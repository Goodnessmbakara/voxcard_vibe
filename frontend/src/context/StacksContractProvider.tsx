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
  getGroupsByParticipant: (participant: string) => Promise<{ groups: Group[] }>;
  getGroupById: (groupId: number) => Promise<{ group: Group | null }>;
  getPaginatedGroups: (page: number, pageSize: number) => Promise<{ groups: Group[]; totalCount: number }>;
  requestJoinGroup: (groupId: number) => Promise<any>;
  approveJoinRequest: (groupId: number, requester: string) => Promise<any>;
  denyJoinRequest: (groupId: number, requester: string) => Promise<any>;
  getJoinRequests: (groupId: number) => Promise<{ requests: string[] }>;
  contribute: (groupId: number, amountMicroSTX: string) => Promise<any>;
  getParticipantCycleStatus: (groupId: number, participant: string) => Promise<ParticipantCycleStatus>;
  getTrustScore: (sender: string) => Promise<number>;
  getTotalContributed: (user: string) => Promise<number>;
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
      
      if ((response.okay || response.success) && response.value !== undefined) {
        // Extract the actual value from the wrapped response
        const extractValue = (item) => {
          if (typeof item === 'object' && item.value !== undefined) {
            return item.value;
          }
          return item;
        };
        
        const count = Number(extractValue(response.value));
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
      
      if ((response.okay || response.success) && response.value) {
        // The contract returns a list of group IDs
        // Handle both direct list and nested response structures
        let groupIds;
        if (Array.isArray(response.value)) {
          groupIds = response.value;
        } else if (response.value.value && Array.isArray(response.value.value)) {
          groupIds = response.value.value;
        } else {
          groupIds = response.value;
        }
        console.log('Group IDs from contract:', groupIds);
        
        // Extract actual values from the response objects
        const actualGroupIds = groupIds.map(item => {
          if (typeof item === 'object' && item.value !== undefined) {
            return item.value;
          }
          return item;
        });
        console.log('Actual group IDs:', actualGroupIds);
        
        // Fetch individual group details for each ID
        const groups = [];
        for (const groupId of actualGroupIds) {
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
      if ((response.okay || response.success) && response.value) {
        // The response.value might be null if the group doesn't exist
        // or it might be the actual group data
        if (response.value === null || response.value === undefined) {
          console.log('Group not found for ID', groupId);
          return { group: null };
        }
        
        // Extract the actual group data from the response
        const rawGroupData = response.value.value || response.value;
        console.log('Raw group data for ID', groupId, ':', rawGroupData);
        
        // Simple extraction function that was working before
        const extractValue = (item: any): any => {
          if (typeof item === 'object' && item.value !== undefined) {
            return item.value;
          }
          return item;
        };
        
        // Handle tuple structure for group data
        let actualGroupData = rawGroupData;
        if (rawGroupData && rawGroupData.type && rawGroupData.type.includes('tuple') && rawGroupData.value) {
          actualGroupData = rawGroupData.value;
          console.log('Using group tuple value data:', actualGroupData);
        }
        
        console.log('Raw group data before extraction:', rawGroupData);
        console.log('Actual group data to process:', actualGroupData);
        
        // Extract all fields from the wrapped response objects
        const extractedData: any = {};
        
        // Handle tuple structure properly
        if (actualGroupData && typeof actualGroupData === 'object') {
          for (const [key, value] of Object.entries(actualGroupData)) {
            // Skip the 'type' field if it exists
            if (key !== 'type') {
              extractedData[key] = extractValue(value);
            }
          }
        }
        
        console.log('Extracted data:', extractedData);
        console.log('Name field specifically:', extractedData.name);
        console.log('Description field specifically:', extractedData.description);
        
        // Map contract field names to Group interface field names
        const groupData: Group = {
          id: groupId.toString(),
          name: String(extractedData.name || ''),
          description: String(extractedData.description || ''),
          creator: String(extractedData.creator || ''),
          total_participants: parseInt(String(extractedData['total-participants'])) || 0,
          contribution_amount: String(extractedData['contribution-amount'] || '0'),
          frequency: String(extractedData.frequency || ''),
          duration_months: parseInt(String(extractedData['duration-months'])) || 0,
          trust_score_required: parseInt(String(extractedData['trust-score-required'])) || 0,
          allow_partial: Boolean(extractedData['allow-partial']),
          asset_type: String(extractedData['asset-type'] || 'STX'),
          participants: [], // Will be populated separately if needed
          join_requests: [], // Will be populated separately if needed
          created_at: parseInt(String(extractedData['created-at'])) || 0,
          current_cycle: parseInt(String(extractedData['current-cycle'])) || 1,
          is_active: Boolean(extractedData['is-active']),
          payout_index: 0 // Default value, not in contract
        };
        
        console.log('Parsed group data for ID', groupId, ':', groupData);
        console.log('Group name:', groupData.name);
        console.log('Group description:', groupData.description);
        console.log('Raw name value:', extractedData.name, 'Type:', typeof extractedData.name);
        console.log('Raw description value:', extractedData.description, 'Type:', typeof extractedData.description);
        
        return { group: groupData };
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
      
      if ((response.okay || response.success) && response.value) {
        const paginationData = response.value;
        
        // Handle tuple structure for pagination data
        let actualPaginationData = paginationData;
        if (paginationData && paginationData.type && paginationData.type.includes('tuple') && paginationData.value) {
          actualPaginationData = paginationData.value;
          console.log('Using pagination tuple value data:', actualPaginationData);
        }
        
        // Extract actual values from wrapped objects
        const extractValue = (item) => {
          if (typeof item === 'object' && item.value !== undefined) {
            return item.value;
          }
          return item;
        };
        
        const startId = parseInt(extractValue(actualPaginationData['start-id'])) || 0;
        const endId = parseInt(extractValue(actualPaginationData['end-id'])) || 0;
        const totalCount = parseInt(extractValue(actualPaginationData['total-count'])) || 0;
        
        console.log('Pagination data:', paginationData);
        console.log('Extracted values - startId:', startId, 'endId:', endId, 'totalCount:', totalCount);
        
        // If no groups exist, return empty array
        if (totalCount === 0 || startId > endId || startId <= 0) {
          console.log('No groups to fetch - total count is 0 or invalid range');
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

      const response = cvToJSON(result);
      console.log('getJoinRequests response for group', groupId, ':', response);
      
      if ((response.okay || response.success) && response.value) {
        // Handle tuple structure for join requests
        let actualRequestsData = response.value;
        if (response.value && response.value.type && response.value.type.includes('tuple') && response.value.value) {
          actualRequestsData = response.value.value;
          console.log('Using join requests tuple value data:', actualRequestsData);
        }
        
        // Extract requests list
        const requests = actualRequestsData.requests || actualRequestsData || [];
        console.log('Extracted join requests:', requests);
        
        // Ensure it's an array
        const requestsArray = Array.isArray(requests) ? requests : [];
        return { requests: requestsArray };
      } else {
        console.log('No join requests found for group', groupId);
        return { requests: [] };
      }
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

  const getGroupsByParticipant = async (participant: string) => {
    if (!isConnected) {
      throw new Error("Wallet not connected");
    }

    try {
      const result = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: "get-groups-by-participant",
        functionArgs: [principalCV(participant)],
        network,
        senderAddress: address!,
      });

      const response = cvToJSON(result);
      console.log('getGroupsByParticipant raw result:', result);
      console.log('getGroupsByParticipant response:', response);
      
      if ((response.okay || response.success) && response.value) {
        // The contract returns a list of group IDs
        // Handle both direct list and nested response structures
        let groupIds;
        if (Array.isArray(response.value)) {
          groupIds = response.value;
        } else if (response.value.value && Array.isArray(response.value.value)) {
          groupIds = response.value.value;
        } else {
          groupIds = response.value;
        }
        console.log('Participant group IDs from contract:', groupIds);
        
        // Extract actual values from the response objects
        const actualGroupIds = groupIds.map(item => {
          if (typeof item === 'object' && item.value !== undefined) {
            return item.value;
          }
          return item;
        });
        console.log('Actual participant group IDs:', actualGroupIds);
        
        // Fetch individual group details for each ID
        const groups = [];
        for (const groupId of actualGroupIds) {
          try {
            const groupResult = await getGroupById(Number(groupId));
            if (groupResult.group) {
              const groupData = {
                ...groupResult.group,
                id: groupId.toString()
              };
              groups.push(groupData);
              console.log(`Found participant group ${groupId}:`, groupData);
            }
          } catch (error) {
            console.log(`Participant group ${groupId} not found or error:`, error);
            // Continue to next group
          }
        }
        
        console.log('Final fetched participant groups:', groups);
        return { groups };
      } else {
        console.log('No participant groups found or error in response');
        return { groups: [] };
      }
    } catch (error) {
      console.error("Error fetching groups by participant:", error);
      return { groups: [] };
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
        for (const group of participantGroups.groups) {
          try {
            const participantResult = await callReadOnlyFunction({
              contractAddress,
              contractName,
              functionName: "get-participant-details",
              functionArgs: [uintCV(Number(group.id)), principalCV(user)],
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
            console.log(`Error getting participant details for group ${group.id}:`, error);
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
        getGroupsByParticipant,
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

