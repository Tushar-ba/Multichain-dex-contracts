const express = require('express');
const router = express.Router();
const balanceController = require('../controllers/balanceController');

// GET /api/balances/chain/:chainId/token/:tokenAddress/user/:userAddress - Get single token balance
router.get('/chain/:chainId/token/:tokenAddress/user/:userAddress', balanceController.getTokenBalance);

// POST /api/balances/chain/:chainId/user/:userAddress/multiple - Get multiple token balances
router.post('/chain/:chainId/user/:userAddress/multiple', balanceController.getMultipleBalances);

// GET /api/balances/chain/:chainId/user/:userAddress/all - Get all token balances for a chain
router.get('/chain/:chainId/user/:userAddress/all', balanceController.getAllTokenBalances);

module.exports = router;