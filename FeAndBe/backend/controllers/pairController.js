const PairCreated = require('../models/PairCreated');
const { validatePairCreated } = require('../utils/validation');

const pairController = {
  // Create a new pair record from PairCreated event
  createPair: async (req, res) => {
    try {
      const { error } = validatePairCreated(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const pair = new PairCreated(req.body);
      await pair.save();
      
      res.status(201).json({
        success: true,
        data: pair
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ error: 'Pair already exists' });
      }
      res.status(500).json({ error: error.message });
    }
  },

  // Get all pairs
  getAllPairs: async (req, res) => {
    try {
      const { page = 1, limit = 20, chainId, isActive } = req.query;
      
      const query = {};
      if (chainId) query.chainId = parseInt(chainId);
      if (isActive !== undefined) query.isActive = isActive === 'true';

      const pairs = await PairCreated.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('chainId', 'name symbol');

      const total = await PairCreated.countDocuments(query);

      res.json({
        success: true,
        data: pairs,
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

  // Get pair by address
  getPairByAddress: async (req, res) => {
    try {
      const { pairAddress } = req.params;
      const { chainId } = req.query;
      
      const query = { pairAddress: pairAddress.toLowerCase() };
      if (chainId) query.chainId = parseInt(chainId);

      const pair = await PairCreated.findOne(query)
        .populate('chainId', 'name symbol explorerUrl');

      if (!pair) {
        return res.status(404).json({ error: 'Pair not found' });
      }

      res.json({
        success: true,
        data: pair
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get pairs by token
  getPairsByToken: async (req, res) => {
    try {
      const { tokenAddress } = req.params;
      const { page = 1, limit = 20, chainId } = req.query;
      
      const query = {
        $or: [
          { token0: tokenAddress.toLowerCase() },
          { token1: tokenAddress.toLowerCase() }
        ]
      };
      if (chainId) query.chainId = parseInt(chainId);

      const pairs = await PairCreated.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('chainId', 'name symbol');

      const total = await PairCreated.countDocuments(query);

      res.json({
        success: true,
        data: pairs,
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

  // Get pair by token pair
  getPairByTokens: async (req, res) => {
    try {
      const { token0, token1 } = req.params;
      const { chainId } = req.query;
      
      const query = {
        $or: [
          { token0: token0.toLowerCase(), token1: token1.toLowerCase() },
          { token0: token1.toLowerCase(), token1: token0.toLowerCase() }
        ]
      };
      if (chainId) query.chainId = parseInt(chainId);

      const pair = await PairCreated.findOne(query)
        .populate('chainId', 'name symbol explorerUrl');

      if (!pair) {
        return res.status(404).json({ error: 'Pair not found' });
      }

      res.json({
        success: true,
        data: pair
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update pair metadata
  updatePairMetadata: async (req, res) => {
    try {
      const { pairAddress } = req.params;
      const { token0Symbol, token1Symbol, token0Decimals, token1Decimals, isActive } = req.body;

      const updateData = {};
      if (token0Symbol) updateData.token0Symbol = token0Symbol;
      if (token1Symbol) updateData.token1Symbol = token1Symbol;
      if (token0Decimals !== undefined) updateData.token0Decimals = token0Decimals;
      if (token1Decimals !== undefined) updateData.token1Decimals = token1Decimals;
      if (isActive !== undefined) updateData.isActive = isActive;

      const pair = await PairCreated.findOneAndUpdate(
        { pairAddress: pairAddress.toLowerCase() },
        updateData,
        { new: true }
      );

      if (!pair) {
        return res.status(404).json({ error: 'Pair not found' });
      }

      res.json({
        success: true,
        data: pair
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get pair statistics
  getPairStats: async (req, res) => {
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

      const stats = await PairCreated.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$chainId',
            totalPairs: { $sum: 1 },
            uniqueTokens: { 
              $addToSet: { $setUnion: ['$token0', '$token1'] }
            },
            uniqueCreators: { $addToSet: '$creator' }
          }
        },
        {
          $project: {
            chainId: '$_id',
            totalPairs: 1,
            uniqueTokens: { 
              $size: {
                $reduce: {
                  input: '$uniqueTokens',
                  initialValue: [],
                  in: { $setUnion: ['$$value', '$$this'] }
                }
              }
            },
            uniqueCreators: { $size: '$uniqueCreators' }
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

module.exports = pairController;