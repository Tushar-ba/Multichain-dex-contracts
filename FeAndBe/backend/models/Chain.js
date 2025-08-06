const mongoose = require('mongoose');

const chainSchema = new mongoose.Schema({
  chainId: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  symbol: {
    type: String,
    required: true,
    trim: true
  },
  rpcUrl: {
    type: String,
    required: true
  },
  explorerUrl: {
    type: String,
    required: true
  },
  nativeCurrency: {
    name: String,
    symbol: String,
    decimals: Number
  },
  isActive: {
    type: Boolean,
    default: true
  },
  supportedProtocols: [{
    type: String,
    enum: ['uniswap-v2', 'uniswap-v3', 'pancakeswap', 'sushiswap', 'curve']
  }],
  bridgeContracts: {
    layerZero: String,
    axelar: String,
    wormhole: String
  }
}, {
  timestamps: true
});

chainSchema.index({ chainId: 1 });
chainSchema.index({ name: 1 });

module.exports = mongoose.model('Chain', chainSchema);