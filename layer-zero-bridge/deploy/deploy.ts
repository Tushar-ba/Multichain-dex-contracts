import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import * as fs from 'fs';
import * as path from 'path';

const deployFunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, run } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    // Chain ID mapping
    const chainIds: { [key: string]: number } = {
        'holesky': 17000,
        'avalanche-fuji-testnet': 43113,
        'arbitrum-sepolia-testnet': 421614,
        'optimism-sepolia-testnet': 11155420,
        'ethereum-sepolia': 11155111,
        'bsc-testnet': 97,
        'base-sepolia': 84532,
        'polygon-amoy': 80002,
    };

    // Network display names
    const networkNames: { [key: string]: string } = {
        'holesky': 'Ethereum Holesky Testnet',
        'avalanche-fuji-testnet': 'Avalanche Fuji Testnet',
        'arbitrum-sepolia-testnet': 'Arbitrum Sepolia Testnet',
        'optimism-sepolia-testnet': 'Optimism Sepolia Testnet',
        'ethereum-sepolia': 'Ethereum Sepolia Testnet',
        'bsc-testnet': 'BSC Testnet',
        'base-sepolia': 'Base Sepolia Testnet',
        'polygon-amoy': 'Polygon Amoy Testnet',
    };

    // LayerZero V2 Endpoint addresses
    const lzEndpoints: { [key: string]: string } = {
        'holesky': '0x6EDCE65403992e310A62460808c4b910D972f10f',
        'avalanche-fuji-testnet': '0x6EDCE65403992e310A62460808c4b910D972f10f',
        'arbitrum-sepolia-testnet': '0x6EDCE65403992e310A62460808c4b910D972f10f',
        'optimism-sepolia-testnet': '0x6EDCE65403992e310A62460808c4b910D972f10f',
        'ethereum-sepolia': '0x6EDCE65403992e310A62460808c4b910D972f10f',
        'bsc-testnet': '0x6EDCE65403992e310A62460808c4b910D972f10f',
        'base-sepolia': '0x6EDCE65403992e310A62460808c4b910D972f10f',
        'polygon-amoy': '0x6EDCE65403992e310A62460808c4b910D972f10f',
    };

    // DEX Router addresses from your CONTRACT_ADDRESSES
    const dexRouters: { [key: string]: string } = {
        'holesky': '0x1F2Ea7012Be2Fb0Ba2ce8B7B2A1ab3357Ab2315d',
        'avalanche-fuji-testnet': '0x011b561002A1D2522210BA3d687131AB1F6AcF79',
        'arbitrum-sepolia-testnet': '0xC5e1362cC4768A10331f77DDe46572f54802e142',
        'optimism-sepolia-testnet': '0x3DfCfA2730f768cf4cf931f4896109ffa9c3e202',
        'ethereum-sepolia': '0xC235d41016435B1034aeC94f9de17a78d9dA7028',
        'bsc-testnet': '0x78069aF1280A73D240cCDF16Ab4a483555246665',
        'base-sepolia': '0xC3b415C823366DC2222d979b0a17ce9C72A4feEB',
        'polygon-amoy': '0xa5812cE58B6Cb897b9B02ED1bAA1f9AC01D4F67e',
    };

    // Explorer URLs
    const explorerUrls: { [key: string]: string } = {
        'holesky': 'https://holesky.etherscan.io',
        'avalanche-fuji-testnet': 'https://testnet.snowtrace.io',
        'arbitrum-sepolia-testnet': 'https://sepolia.arbiscan.io',
        'optimism-sepolia-testnet': 'https://sepolia-optimism.etherscan.io',
        'ethereum-sepolia': 'https://sepolia.etherscan.io',
        'bsc-testnet': 'https://testnet.bscscan.com',
        'base-sepolia': 'https://sepolia.basescan.org',
        'polygon-amoy': 'https://amoy.polygonscan.com',
    };
    
    const lzEndpoint = lzEndpoints[network.name];
    const dexRouter = dexRouters[network.name];

    if (!lzEndpoint) {
        throw new Error(`LayerZero endpoint not configured for network: ${network.name}`);
    }

    if (!dexRouter || dexRouter === '0x0000000000000000000000000000000000000000') {
        throw new Error(`DEX router not configured for network: ${network.name}`);
    }

    // Helper function to verify contracts
    const verifyContract = async (contractAddress: string, constructorArguments: any[], contractName: string) => {
        try {
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
            }
        }
    };

    // Helper function to update JSON file
    const updateDeploymentJSON = (stablecoinAddress: string, crossChainRouterAddress: string) => {
        const jsonFilePath = path.join(__dirname, '../deployment-addresses.json');
        let deploymentData: any = {
            deployments: {},
            metadata: {
                totalNetworks: 8,
                stablecoinName: "Payfunds USD",
                stablecoinSymbol: "PFUSD",
                layerZeroVersion: "V2",
                lastGlobalUpdate: ""
            }
        };

        // Read existing data if file exists
        if (fs.existsSync(jsonFilePath)) {
            try {
                const existingData = fs.readFileSync(jsonFilePath, 'utf8');
                deploymentData = JSON.parse(existingData);
            } catch (error) {
                console.log('Creating new deployment addresses file...');
            }
        }

        // Update the specific network data
        deploymentData.deployments[network.name] = {
            chainId: chainIds[network.name],
            networkName: networkNames[network.name],
            customStablecoinOFT: stablecoinAddress,
            simpleCrossChainRouter: crossChainRouterAddress,
            layerZeroEndpoint: lzEndpoint,
            dexRouter: dexRouter,
            explorer: explorerUrls[network.name],
            lastUpdated: new Date().toISOString()
        };

        // Update global metadata
        deploymentData.metadata.lastGlobalUpdate = new Date().toISOString();

        // Write to file
        fs.writeFileSync(jsonFilePath, JSON.stringify(deploymentData, null, 2));
        console.log(`📝 Updated deployment addresses in: ${jsonFilePath}`);
    };
    
    // Deploy CustomStablecoinOFT
    const stablecoinOFTArgs = [
        'Payfunds USD',
        'PFUSD',
        lzEndpoint,
        deployer
    ];

    const stablecoinOFT = await deploy('CustomStablecoinOFT', {
        from: deployer,
        args: stablecoinOFTArgs,
        log: true,
        waitConfirmations: 3,
        deterministicDeployment: false,
        skipIfAlreadyDeployed: false,
    });

    // Deploy SimpleCrossChainRouter
    const crossChainRouterArgs = [
        lzEndpoint,
        deployer,
        dexRouter,
        stablecoinOFT.address, // Pass stablecoin address directly
    ];

    const crossChainRouter = await deploy('SimpleCrossChainRouter', {
        from: deployer,
        args: crossChainRouterArgs,
        log: true,
        waitConfirmations: 3,
        deterministicDeployment: false,
        skipIfAlreadyDeployed: false,
    });

    // Update JSON file with deployment addresses
    updateDeploymentJSON(stablecoinOFT.address, crossChainRouter.address);

    // Verify contracts on block explorers
    const shouldVerify = !['hardhat', 'localhost'].includes(network.name);
    
    if (shouldVerify) {
        console.log('\n⏳ Waiting for contracts to be indexed...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        await verifyContract(stablecoinOFT.address, stablecoinOFTArgs, 'CustomStablecoinOFT');
        await verifyContract(crossChainRouter.address, crossChainRouterArgs, 'SimpleCrossChainRouter');
    }

    // Display deployment summary
    console.log(`\n🎉 Deployment Summary for ${networkNames[network.name]} (${network.name}):`);
    console.log(`   Chain ID: ${chainIds[network.name]}`);
    console.log(`   CustomStablecoinOFT: ${stablecoinOFT.address}`);
    console.log(`   SimpleCrossChainRouter: ${crossChainRouter.address}`);
    console.log(`   LayerZero Endpoint: ${lzEndpoint}`);
    console.log(`   DEX Router: ${dexRouter}`);
    
    if (shouldVerify) {
        const explorerBaseUrl = explorerUrls[network.name];
        if (explorerBaseUrl) {
            console.log(`\n🔗 View on ${networkNames[network.name]} Explorer:`);
            console.log(`   CustomStablecoinOFT: ${explorerBaseUrl}/address/${stablecoinOFT.address}`);
            console.log(`   SimpleCrossChainRouter: ${explorerBaseUrl}/address/${crossChainRouter.address}`);
        }
    }

    // JSON formatted output for easy copying
    console.log(`\n📋 JSON Format for ${network.name}:`);
    console.log(JSON.stringify({
        [network.name]: {
            chainId: chainIds[network.name],
            networkName: networkNames[network.name],
            customStablecoinOFT: stablecoinOFT.address,
            simpleCrossChainRouter: crossChainRouter.address,
            layerZeroEndpoint: lzEndpoint,
            dexRouter: dexRouter,
            explorer: explorerUrls[network.name],
            lastUpdated: new Date().toISOString()
        }
    }, null, 2));
};

deployFunction.tags = ['SimpleCrossChainRouter', 'CustomStablecoinOFT'];

export default deployFunction;