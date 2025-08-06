const Chain = require('../models/Chain');
const { validateChain } = require('../utils/validation');

const chainController = {
  // Create a new chain
  createChain: async (req, res) => {
    try {
      const { error } = validateChain(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const chain = new Chain(req.body);
      await chain.save();
      
      res.status(201).json({
        success: true,
        data: chain
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ error: 'Chain ID already exists' });
      }
      res.status(500).json({ error: error.message });
    }
  },

  // Get all chains
  getAllChains: async (req, res) => {
    try {
      const { isActive } = req.query;
      const query = {};
      if (isActive !== undefined) query.isActive = isActive === 'true';

      const chains = await Chain.find(query).sort({ name: 1 });

      res.json({
        success: true,
        data: chains
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get chain by ID
  getChainById: async (req, res) => {
    try {
      const { chainId } = req.params;
      const chain = await Chain.findOne({ chainId: parseInt(chainId) });

      if (!chain) {
        return res.status(404).json({ error: 'Chain not found' });
      }

      res.json({
        success: true,
        data: chain
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update chain
  updateChain: async (req, res) => {
    try {
      const { chainId } = req.params;
      const { error } = validateChain(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const chain = await Chain.findOneAndUpdate(
        { chainId: parseInt(chainId) },
        req.body,
        { new: true, runValidators: true }
      );

      if (!chain) {
        return res.status(404).json({ error: 'Chain not found' });
      }

      res.json({
        success: true,
        data: chain
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Delete chain
  deleteChain: async (req, res) => {
    try {
      const { chainId } = req.params;
      const chain = await Chain.findOneAndDelete({ chainId: parseInt(chainId) });

      if (!chain) {
        return res.status(404).json({ error: 'Chain not found' });
      }

      res.json({
        success: true,
        message: 'Chain deleted successfully'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Toggle chain active status
  toggleChainStatus: async (req, res) => {
    try {
      const { chainId } = req.params;
      const chain = await Chain.findOne({ chainId: parseInt(chainId) });

      if (!chain) {
        return res.status(404).json({ error: 'Chain not found' });
      }

      chain.isActive = !chain.isActive;
      await chain.save();

      res.json({
        success: true,
        data: chain
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get supported protocols for a chain
  getSupportedProtocols: async (req, res) => {
    try {
      const { chainId } = req.params;
      const chain = await Chain.findOne({ chainId: parseInt(chainId) });

      if (!chain) {
        return res.status(404).json({ error: 'Chain not found' });
      }

      res.json({
        success: true,
        data: {
          chainId: chain.chainId,
          name: chain.name,
          supportedProtocols: chain.supportedProtocols
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = chainController;