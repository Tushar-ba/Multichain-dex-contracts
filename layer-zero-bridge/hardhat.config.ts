import { HardhatUserConfig, vars } from "hardhat/config";
import "@layerzerolabs/toolbox-hardhat";
import { EndpointId } from '@layerzerolabs/lz-definitions';
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";

const accounts = vars.get("ADMIN_WALLET_PRIVATE_KEY", "");

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.22",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  namedAccounts: {
    deployer: {
      default: 0, // First account as deployer
    },
  },
  networks: {
    // Existing testnets
    'arbitrum-sepolia-testnet': {
        eid: EndpointId.ARBSEP_V2_TESTNET,
        url: 'https://arbitrum-sepolia.gateway.tenderly.co',
        accounts: accounts ? [accounts] : [],
        verify: {
          etherscan: {
            apiUrl: 'https://api-sepolia.arbiscan.io/',
            apiKey: vars.get("ARBISCAN_API_KEY", "")
          }
        }
    },
    'avalanche-fuji-testnet': {
        eid: EndpointId.AVALANCHE_V2_TESTNET,
        url: 'https://avalanche-fuji.drpc.org',
        accounts: accounts ? [accounts] : [],
        verify: {
          etherscan: {
            apiUrl: 'https://api-testnet.snowtrace.io/',
            apiKey: vars.get("SNOWTRACE_API_KEY", "")
          }
        }
    },
    'optimism-sepolia-testnet': {
        eid: EndpointId.OPTSEP_V2_TESTNET,
        url: 'https://optimism-sepolia.gateway.tenderly.co',
        accounts: accounts ? [accounts] : [],
        verify: {
          etherscan: {
            apiUrl: 'https://api-sepolia-optimistic.etherscan.io/',
            apiKey: vars.get("OPTIMISM_API_KEY", "")
          }
        }
    },
    'ethereum-sepolia': {
        eid: EndpointId.SEPOLIA_V2_TESTNET,
        url: vars.get("SEPOLIA_RPC_URL", "https://eth-sepolia.g.alchemy.com/v2/Ln0Aa5Ea0iyVV0mh6RpyT"),
        accounts: accounts ? [accounts] : [],
        verify: {
          etherscan: {
            apiUrl: 'https://api-sepolia.etherscan.io/',
            apiKey: vars.get("ETHERSCAN_API_KEY", "")
          }
        }
    },
    'bsc-testnet': {
        eid: EndpointId.BSC_V2_TESTNET,
        url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
        accounts: accounts ? [accounts] : [],
        verify: {
          etherscan: {
            apiUrl: 'https://api-testnet.bscscan.com/',
            apiKey: vars.get("BSCSCAN_API_KEY", "")
          }
        }
    },
    'base-sepolia': {
        eid: EndpointId.BASESEP_V2_TESTNET,
        url: 'https://sepolia.base.org',
        accounts: accounts ? [accounts] : [],
        verify: {
          etherscan: {
            apiUrl: 'https://api-sepolia.basescan.org/',
            apiKey: vars.get("BASESCAN_API_KEY", "")
          }
        }
    },
    'polygon-amoy': {
        eid: EndpointId.AMOY_V2_TESTNET,
        url: 'https://rpc-amoy.polygon.technology',
        accounts: accounts ? [accounts] : [],
        verify: {
          etherscan: {
            apiUrl: 'https://api-amoy.polygonscan.com/',
            apiKey: vars.get("POLYGONSCAN_API_KEY", "")
          }
        }
    },
  },
  paths: {
    deploy: 'deploy',
    deployments: 'deployments',
  }
};

export default config;