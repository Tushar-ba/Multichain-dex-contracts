const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');

// GET /api/tokens - Get all tokens
router.get('/', tokenController.getAllTokens);

// GET /api/tokens/chains - Get supported chains
router.get('/chains', tokenController.getSupportedChains);

// GET /api/tokens/common - Get common tokens (exist on multiple chains)
router.get('/common', tokenController.getCommonTokens);

// GET /api/tokens/search - Search tokens by name or symbol
router.get('/search', tokenController.searchTokens);

// GET /api/tokens/chain/:chainId - Get tokens by chain ID
router.get('/chain/:chainId', tokenController.getTokensByChain);

// GET /api/tokens/chain/:chainId/pairs - Get token pairs for a specific chain
router.get('/chain/:chainId/pairs', tokenController.getTokenPairs);

// GET /api/tokens/chain/:chainId/address/:address - Get token by address and chain ID
router.get('/chain/:chainId/address/:address', tokenController.getTokenByAddress);

// GET /api/tokens/symbol/:symbol - Get tokens by symbol (across all chains)
router.get('/symbol/:symbol', tokenController.getTokensBySymbol);

module.exports = router;