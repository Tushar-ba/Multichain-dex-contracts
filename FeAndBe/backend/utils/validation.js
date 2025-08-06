const Joi = require('joi');

// Ethereum address validation
const ethereumAddress = Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required();
const ethereumAddressOptional = Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional();
const transactionHash = Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).required();
const bigNumberString = Joi.string().pattern(/^\d+$/).required();

// Chain validation schema
const validateChain = (data) => {
  const schema = Joi.object({
    chainId: Joi.number().integer().positive().required(),
    name: Joi.string().trim().min(1).max(100).required(),
    symbol: Joi.string().trim().min(1).max(10).required(),
    rpcUrl: Joi.string().uri().required(),
    explorerUrl: Joi.string().uri().required(),
    nativeCurrency: Joi.object({
      name: Joi.string().required(),
      symbol: Joi.string().required(),
      decimals: Joi.number().integer().min(0).max(18).required()
    }).optional(),
    isActive: Joi.boolean().optional(),
    supportedProtocols: Joi.array().items(
      Joi.string().valid('uniswap-v2', 'uniswap-v3', 'pancakeswap', 'sushiswap', 'curve')
    ).optional(),
    bridgeContracts: Joi.object({
      layerZero: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional(),
      axelar: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional(),
      wormhole: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional()
    }).optional()
  });

  return schema.validate(data);
};

// Swap validation schema (updated for PayfundsRouter02)
const validateSwap = (data) => {
  const schema = Joi.object({
    transactionHash: transactionHash,
    chainId: Joi.number().integer().positive().required(),
    routerAddress: ethereumAddress,
    userAddress: ethereumAddress,
    amountIn: bigNumberString,
    amountOutMin: bigNumberString,
    actualAmountOut: bigNumberString,
    path: Joi.array().items(Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/)).min(2).required(),
    to: ethereumAddress,
    deadline: Joi.number().integer().positive().required(),
    tokenIn: Joi.object({
      address: ethereumAddress,
      symbol: Joi.string().optional(),
      decimals: Joi.number().integer().min(0).max(18).optional()
    }).required(),
    tokenOut: Joi.object({
      address: ethereumAddress,
      symbol: Joi.string().optional(),
      decimals: Joi.number().integer().min(0).max(18).optional()
    }).required(),
    amountInUSD: Joi.number().min(0).optional(),
    amountOutUSD: Joi.number().min(0).optional(),
    gasUsed: Joi.string().pattern(/^\d+$/).optional(),
    gasPrice: Joi.string().pattern(/^\d+$/).optional(),
    blockNumber: Joi.number().integer().positive().required(),
    blockTimestamp: Joi.date().required(),
    status: Joi.string().valid('pending', 'confirmed', 'failed').optional(),
    priceImpact: Joi.number().min(0).max(100).optional(),
    slippage: Joi.number().min(0).max(100).optional(),
    amounts: Joi.array().items(Joi.string().pattern(/^\d+$/)).optional()
  });

  return schema.validate(data);
};

// Liquidity Provider validation schema (updated for PayfundsRouter02)
const validateLP = (data) => {
  const schema = Joi.object({
    transactionHash: transactionHash,
    chainId: Joi.number().integer().positive().required(),
    routerAddress: ethereumAddress,
    userAddress: ethereumAddress,
    action: Joi.string().valid('add', 'remove', 'addMATIC', 'removeMATIC').required(),
    tokenA: Joi.object({
      address: ethereumAddress,
      symbol: Joi.string().optional(),
      decimals: Joi.number().integer().min(0).max(18).optional(),
      amountDesired: Joi.string().pattern(/^\d+$/).optional(),
      amountMin: Joi.string().pattern(/^\d+$/).optional(),
      actualAmount: Joi.string().pattern(/^\d+$/).optional()
    }).required(),
    tokenB: Joi.object({
      address: ethereumAddress,
      symbol: Joi.string().optional(),
      decimals: Joi.number().integer().min(0).max(18).optional(),
      amountDesired: Joi.string().pattern(/^\d+$/).optional(),
      amountMin: Joi.string().pattern(/^\d+$/).optional(),
      actualAmount: Joi.string().pattern(/^\d+$/).optional()
    }).required(),
    liquidity: bigNumberString,
    pairAddress: ethereumAddress,
    to: ethereumAddress,
    deadline: Joi.number().integer().positive().required(),
    maticAmount: Joi.string().pattern(/^\d+$/).optional(),
    maticAmountMin: Joi.string().pattern(/^\d+$/).optional(),
    totalValueUSD: Joi.number().min(0).optional(),
    gasUsed: Joi.string().pattern(/^\d+$/).optional(),
    gasPrice: Joi.string().pattern(/^\d+$/).optional(),
    blockNumber: Joi.number().integer().positive().required(),
    blockTimestamp: Joi.date().required(),
    status: Joi.string().valid('pending', 'confirmed', 'failed').optional(),
    reserves: Joi.object({
      reserveA: Joi.string().pattern(/^\d+$/).optional(),
      reserveB: Joi.string().pattern(/^\d+$/).optional()
    }).optional(),
    priceAPerB: Joi.number().optional(),
    priceBPerA: Joi.number().optional()
  });

  return schema.validate(data);
};

