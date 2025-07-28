/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

const accounts = [vars.get("ADMIN_WALLET_PRIVATE_KEY")];

module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {},
    polygonAmoy: {
      url: "https://rpc-amoy.polygon.technology",
      chainId: 80002,
      accounts,
    },
    holesky: {
      url: "https://ethereum-holesky.publicnode.com",
      chainId: 17000,
      accounts,
    },
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/Ln0Aa5Ea0iyVV0mh6RpyT",
      chainId: 11155111,
      accounts,
    },
    arbitrumSepolia: {
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      chainId: 421614,
      accounts,
    },
    optimismSepolia: {
      url: "https://sepolia.optimism.io",
      chainId: 11155420,
      accounts,
    },
    avalancheFuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts,
    },
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts,
    },
    baseSepolia: {
      url: "https://sepolia.base.org",
      chainId: 84532,
      accounts,
    },
  },

  etherscan: {
    // Your single API key for all supported networks
    apiKey:process.env.ETHERSCAN_API_KEY,
    // Add the custom chain definition for Optimism Sepolia
    customChains: [
      {
        network: "optimismSepolia",
        chainId: 11155420,
        urls: {
          apiURL: "https://api-sepolia-optimistic.etherscan.io/api",
          browserURL: "https://sepolia-optimism.etherscan.io/",
        },
      },
    ],
  },
};