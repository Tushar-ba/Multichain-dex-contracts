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

const holeskyStablecoin: OmniPointHardhat = {
  eid: 40217,
  contractName: 'CustomStablecoinOFT',
  address: '0x0a44Dc381949F6128Ca0615B4c68F0D15818dE74', // Update with actual base sepolia address
};

const avalancheStablecoin: OmniPointHardhat = {
  eid: 40106,
  contractName: 'CustomStablecoinOFT',
  address: '0x55C192C8bF6749F65dE78E524273A481C4b1f667',
};

// Define CrossChainRouter contract deployments for ONLY deployed networks
// const arbitrumRouter: OmniPointHardhat = {
//   eid: EndpointId.ARBSEP_V2_TESTNET,
//   contractName: 'CrossChainRouter',
//   address: '0x8C17e97049D74d9AB75BB966ef045f83c52D0b27',
// };

// const baseRouter: OmniPointHardhat = {
//   eid: EndpointId.BASESEP_V2_TESTNET,
//   contractName: 'CrossChainRouter',
//   address: '0x111087Fd5862966b9cbD37fD70420E07Bee91994', // Update with actual base sepolia address
// };
const holeskyRouter: OmniPointHardhat = {
  eid: 40217,
  contractName: 'CrossChainRouter',
  address: '0xC411824F1695feeC0f9b8C3d4810c2FD1AB1000a', // Update with actual holesky address
};

const avalancheRouter: OmniPointHardhat = {
  eid: 40106,
  contractName: 'CrossChainRouter',
  address: '0x9F577e8A1be3ec65BE0fb139425988dfE438196e',
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
    holeskyStablecoin,
    avalancheStablecoin,
    [['LayerZero Labs'], []], // [requiredDVNs, [optionalDVNs, threshold]]
    [1, 1], // [source to dest confirmations, dest to source confirmations]
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
];

// Define pathways for CrossChainRouter (only between deployed networks)
const routerPathways: TwoWayConfig[] = [
  [
    holeskyRouter,
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
      { contract: holeskyStablecoin },
      { contract: avalancheStablecoin },
      
      // Router contracts (only deployed networks)
      { contract: holeskyRouter },
      { contract: avalancheRouter },
    ],
    connections,
  };
} 