// Cross Chain validation schema (updated for LayerZero)
const validateCrossChain = (data) => {
  const schema = Joi.object({
    sourceTransactionHash: transactionHash,
    sourceChainId: Joi.number().integer().positive().required(),
    sourceBlockNumber: Joi.number().integer().positive().optional(),
    sourceBlockTimestamp: Joi.date().optional(),
    destinationTransactionHash: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).optional(),
    destinationChainId: Joi.number().integer().positive().required(),
    destinationBlockNumber: Joi.number().integer().positive().optional(),
    destinationBlockTimestamp: Joi.date().optional(),
    destinationEid: Joi.number().integer().positive().required(),
    sender: ethereumAddress,
    recipient: ethereumAddress,
    sourceToken: Joi.object({
      address: ethereumAddress,
      symbol: Joi.string().optional(),
      decimals: Joi.number().integer().min(0).max(18).optional(),
      amount: bigNumberString
    }).required(),
    destinationToken: Joi.object({
      address: ethereumAddress,
      symbol: Joi.string().optional(),
      decimals: Joi.number().integer().min(0).max(18).optional(),
      amount: Joi.string().pattern(/^\d+$/).optional()
    }).required(),
    stableAmount: bigNumberString,
    amountOutMin: bigNumberString,
    layerZeroData: Joi.object({
      messageId: Joi.string().optional(),
      nonce: Joi.string().optional(),
      options: Joi.string().optional(),
      lzTokenFee: Joi.string().pattern(/^\d+$/).optional(),
      nativeFee: Joi.string().pattern(/^\d+$/).optional()
    }).optional(),
    amountInUSD: Joi.number().min(0).optional(),
    amountOutUSD: Joi.number().min(0).optional(),
    bridgeFeeUSD: Joi.number().min(0).optional(),
    sourceGasUsed: Joi.string().pattern(/^\d+$/).optional(),
    sourceGasPrice: Joi.string().pattern(/^\d+$/).optional(),
    destinationGasUsed: Joi.string().pattern(/^\d+$/).optional(),
    destinationGasPrice: Joi.string().pattern(/^\d+$/).optional(),
    status: Joi.string().valid('initiated', 'pending', 'relaying', 'completed', 'failed', 'refunded').optional(),
    sourceRouterAddress: ethereumAddress,
    destinationRouterAddress: ethereumAddressOptional,
    estimatedCompletionTime: Joi.date().optional(),
    actualCompletionTime: Joi.date().optional(),
    errorMessage: Joi.string().optional(),
    retryCount: Joi.number().integer().min(0).optional(),
    events: Joi.array().items(Joi.object({
      eventType: Joi.string().valid('CrossChainSwapInitiated', 'CrossChainSwapCompleted', 'MessageSent', 'MessageReceived').required(),
      transactionHash: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).optional(),
      blockNumber: Joi.number().integer().positive().optional(),
      timestamp: Joi.date().optional(),
      data: Joi.any().optional()
    })).optional()
  });

  return schema.validate(data);
};

// PairCreated validation schema
const validatePairCreated = (data) => {
  const schema = Joi.object({
    transactionHash: transactionHash,
    chainId: Joi.number().integer().positive().required(),
    factoryAddress: ethereumAddress,
    token0: ethereumAddress,
    token1: ethereumAddress,
    pairAddress: ethereumAddress,
    pairIndex: Joi.number().integer().min(0).required(),
    blockNumber: Joi.number().integer().positive().required(),
    blockTimestamp: Joi.date().required(),
    gasUsed: Joi.string().pattern(/^\d+$/).optional(),
    gasPrice: Joi.string().pattern(/^\d+$/).optional(),
    creator: ethereumAddress,
    token0Symbol: Joi.string().optional(),
    token1Symbol: Joi.string().optional(),
    token0Decimals: Joi.number().integer().min(0).max(18).optional(),
    token1Decimals: Joi.number().integer().min(0).max(18).optional(),
    isActive: Joi.boolean().optional()
  });

  return schema.validate(data);
};

module.exports = {
  validateChain,
  validateSwap,
  validateLP,
  validateCrossChain,
  validatePairCreated
};