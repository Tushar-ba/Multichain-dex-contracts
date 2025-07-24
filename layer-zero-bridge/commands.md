# CrossChain Router & Stablecoin OFT Commands

This document lists all available Hardhat tasks for deploying and interacting with the CrossChainRouter and CustomStablecoinOFT contracts.

## Prerequisites

Make sure you have the proper network configuration in your `hardhat.config.ts` and LayerZero endpoint addresses for your target networks.

## Deployment Commands

### Deploy CustomStablecoinOFT

Deploy the stablecoin OFT contract:

```bash
npx hardhat deploy-stablecoin --lz-endpoint <LZ_ENDPOINT_ADDRESS> --network <NETWORK_NAME>
```

**Parameters:**
- `--lz-endpoint`: LayerZero endpoint address for the network
- `--name`: (Optional) Token name (default: "CrossChain Stablecoin")
- `--symbol`: (Optional) Token symbol (default: "CCSTB")

**Example:**
```bash
npx hardhat deploy-stablecoin --lz-endpoint 0x6EDCE65403992e310A62460808c4b910D972f10f --network ethereum-sepolia
```

### Deploy CrossChainRouter

Deploy the cross-chain router contract:

```bash
npx hardhat deploy-router --lz-endpoint <LZ_ENDPOINT_ADDRESS> --dex-router <DEX_ROUTER_ADDRESS> --stablecoin-oft <STABLECOIN_OFT_ADDRESS> --network <NETWORK_NAME>
```

**Parameters:**
- `--lz-endpoint`: LayerZero endpoint address for the network
- `--dex-router`: Address of the PayfundsRouter02 contract
- `--stablecoin-oft`: Address of the deployed CustomStablecoinOFT contract

**Example:**
```bash
npx hardhat deploy-router --lz-endpoint 0x6EDCE65403992e310A62460808c4b910D972f10f --dex-router 0x123...abc --stablecoin-oft 0x456...def --network ethereum-sepolia
```

## Token Management Commands

### Mint Stablecoins

Mint stablecoins to a specific address:

```bash
npx hardhat mint-stablecoin --contract <STABLECOIN_ADDRESS> --to <RECIPIENT_ADDRESS> --amount <AMOUNT_IN_WEI> --network <NETWORK_NAME>
```

**Example:**
```bash
npx hardhat mint-stablecoin --contract 0x456...def --to 0x789...ghi --amount 1000000000000000000000 --network ethereum-sepolia
```

### Check Token Balance

Check the balance of any token for a specific account:

```bash
npx hardhat check-balance --contract <TOKEN_ADDRESS> --account <ACCOUNT_ADDRESS> --network <NETWORK_NAME>
```

**Example:**
```bash
npx hardhat check-balance --contract 0x456...def --account 0x789...ghi --network ethereum-sepolia
```

### Add Minter

Add a new minter address to the stablecoin contract:

```bash
npx hardhat add-minter --contract <STABLECOIN_ADDRESS> --minter <MINTER_ADDRESS> --network <NETWORK_NAME>
```

**Example:**
```bash
npx hardhat add-minter --contract 0x456...def --minter 0xabc...123 --network ethereum-sepolia
```

## LayerZero Configuration Commands

### Set Peer

Set a peer contract on another chain for the OFT:

```bash
npx hardhat set-peer --contract <OFT_ADDRESS> --dst-eid <DESTINATION_EID> --peer <PEER_ADDRESS> --network <NETWORK_NAME>
```

**Parameters:**
- `--dst-eid`: Destination LayerZero endpoint ID
- `--peer`: Address of the peer contract on the destination chain

**Example:**
```bash
npx hardhat set-peer --contract 0x456...def --dst-eid 40161 --peer 0x789...ghi --network ethereum-sepolia
```

## Cross-Chain Swap Commands

### Estimate Swap Output

Estimate the output amount for a cross-chain swap:

```bash
npx hardhat estimate-swap --router <ROUTER_ADDRESS> --source-token <SOURCE_TOKEN_ADDRESS> --amount-in <AMOUNT_IN_WEI> --network <NETWORK_NAME>
```

**Example:**
```bash
npx hardhat estimate-swap --router 0x123...abc --source-token 0xdef...456 --amount-in 1000000000000000000 --network ethereum-sepolia
```

### Quote Swap Fee

Get the LayerZero fee required for a cross-chain swap:

```bash
npx hardhat quote-swap-fee --router <ROUTER_ADDRESS> --destination-eid <DEST_EID> --recipient <RECIPIENT_ADDRESS> --destination-token <DEST_TOKEN_ADDRESS> --amount-out-min <MIN_AMOUNT> --stable-amount <STABLE_AMOUNT> --network <NETWORK_NAME>
```

**Parameters:**
- `--destination-eid`: Destination chain LayerZero endpoint ID
- `--recipient`: Recipient address on destination chain
- `--destination-token`: Token address to receive on destination chain
- `--amount-out-min`: Minimum amount to receive
- `--stable-amount`: Amount of stablecoins to send
- `--options`: (Optional) LayerZero options (default: "0x")

