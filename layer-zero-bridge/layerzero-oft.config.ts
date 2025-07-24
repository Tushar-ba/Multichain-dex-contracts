import { EndpointId } from '@layerzerolabs/lz-definitions';
import { ExecutorOptionType } from '@layerzerolabs/lz-v2-utilities';
import { TwoWayConfig, generateConnectionsConfig } from '@layerzerolabs/metadata-tools';
import { OAppEnforcedOption, OmniPointHardhat } from '@layerzerolabs/toolbox-hardhat';

// Define CustomStablecoinOFT contract deployments for ONLY deployed networks
const arbitrumStablecoin: OmniPointHardhat = {
  eid: EndpointId.ARBSEP_V2_TESTNET,
  contractName: 'CustomStablecoinOFT',
  address: '0xD96d3eC1d7eF8f49F8966E88d5F3E80E71BED6Ba',
};

const avalancheStablecoin: OmniPointHardhat = {
  eid: EndpointId.AVALANCHE_V2_TESTNET,
  contractName: 'CustomStablecoinOFT',
  address: '0x6093Ea528F924e760902C5452CeF4d0Db6000981',
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

// Define the pathways for OFT transfers (only between deployed networks)
const oftPathways: TwoWayConfig[] = [
  [
    arbitrumStablecoin,
    avalancheStablecoin,
    [['LayerZero Labs'], []], // [requiredDVNs, [optionalDVNs, threshold]]
    [1, 1], // [source to dest confirmations, dest to source confirmations]
    [OFT_ENFORCED_OPTIONS, OFT_ENFORCED_OPTIONS],
  ],
];

export default async function () {
  // Generate connections config from OFT pathways
  const connections = await generateConnectionsConfig(oftPathways);
  
  return {
    contracts: [
      // OFT contracts (only deployed networks)
      { contract: arbitrumStablecoin },
      { contract: avalancheStablecoin },
    ],
    connections,
  };
} 