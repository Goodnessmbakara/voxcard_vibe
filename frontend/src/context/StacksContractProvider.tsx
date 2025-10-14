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
const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || "ST240V2R09J62PD2KDMJ5Z5X85VAB4VNJ9NZ6XBS1";
const contractName = import.meta.env.VITE_CONTRACT_NAME || "voxcard-savings-v8";

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

export interface ContributionHistory {
  groupId: number;
  groupName: string;
  cycle: number;
  amount: string;
  contributedAt: number;
  isComplete: boolean;
}

export interface CommunityStats {
  totalUsers: number;
  totalGroups: number;
  totalContributed: number;
  activeGroups: number;
  completedGroups: number;
  averageTrustScore: number;
}

export interface LeaderboardUser {
  address: string;
  trustScore: number;
  totalContributed: number;
  groupsParticipated: number;
  rank: number;
}

export interface RecentActivity {
  id: string;
  type: 'contribution' | 'group_created' | 'group_completed' | 'trust_score_up';
  user: string;
  description: string;
  timestamp: number;
  amount?: number;
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
  getGroupParticipants: (groupId: number) => Promise<string[]>;
  contribute: (groupId: number, amountMicroSTX: string) => Promise<any>;
  getParticipantCycleStatus: (groupId: number, participant: string) => Promise<ParticipantCycleStatus>;
  getTrustScore: (sender: string) => Promise<number>;
  getTotalContributed: (user: string) => Promise<number>;
  getContributionHistory: (user: string) => Promise<ContributionHistory[]>;
  getCommunityStats: () => Promise<CommunityStats>;
  getLeaderboard: (limit?: number) => Promise<LeaderboardUser[]>;
  getRecentActivity: (limit?: number) => Promise<RecentActivity[]>;
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

    return new Promise((resolve, reject) => {
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
          resolve(data);
        },
        onCancel: () => {
          reject(new Error("Transaction cancelled by user"));
        },
      };

