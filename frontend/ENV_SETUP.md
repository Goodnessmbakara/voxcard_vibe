# Environment Variables Setup

Create a `.env` file in the `frontend` directory with the following variables:

```bash
# Stacks Network Configuration
# Options: "mainnet" or "testnet"
VITE_STACKS_NETWORK=testnet

# Stacks API URL
VITE_STACKS_API_URL=https://api.testnet.hiro.so

# Contract Configuration
# The Stacks address where your contract is deployed
VITE_CONTRACT_ADDRESS=ST240V2R09J62PD2KDMJ5Z5X85VAB4VNJ9NZ6XBS1

# The name of your deployed contract (UPDATED TO V6 - Enhanced Retrieve Functions!)
VITE_CONTRACT_NAME=voxcard-savings-v6

# Contract Transaction ID (for reference/verification)
VITE_CONTRACT_TX_ID=4feaa57b0c4217c2ca94c34e2d6e6f997446529f76a3ba3762aebd7fc82c6f0c

# sBTC Contracts (Testnet)
VITE_SBTC_TOKEN_CONTRACT=SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token
VITE_SBTC_REGISTRY_CONTRACT=SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-registry
VITE_SBTC_DEPOSIT_CONTRACT=SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-deposit

# VoxCard Contract (DEPLOYED V6 - Latest with Enhanced Queries!)
VITE_VOXCARD_CONTRACT=ST240V2R09J62PD2KDMJ5Z5X85VAB4VNJ9NZ6XBS1.voxcard-savings-v6

# Turnkey Configuration  
VITE_TURNKEY_API_BASE_URL=https://api.turnkey.com
VITE_TURNKEY_ORGANIZATION_ID=00e5ed83-5819-41ee-bd5e-315b49c40977
VITE_TURNKEY_API_PUBLIC_KEY=d26169ff-27ca-44e7-a391-8bfb79d3214d
VITE_TURNKEY_RPID=localhost
VITE_TURNKEY_IFRAME_URL=https://auth.turnkey.com

# Auth Proxy Configuration
VITE_AUTH_PROXY_CONFIG_ID=e3169061-936c-4295-9d05-c0bf2cc481ca

# VoxCard Contract Configuration
VITE_ORGANIZATION_ID=00e5ed83-5819-41ee-bd5e-315b49c40977
```

## Network Details

### Testnet
- API Endpoint: `https://api.testnet.hiro.so`
- Explorer: `https://explorer.hiro.so/?chain=testnet`

### Mainnet
- API Endpoint: `https://api.mainnet.hiro.so`
- Explorer: `https://explorer.hiro.so/?chain=mainnet`

## After Deployment

After deploying your contract to Stacks:
1. Update `VITE_CONTRACT_ADDRESS` with your deployed contract address
2. Update `VITE_CONTRACT_NAME` if you used a different name (current: voxcard-savings-v6)
3. Update `VITE_CONTRACT_TX_ID` with your deployment transaction ID
4. Set `VITE_STACKS_NETWORK` to `mainnet` when ready for production

## V6 Improvements

VoxCard Savings v6 includes enhanced retrieve functions:
- ✅ `get-groups-by-participant` - Get all groups a user participates in
- ✅ `get-paginated-group-ids` - Improved pagination without hardcoding
- ✅ `get-participant-count` - Get participant count for a group
- ✅ `get-cycle-contribution` - Get contribution details for any cycle
- ✅ `get-cycle-recipient` - Get recipient information for any cycle
- ✅ `get-join-request-details` - Get specific join request details
- ✅ `get-join-request-count` - Get count of pending requests
- ✅ `get-contract-config` - Get all contract configuration

## Wallet Integration

The application uses `@stacks/connect` for wallet integration, which supports:
- Leather Wallet (formerly Hiro Wallet)
- Xverse Wallet
- Other Stacks-compatible wallets

Users will be prompted to connect their wallet when they first interact with the application.

