import { EndpointId } from '@layerzerolabs/lz-definitions';
import { ExecutorOptionType } from '@layerzerolabs/lz-v2-utilities';
import { TwoWayConfig, generateConnectionsConfig } from '@layerzerolabs/metadata-tools';
import { OAppEnforcedOption, OmniPointHardhat } from '@layerzerolabs/toolbox-hardhat';

// Define CustomStablecoinOFT contract deployments for ALL deployed networks
const arbitrumStablecoin: OmniPointHardhat = {
  eid: EndpointId.ARBSEP_V2_TESTNET,
  contractName: 'CustomStablecoinOFT',
  address: '0xCE24E5cA05FDD47D8629465978Ff887091556929',
};

const bscStablecoin: OmniPointHardhat = {
  eid: EndpointId.BSC_V2_TESTNET,
  contractName: 'CustomStablecoinOFT',
  address: '0x2258Db39FCdAB899661fBA6a1246Cc7a0F4E9ff0',
};

const baseStablecoin: OmniPointHardhat = {
  eid: EndpointId.BASESEP_V2_TESTNET,
  contractName: 'CustomStablecoinOFT',
  address: '0x0E4adEe6aCb907Ef3745AcB3202b8511A6FC6F52',
};

const avalancheStablecoin: OmniPointHardhat = {
  eid: EndpointId.AVALANCHE_V2_TESTNET,
  contractName: 'CustomStablecoinOFT',
  address: '0x53CDBE278328314F6208776cBF7Da0a0C2c6Feea',
};

const polygonStablecoin: OmniPointHardhat = {
  eid: EndpointId.AMOY_V2_TESTNET,
  contractName: 'CustomStablecoinOFT',
  address: '0x91735d81732902Cb2a80Dcffc2188592B4031226',
};

const optimismStablecoin: OmniPointHardhat = {
  eid: EndpointId.OPTSEP_V2_TESTNET,
  contractName: 'CustomStablecoinOFT',
  address: '0xdFA54fa7F1f275ab103D4f0Ad65Bc2Fb239E43f9',
};

const sepoliaStablecoin: OmniPointHardhat = {
  eid: EndpointId.SEPOLIA_V2_TESTNET,
  contractName: 'CustomStablecoinOFT',
  address: '0xDE44975f2060d977Dd7c7B93C7d7aFec8fFcb1a2',
};

const holeskyStablecoin: OmniPointHardhat = {
  eid: EndpointId.HOLESKY_V2_TESTNET,
  contractName: 'CustomStablecoinOFT',
  address: '0xfAe78B00a8e7d9eDd1cCFBa0Ca61be311Ce59C08',
};

// Define SimpleCrossChainRouter contract deployments for ALL deployed networks
const arbitrumRouter: OmniPointHardhat = {
  eid: EndpointId.ARBSEP_V2_TESTNET,
  contractName: 'SimpleCrossChainRouter',
  address: '0x4F8FD373bb8Df6DA0461D220D1D1018AA92b9157',
};

const bscRouter: OmniPointHardhat = {
  eid: EndpointId.BSC_V2_TESTNET,
  contractName: 'SimpleCrossChainRouter',
  address: '0x0EBcFE9Fc5817DD541B2EAdc1e8fe92D35bc2470',
};

const baseRouter: OmniPointHardhat = {
  eid: EndpointId.BASESEP_V2_TESTNET,
  contractName: 'SimpleCrossChainRouter',
  address: '0x934b360A75F6AF046F421f9d386c840B4Ad45162',
};

const avalancheRouter: OmniPointHardhat = {
  eid: EndpointId.AVALANCHE_V2_TESTNET,
  contractName: 'SimpleCrossChainRouter',
  address: '0x9480AbA0DFe3bfC6080D279781afD4B1fFcfb8d8',
};

const polygonRouter: OmniPointHardhat = {
  eid: EndpointId.AMOY_V2_TESTNET,
  contractName: 'SimpleCrossChainRouter',
  address: '0x69c475d50afa8EAd344E85326369277F88b74CC6',
};

const optimismRouter: OmniPointHardhat = {
  eid: EndpointId.OPTSEP_V2_TESTNET,
  contractName: 'SimpleCrossChainRouter',
  address: '0x97F4FE32fF553B6f426Ee1998956164638B75a44',
};

const sepoliaRouter: OmniPointHardhat = {
  eid: EndpointId.SEPOLIA_V2_TESTNET,
  contractName: 'SimpleCrossChainRouter',
  address: '0xAdf3323e9B2D26Dfc17c5309390786264Dd2D494',
};

const holeskyRouter: OmniPointHardhat = {
  eid: EndpointId.HOLESKY_V2_TESTNET,
  contractName: 'SimpleCrossChainRouter',
  address: '0x3c7Fe5125Df4BB7Cc6f156E64Fd1949F07B9fA4d',
};

// Configure enforced options for OFT transfers (msg type 1)
const OFT_ENFORCED_OPTIONS: OAppEnforcedOption[] = [
  {
    msgType: 1, // Standard OFT transfer
    optionType: ExecutorOptionType.LZ_RECEIVE,
    gas: 200000, // Gas for OFT _lzReceive
    value: 0,
  },
];

