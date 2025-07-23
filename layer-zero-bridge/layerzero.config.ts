import { EndpointId } from '@layerzerolabs/lz-definitions';
import { ExecutorOptionType } from '@layerzerolabs/lz-v2-utilities';
import { TwoWayConfig, generateConnectionsConfig } from '@layerzerolabs/metadata-tools';
import { OAppEnforcedOption, OmniPointHardhat } from '@layerzerolabs/toolbox-hardhat';

// Define CustomStablecoinOFT contract deployments for each network
const ethereumStablecoin: OmniPointHardhat = {
  eid: EndpointId.SEPOLIA_V2_TESTNET,
  contractName: 'CustomStablecoinOFT',
};

const arbitrumStablecoin: OmniPointHardhat = {
  eid: EndpointId.ARBSEP_V2_TESTNET,
  contractName: 'CustomStablecoinOFT',
};

const avalancheStablecoin: OmniPointHardhat = {
  eid: EndpointId.AVALANCHE_V2_TESTNET,
  contractName: 'CustomStablecoinOFT',
};

const optimismStablecoin: OmniPointHardhat = {
  eid: EndpointId.OPTSEP_V2_TESTNET,
  contractName: 'CustomStablecoinOFT',
};

const bscStablecoin: OmniPointHardhat = {
  eid: EndpointId.BSC_V2_TESTNET,
  contractName: 'CustomStablecoinOFT',
};

const baseStablecoin: OmniPointHardhat = {
  eid: EndpointId.BASESEP_V2_TESTNET,
  contractName: 'CustomStablecoinOFT',
};

const polygonStablecoin: OmniPointHardhat = {
  eid: EndpointId.AMOY_V2_TESTNET,
  contractName: 'CustomStablecoinOFT',
};

// Define CrossChainRouter contract deployments for each network
const ethereumRouter: OmniPointHardhat = {
  eid: EndpointId.SEPOLIA_V2_TESTNET,
  contractName: 'CrossChainRouter',
};

const arbitrumRouter: OmniPointHardhat = {
  eid: EndpointId.ARBSEP_V2_TESTNET,
  contractName: 'CrossChainRouter',
};

const avalancheRouter: OmniPointHardhat = {
  eid: EndpointId.AVALANCHE_V2_TESTNET,
  contractName: 'CrossChainRouter',
};

const optimismRouter: OmniPointHardhat = {
  eid: EndpointId.OPTSEP_V2_TESTNET,
  contractName: 'CrossChainRouter',
};

const bscRouter: OmniPointHardhat = {
  eid: EndpointId.BSC_V2_TESTNET,
  contractName: 'CrossChainRouter',
};

const baseRouter: OmniPointHardhat = {
  eid: EndpointId.BASESEP_V2_TESTNET,
  contractName: 'CrossChainRouter',
};

