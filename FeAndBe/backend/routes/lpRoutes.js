const express = require('express');
const router = express.Router();
const lpController = require('../controllers/lpController');

// POST /api/liquidity - Create a new LP record
router.post('/', lpController.createLP);

// GET /api/liquidity/user/:userAddress - Get LP positions by user address
router.get('/user/:userAddress', lpController.getLPByUser);

// GET /api/liquidity/hash/:hash - Get LP position by transaction hash
router.get('/hash/:hash', lpController.getLPByHash);

// GET /api/liquidity/pool/:poolAddress - Get LP positions by pool
router.get('/pool/:poolAddress', lpController.getLPByPool);

// PUT /api/liquidity/hash/:hash/status - Update LP status
router.put('/hash/:hash/status', lpController.updateLPStatus);

// GET /api/liquidity/stats - Get LP statistics
router.get('/stats', lpController.getLPStats);

module.exports = router;