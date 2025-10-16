import React, { useState } from 'react';
import { useContract } from '@/context/StacksContractProvider';
import { useStacksWallet } from '@/context/StacksWalletProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { testContractAccess } from '@/utils/contract-test';
import { testNetworkAccess } from '@/utils/network-test';

interface ParticipantDebugProps {
  groupId: number;
}

const ParticipantDebug: React.FC<ParticipantDebugProps> = ({ groupId }) => {
  const { getGroupParticipants, getGroupById } = useContract();
  const { address } = useStacksWallet();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [contractTest, setContractTest] = useState<any>(null);
  const [networkTest, setNetworkTest] = useState<any>(null);

  const runDebug = async () => {
    setLoading(true);
    try {
      console.log('=== RUNNING PARTICIPANT DEBUG ===');
      
      // Test 1: Get group details
      console.log('1. Fetching group details...');
      const groupResult = await getGroupById(groupId);
      console.log('Group result:', groupResult);
      
      // Test 2: Get participants directly
      console.log('2. Fetching participants directly...');
      const participants = await getGroupParticipants(groupId);
      console.log('Participants result:', participants);
      
      // Test 3: Check if user is creator
      const isCreator = groupResult?.group?.creator?.toLowerCase() === address?.toLowerCase();
      console.log('Is creator:', isCreator);
      console.log('Creator address:', groupResult?.group?.creator);
      console.log('User address:', address);
      
      setDebugInfo({
        groupData: groupResult?.group,
        participants: participants,
        participantCount: participants.length,
        isCreator: isCreator,
        creatorAddress: groupResult?.group?.creator,
        userAddress: address
      });
      
    } catch (error) {
      console.error('Debug error:', error);
      setDebugInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const runContractTest = async () => {
    setLoading(true);
    try {
      console.log('=== RUNNING CONTRACT TEST ===');
      
      const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || "ST240V2R09J62PD2KDMJ5Z5X85VAB4VNJ9NZ6XBS1";
      const contractName = import.meta.env.VITE_CONTRACT_NAME || "voxcard-savings-v8";
      
      const result = await testContractAccess(contractAddress, contractName, groupId, address || '');
      setContractTest(result);
      
    } catch (error) {
      console.error('Contract test error:', error);
      setContractTest({ error: error.message, success: false });
    } finally {
      setLoading(false);
    }
  };

  const runNetworkTest = async () => {
    setLoading(true);
    try {
      console.log('=== RUNNING NETWORK TEST ===');
      
      const result = await testNetworkAccess();
      setNetworkTest(result);
      
    } catch (error) {
      console.error('Network test error:', error);
      setNetworkTest({ error: error.message, success: false });
    } finally {
      setLoading(false);
    }
  };

  const addCreatorAsParticipant = async () => {
    setLoading(true);
    try {
      console.log('=== ADDING CREATOR AS PARTICIPANT ===');
      
      // Since the creator should already be a participant according to the contract,
      // but the data shows they're not, this suggests either:
      // 1. The group was created before the auto-add logic was implemented
      // 2. There's a data corruption issue
      // 3. The contract function is not working as expected
      
      console.log('DIAGNOSIS: Creator should be auto-added but is not showing as participant');
      console.log('This indicates a data inconsistency between contract and frontend');
      console.log('SOLUTION: The group may need to be recreated or the contract data fixed');
      
      // For now, we'll show what the expected behavior should be
      const expectedResult = {
        message: "Creator should be automatically added as participant when group is created",
        currentIssue: "Creator is not showing in participants list",
        possibleCauses: [
          "Group created before auto-add logic was implemented",
          "Contract data corruption",
          "Frontend data parsing issue"
        ],
        recommendedAction: "Recreate the group or fix contract data manually"
      };
      
      console.log('Expected result:', expectedResult);
      
      // Refresh the debug data
      await runDebug();
      
    } catch (error) {
      console.error('Add creator error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Participant Debug Tool</CardTitle>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={runDebug} disabled={loading}>
            {loading ? 'Running Debug...' : 'Run Debug Test'}
          </Button>
          <Button onClick={runContractTest} disabled={loading} variant="outline">
            {loading ? 'Testing Contract...' : 'Test Contract Access'}
          </Button>
          <Button onClick={runNetworkTest} disabled={loading} variant="outline">
            {loading ? 'Testing Network...' : 'Test Network Access'}
          </Button>
          <Button onClick={addCreatorAsParticipant} disabled={loading} variant="destructive">
            {loading ? 'Adding Creator...' : 'Fix: Add Creator as Participant'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {debugInfo && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-medium text-blue-900 mb-2">Debug Results</h4>
              <pre className="text-xs text-blue-800 overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          </div>
        )}
        
        {contractTest && (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <h4 className="font-medium text-green-900 mb-2">Contract Test Results</h4>
              <pre className="text-xs text-green-800 overflow-auto">
                {JSON.stringify(contractTest, null, 2)}
              </pre>
            </div>
          </div>
        )}
        
        {networkTest && (
          <div className="space-y-4">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded">
              <h4 className="font-medium text-purple-900 mb-2">Network Test Results</h4>
              <pre className="text-xs text-purple-800 overflow-auto">
                {JSON.stringify(networkTest, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ParticipantDebug;
