const CrossChainTransaction = require('../models/CrossChainTransaction');
const { validateCrossChain } = require('../utils/validation');

const crossChainController = {
  // Create a new cross-chain transaction record
  createCrossChainTx: async (req, res) => {
    try {
      const { error } = validateCrossChain(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const crossChainTx = new CrossChainTransaction(req.body);
      await crossChainTx.save();
      
      res.status(201).json({
        success: true,
        data: crossChainTx
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ error: 'Source transaction hash already exists' });
      }
      res.status(500).json({ error: error.message });
    }
  },

  // Get cross-chain transactions by user address
  getCrossChainByUser: async (req, res) => {
    try {
      const { userAddress } = req.params;
      const { page = 1, limit = 20, sourceChainId, destinationChainId, status, bridgeProtocol } = req.query;
      
      const query = { userAddress: userAddress.toLowerCase() };
      if (sourceChainId) query.sourceChainId = parseInt(sourceChainId);
      if (destinationChainId) query.destinationChainId = parseInt(destinationChainId);
      if (status) query.status = status;
      if (bridgeProtocol) query.bridgeProtocol = bridgeProtocol;

      const transactions = await CrossChainTransaction.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('sourceChainId', 'name symbol')
        .populate('destinationChainId', 'name symbol');

      const total = await CrossChainTransaction.countDocuments(query);

      res.json({
        success: true,
        data: transactions,
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

  // Get cross-chain transaction by source hash
  getCrossChainByHash: async (req, res) => {
    try {
      const { hash } = req.params;
      const transaction = await CrossChainTransaction.findOne({ sourceTransactionHash: hash })
        .populate('sourceChainId', 'name symbol explorerUrl')
        .populate('destinationChainId', 'name symbol explorerUrl');

      if (!transaction) {
        return res.status(404).json({ error: 'Cross-chain transaction not found' });
      }

      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update cross-chain transaction status
  updateCrossChainStatus: async (req, res) => {
    try {
      const { hash } = req.params;
      const { 
        status, 
        destinationTransactionHash, 
        destinationBlockNumber, 
        destinationBlockTimestamp,
        destinationGasUsed,
        destinationGasPrice,
        actualCompletionTime,
        errorMessage
      } = req.body;

      const updateData = { status };
      if (destinationTransactionHash) updateData.destinationTransactionHash = destinationTransactionHash;
      if (destinationBlockNumber) updateData.destinationBlockNumber = destinationBlockNumber;
      if (destinationBlockTimestamp) updateData.destinationBlockTimestamp = new Date(destinationBlockTimestamp * 1000);
      if (destinationGasUsed) updateData.destinationGasUsed = destinationGasUsed;
      if (destinationGasPrice) updateData.destinationGasPrice = destinationGasPrice;
      if (actualCompletionTime) updateData.actualCompletionTime = new Date(actualCompletionTime * 1000);
      if (errorMessage) updateData.errorMessage = errorMessage;

      const transaction = await CrossChainTransaction.findOneAndUpdate(
        { sourceTransactionHash: hash },
        updateData,
        { new: true }
      );

      if (!transaction) {
        return res.status(404).json({ error: 'Cross-chain transaction not found' });
      }

      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get pending cross-chain transactions
  getPendingTransactions: async (req, res) => {
    try {
      const { bridgeProtocol, sourceChainId, destinationChainId } = req.query;
      
      const query = { 
        status: { $in: ['initiated', 'pending', 'relaying'] }
      };
      if (bridgeProtocol) query.bridgeProtocol = bridgeProtocol;
      if (sourceChainId) query.sourceChainId = parseInt(sourceChainId);
      if (destinationChainId) query.destinationChainId = parseInt(destinationChainId);

      const transactions = await CrossChainTransaction.find(query)
        .sort({ createdAt: -1 })
        .populate('sourceChainId', 'name symbol')
        .populate('destinationChainId', 'name symbol');

      res.json({
        success: true,
        data: transactions
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get cross-chain statistics
  getCrossChainStats: async (req, res) => {
    try {
      const { timeframe = '24h', bridgeProtocol } = req.query;
      
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
      if (bridgeProtocol) matchQuery.bridgeProtocol = bridgeProtocol;

      const stats = await CrossChainTransaction.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              bridgeProtocol: '$bridgeProtocol',
              status: '$status'
            },
            count: { $sum: 1 },
            totalVolumeUSD: { $sum: '$amountInUSD' },
            totalBridgeFeesUSD: { $sum: '$bridgeFeeUSD' },
            uniqueUsers: { $addToSet: '$userAddress' }
          }
        },
        {
          $group: {
            _id: '$_id.bridgeProtocol',
            statusBreakdown: {
              $push: {
                status: '$_id.status',
                count: '$count',
                totalVolumeUSD: '$totalVolumeUSD'
              }
            },
            totalTransactions: { $sum: '$count' },
            totalVolumeUSD: { $sum: '$totalVolumeUSD' },
            totalBridgeFeesUSD: { $sum: '$totalBridgeFeesUSD' },
            allUniqueUsers: { $push: '$uniqueUsers' }
          }
        },
        {
          $project: {
            bridgeProtocol: '$_id',
            statusBreakdown: 1,
            totalTransactions: 1,
            totalVolumeUSD: 1,
            totalBridgeFeesUSD: 1,
            uniqueUsers: {
              $size: {
                $setUnion: {
                  $reduce: {
                    input: '$allUniqueUsers',
                    initialValue: [],
                    in: { $setUnion: ['$$value', '$$this'] }
                  }
                }
              }
            }
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

module.exports = crossChainController;