**Example:**
```bash
npx hardhat quote-swap-fee --router 0x123...abc --destination-eid 40161 --recipient 0x789...ghi --destination-token 0xabc...def --amount-out-min 900000000000000000 --stable-amount 1000000000000000000 --network ethereum-sepolia
```

### Perform Cross-Chain Swap

Execute a cross-chain token swap:

```bash
npx hardhat cross-chain-swap --router <ROUTER_ADDRESS> --destination-eid <DEST_EID> --recipient <RECIPIENT_ADDRESS> --source-token <SOURCE_TOKEN_ADDRESS> --destination-token <DEST_TOKEN_ADDRESS> --amount-in <AMOUNT_IN_WEI> --amount-out-min <MIN_AMOUNT> --network <NETWORK_NAME>
```

**Parameters:**
- `--destination-eid`: Destination chain LayerZero endpoint ID
- `--recipient`: Recipient address on destination chain
- `--source-token`: Token to swap on source chain
- `--destination-token`: Token to receive on destination chain
- `--amount-in`: Amount of source tokens to swap
- `--amount-out-min`: Minimum amount to receive on destination
- `--options`: (Optional) LayerZero options (default: "0x")

**Example:**
```bash
npx hardhat cross-chain-swap --router 0x123...abc --destination-eid 40161 --recipient 0x789...ghi --source-token 0xdef...456 --destination-token 0xabc...def --amount-in 1000000000000000000 --amount-out-min 900000000000000000 --network ethereum-sepolia
```

## Information Commands

### Contract Information

Get detailed information about deployed contracts:

**For Stablecoin:**
```bash
npx hardhat contract-info --contract <STABLECOIN_ADDRESS> --type stablecoin --network <NETWORK_NAME>
```

**For Router:**
```bash
npx hardhat contract-info --contract <ROUTER_ADDRESS> --type router --network <NETWORK_NAME>
```

**Examples:**
```bash
npx hardhat contract-info --contract 0x456...def --type stablecoin --network ethereum-sepolia
npx hardhat contract-info --contract 0x123...abc --type router --network ethereum-sepolia
```

## Common LayerZero Endpoint IDs

| Network | Endpoint ID |
|---------|-------------|
| Ethereum Sepolia | 40161 |
| Arbitrum Sepolia | 40231 |
| Optimism Sepolia | 40232 |
| Base Sepolia | 40245 |
| Polygon Amoy | 40267 |
| BSC Testnet | 40102 |
| Avalanche Fuji | 40106 |

## Workflow Example

1. **Deploy on Source Chain (e.g., Ethereum Sepolia):**
   ```bash
   npx hardhat deploy-stablecoin --lz-endpoint 0x6EDCE65403992e310A62460808c4b910D972f10f --network ethereum-sepolia
   npx hardhat deploy-router --lz-endpoint 0x6EDCE65403992e310A62460808c4b910D972f10f --dex-router <DEX_ROUTER> --stablecoin-oft <STABLECOIN_ADDRESS> --network ethereum-sepolia
   ```

2. **Deploy on Destination Chain (e.g., Arbitrum Sepolia):**
   ```bash
   npx hardhat deploy-stablecoin --lz-endpoint 0x6EDCE65403992e310A62460808c4b910D972f10f --network arbitrum-sepolia
   npx hardhat deploy-router --lz-endpoint 0x6EDCE65403992e310A62460808c4b910D972f10f --dex-router <DEX_ROUTER> --stablecoin-oft <STABLECOIN_ADDRESS> --network arbitrum-sepolia
   ```

3. **Configure Peers:**
   ```bash
   npx hardhat set-peer --contract <ETH_STABLECOIN> --dst-eid 40231 --peer <ARB_STABLECOIN> --network ethereum-sepolia
   npx hardhat set-peer --contract <ARB_STABLECOIN> --dst-eid 40161 --peer <ETH_STABLECOIN> --network arbitrum-sepolia
   ```

4. **Mint Initial Supply:**
   ```bash
   npx hardhat mint-stablecoin --contract <STABLECOIN_ADDRESS> --to <ROUTER_ADDRESS> --amount 1000000000000000000000 --network ethereum-sepolia
   ```

5. **Perform Cross-Chain Swap:**
   ```bash
   npx hardhat cross-chain-swap --router <ETH_ROUTER> --destination-eid 40231 --recipient <RECIPIENT> --source-token <SOURCE_TOKEN> --destination-token <DEST_TOKEN> --amount-in 1000000000000000000 --amount-out-min 900000000000000000 --network ethereum-sepolia
   ```

## Notes

- Make sure to have sufficient native tokens for gas fees
- LayerZero fees are paid in native tokens (ETH, MATIC, etc.)
- Always test on testnets before mainnet deployment
- Ensure DEX routers and token pairs exist before attempting swaps
- Set appropriate slippage tolerance with `--amount-out-min` 