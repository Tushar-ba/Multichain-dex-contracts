const LiquidityProvider = require('../models/LiquidityProvider');
const { validateLP } = require('../utils/validation');

const lpController = {
  // Create a new LP record
  createLP: async (req, res) => {
    try {
      const { error } = validateLP(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const lp = new LiquidityProvider(req.body);
      await lp.save();
      
      res.status(201).json({
        success: true,
        data: lp
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ error: 'Transaction hash already exists' });
      }
      res.status(500).json({ error: error.message });
    }
  },

  // Get LP positions by user address
  getLPByUser: async (req, res) => {
    try {
      const { userAddress } = req.params;
      const { page = 1, limit = 20, chainId, action, poolAddress } = req.query;
      
      const query = { userAddress: userAddress.toLowerCase() };
      if (chainId) query.chainId = parseInt(chainId);
      if (action) query.action = action;
      if (poolAddress) query.poolAddress = poolAddress.toLowerCase();

      const positions = await LiquidityProvider.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('chainId', 'name symbol');

      const total = await LiquidityProvider.countDocuments(query);

      res.json({
        success: true,
        data: positions,
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

  // Get LP position by transaction hash
  getLPByHash: async (req, res) => {
    try {
      const { hash } = req.params;
      const lp = await LiquidityProvider.findOne({ transactionHash: hash })
        .populate('chainId', 'name symbol explorerUrl');

      if (!lp) {
        return res.status(404).json({ error: 'LP position not found' });
      }

      res.json({
        success: true,
        data: lp
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get LP positions by pool
  getLPByPool: async (req, res) => {
    try {
      const { poolAddress } = req.params;
      const { page = 1, limit = 20, chainId, action } = req.query;
      
      const query = { poolAddress: poolAddress.toLowerCase() };
      if (chainId) query.chainId = parseInt(chainId);
      if (action) query.action = action;

      const positions = await LiquidityProvider.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('chainId', 'name symbol');

      const total = await LiquidityProvider.countDocuments(query);

      res.json({
        success: true,
        data: positions,
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

  // Update LP status
  updateLPStatus: async (req, res) => {
    try {
      const { hash } = req.params;
      const { status, blockNumber, blockTimestamp, gasUsed } = req.body;

      const lp = await LiquidityProvider.findOneAndUpdate(
        { transactionHash: hash },
        { 
          status, 
          blockNumber, 
          blockTimestamp: blockTimestamp ? new Date(blockTimestamp * 1000) : undefined,
          gasUsed 
        },
        { new: true }
      );

      if (!lp) {
        return res.status(404).json({ error: 'LP position not found' });
      }

      res.json({
        success: true,
        data: lp
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get LP statistics
  getLPStats: async (req, res) => {
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

      const stats = await LiquidityProvider.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
            totalValueUSD: { $sum: '$totalValueUSD' },
            uniqueUsers: { $addToSet: '$userAddress' }
          }
        },
        {
          $project: {
            action: '$_id',
            count: 1,
            totalValueUSD: 1,
            uniqueUsers: { $size: '$uniqueUsers' }
          }
        }
      ]);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = lpController;