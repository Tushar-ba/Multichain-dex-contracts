const eventHandler = require('../utils/eventHandler');

const eventController = {
  // Handle single event
  processEvent: async (req, res) => {
    try {
      const { eventType } = req.body;
      
      if (!eventType) {
        return res.status(400).json({ error: 'Event type is required' });
      }

      let result;
      
      switch (eventType) {
        case 'PairCreated':
          result = await eventHandler.handlePairCreated(req.body);
          break;
        case 'Swap':
          result = await eventHandler.handleSwap(req.body);
          break;
        case 'AddLiquidity':
          result = await eventHandler.handleAddLiquidity(req.body);
          break;
        case 'RemoveLiquidity':
          result = await eventHandler.handleRemoveLiquidity(req.body);
          break;
        case 'CrossChainSwapInitiated':
          result = await eventHandler.handleCrossChainSwapInitiated(req.body);
          break;
        case 'CrossChainSwapCompleted':
          result = await eventHandler.handleCrossChainSwapCompleted(req.body);
          break;
        default:
          return res.status(400).json({ error: `Unknown event type: ${eventType}` });
      }

      if (result.success) {
        res.status(201).json({
          success: true,
          message: `${eventType} event processed successfully`,
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error processing event:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Handle batch events
  processBatchEvents: async (req, res) => {
    try {
      const { events } = req.body;
      
      if (!events || !Array.isArray(events)) {
        return res.status(400).json({ error: 'Events array is required' });
      }

      if (events.length === 0) {
        return res.status(400).json({ error: 'Events array cannot be empty' });
      }

      if (events.length > 100) {
        return res.status(400).json({ error: 'Maximum 100 events per batch' });
      }

      const results = await eventHandler.processBatchEvents(events);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      res.status(200).json({
        success: true,
        message: `Processed ${events.length} events: ${successCount} successful, ${failureCount} failed`,
        results,
        summary: {
          total: events.length,
          successful: successCount,
          failed: failureCount
        }
      });
    } catch (error) {
      console.error('Error processing batch events:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Handle PairCreated event specifically
  processPairCreated: async (req, res) => {
    try {
      const result = await eventHandler.handlePairCreated(req.body);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          message: 'PairCreated event processed successfully',
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error processing PairCreated event:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Handle Swap event specifically
  processSwap: async (req, res) => {
    try {
      const result = await eventHandler.handleSwap(req.body);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          message: 'Swap event processed successfully',
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error processing Swap event:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Handle Liquidity events specifically
  processLiquidity: async (req, res) => {
    try {
      const { action } = req.body;
      let result;
      
      if (action === 'add' || action === 'addMATIC') {
        result = await eventHandler.handleAddLiquidity(req.body);
      } else if (action === 'remove' || action === 'removeMATIC') {
        result = await eventHandler.handleRemoveLiquidity(req.body);
      } else {
        return res.status(400).json({ error: 'Invalid liquidity action' });
      }
      
      if (result.success) {
        res.status(201).json({
          success: true,
          message: `Liquidity ${action} event processed successfully`,
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error processing Liquidity event:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Handle CrossChain events specifically
  processCrossChain: async (req, res) => {
    try {
      const { eventType } = req.body;
      let result;
      
      if (eventType === 'CrossChainSwapInitiated') {
        result = await eventHandler.handleCrossChainSwapInitiated(req.body);
      } else if (eventType === 'CrossChainSwapCompleted') {
        result = await eventHandler.handleCrossChainSwapCompleted(req.body);
      } else {
        return res.status(400).json({ error: 'Invalid cross-chain event type' });
      }
      
      if (result.success) {
        res.status(201).json({
          success: true,
          message: `${eventType} event processed successfully`,
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error processing CrossChain event:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = eventController;