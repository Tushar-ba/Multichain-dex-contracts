export const CONTRACT_ADDRESSES = {
  // Polygon Amoy (80002)
  80002: {
    factory: '0xD1fB70842D9A9A330B0E3e1c6Fd47fdCC20B4982',
    router: '0xa5812cE58B6Cb897b9B02ED1bAA1f9AC01D4F67e',
    weth: '0x0000000000000000000000000000000000001010', // MATIC
    crossChainRouter: '0x69c475d50afa8EAd344E85326369277F88b74CC6',
    stablecoin: '0x91735d81732902Cb2a80Dcffc2188592B4031226', // PFUSD
  },
  // Arbitrum Sepolia (421614)
  421614: {
    factory: '0xfdA105569553e29a46fF28D07bd77c1344aDD837',
    router: '0xC5e1362cC4768A10331f77DDe46572f54802e142',
    weth: '0x0000000000000000000000000000000000000000', // ETH
    crossChainRouter: '0x4F8FD373bb8Df6DA0461D220D1D1018AA92b9157',
    stablecoin: '0xCE24E5cA05FDD47D8629465978Ff887091556929', // PFUSD
  },
  // Sepolia (11155111)
  11155111: {
    factory: '0x246D0DB8116F732549dFF7FfDbeEfFB1eB608681',
    router: '0xC235d41016435B1034aeC94f9de17a78d9dA7028',
    weth: '0x0000000000000000000000000000000000000000', // ETH
    crossChainRouter: '0xAdf3323e9B2D26Dfc17c5309390786264Dd2D494',
    stablecoin: '0xDE44975f2060d977Dd7c7B93C7d7aFec8fFcb1a2', // PFUSD
  },
  // BSC Testnet (97)
  97: {
    factory: '0xE7AbD5CF4180D2F6891115070839A2f95CB35F9a',
    router: '0x78069aF1280A73D240cCDF16Ab4a483555246665',
    weth: '0x0000000000000000000000000000000000000000', // BNB
    crossChainRouter: '0x0EBcFE9Fc5817DD541B2EAdc1e8fe92D35bc2470',
    stablecoin: '0x2258Db39FCdAB899661fBA6a1246Cc7a0F4E9ff0', // PFUSD
  },
  // Base Sepolia (84532)
  84532: {
    factory: '0xA4F64f7d0E9a75B014a856FFd2c58c36869F4671',
    router: '0xC3b415C823366DC2222d979b0a17ce9C72A4feEB',
    weth: '0x0000000000000000000000000000000000000000', // ETH
    crossChainRouter: '0x934b360A75F6AF046F421f9d386c840B4Ad45162',
    stablecoin: '0x0E4adEe6aCb907Ef3745AcB3202b8511A6FC6F52', // PFUSD
  },
  // Optimism Sepolia (11155420)
  11155420: {
    factory: '0x6DcC3258fB9F9355d7E4CDE912478369c55b8B6b',
    router: '0x3DfCfA2730f768cf4cf931f4896109ffa9c3e202',
    weth: '0x0000000000000000000000000000000000000000', // ETH
    crossChainRouter: '0x97F4FE32fF553B6f426Ee1998956164638B75a44',
    stablecoin: '0xdFA54fa7F1f275ab103D4f0Ad65Bc2Fb239E43f9', // PFUSD
  },
  // Avalanche Fuji (43113)
  43113: {
    factory: '0x394e2919526d23181A6B3D9e1654829D197cbf46',
    router: '0x011b561002A1D2522210BA3d687131AB1F6AcF79',
    weth: '0x0000000000000000000000000000000000000000', // AVAX
    crossChainRouter: '0x9480AbA0DFe3bfC6080D279781afD4B1fFcfb8d8',
    stablecoin: '0x53CDBE278328314F6208776cBF7Da0a0C2c6Feea', // PFUSD
  },
  // Ethereum Holesky (17000)
  17000: {
    factory: '0x0000000000000000000000000000000000000000', // Add your factory if available
    router: '0x1F2Ea7012Be2Fb0Ba2ce8B7B2A1ab3357Ab2315d', // Existing Holesky router
    weth: '0x0000000000000000000000000000000000000000', // ETH
    crossChainRouter: '0x3c7Fe5125Df4BB7Cc6f156E64Fd1949F07B9fA4d',
    stablecoin: '0xfAe78B00a8e7d9eDd1cCFBa0Ca61be311Ce59C08', // PFUSD
  },
} as const

export const getContractAddress = (chainId: number, contractType: 'factory' | 'router' | 'weth' | 'crossChainRouter' | 'stablecoin') => {
  return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.[contractType]
}

export type ContractAddresses = typeof CONTRACT_ADDRESSES
export type SupportedChainId = keyof ContractAddresses

// Helper function to get all contract addresses for a specific chain
export const getChainContracts = (chainId: number) => {
  return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]
}

// Helper function to get cross-chain router address specifically
export const getCrossChainRouter = (chainId: number) => {
  return getContractAddress(chainId, 'crossChainRouter')
}

// Helper function to get stablecoin address specifically
export const getStablecoin = (chainId: number) => {
  return getContractAddress(chainId, 'stablecoin')
}

// Get all supported chain IDs
export const SUPPORTED_CHAIN_IDS = Object.keys(CONTRACT_ADDRESSES).map(Number)

// Network name mapping
export const CHAIN_NAMES: { [key: number]: string } = {
  80002: 'Polygon Amoy',
  421614: 'Arbitrum Sepolia',
  11155111: 'Ethereum Sepolia',
  97: 'BSC Testnet',
  84532: 'Base Sepolia',
  11155420: 'Optimism Sepolia',
  43113: 'Avalanche Fuji',
  17000: 'Ethereum Holesky',
}

// Get chain name by ID
export const getChainName = (chainId: number) => {
  return CHAIN_NAMES[chainId] || `Unknown Chain (${chainId})`
}