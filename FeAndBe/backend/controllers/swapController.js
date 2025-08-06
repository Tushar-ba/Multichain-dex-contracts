const Swap = require('../models/Swap');
const { validateSwap } = require('../utils/validation');

const swapController = {
  // Create a new swap record
  createSwap: async (req, res) => {
    try {
      const { error } = validateSwap(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const swap = new Swap(req.body);
      await swap.save();
      
      res.status(201).json({
        success: true,
        data: swap
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ error: 'Transaction hash already exists' });
      }
      res.status(500).json({ error: error.message });
    }
  },

  // Get swaps by user address
  getSwapsByUser: async (req, res) => {
    try {
      const { userAddress } = req.params;
      const { page = 1, limit = 20, chainId, status } = req.query;
      
      const query = { userAddress: userAddress.toLowerCase() };
      if (chainId) query.chainId = parseInt(chainId);
      if (status) query.status = status;

      const swaps = await Swap.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('chainId', 'name symbol');

      const total = await Swap.countDocuments(query);

      res.json({
        success: true,
        data: swaps,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get swap by transaction hash
  getSwapByHash: async (req, res) => {
    try {
      const { hash } = req.params;
      const swap = await Swap.findOne({ transactionHash: hash })
        .populate('chainId', 'name symbol explorerUrl');

      if (!swap) {
        return res.status(404).json({ error: 'Swap not found' });
      }

      res.json({
        success: true,
        data: swap
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update swap status
  updateSwapStatus: async (req, res) => {
    try {
      const { hash } = req.params;
      const { status, blockNumber, blockTimestamp, gasUsed } = req.body;

      const swap = await Swap.findOneAndUpdate(
        { transactionHash: hash },
        { 
          status, 
          blockNumber, 
          blockTimestamp: blockTimestamp ? new Date(blockTimestamp * 1000) : undefined,
          gasUsed 
        },
        { new: true }
      );

      if (!swap) {
        return res.status(404).json({ error: 'Swap not found' });
      }

      res.json({
        success: true,
        data: swap
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get swap statistics
  getSwapStats: async (req, res) => {
    try {
      const { chainId, timeframe = '24h' } = req.query;
      
      let timeFilter = {};
      const now = new Date();
      
      switch (timeframe) {
        case '1h':
          timeFilter = { createdAt: { $gte: new Date(now - 60 * 60 * 1000) } };
          break;
        case '24h':
          timeFilter = { createdAt: { $gte: new Date(now - 24 * 60 * 60 * 1000) } };
          break;
        case '7d':
          timeFilter = { createdAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
          break;
        case '30d':
          timeFilter = { createdAt: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } };
          break;
      }

      const matchQuery = { ...timeFilter };
      if (chainId) matchQuery.chainId = parseInt(chainId);

      const stats = await Swap.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalSwaps: { $sum: 1 },
            totalVolumeUSD: { $sum: '$amountInUSD' },
            uniqueUsers: { $addToSet: '$userAddress' },
            avgSlippage: { $avg: '$slippage' }
          }
        },
        {
          $project: {
            totalSwaps: 1,
            totalVolumeUSD: 1,
            uniqueUsers: { $size: '$uniqueUsers' },
            avgSlippage: 1
          }
        }
      ]);

      res.json({
        success: true,
        data: stats[0] || {
          totalSwaps: 0,
          totalVolumeUSD: 0,
          uniqueUsers: 0,
          avgSlippage: 0
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = swapController;