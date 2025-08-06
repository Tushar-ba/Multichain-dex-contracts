const PairCreated = require('../models/PairCreated');
const Swap = require('../models/Swap');
const LiquidityProvider = require('../models/LiquidityProvider');
const CrossChainTransaction = require('../models/CrossChainTransaction');

const eventHandler = {
  // Handle PairCreated event from PayfundsFactory
  handlePairCreated: async (eventData) => {
    try {
      const {
        transactionHash,
        chainId,
        factoryAddress,
        token0,
        token1,
        pairAddress,
        pairIndex,
        blockNumber,
        blockTimestamp,
        gasUsed,
        gasPrice,
        creator,
        token0Symbol,
        token1Symbol,
        token0Decimals,
        token1Decimals,
        isActive
      } = eventData;

      // Validate required fields
      if (!transactionHash || transactionHash === 'unknown') {
        throw new Error('Transaction hash is required');
      }

      const pair = new PairCreated({
        transactionHash,
        chainId,
        factoryAddress: factoryAddress?.toLowerCase() || '0x0000000000000000000000000000000000000000',
        token0: token0?.toLowerCase() || '0x0000000000000000000000000000000000000000',
        token1: token1?.toLowerCase() || '0x0000000000000000000000000000000000000000',
        pairAddress: pairAddress?.toLowerCase() || '0x0000000000000000000000000000000000000000',
        pairIndex: pairIndex || 1,
        blockNumber: blockNumber || 0,
        blockTimestamp: blockTimestamp instanceof Date ? blockTimestamp : new Date(blockTimestamp * 1000),
        gasUsed: gasUsed || '0',
        gasPrice: gasPrice || '0',
        creator: creator?.toLowerCase() || '0x0000000000000000000000000000000000000000',
        token0Symbol: token0Symbol || '',
        token1Symbol: token1Symbol || '',
        token0Decimals: token0Decimals || 18,
        token1Decimals: token1Decimals || 18,
        isActive: isActive !== undefined ? isActive : true
      });

      await pair.save();
      return { success: true, data: pair };
    } catch (error) {
      console.error('Error handling PairCreated event:', error);
      return { success: false, error: error.message };
    }
  },

  // Handle swapExactTokensForTokens from PayfundsRouter02
  handleSwap: async (eventData) => {
    try {
      const {
        transactionHash,
        chainId,
        routerAddress,
        userAddress,
        amountIn,
        amountOutMin,
        actualAmountOut,
        path,
        to,
        deadline,
        blockNumber,
        blockTimestamp,
        gasUsed,
        gasPrice,
        amounts
      } = eventData;

      const swap = new Swap({
        transactionHash,
        chainId,
        routerAddress: routerAddress.toLowerCase(),
        userAddress: userAddress.toLowerCase(),
        amountIn,
        amountOutMin,
        actualAmountOut,
        path: path.map(addr => addr.toLowerCase()),
        to: to.toLowerCase(),
        deadline,
        tokenIn: {
          address: path[0].toLowerCase()
        },
        tokenOut: {
          address: path[path.length - 1].toLowerCase()
        },
        blockNumber,
        blockTimestamp: new Date(blockTimestamp * 1000),
        gasUsed,
        gasPrice,
        amounts,
        status: 'confirmed'
      });

      await swap.save();
      return { success: true, data: swap };
    } catch (error) {
      console.error('Error handling Swap event:', error);
      return { success: false, error: error.message };
    }
  },

  // Handle addLiquidity from PayfundsRouter02
  handleAddLiquidity: async (eventData) => {
    try {
      console.log('Received eventData:', JSON.stringify(eventData, null, 2)); // Debug log
      
      // Validate required fields first
      if (!eventData.transactionHash) {
        throw new Error('Transaction hash is required');
      }
      if (!eventData.userAddress) {
        throw new Error('User address is required');
      }
      if (!eventData.pairAddress) {
        throw new Error('Pair address is required');
      }
      
      const {
        transactionHash,
        chainId,
        routerAddress,
        userAddress,
        action,
        tokenA,
        tokenB,
        liquidity,
        pairAddress,
        to,
        deadline,
        blockNumber,
        blockTimestamp,
        gasUsed,
        gasPrice,
        status
      } = eventData;

      // Handle the case where tokenA and tokenB are objects (from frontend)
      const tokenAData = typeof tokenA === 'object' ? tokenA : { address: tokenA };
      const tokenBData = typeof tokenB === 'object' ? tokenB : { address: tokenB };

      const lp = new LiquidityProvider({
        transactionHash,
        chainId,
        routerAddress: typeof routerAddress === 'string' ? routerAddress.toLowerCase() : routerAddress,
        userAddress: userAddress.toLowerCase(),
        action: action || 'add',
        tokenA: {
          address: tokenAData.address.toLowerCase(),
          symbol: tokenAData.symbol || '',
          decimals: tokenAData.decimals || 18,
          amountDesired: tokenAData.amountDesired || '0',
          amountMin: tokenAData.amountMin || '0',
          actualAmount: tokenAData.actualAmount || tokenAData.amountDesired || '0'
        },
        tokenB: {
          address: tokenBData.address.toLowerCase(),
          symbol: tokenBData.symbol || '',
          decimals: tokenBData.decimals || 18,
          amountDesired: tokenBData.amountDesired || '0',
          amountMin: tokenBData.amountMin || '0',
          actualAmount: tokenBData.actualAmount || tokenBData.amountDesired || '0'
        },
        liquidity: liquidity || '0',
        pairAddress: pairAddress.toLowerCase(),
        to: to.toLowerCase(),
        deadline,
        blockNumber,
        blockTimestamp: blockTimestamp instanceof Date ? blockTimestamp : 
                      (typeof blockTimestamp === 'number' ? new Date(blockTimestamp * 1000) : new Date()),
        gasUsed: gasUsed || '0',
        gasPrice: gasPrice || '0',
        status: status || 'confirmed'
      });

      await lp.save();
      return { success: true, data: lp };
    } catch (error) {
      console.error('Error handling AddLiquidity event:', error);
      return { success: false, error: error.message };
    }
  },

  // Handle removeLiquidity from PayfundsRouter02
  handleRemoveLiquidity: async (eventData) => {
    try {
      const {
        transactionHash,
        chainId,
        routerAddress,
        userAddress,
        action,
        tokenA,
        tokenB,
        liquidity,
        pairAddress,
        to,
        deadline,
        blockNumber,
        blockTimestamp,
        gasUsed,
        gasPrice,
        status
      } = eventData;

      // Handle the case where tokenA and tokenB are objects (from frontend)
      const tokenAData = typeof tokenA === 'object' ? tokenA : { address: tokenA };
      const tokenBData = typeof tokenB === 'object' ? tokenB : { address: tokenB };

      const lp = new LiquidityProvider({
        transactionHash,
        chainId,
        routerAddress: typeof routerAddress === 'string' ? routerAddress.toLowerCase() : routerAddress,
        userAddress: userAddress.toLowerCase(),
        action: action || 'remove',
        tokenA: {
          address: tokenAData.address.toLowerCase(),
          symbol: tokenAData.symbol || '',
          decimals: tokenAData.decimals || 18,
          amountMin: tokenAData.amountMin || '0',
          actualAmount: tokenAData.actualAmount || '0'
        },
        tokenB: {
          address: tokenBData.address.toLowerCase(),
          symbol: tokenBData.symbol || '',
          decimals: tokenBData.decimals || 18,
          amountMin: tokenBData.amountMin || '0',
          actualAmount: tokenBData.actualAmount || '0'
        },
        liquidity: liquidity || '0',
        pairAddress: pairAddress.toLowerCase(),
        to: to.toLowerCase(),
        deadline,
        blockNumber,
        blockTimestamp: blockTimestamp instanceof Date ? blockTimestamp : new Date(blockTimestamp * 1000),
        gasUsed: gasUsed || '0',
        gasPrice: gasPrice || '0',
        status: status || 'confirmed'
      });

      await lp.save();
      return { success: true, data: lp };
    } catch (error) {
      console.error('Error handling RemoveLiquidity event:', error);
      return { success: false, error: error.message };
    }
  },

  // Handle CrossChainSwapInitiated from CrossChainRouter
  handleCrossChainSwapInitiated: async (eventData) => {
    try {
      const {
        transactionHash,
        sourceChainId,
        destinationEid,
        sender,
        recipient,
        sourceToken,
        destinationToken,
        amountIn,
        stableAmount,
        amountOutMin,
        sourceRouterAddress,
        blockNumber,
        blockTimestamp,
        gasUsed,
        gasPrice,
        layerZeroData
      } = eventData;

      const crossChainTx = new CrossChainTransaction({
        sourceTransactionHash: transactionHash,
        sourceChainId,
        destinationChainId: eventData.destinationChainId || sourceChainId, // Will be updated when completed
        destinationEid,
        sender: sender.toLowerCase(),
        recipient: recipient.toLowerCase(),
        sourceToken: {
          address: sourceToken.toLowerCase(),
          amount: amountIn
        },
        destinationToken: {
          address: destinationToken.toLowerCase()
        },
        stableAmount,
        amountOutMin,
        sourceRouterAddress: sourceRouterAddress.toLowerCase(),
        sourceBlockNumber: blockNumber,
        sourceBlockTimestamp: new Date(blockTimestamp * 1000),
        sourceGasUsed: gasUsed,
        sourceGasPrice: gasPrice,
        layerZeroData,
        status: 'initiated',
        events: [{
          eventType: 'CrossChainSwapInitiated',
          transactionHash,
          blockNumber,
          timestamp: new Date(blockTimestamp * 1000),
          data: eventData
        }]
      });

      await crossChainTx.save();
      return { success: true, data: crossChainTx };
    } catch (error) {
      console.error('Error handling CrossChainSwapInitiated event:', error);
      return { success: false, error: error.message };
    }
  },

  // Handle CrossChainSwapCompleted from CrossChainRouter
  handleCrossChainSwapCompleted: async (eventData) => {
    try {
      const {
        sourceTransactionHash,
        destinationTransactionHash,
        recipient,
        destinationToken,
        stableAmount,
        amountOut,
        destinationChainId,
        blockNumber,
        blockTimestamp,
        gasUsed,
        gasPrice
      } = eventData;

      const crossChainTx = await CrossChainTransaction.findOneAndUpdate(
        { sourceTransactionHash },
        {
          $set: {
            destinationTransactionHash,
            destinationChainId,
            destinationBlockNumber: blockNumber,
            destinationBlockTimestamp: new Date(blockTimestamp * 1000),
            destinationGasUsed: gasUsed,
            destinationGasPrice: gasPrice,
            'destinationToken.amount': amountOut,
            status: 'completed',
            actualCompletionTime: new Date(blockTimestamp * 1000)
          },
          $push: {
            events: {
              eventType: 'CrossChainSwapCompleted',
              transactionHash: destinationTransactionHash,
              blockNumber,
              timestamp: new Date(blockTimestamp * 1000),
              data: eventData
            }
          }
        },
        { new: true }
      );

      if (!crossChainTx) {
        throw new Error('Cross-chain transaction not found');
      }

      return { success: true, data: crossChainTx };
    } catch (error) {
      console.error('Error handling CrossChainSwapCompleted event:', error);
      return { success: false, error: error.message };
    }
  },

  // Batch process multiple events
  processBatchEvents: async (events) => {
    const results = [];
    
    for (const event of events) {
      try {
        let result;
        
        switch (event.eventType) {
          case 'PairCreated':
            result = await eventHandler.handlePairCreated(event);
            break;
          case 'Swap':
            result = await eventHandler.handleSwap(event);
            break;
          case 'AddLiquidity':
            result = await eventHandler.handleAddLiquidity(event);
            break;
          case 'RemoveLiquidity':
            result = await eventHandler.handleRemoveLiquidity(event);
            break;
          case 'CrossChainSwapInitiated':
            result = await eventHandler.handleCrossChainSwapInitiated(event);
            break;
          case 'CrossChainSwapCompleted':
            result = await eventHandler.handleCrossChainSwapCompleted(event);
            break;
          default:
            result = { success: false, error: `Unknown event type: ${event.eventType}` };
        }
        
        results.push({ eventType: event.eventType, ...result });
      } catch (error) {
        results.push({ 
          eventType: event.eventType, 
          success: false, 
          error: error.message 
        });
      }
    }
    
    return results;
  }
};

module.exports = eventHandler;