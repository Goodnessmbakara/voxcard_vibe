// components/modals/ContributeModal.tsx

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Group } from "@/context/StacksContractProvider";
import { Coins } from "lucide-react";
import { useStacksWallet } from "@/context/StacksWalletProvider";
import { useContract } from "@/context/StacksContractProvider";
import type { ParticipantCycleStatus } from "@/context/StacksContractProvider";
import ContributionSuccessModal from "./ContributionSuccessModal";
import { MIN_CONTRIBUTION_MICROSTX, formatMicroSTXToSTX } from "@/services/utils";

interface ContributeModalProps {
  plan: Group;
  cycleStatus?: ParticipantCycleStatus;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ContributeModal = ({ plan, cycleStatus, open, onClose, onSuccess }: ContributeModalProps) => {
  const { toast } = useToast();
  const { address } = useStacksWallet();
  const { contribute } = useContract();

  const [amountMicroSTX, setAmountMicroSTX] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successData, setSuccessData] = useState<{
    txId: string;
    amount: string;
  } | null>(null);

  useEffect(() => {
    if (open) {
      // Set to remaining amount if available, otherwise leave empty for user to input
      setAmountMicroSTX(cycleStatus?.remaining_this_cycle ? String(cycleStatus.remaining_this_cycle) : '');
    }
  }, [open, cycleStatus?.remaining_this_cycle]);

  const handleContribute = async () => {
    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet",
        variant: "destructive",
      });
      return;
    }

    if (!/^\d+$/.test(amountMicroSTX)) {
      toast({
        title: "Invalid amount",
        description: "Amount must be a whole number of microSTX (no decimals).",
        variant: "destructive",
      });
      return;
    }

    const numericAmount = parseInt(amountMicroSTX, 10);

    // Check minimum contribution amount (enforced by smart contract)
    if (numericAmount < MIN_CONTRIBUTION_MICROSTX) {
      toast({
        title: "Amount too small",
        description: `Minimum contribution per transaction is ${MIN_CONTRIBUTION_MICROSTX} microSTX (0.0001 STX).`,
        variant: "destructive",
      });
      return;
    }

    // For non-partial payments, must be exact amount
    if (!plan.allow_partial && amountMicroSTX !== String(plan.contribution_amount)) {
      toast({
        title: "Full amount required",
        description: `This group requires exactly ${plan.contribution_amount} microSTX.`,
        variant: "destructive",
      });
      return;
    }

    // For partial payments, warn if contributing more than remaining amount (only if remaining > 0)
    if (plan.allow_partial && cycleStatus?.remaining_this_cycle && Number(cycleStatus.remaining_this_cycle) > 0 && numericAmount > Number(cycleStatus.remaining_this_cycle)) {
      toast({
        title: "Overpayment warning",
        description: `You're contributing ${numericAmount} microSTX, but only ${cycleStatus.remaining_this_cycle} microSTX is needed to complete this cycle.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await contribute(Number(plan.id), amountMicroSTX);
      console.log("Contribute result:", res);
      
      const txId = res?.txId || res?.txHash || res?.tx?.txId || 'pending';
      
      // Set success data and show success modal
      setSuccessData({
        txId: txId,
        amount: amountMicroSTX
      });
      setSuccessModalOpen(true);
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Contribution error:", err);
      toast({
        title: "Error",
        description: err?.message || "Failed to submit contribution.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

	const handleChange = (e) => {
		const value = e.target.value;

		// Allow only digits or empty string
		if (/^\d*$/.test(value)) {
			const numericValue = parseInt(value, 10);
			
			// For partial payments, allow any numeric input - validation happens on submit
			if (plan.allow_partial) {
				setAmountMicroSTX(value);
			} else {
				// For non-partial payments, only allow exact contribution amount
				if (value === '' || numericValue === Number(plan.contribution_amount)) {
					setAmountMicroSTX(value);
				}
				// Don't update if not exact amount for non-partial groups
			}
		}
	};


  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Make Contribution</DialogTitle>
            <DialogDescription>
              Contribute to "{plan.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (microSTX)</Label>
              {plan.allow_partial ? (
                <>
                  <Input
                    id="amount"
                    type="text"
                    inputMode="numeric"
                    value={amountMicroSTX}
                    onChange={(e) => handleChange(e)}
                    placeholder={`e.g. ${MIN_CONTRIBUTION_MICROSTX}, ${cycleStatus?.remaining_this_cycle || plan.contribution_amount}`}
                  />
                  <p className="text-sm text-gray-500">
                    Partial payments allowed. You can contribute in smaller amounts until you reach the full amount.
                    <br />
                    <span className="text-orange-600 font-medium">Minimum per transaction: {MIN_CONTRIBUTION_MICROSTX} microSTX (0.0001 STX)</span>
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold ">{formatMicroSTXToSTX(Number(plan.contribution_amount))} STX</p>
                  <p className="text-sm text-gray-500">
                    Full payment required: {formatMicroSTXToSTX(Number(plan.contribution_amount))} STX
                  </p>
                </>
              )}
            </div>

            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Coins className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Contribution Info
                  </h3>
                  <div className="mt-2 text-sm text-green-700 space-y-1">
                    <p>• Expected: {formatMicroSTXToSTX(Number(plan.contribution_amount))} STX</p>
                    <p>• Frequency: {plan.frequency.toLowerCase()}</p>
                    {plan.allow_partial && <>
                      <p>Partial payments allowed</p>
                      <p>Contributed: {formatMicroSTXToSTX(Number(cycleStatus?.contributed_this_cycle || 0))} STX</p>
                      <p>Left: {formatMicroSTXToSTX(Number(cycleStatus?.remaining_this_cycle || plan.contribution_amount))} STX</p>
                      {Number(cycleStatus?.debt || 0) > 0 && (
                        <p className="text-orange-600 font-medium">Debt: {formatMicroSTXToSTX(Number(cycleStatus?.debt || 0))} STX</p>
                      )}
                    </>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleContribute}
              disabled={isSubmitting}
              className="gradient-bg text-white"
            >
              {isSubmitting ? "Processing..." : "Make Contribution"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Success Modal */}
      {successData && (
        <ContributionSuccessModal
          open={successModalOpen}
          onClose={() => {
            setSuccessModalOpen(false);
            setSuccessData(null);
          }}
          txId={successData.txId}
          groupName={plan.name}
          amount={successData.amount}
        />
      )}
    </>
  );
};

export default ContributeModal;
