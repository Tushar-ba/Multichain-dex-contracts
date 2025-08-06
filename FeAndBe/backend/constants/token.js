const tokens = [
    // Sepolia Tokens (Chain ID: 11155111)
    {
        address: '0x0000000000000000000000000000000000000000',
        data: {
            name: 'Ethereum',
            symbol: 'ETH',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/refs/heads/main/Ethereum-Logo-PNG-Free-Image.png',
            decimals: 18,
            chain: "Sepolia",
            chainId: 11155111
        }
    },
    {
        address: '0x12c87dbebe6E943A9fC10dD0EB3B8471f947A6A0',
        data: {
            name: 'USD Coin',
            symbol: 'USDC',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/main/usd-coin-usdc-logo.png',
            decimals: 18,
            chain: "Sepolia",
            chainId: 11155111
        }
    },
    {
        address: '0x9fC5944362D63F6B1E0cab071EE1881b9FBf07DE',
        data: {
            name: 'Maga',
            symbol: 'TRUMP',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/main/tether-usdt-logo.png',
            decimals: 18,
            chain: "Sepolia",
            chainId: 11155111
        }
    },
    {
        address: '0x10F213664D081A777abCb9175E5e7ACCf9d3dB80',
        data: {
            name: 'Wrapped Ether',
            symbol: 'WETH',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/refs/heads/main/Ethereum-Logo-PNG-Free-Image.png',
            decimals: 18,
            chain: "Sepolia",
            chainId: 11155111
        }
    },
    {
        address: '0xDf44b1aA66d28775Ab67349Af1D139c0E145284C',
        data: {
            name: 'Wrapped Solana',
            symbol: 'SOL',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/refs/heads/main/solana.jpg',
            decimals: 18,
            chain: "Sepolia",
            chainId: 11155111
        }
    },
    {
        address: '0x83D03b310A99feD06bE94E80bff49A84e8A69B0d',
        data: {
            name: 'Sui',
            symbol: 'SUI',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/main/sui-sui-logo.png',
            decimals: 18,
            chain: "Sepolia",
            chainId: 11155111
        }
    },
    {
        address: '0x7bfFe546Dae80Ee91651BC152fC7046e8e6b4cf3',
        data: {
            name: 'Dogecoin',
            symbol: 'DOGE',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/main/dogecoin-doge-logo.png',
            decimals: 18,
            chain: "Sepolia",
            chainId: 11155111
        }
    },

    // Polygon Amoy Tokens (Chain ID: 80002)
    {
        address: '0x0000000000000000000000000000000000001010',
        data: {
            name: 'MATIC',
            symbol: 'MATIC',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/refs/heads/main/polygon-matic-logo.png',
            decimals: 18,
            chain: "Polygon Amoy",
            chainId: 80002
        }
    },
    {
        address: '0x53d6df2091A22165d89037926A59F81c0AAD33e0',
        data: {
            name: 'USD Coin',
            symbol: 'USDC',
            uri: 'https://tse2.mm.bing.net/th/id/OIP.x2szykLFcwq3fzNBzpdkpwHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3',
            decimals: 18,
            chain: "Polygon Amoy",
            chainId: 80002
        }
    },
    {
        address: '0xD68fD63DEea890b898AfeCb7A1F4cC28646cC54A',
        data: {
            name: 'Maga',
            symbol: 'TRUMP',
            uri: 'https://images-na.ssl-images-amazon.com/images/I/71zkn4UyOPL.jpg',
            decimals: 18,
            chain: "Polygon Amoy",
            chainId: 80002
        }
    },
    {
        address: '0x6645445399582db7C67645b8AD83Bb8877D71f7d',
        data: {
            name: 'Wrapped Ether',
            symbol: 'WETH',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/refs/heads/main/Ethereum-Logo-PNG-Free-Image.png',
            decimals: 18,
            chain: "Polygon Amoy",
            chainId: 80002
        }
    },
    {
        address: '0x9Bb3FB3A4df28BcF38B967d16F7c06a447f1AE4A',
        data: {
            name: 'Wrapped Solana',
            symbol: 'SOL',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/refs/heads/main/solana.jpg',
            decimals: 18,
            chain: "Polygon Amoy",
            chainId: 80002
        }
    },
    {
        address: '0x3dC326C8123d1129260f88A5D8E6B1FC281f9500',
        data: {
            name: 'Sui',
            symbol: 'SUI',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/main/sui-sui-logo.png',
            decimals: 18,
            chain: "Polygon Amoy",
            chainId: 80002
        }
    },
    {
        address: '0x1204F716E3431c43ABA28AB442766a1700146c09',
        data: {
            name: 'Dogecoin',
            symbol: 'DOGE',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/main/dogecoin-doge-logo.png',
            decimals: 18,
            chain: "Polygon Amoy",
            chainId: 80002
        }
    },

    // Arbitrum Sepolia Tokens (Chain ID: 421614)
    {
        address: '0x0000000000000000000000000000000000000000',
        data: {
            name: 'Ethereum',
            symbol: 'ETH',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/refs/heads/main/Ethereum-Logo-PNG-Free-Image.png',
            decimals: 18,
            chain: "Arbitrum Sepolia",
            chainId: 421614
        }
    },
    {
        address: '0xf4A14d30E9db1fE48068205c4d71b37b73c0Eb02',
        data: {
            name: 'USD Coin',
            symbol: 'USDC',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/main/usd-coin-usdc-logo.png',
            decimals: 18,
            chain: "Arbitrum Sepolia",
            chainId: 421614
        }
    },
    {
        address: '0x861D72B8ef1A015512035a77143b6a7cF0427cf4',
        data: {
            name: 'Maga',
            symbol: 'TRUMP',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/main/tether-usdt-logo.png',
            decimals: 18,
            chain: "Arbitrum Sepolia",
            chainId: 421614
        }
    },
    {
        address: '0x72DD12D8960495F67D8e589282283d2Bc8e0fDB6',
        data: {
            name: 'Wrapped Ether',
            symbol: 'WETH',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/refs/heads/main/Ethereum-Logo-PNG-Free-Image.png',
            decimals: 18,
            chain: "Arbitrum Sepolia",
            chainId: 421614
        }
    },
    {
        address: '0x0db2c54208Df8caa12e62533541a9a9Fd6D48bAF',
        data: {
            name: 'Wrapped Solana',
            symbol: 'SOL',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/refs/heads/main/solana.jpg',
            decimals: 18,
            chain: "Arbitrum Sepolia",
            chainId: 421614
        }
    },
    {
        address: '0xa7c557E76DEcbB3a1D0F4A01b90ed49e2e15905D',
        data: {
            name: 'Sui',
            symbol: 'SUI',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/main/sui-sui-logo.png',
            decimals: 18,
            chain: "Arbitrum Sepolia",
            chainId: 421614
        }
    },
    {
        address: '0x0e6021360bDfb3ccA2e5403062d89600aE280AA9',
        data: {
            name: 'Dogecoin',
            symbol: 'DOGE',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/main/dogecoin-doge-logo.png',
            decimals: 18,
            chain: "Arbitrum Sepolia",
            chainId: 421614
        }
    },

    // BSC Testnet Tokens (Chain ID: 97)
    {
        address: '0x0000000000000000000000000000000000000000',
        data: {
            name: 'BNB',
            symbol: 'BNB',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/refs/heads/main/bnb-bnb-logo.png',
            decimals: 18,
            chain: "BSC Testnet",
            chainId: 97
        }
    },
    {
        address: '0xBB251a43D8e5EAD9a4CAe64E13177268e59b5073',
        data: {
            name: 'USD Coin',
            symbol: 'USDC',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/main/usd-coin-usdc-logo.png',
            decimals: 18,
            chain: "BSC Testnet",
            chainId: 97
        }
    },
    {
        address: '0x48bd778Caa0a04FC93AF8ab87B391Ed40C335C95',
        data: {
            name: 'Maga',
            symbol: 'TRUMP',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/main/tether-usdt-logo.png',
            decimals: 18,
            chain: "BSC Testnet",
            chainId: 97
        }
    },
    {
        address: '0xcEF6B5286eC1d0d2a50d84e2222063424993034D',
        data: {
            name: 'Wrapped Ether',
            symbol: 'WETH',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/refs/heads/main/Ethereum-Logo-PNG-Free-Image.png',
            decimals: 18,
            chain: "BSC Testnet",
            chainId: 97
        }
    },
    {
        address: '0x9EC9E9e2AcF033Cc75EBd055CFd2367Bb4B1c984',
        data: {
            name: 'Wrapped Solana',
            symbol: 'SOL',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/refs/heads/main/solana.jpg',
            decimals: 18,
            chain: "BSC Testnet",
            chainId: 97
        }
    },
    {
        address: '0x87DC2EB8D7D9dE61C8fD6De83eb23331dE133722',
        data: {
            name: 'Sui',
            symbol: 'SUI',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/main/sui-sui-logo.png',
            decimals: 18,
            chain: "BSC Testnet",
            chainId: 97
        }
    },
    {
        address: '0x520275aABA38E1403bb7A700eC697a76FB991427',
        data: {
            name: 'Dogecoin',
            symbol: 'DOGE',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/main/dogecoin-doge-logo.png',
            decimals: 18,
            chain: "BSC Testnet",
            chainId: 97
        }
    },

    // Optimism Sepolia Tokens (Chain ID: 11155420)
    {
        address: '0x0000000000000000000000000000000000000000',
        data: {
            name: 'Ethereum',
            symbol: 'ETH',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/refs/heads/main/Ethereum-Logo-PNG-Free-Image.png',
            decimals: 18,
            chain: "Optimism Sepolia",
            chainId: 11155420
        }
    },
    {
        address: '0xf1bE638a1f4Cdbba0078256E54920b33D4639517',
        data: {
            name: 'USD Coin',
            symbol: 'USDC',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/main/usd-coin-usdc-logo.png',
            decimals: 18,
            chain: "Optimism Sepolia",
            chainId: 11155420
        }
    },
    {
        address: '0x4bEABeB5464fc05C00D3f96a5C7F627ef882d251',
        data: {
            name: 'Maga',
            symbol: 'TRUMP',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/main/tether-usdt-logo.png',
            decimals: 18,
            chain: "Optimism Sepolia",
            chainId: 11155420
        }
    },
    {
        address: '0x3bb24b202F287e025Ef69a2666b6531DcdAA6FEA',
        data: {
            name: 'Wrapped Ether',
            symbol: 'WETH',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/refs/heads/main/Ethereum-Logo-PNG-Free-Image.png',
            decimals: 18,
            chain: "Optimism Sepolia",
            chainId: 11155420
        }
    },
    {
        address: '0xa215ED57831d3Ac18Eb878c8D354536dE89DA223',
        data: {
            name: 'Wrapped Solana',
            symbol: 'SOL',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/refs/heads/main/solana.jpg',
            decimals: 18,
            chain: "Optimism Sepolia",
            chainId: 11155420
        }
    },
    {
        address: '0x42634B27c31dc1235184F32a5D1F086338fB12F0',
        data: {
            name: 'Sui',
            symbol: 'SUI',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/main/sui-sui-logo.png',
            decimals: 18,
            chain: "Optimism Sepolia",
            chainId: 11155420
        }
    },
    {
        address: '0x0D2839961f851a9c655b6A834B3D95547a45d7db',
        data: {
            name: 'Dogecoin',
            symbol: 'DOGE',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/main/dogecoin-doge-logo.png',
            decimals: 18,
            chain: "Optimism Sepolia",
            chainId: 11155420
        }
    },

    // Avalanche Fuji Tokens (Chain ID: 43113)
    {
        address: '0x0000000000000000000000000000000000000000',
        data: {
            name: 'Avalanche',
            symbol: 'AVAX',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/refs/heads/main/avalanche-avax-logo.png',
            decimals: 18,
            chain: "Avalanche Fuji",
            chainId: 43113
        }
    },
    {
        address: '0x6eF270de76beaD742E3f82083b8b0EA2C3E45Bd1',
        data: {
            name: 'USD Coin',
            symbol: 'USDC',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/main/usd-coin-usdc-logo.png',
            decimals: 18,
            chain: "Avalanche Fuji",
            chainId: 43113
        }
    },
    {
        address: '0xC0D63F30c9E187Dd13bdf16b5b1f5d8C0962F410',
        data: {
            name: 'Maga',
            symbol: 'TRUMP',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/main/tether-usdt-logo.png',
            decimals: 18,
            chain: "Avalanche Fuji",
            chainId: 43113
        }
    },
    {
        address: '0xb3cf5594b3F12F8fF3dC2C583b3BF08c3Bf6DD76',
        data: {
            name: 'Wrapped Ether',
            symbol: 'WETH',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/refs/heads/main/Ethereum-Logo-PNG-Free-Image.png',
            decimals: 18,
            chain: "Avalanche Fuji",
            chainId: 43113
        }
    },
    {
        address: '0x17adf641B9192E7655F1A888084C8a6F9124Ec4a',
        data: {
            name: 'Wrapped Solana',
            symbol: 'SOL',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/refs/heads/main/solana.jpg',
            decimals: 18,
            chain: "Avalanche Fuji",
            chainId: 43113
        }
    },
    {
        address: '0x0945087D95713c9a723E54E5EF79f99F83E2aF96',
        data: {
            name: 'Sui',
            symbol: 'SUI',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/main/sui-sui-logo.png',
            decimals: 18,
            chain: "Avalanche Fuji",
            chainId: 43113
        }
    },
    {
        address: '0x5cC933c9DA24e8627AC6EC5f1b173fB3F7248780',
        data: {
            name: 'Dogecoin',
            symbol: 'DOGE',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/main/dogecoin-doge-logo.png',
            decimals: 18,
            chain: "Avalanche Fuji",
            chainId: 43113
        }
    },

    // Base Sepolia Tokens (Chain ID: 84532)
    {
        address: '0x0000000000000000000000000000000000000000',
        data: {
            name: 'Ethereum',
            symbol: 'ETH',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/refs/heads/main/Ethereum-Logo-PNG-Free-Image.png',
            decimals: 18,
            chain: "Base Sepolia",
            chainId: 84532
        }
    },
    {
        address: '0xE2c7296bdB626c037222F79E95BeD80a53EE0ef2',
        data: {
            name: 'USD Coin',
            symbol: 'USDC',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/main/usd-coin-usdc-logo.png',
            decimals: 18,
            chain: "Base Sepolia",
            chainId: 84532
        }
    },
    {
        address: '0x72B7AA21AB64F9C8Fcb5F7d6323466a13e711fCB',
        data: {
            name: 'Maga',
            symbol: 'TRUMP',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/main/tether-usdt-logo.png',
            decimals: 18,
            chain: "Base Sepolia",
            chainId: 84532
        }
    },
    {
        address: '0x28eA7FA998336b6F51024d8e242a27eCE50989D3',
        data: {
            name: 'Wrapped Ether',
            symbol: 'WETH',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/refs/heads/main/Ethereum-Logo-PNG-Free-Image.png',
            decimals: 18,
            chain: "Base Sepolia",
            chainId: 84532
        }
    },
    {
        address: '0x7578006fF48f6fFb0913FEf70Edb2378daDD4de3',
        data: {
            name: 'Wrapped Solana',
            symbol: 'SOL',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/refs/heads/main/solana.jpg',
            decimals: 18,
            chain: "Base Sepolia",
            chainId: 84532
        }
    },
    {
        address: '0xbb5365A4f1E5b7535B3CC8acEDd4095056c42002',
        data: {
            name: 'Sui',
            symbol: 'SUI',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/main/sui-sui-logo.png',
            decimals: 18,
            chain: "Base Sepolia",
            chainId: 84532
        }
    },
    {
        address: '0x976580a38373878d4faA11266d17303eAA2691f5',
        data: {
            name: 'Dogecoin',
            symbol: 'DOGE',
            uri: 'https://raw.githubusercontent.com/Tushar-ba/metadata/main/dogecoin-doge-logo.png',
            decimals: 18,
            chain: "Base Sepolia",
            chainId: 84532
        }
    }
];

module.exports = { tokens };