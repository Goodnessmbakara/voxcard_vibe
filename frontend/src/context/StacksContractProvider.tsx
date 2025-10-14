import { createContext, useContext, ReactNode } from "react";
import { useStacksWallet } from "./StacksWalletProvider";
import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  bufferCVFromString,
  uintCV,
  stringUtf8CV,
  stringAsciiCV,
  principalCV,
  boolCV,
  callReadOnlyFunction,
  cvToJSON,
} from "@stacks/transactions";
import { StacksTestnet, StacksMainnet } from "@stacks/network";
import { openContractCall } from "@stacks/connect";

// Contract configuration
const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || "";
const contractName = import.meta.env.VITE_CONTRACT_NAME || "voxcard-savings-v6";

const isMainnet = import.meta.env.VITE_STACKS_NETWORK === "mainnet";
const network = isMainnet ? new StacksMainnet() : new StacksTestnet();

export interface CreateGroupInput {
  name: string;
  description: string;
  total_participants: number;
  contribution_amount: string;
  frequency: string;
  duration_months: number;
  trust_score_required: number;
  allow_partial: boolean;
  asset_type: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  creator: string;
  total_participants: number;
  contribution_amount: string;
  frequency: string;
  duration_months: number;
  trust_score_required: number;
  allow_partial: boolean;
  asset_type: string;
  participants: string[];
  join_requests: string[];
  created_at: number;
  current_cycle: number;
  is_active: boolean;
  payout_index: number;
}

export interface ParticipantCycleStatus {
  contributed_this_cycle: string;
  remaining_this_cycle: string;
  is_recipient_this_cycle: boolean;
  cycle: number;
  required: string;
  fully_contributed: boolean;
  debt: string;
}

interface ContractContextProps {
  address: string;
  account?: string;
  balance?: string;
  createGroup: (group: CreateGroupInput) => Promise<any>;
  getGroupCount: () => Promise<number>;
  getGroupsByCreator: (creator: string) => Promise<{ groups: Group[] }>;
  getGroupById: (groupId: number) => Promise<{ group: Group | null }>;
  getPaginatedGroups: (page: number, pageSize: number) => Promise<{ groups: Group[]; totalCount: number }>;
  requestJoinGroup: (groupId: number) => Promise<any>;
  approveJoinRequest: (groupId: number, requester: string) => Promise<any>;
  denyJoinRequest: (groupId: number, requester: string) => Promise<any>;
  getJoinRequests: (groupId: number) => Promise<{ requests: string[] }>;
  contribute: (groupId: number, amountMicroSTX: string) => Promise<any>;
  getParticipantCycleStatus: (groupId: number, participant: string) => Promise<ParticipantCycleStatus>;
  getTrustScore: (sender: string) => Promise<number>;
}

const ContractContext = createContext<ContractContextProps | null>(null);

