import { EndpointId } from '@layerzerolabs/lz-definitions';
import { ExecutorOptionType } from '@layerzerolabs/lz-v2-utilities';
import { TwoWayConfig, generateConnectionsConfig } from '@layerzerolabs/metadata-tools';
import { OAppEnforcedOption, OmniPointHardhat } from '@layerzerolabs/toolbox-hardhat';

// Define CustomStablecoinOFT contract deployments for ONLY deployed networks
// const arbitrumStablecoin: OmniPointHardhat = {
//   eid: EndpointId.ARBSEP_V2_TESTNET,
//   contractName: 'CustomStablecoinOFT',
//   address: '0x2520342A8e02D4782dCe3Db0e579Fff965D873C2',
// };

const avalancheStablecoin: OmniPointHardhat = {
  eid: EndpointId.AVALANCHE_V2_TESTNET,
  contractName: 'CustomStablecoinOFT',
  address: '0x8ffFA9c480FF1092bAd184154b37BCfA4a801829',
};

// Define CrossChainRouter contract deployments for ONLY deployed networks
// const arbitrumRouter: OmniPointHardhat = {
//   eid: EndpointId.ARBSEP_V2_TESTNET,
//   contractName: 'CrossChainRouter',
//   address: '0x8C17e97049D74d9AB75BB966ef045f83c52D0b27',
// };

const avalancheRouter: OmniPointHardhat = {
  eid: EndpointId.AVALANCHE_V2_TESTNET,
  contractName: 'CrossChainRouter',
  address: '0x83dce164A8d1b8b8d70d0b99b7Aa7b22c4EABb40',
};

const baseSepoliaStablecoin: OmniPointHardhat = {
  eid: EndpointId.BASESEP_V2_TESTNET,
  contractName: 'CustomStablecoinOFT',
  address: '0x2520342A8e02D4782dCe3Db0e579Fff965D873C2',
};
const baseSepoliaRouter: OmniPointHardhat = {
  eid: EndpointId.BASESEP_V2_TESTNET,
  contractName: 'CrossChainRouter',
  address: '0x8C17e97049D74d9AB75BB966ef045f83c52D0b27',
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

// Define the pathways for OFT transfers (only between deployed networks)
const oftPathways: TwoWayConfig[] = [
  [
    baseSepoliaStablecoin,
    avalancheStablecoin,
    [['LayerZero Labs'], []], // [requiredDVNs, [optionalDVNs, threshold]]
    [1, 1], // [source to dest confirmations, dest to source confirmations]
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
];

// Define pathways for CrossChainRouter (only between deployed networks)
const routerPathways: TwoWayConfig[] = [
  [
    baseSepoliaRouter,
    avalancheRouter,
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
      // OFT contracts (only deployed networks)
      { contract: baseSepoliaStablecoin },
      { contract: avalancheStablecoin },
      
      // Router contracts (only deployed networks)
      { contract: baseSepoliaRouter },
      { contract: avalancheRouter },
    ],
    connections,
  };
} 