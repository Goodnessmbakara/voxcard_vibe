import { readFileSync } from 'fs';
import transactionsPkg from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';

const { makeContractDeploy, broadcastTransaction, AnchorMode } = transactionsPkg;

// Read the Clarity contract code
const contractCode = readFileSync('./voxcard-stacks/contracts/voxcard-savings-v8.clar', 'utf8');

// Deployment configuration
const contractName = 'voxcard-savings-v8';
const network = STACKS_TESTNET;
const senderAddress = 'ST240V2R09J62PD2KDMJ5Z5X85VAB4VNJ9NZ6XBS1';
const privateKey = '8360233f8b5177477bb7f3205fa9ad650d73a898f685e278882a073a221dd85101';

console.log('🚀 Deploying VoxCard Savings v8 to Stacks Testnet...\n');

console.log('Contract Details:');
console.log(`Name: ${contractName}`);
console.log(`Network: Testnet`);
console.log(`Sender: ${senderAddress}`);
console.log(`Private Key: ${privateKey.substring(0, 8)}...${privateKey.substring(-8)}`);

// Deployment options
const txOptions = {
  contractName: contractName,
  codeBody: contractCode,
  senderKey: privateKey,
  network: network,
  anchorMode: AnchorMode.Any,
  fee: 300000n, // 0.3 STX fee
};

async function deployContract() {
  try {
    console.log('\n📝 Creating contract deployment transaction...');
    
    const transaction = await makeContractDeploy(txOptions);
    
    console.log('✅ Transaction created successfully!');
    console.log('\n🌐 Broadcasting transaction to network...');
    
    const broadcastResponse = await broadcastTransaction({ transaction, network });
    
    if (broadcastResponse.error) {
      console.error('\n❌ Deployment failed:');
      console.error(broadcastResponse);
      process.exit(1);
    }
    
    console.log('\n🎉 Contract v8 deployed successfully!');
    console.log(`📋 Transaction ID: ${broadcastResponse.txid}`);
    console.log(`🔗 View transaction: https://explorer.hiro.so/txid/${broadcastResponse.txid}?chain=testnet`);
    console.log(`\n📄 Contract address: ${senderAddress}.${contractName}`);
    console.log(`\n⏳ Transaction status: Pending confirmation`);
    console.log(`📝 Note: Wait for transaction confirmation (usually 1-2 blocks, ~10-20 minutes)`);
    console.log(`\n🎯 Once confirmed, your contract will be live at: ${senderAddress}.${contractName}`);
    console.log(`\n🔧 New Features in v8:`);
    console.log(`   - Enhanced participant tracking`);
    console.log(`   - Improved debt management`);
    console.log(`   - Better error handling`);
    console.log(`\n📝 Next Steps:`);
    console.log(`   1. Update frontend .env file with new contract name: ${contractName}`);
    console.log(`   2. Update frontend contract address: ${senderAddress}`);
    console.log(`   3. Test the frontend to ensure everything works correctly`);
    
  } catch (error) {
    console.error('\n❌ Error deploying contract:');
    console.error(error);
    process.exit(1);
  }
}

deployContract();
