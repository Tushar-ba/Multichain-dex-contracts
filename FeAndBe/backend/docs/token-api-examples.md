# Token API Usage Examples

## Overview
The Token API provides endpoints to retrieve token information across multiple blockchain networks without requiring authentication.

## Supported Chains
- **Sepolia** (11155111) - 8 tokens
- **Polygon Amoy** (80002) - 7 tokens  
- **Arbitrum Sepolia** (421614) - 6 tokens
- **BSC Testnet** (97) - 7 tokens
- **Optimism Sepolia** (11155420) - 7 tokens
- **Avalanche Fuji** (43113) - 7 tokens
- **Holesky** (17000) - 4 tokens
- **Base Sepolia** (84532) - 4 tokens

## API Endpoints & Examples

### 1. Get All Tokens
```bash
GET /api/tokens
```
**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 50
}
```

### 2. Get Tokens by Chain ID
```bash
GET /api/tokens/chain/11155111
```
**Response:**
```json
{
  "success": true,
  "chainId": 11155111,
  "chainName": "Sepolia",
  "data": [
    {
      "address": "0x7d42a5f6D1Ea6F91a6b7D689cd6728ac5d156f2f",
      "data": {
        "name": "USD Coin",
        "symbol": "USDC",
        "uri": "https://tse2.mm.bing.net/th/id/OIP.x2szykLFcwq3fzNBzpdkpwHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        "decimals": 18,
        "chain": "Sepolia",
        "chainId": 11155111
      }
    }
  ],
  "count": 8
}
```

### 3. Get Supported Chains
```bash
GET /api/tokens/chains
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "chainId": 97,
      "name": "BSC Testnet",
      "tokenCount": 7
    },
    {
      "chainId": 11155111,
      "name": "Sepolia", 
      "tokenCount": 8
    }
  ],
  "count": 8
}
```

### 4. Search Tokens
```bash
GET /api/tokens/search?query=USD&chainId=11155111
```
**Response:**
```json
{
  "success": true,
  "query": "USD",
  "chainId": "11155111",
  "data": [
    {
      "address": "0x7d42a5f6D1Ea6F91a6b7D689cd6728ac5d156f2f",
      "data": {
        "name": "USD Coin",
        "symbol": "USDC",
        "decimals": 18,
        "chain": "Sepolia",
        "chainId": 11155111
      }
    }
  ],
  "count": 1
}
```

### 5. Get Token by Address
```bash
GET /api/tokens/chain/11155111/address/0x7d42a5f6D1Ea6F91a6b7D689cd6728ac5d156f2f
```
**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x7d42a5f6D1Ea6F91a6b7D689cd6728ac5d156f2f",
    "data": {
      "name": "USD Coin",
      "symbol": "USDC",
      "uri": "https://tse2.mm.bing.net/th/id/OIP.x2szykLFcwq3fzNBzpdkpwHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
      "decimals": 18,
      "chain": "Sepolia",
      "chainId": 11155111
    }
  }
}
```

### 6. Get Tokens by Symbol
```bash
GET /api/tokens/symbol/USDC
```
**Response:**
```json
{
  "success": true,
  "symbol": "USDC",
  "data": [
    {
      "address": "0x7d42a5f6D1Ea6F91a6b7D689cd6728ac5d156f2f",
      "data": {
        "name": "USD Coin",
        "symbol": "USDC",
        "chain": "Sepolia",
        "chainId": 11155111
      }
    },
    {
      "address": "0x53d6df2091A22165d89037926A59F81c0AAD33e0",
      "data": {
        "name": "USD Coin", 
        "symbol": "USDC",
        "chain": "Polygon Amoy",
        "chainId": 80002
      }
    }
  ],
  "count": 8
}
```

### 7. Get Token Pairs for DEX
```bash
GET /api/tokens/chain/11155111/pairs
```
**Response:**
```json
{
  "success": true,
  "chainId": 11155111,
  "chainName": "Sepolia",
  "data": [
    {
      "token0": {
        "address": "0x7d42a5f6D1Ea6F91a6b7D689cd6728ac5d156f2f",
        "symbol": "USDC",
        "name": "USD Coin",
        "decimals": 18
      },
      "token1": {
        "address": "0x16715e3E288d66E5121f04170024292ed869A5e4",
        "symbol": "ETH",
        "name": "Ethereum",
        "decimals": 18
      }
    }
  ],
  "count": 28
}
```

### 8. Get Common Tokens (Multi-chain)
```bash
GET /api/tokens/common
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "symbol": "USDC",
      "name": "USD Coin",
      "chains": [
        {
          "chainId": 11155111,
          "chainName": "Sepolia",
          "address": "0x7d42a5f6D1Ea6F91a6b7D689cd6728ac5d156f2f",
          "decimals": 18
        },
        {
          "chainId": 80002,
          "chainName": "Polygon Amoy", 
          "address": "0x53d6df2091A22165d89037926A59F81c0AAD33e0",
          "decimals": 18
        }
      ],
      "chainCount": 8
    }
  ],
  "count": 9
}
```

## Frontend Integration Examples

### React/JavaScript Usage
```javascript
// Get tokens for current chain
const getTokensForChain = async (chainId) => {
  try {
    const response = await fetch(`/api/tokens/chain/${chainId}`);
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return [];
  }
};

// Search tokens
const searchTokens = async (query, chainId = null) => {
  try {
    const url = chainId 
      ? `/api/tokens/search?query=${query}&chainId=${chainId}`
      : `/api/tokens/search?query=${query}`;
    
    const response = await fetch(url);
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error searching tokens:', error);
    return [];
  }
};

// Get token pairs for DEX
const getTokenPairs = async (chainId) => {
  try {
    const response = await fetch(`/api/tokens/chain/${chainId}/pairs`);
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching token pairs:', error);
    return [];
  }
};
```

## Error Responses
```json
{
  "error": "No tokens found for this chain",
  "chainId": 999999
}
```

```json
{
  "error": "Invalid chain ID"
}
```

```json
{
  "error": "Token not found",
  "chainId": 11155111,
  "address": "0x1234..."
}
```