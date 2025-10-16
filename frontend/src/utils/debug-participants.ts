// Debug utility to check participant data flow
import { useContract } from '@/context/StacksContractProvider';

export const debugParticipants = async (groupId: number) => {
  console.log('=== DEBUGGING PARTICIPANTS ===');
  console.log('Group ID:', groupId);
  
  try {
    // Test the contract function directly
    const { getGroupParticipants, getGroupById } = useContract();
    
    console.log('1. Fetching group details...');
    const groupResult = await getGroupById(groupId);
    console.log('Group result:', groupResult);
    
    if (groupResult?.group) {
      console.log('Group participants from getGroupById:', groupResult.group.participants);
      console.log('Group creator:', groupResult.group.creator);
      console.log('Group total participants:', groupResult.group.total_participants);
    }
    
    console.log('2. Fetching participants directly...');
    const participants = await getGroupParticipants(groupId);
    console.log('Direct participants result:', participants);
    
    console.log('3. Checking participant count...');
    console.log('Participants array length:', participants.length);
    console.log('Participants:', participants);
    
    return {
      groupData: groupResult?.group,
      participants: participants,
      participantCount: participants.length
    };
  } catch (error) {
    console.error('Error debugging participants:', error);
    return null;
  }
};