      openContractCall(txOptions).catch(reject);
    });
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
          participants: [], // Will be populated below
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
        
        // Fetch participants for this group
        try {
          const participants = await getGroupParticipants(groupId);
          groupData.participants = participants;
          console.log('Fetched participants for group', groupId, ':', participants);
        } catch (error) {
          console.error('Error fetching participants for group', groupId, ':', error);
          // Keep empty array if participants fetch fails
        }
        
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

    return new Promise((resolve, reject) => {
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
          resolve(data);
        },
        onCancel: () => {
          reject(new Error("Transaction cancelled by user"));
        },
      };

      openContractCall(txOptions).catch(reject);
    });
  };

  const approveJoinRequest = async (groupId: number, requester: string): Promise<any> => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }

    return new Promise((resolve, reject) => {
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
          resolve(data);
        },
        onCancel: () => {
          reject(new Error("Transaction cancelled by user"));
        },
      };

      openContractCall(txOptions).catch(reject);
    });
  };

  const denyJoinRequest = async (groupId: number, requester: string): Promise<any> => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }

    return new Promise((resolve, reject) => {
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
          resolve(data);
        },
        onCancel: () => {
          reject(new Error("Transaction cancelled by user"));
        },
      };

      openContractCall(txOptions).catch(reject);
    });
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

  const getGroupParticipants = async (groupId: number): Promise<string[]> => {
    if (!isConnected) {
      throw new Error("Wallet not connected");
    }

    try {
      const result = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: "get-group-participants",
        functionArgs: [uintCV(groupId)],
        network,
        senderAddress: address!,
      });

      const response = cvToJSON(result);
      console.log('getGroupParticipants response for group', groupId, ':', response);
      
      if ((response.okay || response.success) && response.value) {
        // Handle tuple structure for participants
        let actualParticipantsData = response.value;
        if (response.value && response.value.type && response.value.type.includes('tuple') && response.value.value) {
          actualParticipantsData = response.value.value;
          console.log('Using participants tuple value data:', actualParticipantsData);
        }
        
        // Extract participants list
        const participants = actualParticipantsData || [];
        console.log('Extracted participants:', participants);
        
        // Ensure it's an array and convert to strings
        const participantsArray = Array.isArray(participants) ? participants.map(p => String(p)) : [];
        return participantsArray;
      } else {
        console.log('No participants found for group', groupId);
        return [];
      }
    } catch (error) {
      console.error("Error fetching group participants:", error);
      return [];
    }
  };

  const contribute = async (groupId: number, amountMicroSTX: string) => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }

    return new Promise((resolve, reject) => {
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
          resolve(data);
        },
        onCancel: () => {
          reject(new Error("Transaction cancelled by user"));
        },
      };

      openContractCall(txOptions).catch(reject);
    });
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
      console.log("Raw participant cycle status:", status);
      
      // Map smart contract response to our interface
      return {
        contributed_this_cycle: status["contributed-this-cycle"] || "0",
        remaining_this_cycle: status["remaining-this-cycle"] || "0",
        is_recipient_this_cycle: false, // Not provided by smart contract
        cycle: Number(status["current-cycle"] || 0),
        required: String(status["required-amount"] || "0"),
        fully_contributed: status["is-complete"] || false,
        debt: String(status["total-debt"] || "0"),
      };
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

      const response = cvToJSON(result);
      console.log("Trust score raw result:", result);
      console.log("Trust score response:", response);
      console.log("Contract address:", contractAddress);
      console.log("Contract name:", contractName);
      console.log("Sender address:", sender);
      
      // The contract returns (ok (calculate-trust-score user))
      if (response.okay && response.value !== undefined) {
        const score = Number(response.value);
        console.log("Parsed trust score:", score);
        return isNaN(score) ? 50 : score; // Default to 50 if NaN
      } else {
        console.log("No trust score found, returning default 50");
        return 50; // Default trust score for new users
      }
    } catch (error) {
      console.error("Error fetching trust score:", error);
      return 50; // Default trust score on error
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

  const getContributionHistory = async (user: string): Promise<ContributionHistory[]> => {
    if (!isConnected) {
      throw new Error("Wallet not connected");
    }

    try {
      // Get all groups the user participates in
      const participantGroups = await getGroupsByParticipant(user);
      const contributionHistory: ContributionHistory[] = [];

      if (participantGroups.groups && Array.isArray(participantGroups.groups)) {
        // For each group, fetch contribution history
        for (const group of participantGroups.groups) {
          try {
            // Get group details to know current cycle and contribution amount
            const groupResult = await getGroupById(Number(group.id));
            if (!groupResult.group) continue;

            const groupData = groupResult.group;
            const currentCycle = groupData.current_cycle;
            
            // Fetch contributions for each cycle up to current cycle
            for (let cycle = 1; cycle <= currentCycle; cycle++) {
              try {
                const contributionResult = await callReadOnlyFunction({
                  contractAddress,
                  contractName,
                  functionName: "get-cycle-contribution",
                  functionArgs: [uintCV(Number(group.id)), principalCV(user), uintCV(cycle)],
                  network,
                  senderAddress: address!,
                });

                const response = cvToJSON(contributionResult);
                if (response.okay && response.value) {
                  const contributionData = response.value.value || response.value;
                  const amount = contributionData['amount-contributed'] || 0;
                  const contributedAt = contributionData['contributed-at'] || 0;
                  const isComplete = contributionData['is-complete'] || false;

                  // Only include contributions with actual amounts
                  if (Number(amount) > 0) {
                    contributionHistory.push({
                      groupId: Number(group.id),
                      groupName: groupData.name,
                      cycle: cycle,
                      amount: (Number(amount) / 1_000_000).toString(), // Convert microSTX to STX
                      contributedAt: Number(contributedAt),
                      isComplete: Boolean(isComplete)
                    });
                  }
                }
              } catch (error) {
                console.log(`Error getting cycle contribution for group ${group.id}, cycle ${cycle}:`, error);
                // Continue to next cycle
              }
            }
          } catch (error) {
            console.log(`Error getting contribution history for group ${group.id}:`, error);
            // Continue to next group
          }
        }
      }

      // Sort by contribution date (most recent first)
      contributionHistory.sort((a, b) => b.contributedAt - a.contributedAt);
      
      // Limit to recent contributions (last 10)
      return contributionHistory.slice(0, 10);
    } catch (error) {
      console.error("Error fetching contribution history:", error);
      return [];
    }
  };

  const getCommunityStats = async (): Promise<CommunityStats> => {
    if (!isConnected) {
      throw new Error("Wallet not connected");
    }

    try {
      // Get total group count
      const totalGroups = await getGroupCount();
      
      // Get all groups to calculate stats
      const allGroupsResult = await getPaginatedGroups(1, 100); // Get first 100 groups
      const allGroups = allGroupsResult.groups || [];
      
      let totalContributed = 0;
      let activeGroups = 0;
      let completedGroups = 0;
      const uniqueUsers = new Set<string>();
      
      // Process each group
      for (const group of allGroups) {
        if (group.is_active) {
          activeGroups++;
        } else {
          completedGroups++;
        }
        
        // Add creator to unique users
        uniqueUsers.add(group.creator);
        
        // Add participants to unique users
        if (group.participants && Array.isArray(group.participants)) {
          group.participants.forEach(participant => uniqueUsers.add(participant));
        }
        
        // Get total contributed for this group (sum of all participants)
        if (group.participants && Array.isArray(group.participants)) {
          for (const participant of group.participants) {
            try {
              const participantResult = await callReadOnlyFunction({
                contractAddress,
                contractName,
                functionName: "get-participant-details",
                functionArgs: [uintCV(Number(group.id)), principalCV(participant)],
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
              console.log(`Error getting participant details for group ${group.id}, participant ${participant}:`, error);
            }
          }
        }
      }

      return {
        totalUsers: uniqueUsers.size,
        totalGroups: totalGroups,
        totalContributed: totalContributed / 1_000_000, // Convert microSTX to STX
        activeGroups: activeGroups,
        completedGroups: completedGroups,
        averageTrustScore: 50 // Default value, could be calculated from trust scores
      };
    } catch (error) {
      console.error("Error fetching community stats:", error);
      return {
        totalUsers: 0,
        totalGroups: 0,
        totalContributed: 0,
        activeGroups: 0,
        completedGroups: 0,
        averageTrustScore: 0
      };
    }
  };

  const getLeaderboard = async (limit: number = 10): Promise<LeaderboardUser[]> => {
    if (!isConnected) {
      throw new Error("Wallet not connected");
    }

    try {
      // Get all groups to find all participants
      const allGroupsResult = await getPaginatedGroups(1, 100);
      const allGroups = allGroupsResult.groups || [];
      
      const userStats = new Map<string, {
        trustScore: number;
        totalContributed: number;
        groupsParticipated: number;
      }>();
      
      // Process each group to collect user statistics
      for (const group of allGroups) {
        // Add creator
        if (group.creator) {
          const existingStats = userStats.get(group.creator) || {
            trustScore: 0,
            totalContributed: 0,
            groupsParticipated: 0
          };
          
          // Get trust score for this user
          try {
            const trustScore = await getTrustScore(group.creator);
            existingStats.trustScore = trustScore;
          } catch (error) {
            console.log(`Error getting trust score for ${group.creator}:`, error);
          }
          
          existingStats.groupsParticipated += 1;
          userStats.set(group.creator, existingStats);
        }
        
        // Add participants
        if (group.participants && Array.isArray(group.participants)) {
          for (const participant of group.participants) {
            const existingStats = userStats.get(participant) || {
              trustScore: 0,
              totalContributed: 0,
              groupsParticipated: 0
            };
            
            // Get trust score and total contributed for this user
            try {
              const trustScore = await getTrustScore(participant);
              const totalContributed = await getTotalContributed(participant);
              existingStats.trustScore = trustScore;
              existingStats.totalContributed = totalContributed / 1_000_000; // Convert to STX
            } catch (error) {
              console.log(`Error getting stats for ${participant}:`, error);
            }
            
            existingStats.groupsParticipated += 1;
            userStats.set(participant, existingStats);
          }
        }
      }
      
      // Convert to leaderboard array and sort by trust score
      const leaderboard: LeaderboardUser[] = Array.from(userStats.entries())
        .map(([address, stats], index) => ({
          address,
          trustScore: stats.trustScore,
          totalContributed: stats.totalContributed,
          groupsParticipated: stats.groupsParticipated,
          rank: index + 1
        }))
        .sort((a, b) => b.trustScore - a.trustScore)
        .slice(0, limit)
        .map((user, index) => ({
          ...user,
          rank: index + 1
        }));
      
      return leaderboard;
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      return [];
    }
  };

  const getRecentActivity = async (limit: number = 10): Promise<RecentActivity[]> => {
    if (!isConnected) {
      throw new Error("Wallet not connected");
    }

    try {
      // Get all groups to find recent activity
      const allGroupsResult = await getPaginatedGroups(1, 50); // Get recent groups
      const allGroups = allGroupsResult.groups || [];
      
      const activities: RecentActivity[] = [];
      
      // Process each group to find recent activity
      for (const group of allGroups) {
        // Add group creation activity
        activities.push({
          id: `group-created-${group.id}`,
          type: 'group_created',
          user: group.creator,
          description: `Created new savings group "${group.name}"`,
          timestamp: group.created_at * 1000 // Convert block height to approximate timestamp
        });
        
        // Get recent contributions for this group
        if (group.participants && Array.isArray(group.participants)) {
          for (const participant of group.participants) {
            try {
              // Get contribution history for this participant
              const contributionHistory = await getContributionHistory(participant);
              
              // Add recent contributions as activities
              contributionHistory.forEach((contribution, index) => {
                if (contribution.groupId === Number(group.id)) {
                  activities.push({
                    id: `contribution-${group.id}-${participant}-${contribution.cycle}`,
                    type: 'contribution',
                    user: participant,
                    description: `Made a contribution of ${contribution.amount} STX to "${group.name}"`,
                    timestamp: contribution.contributedAt * 1000,
                    amount: parseFloat(contribution.amount)
                  });
                }
              });
            } catch (error) {
              console.log(`Error getting contribution history for ${participant}:`, error);
            }
          }
        }
      }
      
      // Sort by timestamp (most recent first) and limit
      activities.sort((a, b) => b.timestamp - a.timestamp);
      return activities.slice(0, limit);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      return [];
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
        getGroupParticipants,
        contribute,
        getParticipantCycleStatus,
        getTrustScore,
        getTotalContributed,
        getContributionHistory,
        getCommunityStats,
        getLeaderboard,
        getRecentActivity,
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

