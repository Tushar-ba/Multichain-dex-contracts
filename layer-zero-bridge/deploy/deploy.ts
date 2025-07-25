import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deployFunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, run } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    // LayerZero V2 Endpoint addresses for Arbitrum and Avalanche testnets
    const lzEndpoints: { [key: string]: string } = {
        'arbitrum-sepolia-testnet': '0x6EDCE65403992e310A62460808c4b910D972f10f',
        'avalanche-fuji-testnet': '0x6EDCE65403992e310A62460808c4b910D972f10f',
    };

    // PayfundsRouter02 addresses for Arbitrum and Avalanche
    const dexRouters: { [key: string]: string } = {
        'arbitrum-sepolia-testnet': '0xC5e1362cC4768A10331f77DDe46572f54802e142',
        'avalanche-fuji-testnet': '0x011b561002A1D2522210BA3d687131AB1F6AcF79',
    };

    const lzEndpoint = lzEndpoints[network.name];
    const dexRouter = dexRouters[network.name];

    if (!lzEndpoint) {
        throw new Error(`LayerZero endpoint not configured for network: ${network.name}`);
    }

    if (!dexRouter || dexRouter === '0x0000000000000000000000000000000000000000') {
        throw new Error(`DEX router not configured for network: ${network.name}. Please update the dexRouters mapping.`);
    }

    // Helper function to verify contracts
    const verifyContract = async (contractAddress: string, constructorArguments: any[], contractName: string) => {
        try {
            console.log(`🔍 Verifying ${contractName} at ${contractAddress}...`);
            await run("verify:verify", {
                address: contractAddress,
                constructorArguments: constructorArguments,
            });
            console.log(`✅ ${contractName} verified successfully!`);
        } catch (error: any) {
            if (error.message.toLowerCase().includes("already verified")) {
                console.log(`ℹ️  ${contractName} is already verified`);
            } else {
                console.error(`❌ Error verifying ${contractName}:`, error.message);
                console.log(`   You can manually verify later with:`);
                console.log(`   npx hardhat verify --network ${network.name} ${contractAddress} ${constructorArguments.map(arg => `"${arg}"`).join(' ')}`);
            }
        }
    };
    
    // FORCE DEPLOY: Always deploy new CustomStablecoinOFT
    const timestamp = Date.now().toString();
    const stablecoinOFTArgs = [
        'Payfunds USD',  // name
        'PFUSD',         // symbol
        lzEndpoint,      // LayerZero endpoint
        deployer         // owner
    ];

    const stablecoinOFT = await deploy('CustomStablecoinOFT', {
        from: deployer,
        args: stablecoinOFTArgs,
        log: true,
        waitConfirmations: 3, // Increased wait time for verification
        // Force new deployment by using unique salt
        deterministicDeployment: false,
        // Alternative: use skipIfAlreadyDeployed: false
        skipIfAlreadyDeployed: false,
    });

    console.log(`✅ CustomStablecoinOFT deployed on ${network.name}:`);
    console.log(`   Address: ${stablecoinOFT.address}`);
    console.log(`   Transaction: ${stablecoinOFT.transactionHash}`);
    console.log('');

    // FORCE DEPLOY: Always deploy new CrossChainRouter
    const crossChainRouterArgs = [
        lzEndpoint,               // LayerZero endpoint
        deployer,                 // owner
        dexRouter,                // PayfundsRouter02 address
        stablecoinOFT.address,    // CustomStablecoinOFT address (use the new one)
    ];

    const crossChainRouter = await deploy('CrossChainRouter', {
        from: deployer,
        args: crossChainRouterArgs,
        log: true,
        waitConfirmations: 3, // Increased wait time for verification
        // Force new deployment
        deterministicDeployment: false,
        skipIfAlreadyDeployed: false,
    });

    console.log(`✅ CrossChainRouter deployed on ${network.name}:`);
    console.log(`   Address: ${crossChainRouter.address}`);
    console.log(`   Transaction: ${crossChainRouter.transactionHash}`);
    console.log('');

    // Verify contracts on block explorers
    console.log('🔍 Starting contract verification...');
    console.log('');

    // Only verify on networks that support verification (exclude local networks)
    const shouldVerify = !['hardhat', 'localhost'].includes(network.name);
    
    if (shouldVerify) {
        // Add a small delay to ensure contracts are indexed
        console.log('⏳ Waiting for contracts to be indexed...');
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds delay

        // Verify CustomStablecoinOFT
        await verifyContract(stablecoinOFT.address, stablecoinOFTArgs, 'CustomStablecoinOFT');
        console.log('');

        // Verify CrossChainRouter
        await verifyContract(crossChainRouter.address, crossChainRouterArgs, 'CrossChainRouter');
        console.log('');
    } else {
        console.log(`ℹ️  Skipping verification on local network: ${network.name}`);
        console.log('');
    }

    // Display helpful information for setting up LayerZero
    console.log(`🔧 Setup Instructions for ${network.name}:`);
    console.log(`   1. Set LayerZero OFT peers between chains`);
    console.log(`   2. Configure trusted remotes for CrossChainRouter`);
    console.log(`   3. Fund CrossChainRouter with native tokens for gas`);
    console.log(`   4. Update task configuration with deployed addresses`);
    console.log('');
    
    console.log(`🎉 Deployment Summary for ${network.name}:`);
    console.log(`   CustomStablecoinOFT: ${stablecoinOFT.address}`);
    console.log(`   CrossChainRouter: ${crossChainRouter.address}`);
    console.log(`   LayerZero Endpoint: ${lzEndpoint}`);
    console.log(`   DEX Router: ${dexRouter}`);
    console.log('');
    
    if (shouldVerify) {
        console.log(`🔗 View verified contracts on block explorer:`);
        const explorerUrls: { [key: string]: string } = {
            'arbitrum-sepolia-testnet': 'https://sepolia.arbiscan.io/address/',
            'avalanche-fuji-testnet': 'https://testnet.snowtrace.io/address/',
        };
        
        const explorerBaseUrl = explorerUrls[network.name];
        if (explorerBaseUrl) {
            console.log(`   CustomStablecoinOFT: ${explorerBaseUrl}${stablecoinOFT.address}`);
            console.log(`   CrossChainRouter: ${explorerBaseUrl}${crossChainRouter.address}`);
        }
        console.log('');
    }
    
    console.log(`📋 Update tasks/task.ts with these addresses:`);
    console.log(`   CustomStablecoinOFT: '${stablecoinOFT.address}',`);
    console.log(`   CrossChainRouter: '${crossChainRouter.address}',`);
    console.log('─'.repeat(80));

    // Save deployment info to a file for easy reference
    const fs = require('fs');
    const deploymentInfo = {
        network: network.name,
        timestamp: new Date().toISOString(),
        contracts: {
            CustomStablecoinOFT: {
                address: stablecoinOFT.address,
                constructorArgs: stablecoinOFTArgs,
                verified: shouldVerify
            },
            CrossChainRouter: {
                address: crossChainRouter.address,
                constructorArgs: crossChainRouterArgs,
                verified: shouldVerify
            },
        },
        config: {
            lzEndpoint,
            dexRouter,
        },
        explorerLinks: shouldVerify ? {
            CustomStablecoinOFT: `${['arbitrum-sepolia-testnet', 'avalanche-fuji-testnet'].includes(network.name) ? {
                'arbitrum-sepolia-testnet': 'https://sepolia.arbiscan.io/address/',
                'avalanche-fuji-testnet': 'https://testnet.snowtrace.io/address/',
            }[network.name] || '' : ''}${stablecoinOFT.address}`,
            CrossChainRouter: `${['arbitrum-sepolia-testnet', 'avalanche-fuji-testnet'].includes(network.name) ? {
                'arbitrum-sepolia-testnet': 'https://sepolia.arbiscan.io/address/',
                'avalanche-fuji-testnet': 'https://testnet.snowtrace.io/address/',
            }[network.name] || '' : ''}${crossChainRouter.address}`
        } : undefined
    };
    
    fs.writeFileSync(
        `deployments-${network.name}-${timestamp}.json`, 
        JSON.stringify(deploymentInfo, null, 2)
    );
    console.log(`📝 Deployment info saved to deployments-${network.name}-${timestamp}.json`);
};

deployFunction.tags = ['CrossChainRouter', 'CustomStablecoinOFT'];

export default deployFunction;