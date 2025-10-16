// components/modals/GroupCreationSuccessModal.tsx

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, ExternalLink, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GroupCreationSuccessModalProps {
  open: boolean;
  onClose: () => void;
  txId: string;
  groupName: string;
}

const GroupCreationSuccessModal = ({ 
  open, 
  onClose, 
  txId, 
  groupName
}: GroupCreationSuccessModalProps) => {
  const { toast } = useToast();

  console.log("GroupCreationSuccessModal rendered:", { open, txId, groupName });

  const hiroTestnetUrl = `https://explorer.hiro.so/txid/${txId}?chain=testnet`;
  
  const handleCopyTxId = () => {
    navigator.clipboard.writeText(txId);
    toast({
      title: "Copied!",
      description: "Transaction ID copied to clipboard",
    });
  };

  const handleViewOnHiro = () => {
    window.open(hiroTestnetUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <DialogTitle className="text-2xl font-bold text-green-600">
            Group Created Successfully!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="text-center">
            <p className="text-lg text-gray-700">
              You successfully created the savings group{" "}
              <span className="font-semibold text-gray-900">
                "{groupName}"
              </span>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Your group is now available for members to join!
            </p>
          </div>

          <div className="rounded-lg border bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Transaction ID</p>
                <p className="text-sm text-gray-600 font-mono break-all">
                  {txId}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyTxId}
                className="ml-2 flex-shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleViewOnHiro}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View Transaction on Hiro Explorer
            </Button>
            
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupCreationSuccessModal;