const polygonRouter: OmniPointHardhat = {
  eid: EndpointId.AMOY_V2_TESTNET,
  contractName: 'CrossChainRouter',
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

// Configure enforced options for Compose messages (msg type 2)
const COMPOSE_ENFORCED_OPTIONS: OAppEnforcedOption[] = [
  {
    msgType: 1, // OFT transfer that triggers compose
    optionType: ExecutorOptionType.LZ_RECEIVE,
    gas: 200000, // Gas for OFT _lzReceive
    value: 0,
  },
  {
    msgType: 2, // Compose message
    optionType: ExecutorOptionType.COMPOSE,
    gas: 500000, // Gas for lzCompose execution (includes DEX swap)
    value: 0,
    index: 0, // First compose message
  },
];

// Define the pathways for OFT transfers (all chains connected to all other chains)
const oftPathways: TwoWayConfig[] = [
  // Ethereum connections
  [
    ethereumStablecoin,
    arbitrumStablecoin,
    [['LayerZero Labs'], []], // [requiredDVNs, [optionalDVNs, threshold]]
    [1, 1], // [source to dest confirmations, dest to source confirmations]
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  [
    ethereumStablecoin,
    avalancheStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  [
    ethereumStablecoin,
    optimismStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  [
    ethereumStablecoin,
    bscStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  [
    ethereumStablecoin,
    baseStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  [
    ethereumStablecoin,
    polygonStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  
  // Arbitrum connections (excluding Ethereum - already covered)
  [
    arbitrumStablecoin,
    avalancheStablecoin,
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
  
  // Avalanche connections (excluding previous - already covered)
  [
    avalancheStablecoin,
    optimismStablecoin,
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
  
  // Optimism connections (excluding previous - already covered)
  [
    optimismStablecoin,
    bscStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  [
    optimismStablecoin,
    baseStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  [
    optimismStablecoin,
    polygonStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
  
  // BSC connections (excluding previous - already covered)
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
  
  // Base connections (excluding previous - already covered)
  [
    baseStablecoin,
    polygonStablecoin,
    [['LayerZero Labs'], []],
    [1, 1],
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
];

// Define pathways for CrossChainRouter (compose functionality)
const routerPathways: TwoWayConfig[] = [
  // Router connections for cross-chain swaps with compose
  [
    ethereumRouter,
    arbitrumRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [COMPOSE_ENFORCED_OPTIONS, COMPOSE_ENFORCED_OPTIONS],
  ],
  [
    ethereumRouter,
    avalancheRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [COMPOSE_ENFORCED_OPTIONS, COMPOSE_ENFORCED_OPTIONS],
  ],
  [
    ethereumRouter,
    optimismRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [COMPOSE_ENFORCED_OPTIONS, COMPOSE_ENFORCED_OPTIONS],
  ],
  [
    ethereumRouter,
    bscRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [COMPOSE_ENFORCED_OPTIONS, COMPOSE_ENFORCED_OPTIONS],
  ],
  [
    ethereumRouter,
    baseRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [COMPOSE_ENFORCED_OPTIONS, COMPOSE_ENFORCED_OPTIONS],
  ],
  [
    ethereumRouter,
    polygonRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [COMPOSE_ENFORCED_OPTIONS, COMPOSE_ENFORCED_OPTIONS],
  ],
  [
    arbitrumRouter,
    avalancheRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [COMPOSE_ENFORCED_OPTIONS, COMPOSE_ENFORCED_OPTIONS],
  ],
  [
    arbitrumRouter,
    optimismRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [COMPOSE_ENFORCED_OPTIONS, COMPOSE_ENFORCED_OPTIONS],
  ],
  [
    arbitrumRouter,
    bscRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [COMPOSE_ENFORCED_OPTIONS, COMPOSE_ENFORCED_OPTIONS],
  ],
  [
    arbitrumRouter,
    baseRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [COMPOSE_ENFORCED_OPTIONS, COMPOSE_ENFORCED_OPTIONS],
  ],
  [
    arbitrumRouter,
    polygonRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [COMPOSE_ENFORCED_OPTIONS, COMPOSE_ENFORCED_OPTIONS],
  ],
  [
    avalancheRouter,
    optimismRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [COMPOSE_ENFORCED_OPTIONS, COMPOSE_ENFORCED_OPTIONS],
  ],
  [
    avalancheRouter,
    bscRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [COMPOSE_ENFORCED_OPTIONS, COMPOSE_ENFORCED_OPTIONS],
  ],
  [
    avalancheRouter,
    baseRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [COMPOSE_ENFORCED_OPTIONS, COMPOSE_ENFORCED_OPTIONS],
  ],
  [
    avalancheRouter,
    polygonRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [COMPOSE_ENFORCED_OPTIONS, COMPOSE_ENFORCED_OPTIONS],
  ],
  [
    optimismRouter,
    bscRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [COMPOSE_ENFORCED_OPTIONS, COMPOSE_ENFORCED_OPTIONS],
  ],
  [
    optimismRouter,
    baseRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [COMPOSE_ENFORCED_OPTIONS, COMPOSE_ENFORCED_OPTIONS],
  ],
  [
    optimismRouter,
    polygonRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [COMPOSE_ENFORCED_OPTIONS, COMPOSE_ENFORCED_OPTIONS],
  ],
  [
    bscRouter,
    baseRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [COMPOSE_ENFORCED_OPTIONS, COMPOSE_ENFORCED_OPTIONS],
  ],
  [
    bscRouter,
    polygonRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [COMPOSE_ENFORCED_OPTIONS, COMPOSE_ENFORCED_OPTIONS],
  ],
  [
    baseRouter,
    polygonRouter,
    [['LayerZero Labs'], []],
    [1, 1],
    [COMPOSE_ENFORCED_OPTIONS, COMPOSE_ENFORCED_OPTIONS],
  ],
];

export default async function () {
  // Combine all pathways into a single array
  const allPathways = [...oftPathways, ...routerPathways];
  
  // Generate connections config from all pathways
  const connections = await generateConnectionsConfig(allPathways);
  
  return {
    contracts: [
      // OFT contracts
      { contract: ethereumStablecoin },
      { contract: arbitrumStablecoin },
      { contract: avalancheStablecoin },
      { contract: optimismStablecoin },
      { contract: bscStablecoin },
      { contract: baseStablecoin },
      { contract: polygonStablecoin },
      
      // Router contracts
      { contract: ethereumRouter },
      { contract: arbitrumRouter },
      { contract: avalancheRouter },
      { contract: optimismRouter },
      { contract: bscRouter },
      { contract: baseRouter },
      { contract: polygonRouter },
    ],
    connections,
  };
} 