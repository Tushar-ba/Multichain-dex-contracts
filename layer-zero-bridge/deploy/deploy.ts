import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deployFunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    // LayerZero V2 Endpoint addresses for testnets
    const lzEndpoints: { [key: string]: string } = {
        'ethereum-sepolia': '0x6EDCE65403992e310A62460808c4b910D972f10f',
        'arbitrum-sepolia-testnet': '0x6EDCE65403992e310A62460808c4b910D972f10f',
        'optimism-sepolia-testnet': '0x6EDCE65403992e310A62460808c4b910D972f10f',
        'avalanche-fuji-testnet': '0x6EDCE65403992e310A62460808c4b910D972f10f',
        'bsc-testnet': '0x6EDCE65403992e310A62460808c4b910D972f10f',
        'base-sepolia': '0x6EDCE65403992e310A62460808c4b910D972f10f',
        'polygon-amoy': '0x6EDCE65403992e310A62460808c4b910D972f10f',
    };

    // PayfundsRouter02 addresses (replace with actual deployed addresses)
    const dexRouters: { [key: string]: string } = {
        'ethereum-sepolia': '0xC235d41016435B1034aeC94f9de17a78d9dA7028', // Replace with actual
        'arbitrum-sepolia-testnet': '0xA9a558fB3269F307eE57270b41fcBaFFC56d5290', // Replace with actual
        'optimism-sepolia-testnet': '0x3DfCfA2730f768cf4cf931f4896109ffa9c3e202', // Replace with actual
        'avalanche-fuji-testnet': '0x011b561002A1D2522210BA3d687131AB1F6AcF79', // Replace with actual
        'bsc-testnet': '0x78069aF1280A73D240cCDF16Ab4a483555246665', // Replace with actual
        'base-sepolia': '0xC3b415C823366DC2222d979b0a17ce9C72A4feEB', // Replace with actual
        'polygon-amoy': '0xa5812cE58B6Cb897b9B02ED1bAA1f9AC01D4F67e', // Replace with actual
        'holesky': '0x1F2Ea7012Be2Fb0Ba2ce8B7B2A1ab3357Ab2315d', // Replace with actual
    };

    const lzEndpoint = lzEndpoints[network.name];
    const dexRouter = dexRouters[network.name];

    if (!lzEndpoint) {
        throw new Error(`LayerZero endpoint not configured for network: ${network.name}`);
    }

    if (!dexRouter || dexRouter === '0x0000000000000000000000000000000000000000') {
        throw new Error(`DEX router not configured for network: ${network.name}. Please update the dexRouters mapping.`);
    }
    
    // Deploy CustomStablecoinOFT first - using standard OFT constructor
    const stablecoinOFT = await deploy('CustomStablecoinOFT', {
        from: deployer,
        args: [
            'Payfunds USD',  // name
            'PFUSD',         // symbol
            lzEndpoint,      // LayerZero endpoint
            deployer         // owner
        ],
        log: true,
        waitConfirmations: 1,
    });

    console.log(`✅ CustomStablecoinOFT deployed on ${network.name}:`);
    console.log(`   Address: ${stablecoinOFT.address}`);
    console.log(`   Transaction: ${stablecoinOFT.transactionHash}`);
    console.log('');

    // Deploy CrossChainRouter
    const crossChainRouter = await deploy('CrossChainRouter', {
        from: deployer,
        args: [
            lzEndpoint,
            deployer,
            dexRouter,
            stablecoinOFT.address,
        ],
        log: true,
        waitConfirmations: 1,
    });

    console.log(`✅ CrossChainRouter deployed on ${network.name}:`);
    console.log(`   Address: ${crossChainRouter.address}`);
    console.log(`   Transaction: ${crossChainRouter.transactionHash}`);
    console.log('');
    
    console.log(`🎉 Deployment Summary for ${network.name}:`);
    console.log(`   CustomStablecoinOFT: ${stablecoinOFT.address}`);
    console.log(`   CrossChainRouter: ${crossChainRouter.address}`);
    console.log(`   LayerZero Endpoint: ${lzEndpoint}`);
    console.log(`   DEX Router: ${dexRouter}`);
    console.log('─'.repeat(80));
};

deployFunction.tags = ['CrossChainRouter', 'CustomStablecoinOFT'];

export default deployFunction;
