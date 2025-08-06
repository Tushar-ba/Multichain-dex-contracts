const mongoose = require('mongoose');

const pairCreatedSchema = new mongoose.Schema({
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
    factoryAddress: {
        type: String,
        required: true,
        lowercase: true
    },
    token0: {
        type: String,
        required: true,
        lowercase: true,
        index: true
    },
    token1: {
        type: String,
        required: true,
        lowercase: true,
        index: true
    },
    pairAddress: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        index: true
    },
    pairIndex: {
        type: Number,
        required: true
    },
    blockNumber: {
        type: Number,
        required: true
    },
    blockTimestamp: {
        type: Date,
        required: true
    },
    gasUsed: String,
    gasPrice: String,
    creator: {
        type: String,
        required: true,
        lowercase: true
    },
    // Additional metadata
    token0Symbol: String,
    token1Symbol: String,
    token0Decimals: Number,
    token1Decimals: Number,
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
pairCreatedSchema.index({ chainId: 1, createdAt: -1 });
pairCreatedSchema.index({ token0: 1, token1: 1 });
pairCreatedSchema.index({ pairAddress: 1, chainId: 1 });
pairCreatedSchema.index({ blockTimestamp: -1 });

module.exports = mongoose.model('PairCreated', pairCreatedSchema);