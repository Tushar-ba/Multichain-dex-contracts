const mongoose = require('mongoose');

const liquidityProviderSchema = new mongoose.Schema({
  transactionHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  chainId: {
    type: Number,
    required: true,
    ref: 'Chain'
  },
  routerAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  userAddress: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: ['add', 'remove', 'addMATIC', 'removeMATIC']
  },
  // For addLiquidity/removeLiquidity
  tokenA: {
    address: {
      type: String,
      required: true,
      lowercase: true
    },
    symbol: String,
    decimals: Number,
    amountDesired: String, // for add operations
    amountMin: String,
    actualAmount: String
  },
  tokenB: {
    address: {
      type: String,
      required: true,
      lowercase: true
    },
    symbol: String,
    decimals: Number,
    amountDesired: String, // for add operations
    amountMin: String,
    actualAmount: String
  },
  // Liquidity details
  liquidity: {
    type: String,
    required: true
  },
  pairAddress: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  to: {
    type: String,
    required: true,
    lowercase: true
  },
  deadline: {
    type: Number,
    required: true
  },
  // For MATIC operations
  maticAmount: String,
  maticAmountMin: String,
  
  // USD values for analytics
  totalValueUSD: {
    type: Number,
    default: 0
  },
  
  // Transaction details
  gasUsed: String,
  gasPrice: String,
  blockNumber: {
    type: Number,
    required: true
  },
  blockTimestamp: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending'
  },
  
  // Pool state at time of transaction
  reserves: {
    reserveA: String,
    reserveB: String
  },
  
  // Price information
  priceAPerB: Number,
  priceBPerA: Number
}, {
  timestamps: true
});

liquidityProviderSchema.index({ userAddress: 1, createdAt: -1 });
liquidityProviderSchema.index({ chainId: 1, pairAddress: 1 });
liquidityProviderSchema.index({ status: 1 });
liquidityProviderSchema.index({ blockTimestamp: -1 });
liquidityProviderSchema.index({ action: 1 });

module.exports = mongoose.model('LiquidityProvider', liquidityProviderSchema);