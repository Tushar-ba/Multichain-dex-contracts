import { EndpointId } from "@layerzerolabs/lz-definitions";
const arbitrum_sepolia_testnetContract = {
    eid: EndpointId.ARBSEP_V2_TESTNET,
    contractName: "CrossChainRouter"
};
const avalanche_fuji_testnetContract = {
    eid: EndpointId.AVALANCHE_V2_TESTNET,
    contractName: "CrossChainRouter"
};
export default { contracts: [{ contract: arbitrum_sepolia_testnetContract }, { contract: avalanche_fuji_testnetContract }], connections: [{ from: arbitrum_sepolia_testnetContract, to: avalanche_fuji_testnetContract, config: { sendLibrary: "0x4f7cd4DA19ABB31b0eC98b9066B9e857B1bf9C0E", receiveLibraryConfig: { receiveLibrary: "0x75Db67CDab2824970131D5aa9CECfC9F69c69636", gracePeriod: 0 }, sendConfig: { executorConfig: { maxMessageSize: 10000, executor: "0x5Df3a1cEbBD9c8BA7F8dF51Fd632A9aef8308897" }, ulnConfig: { confirmations: 1, requiredDVNs: ["0x53f488E93b4f1b60E8E83aa374dBe1780A1EE8a8"], optionalDVNs: [], optionalDVNThreshold: 0 } }, receiveConfig: { ulnConfig: { confirmations: 4, requiredDVNs: ["0x53f488E93b4f1b60E8E83aa374dBe1780A1EE8a8"], optionalDVNs: [], optionalDVNThreshold: 0 } } } }, { from: avalanche_fuji_testnetContract, to: arbitrum_sepolia_testnetContract, config: { sendLibrary: "0x69BF5f48d2072DfeBc670A1D19dff91D0F4E8170", receiveLibraryConfig: { receiveLibrary: "0x819F0FAF2cb1Fba15b9cB24c9A2BDaDb0f895daf", gracePeriod: 0 }, sendConfig: { executorConfig: { maxMessageSize: 10000, executor: "0xa7BFA9D51032F82D649A501B6a1f922FC2f7d4e3" }, ulnConfig: { confirmations: 4, requiredDVNs: ["0x9f0e79Aeb198750F963b6f30B99d87c6EE5A0467"], optionalDVNs: [], optionalDVNThreshold: 0 } }, receiveConfig: { ulnConfig: { confirmations: 1, requiredDVNs: ["0x9f0e79Aeb198750F963b6f30B99d87c6EE5A0467"], optionalDVNs: [], optionalDVNThreshold: 0 } } } }] };
