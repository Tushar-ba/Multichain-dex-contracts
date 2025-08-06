const express = require('express');
const router = express.Router();
const chainController = require('../controllers/chainController');

// POST /api/chains - Create a new chain
router.post('/', chainController.createChain);

// GET /api/chains - Get all chains
router.get('/', chainController.getAllChains);

// GET /api/chains/:chainId - Get chain by ID
router.get('/:chainId', chainController.getChainById);

// PUT /api/chains/:chainId - Update chain
router.put('/:chainId', chainController.updateChain);

// DELETE /api/chains/:chainId - Delete chain
router.delete('/:chainId', chainController.deleteChain);

// PUT /api/chains/:chainId/toggle - Toggle chain active status
router.put('/:chainId/toggle', chainController.toggleChainStatus);

// GET /api/chains/:chainId/protocols - Get supported protocols for a chain
router.get('/:chainId/protocols', chainController.getSupportedProtocols);

module.exports = router;