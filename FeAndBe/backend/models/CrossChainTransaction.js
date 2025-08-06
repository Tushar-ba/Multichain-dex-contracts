const mongoose = require('mongoose');

const crossChainTransactionSchema = new mongoose.Schema({
  // Source transaction details
  sourceTransactionHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  sourceChainId: {
    type: Number,
    required: true,
    ref: 'Chain'
  },
  sourceBlockNumber: Number,
  sourceBlockTimestamp: Date,
  
  // Destination transaction details
  destinationTransactionHash: String,
  destinationChainId: {
    type: Number,
    required: true,
    ref: 'Chain'
  },
  destinationBlockNumber: Number,
  destinationBlockTimestamp: Date,
  
  // LayerZero specific fields
  destinationEid: {
    type: Number,
    required: true
  },
  
  // User details
  sender: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  recipient: {
    type: String,
    required: true,
    lowercase: true
  },
  
  // CrossChainSwapInitiated event data
  sourceToken: {
    address: {
      type: String,
      required: true,
      lowercase: true
    },
    symbol: String,
    decimals: Number,
    amount: {
      type: String,
      required: true
    }
  },
  
  destinationToken: {
    address: {
      type: String,
      required: true,
      lowercase: true
    },
    symbol: String,
    decimals: Number,
    amount: String // filled when completed
  },
  
  // Stablecoin intermediate amounts
  stableAmount: {
    type: String,
    required: true
  },
  amountOutMin: {
    type: String,
    required: true
  },
  
  // LayerZero message details
  layerZeroData: {
    messageId: String,
    nonce: String,
    options: String,
    lzTokenFee: String,
    nativeFee: String
  },
  
  // Financial details
  amountInUSD: {
    type: Number,
    default: 0
  },
  amountOutUSD: {
    type: Number,
    default: 0
  },
  bridgeFeeUSD: {
    type: Number,
    default: 0
  },
  
  // Gas details
  sourceGasUsed: String,
  sourceGasPrice: String,
  destinationGasUsed: String,
  destinationGasPrice: String,
  
  // Status tracking
  status: {
    type: String,
    enum: ['initiated', 'pending', 'relaying', 'completed', 'failed', 'refunded'],
    default: 'initiated'
  },
  
  // Router addresses
  sourceRouterAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  destinationRouterAddress: String,
  
  // Timing
  estimatedCompletionTime: Date,
  actualCompletionTime: Date,
  
  // Error handling
  errorMessage: String,
  retryCount: {
    type: Number,
    default: 0
  },
  
  // Event tracking
  events: [{
    eventType: {
      type: String,
      enum: ['CrossChainSwapInitiated', 'CrossChainSwapCompleted', 'MessageSent', 'MessageReceived']
    },
    transactionHash: String,
    blockNumber: Number,
    timestamp: Date,
    data: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true
});

crossChainTransactionSchema.index({ sender: 1, createdAt: -1 });
crossChainTransactionSchema.index({ recipient: 1, createdAt: -1 });
crossChainTransactionSchema.index({ sourceChainId: 1, destinationChainId: 1 });
crossChainTransactionSchema.index({ destinationEid: 1 });
crossChainTransactionSchema.index({ status: 1 });
crossChainTransactionSchema.index({ sourceBlockTimestamp: -1 });

module.exports = mongoose.model('CrossChainTransaction', crossChainTransactionSchema);