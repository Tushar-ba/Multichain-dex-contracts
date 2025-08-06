const express = require('express');
const router = express.Router();
const crossChainController = require('../controllers/crossChainController');

// POST /api/cross-chain - Create a new cross-chain transaction record
router.post('/', crossChainController.createCrossChainTx);

// GET /api/cross-chain/user/:userAddress - Get cross-chain transactions by user address
router.get('/user/:userAddress', crossChainController.getCrossChainByUser);

// GET /api/cross-chain/hash/:hash - Get cross-chain transaction by source hash
router.get('/hash/:hash', crossChainController.getCrossChainByHash);

// PUT /api/cross-chain/hash/:hash/status - Update cross-chain transaction status
router.put('/hash/:hash/status', crossChainController.updateCrossChainStatus);

// GET /api/cross-chain/pending - Get pending cross-chain transactions
router.get('/pending', crossChainController.getPendingTransactions);

// GET /api/cross-chain/stats - Get cross-chain statistics
router.get('/stats', crossChainController.getCrossChainStats);

module.exports = router;