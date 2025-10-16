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
import { Coins, AlertCircle } from "lucide-react";
import { useStacksWallet } from "@/context/StacksWalletProvider";
import { useContract } from "@/context/StacksContractProvider";
import type { ParticipantCycleStatus } from "@/context/StacksContractProvider";
import ContributionSuccessModal from "./ContributionSuccessModal";
import { MIN_CONTRIBUTION_MICROSTX, formatMicroSTXToSTX, formatSTXToMicroSTX, isValidSTXAmount } from "@/services/utils";

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

  const [amountSTX, setAmountSTX] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successData, setSuccessData] = useState<{
    txId: string;
    amount: string;
  } | null>(null);

  // Convert STX to microSTX for contract calls
  const getAmountMicroSTX = () => {
    if (!amountSTX) return '';
    const stxAmount = parseFloat(amountSTX);
    return isNaN(stxAmount) ? '' : String(formatSTXToMicroSTX(stxAmount));
  };

  useEffect(() => {
    if (open) {
      // Set to remaining amount if available, otherwise leave empty for user to input
      const remainingSTX = cycleStatus?.remaining_this_cycle 
        ? formatMicroSTXToSTX(Number(cycleStatus.remaining_this_cycle))
        : '';
      setAmountSTX(remainingSTX);
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

    if (!amountSTX || !isValidSTXAmount(amountSTX)) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid STX amount (0 to 1,000,000 STX).",
        variant: "destructive",
      });
      return;
    }

    const stxAmount = parseFloat(amountSTX);
    const amountMicroSTX = formatSTXToMicroSTX(stxAmount);

    // Debug logging
    console.log('=== CONTRIBUTION VALIDATION DEBUG ===');
    console.log('Input amountSTX:', amountSTX);
    console.log('Parsed stxAmount:', stxAmount);
    console.log('Converted amountMicroSTX:', amountMicroSTX);
    console.log('MIN_CONTRIBUTION_MICROSTX:', MIN_CONTRIBUTION_MICROSTX);
    console.log('Is amountMicroSTX < MIN_CONTRIBUTION_MICROSTX?', amountMicroSTX < MIN_CONTRIBUTION_MICROSTX);

    // Check minimum contribution amount (enforced by smart contract)
    if (amountMicroSTX < MIN_CONTRIBUTION_MICROSTX) {
      console.log('VALIDATION FAILED: Amount too small');
      toast({
        title: "Amount too small",
        description: `Minimum contribution per transaction is ${formatMicroSTXToSTX(MIN_CONTRIBUTION_MICROSTX)} STX.`,
        variant: "destructive",
      });
      return;
    }

    // For non-partial payments, must be exact amount
    const requiredAmountSTX = formatMicroSTXToSTX(Number(plan.contribution_amount));
    if (!plan.allow_partial && Math.abs(stxAmount - parseFloat(requiredAmountSTX)) > 0.000001) {
      toast({
        title: "Full amount required",
        description: `This group requires exactly ${requiredAmountSTX} STX.`,
        variant: "destructive",
      });
      return;
    }

    // For partial payments, warn if contributing more than remaining amount (only if remaining > 0)
    if (plan.allow_partial && cycleStatus?.remaining_this_cycle && Number(cycleStatus.remaining_this_cycle) > 0) {
      const remainingSTX = parseFloat(formatMicroSTXToSTX(Number(cycleStatus.remaining_this_cycle)));
      if (stxAmount > remainingSTX) {
        toast({
          title: "Overpayment warning",
          description: `You're contributing ${stxAmount} STX, but only ${remainingSTX} STX is needed to complete this cycle.`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await contribute(Number(plan.id), String(amountMicroSTX));
      console.log("Contribute result:", res);
      
      const txId = res?.txId || res?.txHash || res?.tx?.txId || 'pending';
      console.log("Extracted transaction ID:", txId);
      
      // Set success data and show success modal
      setSuccessData({
        txId: txId,
        amount: amountSTX
      });
      console.log("Setting success modal open");
      setSuccessModalOpen(true);
      
      // Also call onSuccess to refresh data
      onSuccess();
      
      // Don't close the modal immediately - let the success modal handle it
      // onSuccess();
      // onClose();
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow decimal numbers for STX amounts (up to 6 decimal places)
    if (/^\d*\.?\d{0,6}$/.test(value) || value === '') {
      const numericValue = parseFloat(value);
      
      // For partial payments, allow any numeric input - validation happens on submit
      if (plan.allow_partial) {
        setAmountSTX(value);
      } else {
        // For non-partial payments, only allow exact contribution amount
        const requiredAmountSTX = formatMicroSTXToSTX(Number(plan.contribution_amount));
        if (value === '' || Math.abs(numericValue - parseFloat(requiredAmountSTX)) < 0.000001) {
          setAmountSTX(value);
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
              <Label htmlFor="amount">Amount (STX)</Label>
              {plan.allow_partial ? (
                <>
                  <Input
                    id="amount"
                    type="number"
                    step="0.000001"
                    min="0"
                    value={amountSTX}
                    onChange={handleChange}
                    placeholder={`e.g. ${formatMicroSTXToSTX(MIN_CONTRIBUTION_MICROSTX)}, ${formatMicroSTXToSTX(Number(cycleStatus?.remaining_this_cycle || plan.contribution_amount))}`}
                  />
                  <div className="flex items-start space-x-2 text-sm text-gray-600">
                    <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p>Partial payments allowed. You can contribute in smaller amounts until you reach the full amount.</p>
                      <p className="text-orange-600 font-medium mt-1">
                        Minimum per transaction: {formatMicroSTXToSTX(MIN_CONTRIBUTION_MICROSTX)} STX
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="font-bold text-lg">{formatMicroSTXToSTX(Number(plan.contribution_amount))} STX</p>
                    <p className="text-sm text-gray-500">
                      Full payment required: {formatMicroSTXToSTX(Number(plan.contribution_amount))} STX
                    </p>
                  </div>
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
                    {plan.allow_partial && (
                      <>
                        <p>• Partial payments allowed</p>
                        <p>• Contributed: {formatMicroSTXToSTX(Number(cycleStatus?.contributed_this_cycle || 0))} STX</p>
                        <p>• Remaining: {formatMicroSTXToSTX(Number(cycleStatus?.remaining_this_cycle || plan.contribution_amount))} STX</p>
                        {Number(cycleStatus?.debt || 0) > 0 && (
                          <p className="text-orange-600 font-medium">• Debt: {formatMicroSTXToSTX(Number(cycleStatus?.debt || 0))} STX</p>
                        )}
                      </>
                    )}
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
            onSuccess(); // Call the success callback
            onClose(); // Close the contribute modal
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
