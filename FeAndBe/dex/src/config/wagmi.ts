import { http, createConfig } from 'wagmi'
import { supportedChains } from './chains'

export const config = createConfig({
  chains: supportedChains,
  transports: {
    [11155111]: http('https://eth-sepolia.g.alchemy.com/v2/Ln0Aa5Ea0iyVV0mh6RpyT'),
    [80002]: http('https://rpc-amoy.polygon.technology'),
    [421614]: http('https://sepolia-rollup.arbitrum.io/rpc'),
    [11155420]: http('https://sepolia.optimism.io'),
    [43113]: http('https://api.avax-test.network/ext/bc/C/rpc'),
    [97]: http('https://data-seed-prebsc-1-s1.binance.org:8545'),
    [84532]: http('https://sepolia.base.org'),
  },
})