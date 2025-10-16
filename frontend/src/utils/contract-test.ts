// Contract test utility to verify contract accessibility
import { callReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';

export const testContractAccess = async (contractAddress: string, contractName: string, groupId: number, senderAddress: string) => {
  const network = new StacksTestnet();
  
  console.log('=== TESTING CONTRACT ACCESS ===');
  console.log('Contract Address:', contractAddress);
  console.log('Contract Name:', contractName);
  console.log('Group ID:', groupId);
  console.log('Sender Address:', senderAddress);
  
  try {
    // Test 1: Try to get group details
    console.log('\n1. Testing get-group...');
    const groupResult = await callReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-group",
      functionArgs: [groupId],
      network,
      senderAddress,
    });
    
    const groupResponse = cvToJSON(groupResult);
    console.log('Group result:', groupResponse);
    
    // Test 2: Try to get participants
    console.log('\n2. Testing get-group-participants...');
    const participantsResult = await callReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-group-participants",
      functionArgs: [groupId],
      network,
      senderAddress,
    });
    
    const participantsResponse = cvToJSON(participantsResult);
    console.log('Participants result:', participantsResponse);
    
    // Test 3: Try to get participant count
    console.log('\n3. Testing get-participant-count...');
    const countResult = await callReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-participant-count",
      functionArgs: [groupId],
      network,
      senderAddress,
    });
    
    const countResponse = cvToJSON(countResult);
    console.log('Participant count result:', countResponse);
    
    return {
      group: groupResponse,
      participants: participantsResponse,
      count: countResponse,
      success: true
    };
    
  } catch (error) {
    console.error('Contract test failed:', error);
    return {
      error: error.message,
      success: false
    };
  }
};

