const mongoose = require('mongoose');

const swapSchema = new mongoose.Schema({
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
  // swapExactTokensForTokens specific fields
  amountIn: {
    type: String,
    required: true
  },
  amountOutMin: {
    type: String,
    required: true
  },
  actualAmountOut: {
    type: String,
    required: true
  },
  path: [{
    type: String,
    lowercase: true,
    required: true
  }],
  to: {
    type: String,
    required: true,
    lowercase: true
  },
  deadline: {
    type: Number,
    required: true
  },
  // Token details for first and last in path
  tokenIn: {
    address: {
      type: String,
      required: true,
      lowercase: true
    },
    symbol: String,
    decimals: Number
  },
  tokenOut: {
    address: {
      type: String,
      required: true,
      lowercase: true
    },
    symbol: String,
    decimals: Number
  },
  // USD values for analytics
  amountInUSD: {
    type: Number,
    default: 0
  },
  amountOutUSD: {
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
  // Price impact and slippage calculations
  priceImpact: Number,
  slippage: Number,
  // All amounts returned from the swap
  amounts: [{
    type: String
  }]
}, {
  timestamps: true
});

swapSchema.index({ userAddress: 1, createdAt: -1 });
swapSchema.index({ chainId: 1, createdAt: -1 });
swapSchema.index({ status: 1 });
swapSchema.index({ blockTimestamp: -1 });
swapSchema.index({ 'tokenIn.address': 1, 'tokenOut.address': 1 });

module.exports = mongoose.model('Swap', swapSchema);