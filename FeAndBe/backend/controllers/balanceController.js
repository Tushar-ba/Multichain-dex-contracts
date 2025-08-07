const { ethers } = require('ethers');
const { tokens } = require('../constants/token');

// ERC20 ABI for balanceOf function
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

// RPC URLs for different chains
const RPC_URLS = {
  11155111: 'https://eth-sepolia.g.alchemy.com/v2/Ln0Aa5Ea0iyVV0mh6RpyT',
  80002: 'https://rpc-amoy.polygon.technology',
  421614: 'https://sepolia-rollup.arbitrum.io/rpc',
  11155420: 'https://sepolia.optimism.io',
  43113: 'https://api.avax-test.network/ext/bc/C/rpc',
  97: 'https://data-seed-prebsc-1-s1.binance.org:8545',
  84532: 'https://sepolia.base.org',
  17000: 'https://ethereum-holesky-rpc.publicnode.com'
};

const balanceController = {
  // Get token balance for a specific address
  getTokenBalance: async (req, res) => {
    try {
      const { chainId, tokenAddress, userAddress } = req.params;
      const chainIdNum = parseInt(chainId);

      if (!RPC_URLS[chainIdNum]) {
        return res.status(400).json({ error: 'Unsupported chain ID' });
      }

      const provider = new ethers.JsonRpcProvider(RPC_URLS[chainIdNum]);
      
      // Handle native token (ETH, MATIC, BNB, AVAX)
      if (tokenAddress.toLowerCase() === '0x0000000000000000000000000000000000000000' || 
          tokenAddress.toLowerCase() === '0x0000000000000000000000000000000000001010') {
        const balance = await provider.getBalance(userAddress);
        
        res.json({
          success: true,
          data: {
            address: tokenAddress,
            userAddress,
            chainId: chainIdNum,
            balance: balance.toString(),
            formattedBalance: ethers.formatEther(balance),
            decimals: 18
          }
        });
        return;
      }

      // Handle ERC20 tokens
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const balance = await contract.balanceOf(userAddress);
      const decimals = await contract.decimals();
      
      res.json({
        success: true,
        data: {
          address: tokenAddress,
          userAddress,
          chainId: chainIdNum,
          balance: balance.toString(),
          formattedBalance: ethers.formatUnits(balance, decimals),
          decimals: Number(decimals)
        }
      });
    } catch (error) {
      console.error('Error fetching token balance:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get balances for multiple tokens
  getMultipleBalances: async (req, res) => {
    try {
      const { chainId, userAddress } = req.params;
      const { tokenAddresses } = req.body;
      const chainIdNum = parseInt(chainId);

      if (!RPC_URLS[chainIdNum]) {
        return res.status(400).json({ error: 'Unsupported chain ID' });
      }

      if (!tokenAddresses || !Array.isArray(tokenAddresses)) {
        return res.status(400).json({ error: 'tokenAddresses array is required' });
      }

      const provider = new ethers.JsonRpcProvider(RPC_URLS[chainIdNum]);
      const balances = [];

      for (const tokenAddress of tokenAddresses) {
        try {
          let balance, decimals = 18;

          // Handle native token
          if (tokenAddress.toLowerCase() === '0x0000000000000000000000000000000000000000' || 
              tokenAddress.toLowerCase() === '0x0000000000000000000000000000000000001010') {
            balance = await provider.getBalance(userAddress);
          } else {
            // Handle ERC20 tokens
            const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
            balance = await contract.balanceOf(userAddress);
            decimals = await contract.decimals();
          }

          balances.push({
            address: tokenAddress,
            balance: balance.toString(),
            formattedBalance: ethers.formatUnits(balance, decimals),
            decimals: Number(decimals)
          });
        } catch (error) {
          console.error(`Error fetching balance for ${tokenAddress}:`, error);
          balances.push({
            address: tokenAddress,
            balance: '0',
            formattedBalance: '0',
            decimals: 18,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        data: {
          userAddress,
          chainId: chainIdNum,
          balances
        }
      });
    } catch (error) {
      console.error('Error fetching multiple balances:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get all token balances for a chain
  getAllTokenBalances: async (req, res) => {
    try {
      const { chainId, userAddress } = req.params;
      const chainIdNum = parseInt(chainId);

      if (!RPC_URLS[chainIdNum]) {
        return res.status(400).json({ error: 'Unsupported chain ID' });
      }

      // Get all tokens for this chain
      const chainTokens = tokens.filter(token => token.data.chainId === chainIdNum);
      const tokenAddresses = chainTokens.map(token => token.address);

      const provider = new ethers.JsonRpcProvider(RPC_URLS[chainIdNum]);
      const balances = [];

      for (const token of chainTokens) {
        try {
          let balance, decimals = token.data.decimals;

          // Handle native token
          if (token.address.toLowerCase() === '0x0000000000000000000000000000000000000000' || 
              token.address.toLowerCase() === '0x0000000000000000000000000000000000001010') {
            balance = await provider.getBalance(userAddress);
          } else {
            // Handle ERC20 tokens
            const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
            balance = await contract.balanceOf(userAddress);
          }

          balances.push({
            ...token,
            balance: balance.toString(),
            formattedBalance: ethers.formatUnits(balance, decimals)
          });
        } catch (error) {
          console.error(`Error fetching balance for ${token.address}:`, error);
          balances.push({
            ...token,
            balance: '0',
            formattedBalance: '0',
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        data: {
          userAddress,
          chainId: chainIdNum,
          chainName: chainTokens[0]?.data.chain || 'Unknown',
          balances
        }
      });
    } catch (error) {
      console.error('Error fetching all token balances:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = balanceController;