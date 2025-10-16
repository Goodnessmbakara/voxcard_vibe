// Network test utility to verify contract accessibility
import { callReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { StacksTestnet, StacksMainnet } from '@stacks/network';

export const testNetworkAccess = async () => {
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || "ST240V2R09J62PD2KDMJ5Z5X85VAB4VNJ9NZ6XBS1";
  const contractName = import.meta.env.VITE_CONTRACT_NAME || "voxcard-savings-v8";
  const networkType = import.meta.env.VITE_STACKS_NETWORK || "testnet";
  
  const network = networkType === "mainnet" ? new StacksMainnet() : new StacksTestnet();
  
  console.log('=== TESTING NETWORK ACCESS ===');
  console.log('Network Type:', networkType);
  console.log('Contract Address:', contractAddress);
  console.log('Contract Name:', contractName);
  console.log('Network URL:', network.coreApiUrl);
  
  try {
    // Test 1: Try to get group count
    console.log('\n1. Testing get-group-count...');
    const countResult = await callReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-group-count",
      functionArgs: [],
      network,
      senderAddress: contractAddress, // Use contract address as sender for read-only calls
    });
    
    const countResponse = cvToJSON(countResult);
    console.log('Group count result:', countResponse);
    
    // Test 2: Try to get contract config
    console.log('\n2. Testing get-contract-config...');
    const configResult = await callReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-contract-config",
      functionArgs: [],
      network,
      senderAddress: contractAddress,
    });
    
    const configResponse = cvToJSON(configResult);
    console.log('Contract config result:', configResponse);
    
    return {
      networkType,
      contractAddress,
      contractName,
      networkUrl: network.coreApiUrl,
      groupCount: countResponse,
      contractConfig: configResponse,
      success: true
    };
    
  } catch (error) {
    console.error('Network test failed:', error);
    return {
      networkType,
      contractAddress,
      contractName,
      networkUrl: network.coreApiUrl,
      error: error.message,
      success: false
    };
  }
};