// Configure enforced options for CrossChainRouter messages (msg type 1)
const ROUTER_ENFORCED_OPTIONS: OAppEnforcedOption[] = [
  {
    msgType: 1, // CrossChain swap message
    optionType: ExecutorOptionType.LZ_RECEIVE,
    gas: 500000, // Gas for CrossChainRouter _lzReceive (includes DEX swap)
    value: 0,
  },
];

// Define the pathways for OFT transfers (manually defined pathways)
const oftPathways: TwoWayConfig[] = [
  // Holesky to all other networks
  [
    holeskyStablecoin,
    avalancheStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  [
    holeskyStablecoin,
    arbitrumStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  [
    holeskyStablecoin,
    bscStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  [
    holeskyStablecoin,
    baseStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  [
    holeskyStablecoin,
    polygonStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  [
    holeskyStablecoin,
    optimismStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  [
    holeskyStablecoin,
    sepoliaStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  
  // Avalanche to remaining networks (excluding holesky - already covered above)
  [
    avalancheStablecoin,
    arbitrumStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  [
    avalancheStablecoin,
    bscStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  [
    avalancheStablecoin,
    baseStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  [
    avalancheStablecoin,
    polygonStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  [
    avalancheStablecoin,
    optimismStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  [
    avalancheStablecoin,
    sepoliaStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  
  // Arbitrum to remaining networks
  [
    arbitrumStablecoin,
    bscStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  [
    arbitrumStablecoin,
    baseStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  [
    arbitrumStablecoin,
    polygonStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  [
    arbitrumStablecoin,
    optimismStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  [
    arbitrumStablecoin,
    sepoliaStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  
  // BSC to remaining networks
  [
    bscStablecoin,
    baseStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  [
    bscStablecoin,
    polygonStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  [
    bscStablecoin,
    optimismStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  [
    bscStablecoin,
    sepoliaStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  
  // Base to remaining networks
  [
    baseStablecoin,
    polygonStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  [
    baseStablecoin,
    optimismStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  [
    baseStablecoin,
    sepoliaStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  
  // Polygon to remaining networks
  [
    polygonStablecoin,
    optimismStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  [
    polygonStablecoin,
    sepoliaStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  
  // Optimism to remaining networks
  [
    optimismStablecoin,
    sepoliaStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
];

// Define pathways for CrossChainRouter (manually defined pathways)
const routerPathways: TwoWayConfig[] = [
  // Holesky to all other networks
  [
    holeskyRouter,
    avalancheRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS],
  ],
  [
    holeskyRouter,
    arbitrumRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS],
  ],
  [
    holeskyRouter,
    bscRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS],
  ],
  [
    holeskyRouter,
    baseRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS],
  ],
  [
    holeskyRouter,
    polygonRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS],
  ],
  [
    holeskyRouter,
    optimismRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS],
  ],
  [
    holeskyRouter,
    sepoliaRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS],
  ],
  
  // Avalanche to remaining networks
  [
    avalancheRouter,
    arbitrumRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS],
  ],
  [
    avalancheRouter,
    bscRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS],
  ],
  [
    avalancheRouter,
    baseRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS],
  ],
  [
    avalancheRouter,
    polygonRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS],
  ],
  [
    avalancheRouter,
    optimismRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS],
  ],
  [
    avalancheRouter,
    sepoliaRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS],
  ],
  
  // Arbitrum to remaining networks
  [
    arbitrumRouter,
    bscRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS],
  ],
  [
    arbitrumRouter,
    baseRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS],
  ],
  [
    arbitrumRouter,
    polygonRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS],
  ],
  [
    arbitrumRouter,
    optimismRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS],
  ],
  [
    arbitrumRouter,
    sepoliaRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS],
  ],
  
  // BSC to remaining networks
  [
    bscRouter,
    baseRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS],
  ],
  [
    bscRouter,
    polygonRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS],
  ],
  [
    bscRouter,
    optimismRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS],
  ],
  [
    bscRouter,
    sepoliaRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS],
  ],
  
  // Base to remaining networks
  [
    baseRouter,
    polygonRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS],
  ],
  [
    baseRouter,
    optimismRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS],
  ],
  [
    baseRouter,
    sepoliaRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS],
  ],
  
  // Polygon to remaining networks
  [
    polygonRouter,
    optimismRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS],
  ],
  [
    polygonRouter,
    sepoliaRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS],
  ],
  
  // Optimism to remaining networks
  [
    optimismRouter,
    sepoliaRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS],
  ],
];

export default async function () {
  // Combine all pathways into a single array
  const allPathways = [...oftPathways, ...routerPathways];
  
  // Generate connections config from all pathways
  const connections = await generateConnectionsConfig(allPathways);
  
  return {
    contracts: [
      // OFT contracts (all deployed networks)
      { contract: arbitrumStablecoin },
      { contract: bscStablecoin },
      { contract: baseStablecoin },
      { contract: avalancheStablecoin },
      { contract: polygonStablecoin },
      { contract: optimismStablecoin },
      { contract: sepoliaStablecoin },
      { contract: holeskyStablecoin },
      
      // Router contracts (all deployed networks)
      { contract: arbitrumRouter },
      { contract: bscRouter },
      { contract: baseRouter },
      { contract: avalancheRouter },
      { contract: polygonRouter },
      { contract: optimismRouter },
      { contract: sepoliaRouter },
      { contract: holeskyRouter },
    ],
    connections,
  };
}