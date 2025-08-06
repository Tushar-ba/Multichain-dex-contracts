const express = require('express');
const router = express.Router();
const pairController = require('../controllers/pairController');

// POST /api/pairs - Create a new pair record from PairCreated event
router.post('/', pairController.createPair);

// GET /api/pairs - Get all pairs
router.get('/', pairController.getAllPairs);

// GET /api/pairs/address/:pairAddress - Get pair by address
router.get('/address/:pairAddress', pairController.getPairByAddress);

// GET /api/pairs/token/:tokenAddress - Get pairs by token
router.get('/token/:tokenAddress', pairController.getPairsByToken);

// GET /api/pairs/tokens/:token0/:token1 - Get pair by token pair
router.get('/tokens/:token0/:token1', pairController.getPairByTokens);

// PUT /api/pairs/address/:pairAddress/metadata - Update pair metadata
router.put('/address/:pairAddress/metadata', pairController.updatePairMetadata);

// GET /api/pairs/stats - Get pair statistics
router.get('/stats', pairController.getPairStats);

module.exports = router;