export const StacksContractProvider = ({ children }: { children: ReactNode }) => {
  const { address, balance, isConnected, userData } = useStacksWallet();

  const createGroup = async (group: CreateGroupInput): Promise<any> => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }

    // Convert STX to microSTX (1 STX = 1,000,000 microSTX)
    const contributionAmountMicroSTX = Math.floor(parseFloat(group.contribution_amount) * 1_000_000);

    const txOptions = {
      contractAddress,
      contractName,
      functionName: "create-group",
      functionArgs: [
        stringUtf8CV(group.name),
        stringUtf8CV(group.description),
        uintCV(group.total_participants),
        uintCV(contributionAmountMicroSTX),
        stringAsciiCV(group.frequency),
        uintCV(group.duration_months),
        uintCV(group.trust_score_required),
        boolCV(group.allow_partial),
        stringAsciiCV(group.asset_type),
      ],
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      appDetails: {
        name: "VoxCard",
        icon: window.location.origin + "/voxcard-logo.svg",
      },
      onFinish: (data: any) => {
        console.log("Transaction finished:", data);
      },
    };

    return await openContractCall(txOptions);
  };

  const getGroupCount = async (): Promise<number> => {
    if (!isConnected) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log('=== getGroupCount called ===');
      console.log('Contract address:', contractAddress);
      console.log('Contract name:', contractName);
      console.log('Network:', network);
      console.log('Sender address:', address);
      
      const result = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: "get-group-count",
        functionArgs: [],
        network,
        senderAddress: address!,
      });

      const response = cvToJSON(result);
      console.log('getGroupCount raw result:', result);
      console.log('getGroupCount response:', response);
      
      if (response.okay && response.value !== undefined) {
        const count = Number(response.value);
        console.log('Group count:', count);
        return count;
      } else {
        console.log('No group count found or error in response');
        return 0;
      }
    } catch (error) {
      console.error("Error fetching group count:", error);
      return 0;
    }
  };

  const getGroupsByCreator = async (creator: string) => {
    if (!isConnected) {
      throw new Error("Wallet not connected");
    }

    try {
      const result = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: "get-groups-by-creator",
        functionArgs: [principalCV(creator)],
        network,
        senderAddress: address!,
      });

      const response = cvToJSON(result);
      console.log('getGroupsByCreator raw result:', result);
      console.log('getGroupsByCreator response:', response);
      
      if (response.okay && response.value) {
        // The contract returns a nested response structure: response.value.value contains the actual list
        const groupIds = response.value.value || response.value;
        console.log('Group IDs from contract:', groupIds);
        
        // Fetch individual group details for each ID
        const groups = [];
        for (const groupId of groupIds) {
          try {
            const groupResult = await getGroupById(Number(groupId));
            if (groupResult.group) {
              const groupData = {
                ...groupResult.group,
                id: groupId.toString()
              };
              groups.push(groupData);
              console.log(`Found group ${groupId}:`, groupData);
            }
          } catch (error) {
            console.log(`Group ${groupId} not found or error:`, error);
            // Continue to next group
          }
        }
        
        console.log('Final fetched groups for creator:', groups);
        return { groups };
      } else {
        console.log('No groups found for creator or error in response');
        return { groups: [] };
      }
    } catch (error) {
      console.error("Error fetching groups by creator:", error);
      return { groups: [] };
    }
  };

  const getGroupById = async (groupId: number) => {
    if (!isConnected) {
      throw new Error("Wallet not connected");
    }

    try {
      const result = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: "get-group",
        functionArgs: [uintCV(groupId)],
        network,
        senderAddress: address!,
      });

      const response = cvToJSON(result);
      console.log('getGroupById response for group', groupId, ':', response);
      
      // The contract returns (ok (map-get? groups { group-id: group-id }))
      // So we need to check if the result is okay and has a value
      if (response.okay && response.value) {
        return { group: response.value };
      } else {
        console.log('Group not found or no value for group', groupId);
        return { group: null };
      }
    } catch (error) {
      console.error("Error fetching group:", error);
      return { group: null };
    }
  };

  const getPaginatedGroups = async (page: number, pageSize: number) => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }

    try {
      // Call the new get-paginated-group-ids function
      const result = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: "get-paginated-group-ids",
        functionArgs: [uintCV(page), uintCV(pageSize)],
        network,
        senderAddress: address!,
      });

      const response = cvToJSON(result);
      console.log('getPaginatedGroups response:', response);
      
      if (response.okay && response.value) {
        const paginationData = response.value;
        const startId = paginationData['start-id'] || 0;
        const endId = paginationData['end-id'] || 0;
        const totalCount = paginationData['total-count'] || 0;
        
        console.log('Pagination data:', paginationData);
        
        // If no groups exist, return empty array
        if (totalCount === 0 || startId > endId || startId === 0) {
          console.log('No groups to fetch - total count is 0');
          return { groups: [], totalCount: 0 };
        }
        
        // Fetch individual groups using the ID range
        const groups = [];
        for (let groupId = startId; groupId <= endId; groupId++) {
          try {
            const groupResult = await getGroupById(groupId);
            if (groupResult.group) {
              const groupData = {
                ...groupResult.group,
                id: groupId.toString()
              };
              groups.push(groupData);
              console.log(`Found group ${groupId}:`, groupData);
            }
          } catch (error) {
            console.log(`Group ${groupId} not found or error:`, error);
            // Continue to next group
          }
        }
        
        console.log('Final fetched groups:', groups);
        return { groups, totalCount };
      } else {
        console.log('No groups found or error in response');
        return { groups: [], totalCount: 0 };
      }
    } catch (error) {
      console.error("Error fetching paginated groups:", error);
      return { groups: [], totalCount: 0 };
    }
  };

  const requestJoinGroup = async (groupId: number): Promise<any> => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }

    const txOptions = {
      contractAddress,
      contractName,
      functionName: "request-to-join-group",
      functionArgs: [uintCV(groupId)],
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      appDetails: {
        name: "VoxCard",
        icon: window.location.origin + "/voxcard-logo.svg",
      },
      onFinish: (data: any) => {
        console.log("Join request submitted:", data);
      },
    };

    return await openContractCall(txOptions);
  };

  const approveJoinRequest = async (groupId: number, requester: string): Promise<any> => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }

    const txOptions = {
      contractAddress,
      contractName,
      functionName: "approve-join-request",
      functionArgs: [uintCV(groupId), principalCV(requester)],
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      appDetails: {
        name: "VoxCard",
        icon: window.location.origin + "/voxcard-logo.svg",
      },
      onFinish: (data: any) => {
        console.log("Join request approved:", data);
      },
    };

    return await openContractCall(txOptions);
  };

  const denyJoinRequest = async (groupId: number, requester: string): Promise<any> => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }

    const txOptions = {
      contractAddress,
      contractName,
      functionName: "deny-join-request",
      functionArgs: [uintCV(groupId), principalCV(requester)],
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      appDetails: {
        name: "VoxCard",
        icon: window.location.origin + "/voxcard-logo.svg",
      },
      onFinish: (data: any) => {
        console.log("Join request denied:", data);
      },
    };

    return await openContractCall(txOptions);
  };

  const getJoinRequests = async (groupId: number): Promise<{ requests: string[] }> => {
    if (!isConnected) {
      throw new Error("Wallet not connected");
    }

    try {
      const result = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: "get-join-requests",
        functionArgs: [uintCV(groupId)],
        network,
        senderAddress: address!,
      });

      const requests = cvToJSON(result).value;
      return { requests };
    } catch (error) {
      console.error("Error fetching join requests:", error);
      return { requests: [] };
    }
  };

  const contribute = async (groupId: number, amountMicroSTX: string) => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }

    const txOptions = {
      contractAddress,
      contractName,
      functionName: "contribute",
      functionArgs: [uintCV(groupId), uintCV(amountMicroSTX)],
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      postConditions: [],
      appDetails: {
        name: "VoxCard",
        icon: window.location.origin + "/voxcard-logo.svg",
      },
      onFinish: (data: any) => {
        console.log("Contribution submitted:", data);
      },
    };

    return await openContractCall(txOptions);
  };

  const getParticipantCycleStatus = async (groupId: number, participant: string): Promise<ParticipantCycleStatus> => {
    if (!isConnected) {
      throw new Error("Wallet not connected");
    }

    try {
      const result = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: "get-participant-cycle-status",
        functionArgs: [uintCV(groupId), principalCV(participant)],
        network,
        senderAddress: address!,
      });

      const status = cvToJSON(result).value;
      return status;
    } catch (error) {
      console.error("Error fetching participant cycle status:", error);
      return {
        contributed_this_cycle: "0",
        remaining_this_cycle: "0",
        is_recipient_this_cycle: false,
        cycle: 0,
        required: "0",
        fully_contributed: false,
        debt: "0",
      };
    }
  };

  const getTrustScore = async (sender: string): Promise<number> => {
    if (!isConnected) {
      throw new Error("Wallet not connected");
    }

    try {
      const result = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: "get-trust-score",
        functionArgs: [principalCV(sender)],
        network,
        senderAddress: address!,
      });

      const score = Number(cvToJSON(result).value);
      return score;
    } catch (error) {
      console.error("Error fetching trust score:", error);
      return 0;
    }
  };

  const getTotalContributed = async (user: string): Promise<number> => {
    if (!isConnected) {
      throw new Error("Wallet not connected");
    }

    try {
      // Get all groups the user participates in
      const participantGroups = await getGroupsByParticipant(user);
      let totalContributed = 0;

      if (participantGroups.groups && Array.isArray(participantGroups.groups)) {
        // For each group, get the participant details to sum up total contributed
        for (const groupId of participantGroups.groups) {
          try {
            const participantResult = await callReadOnlyFunction({
              contractAddress,
              contractName,
              functionName: "get-participant-details",
              functionArgs: [uintCV(groupId), principalCV(user)],
              network,
              senderAddress: address!,
            });

            const response = cvToJSON(participantResult);
            if (response.okay && response.value) {
              const participantData = response.value.value || response.value;
              const contributed = participantData['total-contributed'] || 0;
              totalContributed += Number(contributed);
            }
          } catch (error) {
            console.log(`Error getting participant details for group ${groupId}:`, error);
            // Continue to next group
          }
        }
      }

      return totalContributed;
    } catch (error) {
      console.error("Error fetching total contributed:", error);
      return 0;
    }
  };

  return (
    <ContractContext.Provider
      value={{
        address: contractAddress,
        account: address || undefined,
        balance: balance || undefined,
        createGroup,
        getGroupCount,
        getGroupsByCreator,
        getGroupById,
        getPaginatedGroups,
        requestJoinGroup,
        approveJoinRequest,
        denyJoinRequest,
        getJoinRequests,
        contribute,
        getParticipantCycleStatus,
        getTrustScore,
        getTotalContributed,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};

export const useContract = () => {
  const ctx = useContext(ContractContext);
  if (!ctx) {
    throw new Error("useContract must be used within StacksContractProvider");
  }
  return ctx;
};

