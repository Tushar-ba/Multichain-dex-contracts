const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

// POST /api/events - Process single event
router.post('/', eventController.processEvent);

// POST /api/events/batch - Process batch events
router.post('/batch', eventController.processBatchEvents);

// POST /api/events/pair-created - Process PairCreated event
router.post('/pair-created', eventController.processPairCreated);

// POST /api/events/swap - Process Swap event
router.post('/swap', eventController.processSwap);

// POST /api/events/liquidity - Process Liquidity events (add/remove)
router.post('/liquidity', eventController.processLiquidity);

// POST /api/events/cross-chain - Process CrossChain events
router.post('/cross-chain', eventController.processCrossChain);

module.exports = router;