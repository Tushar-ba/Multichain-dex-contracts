const { tokens } = require('../constants/token');

const tokenController = {
  // Get all tokens
  getAllTokens: async (req, res) => {
    try {
      res.json({
        success: true,
        data: tokens,
        count: tokens.length
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get tokens by chain ID
  getTokensByChain: async (req, res) => {
    try {
      const { chainId } = req.params;
      const chainIdNum = parseInt(chainId);

      if (isNaN(chainIdNum)) {
        return res.status(400).json({ error: 'Invalid chain ID' });
      }

      const chainTokens = tokens.filter(token => token.data.chainId === chainIdNum);

      if (chainTokens.length === 0) {
        return res.status(404).json({ 
          error: 'No tokens found for this chain',
          chainId: chainIdNum
        });
      }

      res.json({
        success: true,
        chainId: chainIdNum,
        chainName: chainTokens[0].data.chain,
        data: chainTokens,
        count: chainTokens.length
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get token by address and chain ID
  getTokenByAddress: async (req, res) => {
    try {
      const { chainId, address } = req.params;
      const chainIdNum = parseInt(chainId);

      if (isNaN(chainIdNum)) {
        return res.status(400).json({ error: 'Invalid chain ID' });
      }

      const token = tokens.find(
        token => 
          token.data.chainId === chainIdNum && 
          token.address.toLowerCase() === address.toLowerCase()
      );

      if (!token) {
        return res.status(404).json({ 
          error: 'Token not found',
          chainId: chainIdNum,
          address: address
        });
      }

      res.json({
        success: true,
        data: token
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get tokens by symbol (across all chains)
  getTokensBySymbol: async (req, res) => {
    try {
      const { symbol } = req.params;
      const { chainId } = req.query;

      let filteredTokens = tokens.filter(
        token => token.data.symbol.toLowerCase() === symbol.toLowerCase()
      );

      // If chainId is provided, filter by chain as well
      if (chainId) {
        const chainIdNum = parseInt(chainId);
        if (!isNaN(chainIdNum)) {
          filteredTokens = filteredTokens.filter(token => token.data.chainId === chainIdNum);
        }
      }

      if (filteredTokens.length === 0) {
        return res.status(404).json({ 
          error: 'No tokens found with this symbol',
          symbol: symbol,
          chainId: chainId || 'all chains'
        });
      }

      res.json({
        success: true,
        symbol: symbol.toUpperCase(),
        data: filteredTokens,
        count: filteredTokens.length
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get supported chains
  getSupportedChains: async (req, res) => {
    try {
      const chains = tokens.reduce((acc, token) => {
        const chainId = token.data.chainId;
        const chainName = token.data.chain;
        
        if (!acc.find(chain => chain.chainId === chainId)) {
          acc.push({
            chainId: chainId,
            name: chainName,
            tokenCount: tokens.filter(t => t.data.chainId === chainId).length
          });
        }
        
        return acc;
      }, []);

      // Sort by chainId
      chains.sort((a, b) => a.chainId - b.chainId);

      res.json({
        success: true,
        data: chains,
        count: chains.length
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Search tokens by name or symbol
  searchTokens: async (req, res) => {
    try {
      const { query, chainId } = req.query;

      if (!query || query.length < 2) {
        return res.status(400).json({ error: 'Search query must be at least 2 characters' });
      }

      let filteredTokens = tokens.filter(token => {
        const name = token.data.name.toLowerCase();
        const symbol = token.data.symbol.toLowerCase();
        const searchQuery = query.toLowerCase();
        
        return name.includes(searchQuery) || symbol.includes(searchQuery);
      });

      // If chainId is provided, filter by chain as well
      if (chainId) {
        const chainIdNum = parseInt(chainId);
        if (!isNaN(chainIdNum)) {
          filteredTokens = filteredTokens.filter(token => token.data.chainId === chainIdNum);
        }
      }

      res.json({
        success: true,
        query: query,
        chainId: chainId || 'all chains',
        data: filteredTokens,
        count: filteredTokens.length
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get token pairs for a specific chain (useful for DEX operations)
  getTokenPairs: async (req, res) => {
    try {
      const { chainId } = req.params;
      const chainIdNum = parseInt(chainId);

      if (isNaN(chainIdNum)) {
        return res.status(400).json({ error: 'Invalid chain ID' });
      }

      const chainTokens = tokens.filter(token => token.data.chainId === chainIdNum);

      if (chainTokens.length === 0) {
        return res.status(404).json({ 
          error: 'No tokens found for this chain',
          chainId: chainIdNum
        });
      }

      // Generate all possible pairs
      const pairs = [];
      for (let i = 0; i < chainTokens.length; i++) {
        for (let j = i + 1; j < chainTokens.length; j++) {
          pairs.push({
            token0: {
              address: chainTokens[i].address,
              symbol: chainTokens[i].data.symbol,
              name: chainTokens[i].data.name,
              decimals: chainTokens[i].data.decimals
            },
            token1: {
              address: chainTokens[j].address,
              symbol: chainTokens[j].data.symbol,
              name: chainTokens[j].data.name,
              decimals: chainTokens[j].data.decimals
            }
          });
        }
      }

      res.json({
        success: true,
        chainId: chainIdNum,
        chainName: chainTokens[0].data.chain,
        data: pairs,
        count: pairs.length
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get common tokens (tokens that exist on multiple chains)
  getCommonTokens: async (req, res) => {
    try {
      const symbolGroups = tokens.reduce((acc, token) => {
        const symbol = token.data.symbol;
        if (!acc[symbol]) {
          acc[symbol] = [];
        }
        acc[symbol].push(token);
        return acc;
      }, {});

      // Filter symbols that exist on multiple chains
      const commonTokens = Object.entries(symbolGroups)
        .filter(([symbol, tokenList]) => tokenList.length > 1)
        .map(([symbol, tokenList]) => ({
          symbol: symbol,
          name: tokenList[0].data.name,
          chains: tokenList.map(token => ({
            chainId: token.data.chainId,
            chainName: token.data.chain,
            address: token.address,
            decimals: token.data.decimals
          })),
          chainCount: tokenList.length
        }));

      // Sort by chain count (most common first)
      commonTokens.sort((a, b) => b.chainCount - a.chainCount);

      res.json({
        success: true,
        data: commonTokens,
        count: commonTokens.length
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = tokenController;