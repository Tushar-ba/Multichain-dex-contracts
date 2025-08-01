import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deployFunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, run } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    // LayerZero V2 Endpoint addresses
    const lzEndpoints: { [key: string]: string } = {
        'holesky': '0x6EDCE65403992e310A62460808c4b910D972f10f',
        'avalanche-fuji-testnet': '0x6EDCE65403992e310A62460808c4b910D972f10f',
    };

    // PayfundsRouter02 addresses
    const dexRouters: { [key: string]: string } = {
        'holesky': '0x1F2Ea7012Be2Fb0Ba2ce8B7B2A1ab3357Ab2315d',
        'avalanche-fuji-testnet': '0x011b561002A1D2522210BA3d687131AB1F6AcF79',
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

    // Verify contracts on block explorers
    const shouldVerify = !['hardhat', 'localhost'].includes(network.name);
    
    if (shouldVerify) {
        console.log('\n⏳ Waiting for contracts to be indexed...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        await verifyContract(stablecoinOFT.address, stablecoinOFTArgs, 'CustomStablecoinOFT');
        await verifyContract(crossChainRouter.address, crossChainRouterArgs, 'SimpleCrossChainRouter');
    }

    // Display deployment summary
    console.log(`\n🎉 Deployment Summary for ${network.name}:`);
    console.log(`   CustomStablecoinOFT: ${stablecoinOFT.address}`);
    console.log(`   SimpleCrossChainRouter: ${crossChainRouter.address}`);
    console.log(`   LayerZero Endpoint: ${lzEndpoint}`);
    console.log(`   DEX Router: ${dexRouter}`);
    
    if (shouldVerify) {
        const explorerUrls: { [key: string]: string } = {
            'holesky': 'https://holesky.etherscan.io/address/',
            'avalanche-fuji-testnet': 'https://testnet.snowtrace.io/address/',
        };
        
        const explorerBaseUrl = explorerUrls[network.name];
        if (explorerBaseUrl) {
            console.log(`\n🔗 View on block explorer:`);
            console.log(`   CustomStablecoinOFT: ${explorerBaseUrl}${stablecoinOFT.address}`);
            console.log(`   SimpleCrossChainRouter: ${explorerBaseUrl}${crossChainRouter.address}`);
        }
    }
};

deployFunction.tags = ['SimpleCrossChainRouter', 'CustomStablecoinOFT'];

export default deployFunction;