import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { AppConfig, UserSession, showConnect } from "@stacks/connect";
import { StacksMainnet, StacksTestnet } from "@stacks/network";
import { 
  openContractCall,
  openSTXTransfer,
} from "@stacks/connect";
import {
  makeContractCall,
  makeSTXTokenTransfer,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
} from "@stacks/transactions";
import { toast } from "@/hooks/use-toast";

// Network configuration
const isMainnet = import.meta.env.VITE_STACKS_NETWORK === "mainnet";
const network = isMainnet ? new StacksMainnet() : new StacksTestnet();

// AppConfig for Stacks authentication
const appConfig = new AppConfig(["store_write", "publish_data"]);
const userSession = new UserSession({ appConfig });

interface StacksWalletContextProps {
  isConnected: boolean;
  address: string | null;
  balance: string;
  userData: any;
  network: typeof network;
  connectWallet: () => void;
  disconnectWallet: () => void;
  signAndBroadcast: (txOptions: any) => Promise<any>;
  sendSTX: (recipient: string, amount: bigint, memo?: string) => Promise<string>;
}

const StacksWalletContext = createContext<StacksWalletContextProps | null>(null);

export const StacksWalletProvider = ({ children }: { children: ReactNode }) => {
  const [userData, setUserData] = useState<any>(undefined);
  const [balance, setBalance] = useState<string>("--");

  const address = userData?.profile?.stxAddress?.testnet || userData?.profile?.stxAddress?.mainnet || null;
  const isConnected = !!userData;

  // Handle pending sign in on mount
  useEffect(() => {
    if (userSession.isSignInPending()) {
      userSession.handlePendingSignIn().then((userData) => {
        setUserData(userData);
      });
    } else if (userSession.isUserSignedIn()) {
      setUserData(userSession.loadUserData());
    }
  }, []);

  // Fetch balance when address changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (!address) {
        setBalance("--");
        return;
      }

      try {
        const apiUrl = isMainnet 
          ? `https://api.mainnet.hiro.so/v2/accounts/${address}`
          : `https://api.testnet.hiro.so/v2/accounts/${address}`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        // Convert microSTX to STX
        const stxBalance = Number(data.balance) / 1_000_000;
        setBalance(stxBalance.toFixed(2));
      } catch (error) {
        console.error("Error fetching balance:", error);
        setBalance("--");
      }
    };

    fetchBalance();
  }, [address]);

  const connectWallet = () => {
    showConnect({
      appDetails: {
        name: "VoxCard",
        icon: window.location.origin + "/voxcard-logo.png",
      },
      onFinish: () => {
        window.location.reload();
      },
      userSession,
    });
  };

  const disconnectWallet = () => {
    userSession.signUserOut();
    setUserData(undefined);
    setBalance("--");
    window.location.reload();
  };

  const signAndBroadcast = async (txOptions: any) => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }

    try {
      const result = await openContractCall(txOptions);
      
      toast({
        title: "Transaction Submitted",
        description: "Your transaction has been broadcast to the network",
      });

      return result;
    } catch (error: any) {
      console.error("Transaction error:", error);
      
      toast({
        title: "Transaction Failed",
        description: error.message || "Failed to broadcast transaction",
        variant: "destructive",
      });

      throw error;
    }
  };

  const sendSTX = async (recipient: string, amount: bigint, memo?: string): Promise<string> => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }

    try {
      const txOptions = {
        recipient,
        amount,
        memo,
        network,
        anchorMode: AnchorMode.Any,
        appDetails: {
          name: "VoxCard",
          icon: window.location.origin + "/voxcard-logo.png",
        },
        onFinish: (data: any) => {
          toast({
            title: "STX Transfer Submitted",
            description: `Transaction ID: ${data.txId}`,
          });
        },
      };

      await openSTXTransfer(txOptions);
      return "pending"; // Return pending status
    } catch (error: any) {
      console.error("STX transfer error:", error);
      
      toast({
        title: "Transfer Failed",
        description: error.message || "Failed to send STX",
        variant: "destructive",
      });

      throw error;
    }
  };

  return (
    <StacksWalletContext.Provider
      value={{
        isConnected,
        address,
        balance,
        userData,
        network,
        connectWallet,
        disconnectWallet,
        signAndBroadcast,
        sendSTX,
      }}
    >
      {children}
    </StacksWalletContext.Provider>
  );
};

export const useStacksWallet = () => {
  const ctx = useContext(StacksWalletContext);
  if (!ctx) {
    throw new Error("useStacksWallet must be used within StacksWalletProvider");
  }
  return ctx;
};

