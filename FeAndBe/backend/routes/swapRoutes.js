const express = require('express');
const router = express.Router();
const swapController = require('../controllers/swapController');

// POST /api/swaps - Create a new swap record
router.post('/', swapController.createSwap);

// GET /api/swaps/user/:userAddress - Get swaps by user address
router.get('/user/:userAddress', swapController.getSwapsByUser);

// GET /api/swaps/hash/:hash - Get swap by transaction hash
router.get('/hash/:hash', swapController.getSwapByHash);

// PUT /api/swaps/hash/:hash/status - Update swap status
router.put('/hash/:hash/status', swapController.updateSwapStatus);

// GET /api/swaps/stats - Get swap statistics
router.get('/stats', swapController.getSwapStats);

module.exports = router;