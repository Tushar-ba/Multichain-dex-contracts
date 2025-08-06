# Multi-Chain DEX Backend

A robust backend API for managing multi-chain DEX operations including swaps, liquidity provision, and cross-chain transactions.

## Features

- **Multi-chain Support**: Track transactions across multiple blockchain networks
- **Swap Management**: Record and monitor DEX swaps with detailed metadata
- **Liquidity Tracking**: Monitor LP positions and liquidity operations
- **Cross-chain Transactions**: Handle bridge transactions across different protocols
- **Chain Management**: Configure and manage supported blockchain networks
- **Statistics & Analytics**: Comprehensive stats for all transaction types

## Tech Stack

- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Joi** for validation
- **CORS** for cross-origin requests
- **Helmet** for security
- **Morgan** for logging
- **Rate limiting** for API protection

## Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd FeAndBe/backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start MongoDB (make sure MongoDB is installed and running)

5. Run the application:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Events (Contract Event Processing)
- `POST /api/events` - Process single contract event
- `POST /api/events/batch` - Process batch contract events
- `POST /api/events/pair-created` - Process PairCreated event
- `POST /api/events/swap` - Process Swap event
- `POST /api/events/liquidity` - Process Liquidity events
- `POST /api/events/cross-chain` - Process CrossChain events

### Pairs (PayfundsFactory)
- `POST /api/pairs` - Create pair record from PairCreated event
- `GET /api/pairs` - Get all pairs
- `GET /api/pairs/address/:pairAddress` - Get pair by address
- `GET /api/pairs/token/:tokenAddress` - Get pairs by token
- `GET /api/pairs/tokens/:token0/:token1` - Get pair by token pair
- `PUT /api/pairs/address/:pairAddress/metadata` - Update pair metadata
- `GET /api/pairs/stats` - Get pair statistics

### Swaps (PayfundsRouter02)
- `POST /api/swaps` - Create swap record
- `GET /api/swaps/user/:userAddress` - Get user swaps
- `GET /api/swaps/hash/:hash` - Get swap by transaction hash
- `PUT /api/swaps/hash/:hash/status` - Update swap status
- `GET /api/swaps/stats` - Get swap statistics

### Liquidity (PayfundsRouter02)
- `POST /api/liquidity` - Create LP record
- `GET /api/liquidity/user/:userAddress` - Get user LP positions
- `GET /api/liquidity/hash/:hash` - Get LP by transaction hash
- `GET /api/liquidity/pool/:poolAddress` - Get LP by pool
- `PUT /api/liquidity/hash/:hash/status` - Update LP status
- `GET /api/liquidity/stats` - Get LP statistics

### Cross-Chain (LayerZero CrossChainRouter)
- `POST /api/cross-chain` - Create cross-chain transaction
- `GET /api/cross-chain/user/:userAddress` - Get user cross-chain transactions
- `GET /api/cross-chain/hash/:hash` - Get cross-chain by hash
- `PUT /api/cross-chain/hash/:hash/status` - Update cross-chain status
- `GET /api/cross-chain/pending` - Get pending transactions
- `GET /api/cross-chain/stats` - Get cross-chain statistics

### Chains
- `POST /api/chains` - Create chain
- `GET /api/chains` - Get all chains
- `GET /api/chains/:chainId` - Get chain by ID
- `PUT /api/chains/:chainId` - Update chain
- `DELETE /api/chains/:chainId` - Delete chain
- `PUT /api/chains/:chainId/toggle` - Toggle chain status
- `GET /api/chains/:chainId/protocols` - Get supported protocols

### Tokens
- `GET /api/tokens` - Get all tokens
- `GET /api/tokens/chains` - Get supported chains
- `GET /api/tokens/common` - Get common tokens (exist on multiple chains)
- `GET /api/tokens/search?query=<search>&chainId=<chainId>` - Search tokens
- `GET /api/tokens/chain/:chainId` - Get tokens by chain ID
- `GET /api/tokens/chain/:chainId/pairs` - Get token pairs for DEX
- `GET /api/tokens/chain/:chainId/address/:address` - Get token by address
- `GET /api/tokens/symbol/:symbol` - Get tokens by symbol

### Balances
- `GET /api/balances/chain/:chainId/token/:tokenAddress/user/:userAddress` - Get single token balance
- `POST /api/balances/chain/:chainId/user/:userAddress/multiple` - Get multiple token balances
- `GET /api/balances/chain/:chainId/user/:userAddress/all` - Get all token balances for a chain

### Health Check
- `GET /health` - Health check endpoint

## Database Models

### Chain
Stores blockchain network configurations including RPC URLs, explorer URLs, and supported protocols.

### Swap
Records DEX swap transactions with token details, amounts, fees, and routing information.

### LiquidityProvider
Tracks liquidity provision operations including add/remove actions and position details.

### CrossChainTransaction
Manages cross-chain bridge transactions with source/destination chain details and bridge protocol information.

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URI` - MongoDB connection string
- `FRONTEND_URL` - Frontend URL for CORS
- `JWT_SECRET` - JWT secret key (if authentication is added)

## Security Features

- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API rate limiting
- **Input Validation** - Joi schema validation
- **Error Handling** - Comprehensive error handling

## Development

The backend is structured with:
- `/config` - Database and configuration files
- `/models` - MongoDB schemas
- `/controllers` - Business logic
- `/routes` - API route definitions
- `/utils` - Utility functions and validation

## Contributing

1. Follow the existing code structure
2. Add proper validation for new endpoints
3. Include error handling
4. Update documentation for new features