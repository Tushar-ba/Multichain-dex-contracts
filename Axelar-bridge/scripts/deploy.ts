import { ethers } from "hardhat";
import { writeFileSync } from "fs";

async function main() {
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Network configuration
  const networkName = hre.network.name;
  console.log("Deploying to network:", networkName);

  // Axelar Contract Addresses by Network - UPDATED WITH CORRECT ADDRESSES
  const axelarConfig: Record<string, { gateway: string; gasService: string }> = {
    "optimism-sepolia": {
      gateway: "0xe432150cce91c13a887f7D836923d5597adD8E31", // Optimism Sepolia Gateway
      gasService: "0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6" // Optimism Sepolia Gas Service
    },
    "avalanche-fuji": {
      gateway: "0xC249632c2D40b9001FE907806902f63038B737Ab", // Avalanche Fuji Gateway - CORRECTED
      gasService: "0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6" // Avalanche Fuji Gas Service - CORRECTED
    }
  };

  // Get network config
  const config = axelarConfig[networkName];
  if (!config) {
    throw new Error(`Network ${networkName} not supported. Supported networks: ${Object.keys(axelarConfig).join(", ")}`);
  }

  console.log("Using Axelar Gateway:", config.gateway);
  console.log("Using Axelar Gas Service:", config.gasService);

  // Step 1: Deploy Custom Stable Coin
  console.log("\n=== Deploying Custom Stable Coin ===");
  const CustomStableCoin = await ethers.getContractFactory("CustomStableCoin");
  
  const stableCoinArgs: [string, string, number, bigint] = [
    "PayFunds USD", // name
    "PFUSD", // symbol
    18, // decimals
    ethers.parseEther("1000000") // initial supply: 1M tokens
  ];
  
  const stableCoin = await CustomStableCoin.deploy(...stableCoinArgs);
  await stableCoin.waitForDeployment();
  
  const stableCoinAddress = await stableCoin.getAddress();
  console.log("CustomStableCoin deployed to:", stableCoinAddress);
  
  // Wait for a few block confirmations before calling contract methods
  console.log("Waiting for contract confirmation...");
  await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
  
  try {
    const totalSupply = await stableCoin.totalSupply();
    console.log("Initial supply:", ethers.formatEther(totalSupply), "PFUSD");
  } catch (error) {
    console.log("Note: Could not read totalSupply immediately after deployment (this is normal)");
    console.log("Initial supply: 1,000,000 PFUSD (as configured)");
  }

  // Step 2: Deploy DEX Router (placeholder address - you need to provide your actual router)
  // For demo purposes, using a placeholder. Replace with your actual PayfundsRouter02 address
  const dexRouterAddress = process.env.DEX_ROUTER_ADDRESS || "0x011b561002A1D2522210BA3d687131AB1F6AcF79";
  
  if (dexRouterAddress === "0x0000000000000000000000000000000000000000") {
    console.log("\n⚠️  WARNING: DEX_ROUTER_ADDRESS not set in environment variables!");
    console.log("Please set DEX_ROUTER_ADDRESS to your PayfundsRouter02 contract address");
    console.log("For now, using placeholder address. Contract will not work until this is updated.");
  }

  // Step 3: Deploy FlexibleAxelarRouter
  console.log("\n=== Deploying FlexibleAxelarRouter ===");
  const FlexibleAxelarRouter = await ethers.getContractFactory("FlexibleAxelarRouter");
  
  const routerArgs: [string, string, string, string, string] = [
    config.gateway, // Axelar Gateway
    config.gasService, // Axelar Gas Service
    dexRouterAddress, // DEX Router (PayfundsRouter02)
    stableCoinAddress, // Bridge Token (our custom stable coin)
    "PFUSD" // Bridge Token Symbol
  ];
  
  const axelarRouter = await FlexibleAxelarRouter.deploy(...routerArgs);
  await axelarRouter.waitForDeployment();
  
  const axelarRouterAddress = await axelarRouter.getAddress();
  console.log("FlexibleAxelarRouter deployed to:", axelarRouterAddress);

  // Step 4: Initial Setup
  console.log("\n=== Initial Setup ===");
  
  // Wait a bit more before calling contract methods
  console.log("Waiting for contracts to be fully confirmed...");
  await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 more seconds
  
  try {
    // Mint some tokens to the router for testing
    const mintAmount = ethers.parseEther("10000"); // 10k tokens
    const mintTx1 = await stableCoin.mint(axelarRouterAddress, mintAmount);
    await mintTx1.wait();
    console.log("Minted", ethers.formatEther(mintAmount), "PFUSD to router");
    
    // Mint some tokens to deployer for testing
    const mintTx2 = await stableCoin.mint(deployer.address, mintAmount);
    await mintTx2.wait();
    console.log("Minted", ethers.formatEther(mintAmount), "PFUSD to deployer");
  } catch (error) {
    console.log("Note: Could not mint tokens immediately after deployment");
    console.log("You can mint tokens later using the mint() function");
    console.log("Error:", error.message);
  }

  // Step 5: Verification Info
  console.log("\n=== Contract Verification Commands ===");
  console.log("To verify CustomStableCoin:");
  console.log(`npx hardhat verify --network ${networkName} ${stableCoinAddress} "${stableCoinArgs[0]}" "${stableCoinArgs[1]}" ${stableCoinArgs[2]} "${stableCoinArgs[3]}"`);
  
  console.log("\nTo verify FlexibleAxelarRouter:");
  console.log(`npx hardhat verify --network ${networkName} ${axelarRouterAddress} "${routerArgs[0]}" "${routerArgs[1]}" "${routerArgs[2]}" "${routerArgs[3]}" "${routerArgs[4]}"`);

  // Step 6: Deployment Summary
  console.log("\n=== Deployment Summary ===");
  console.log("Network:", networkName);
  console.log("Deployer:", deployer.address);
  console.log("CustomStableCoin:", stableCoinAddress);
  console.log("FlexibleAxelarRouter:", axelarRouterAddress);
  console.log("Axelar Gateway:", config.gateway);
  console.log("Axelar Gas Service:", config.gasService);
  console.log("DEX Router:", dexRouterAddress);
  
  // Step 7: Next Steps
  console.log("\n=== Next Steps ===");
  console.log("1. Deploy this same setup on the other chain (Base Sepolia/Fuji)");
  console.log("2. Set remote router addresses on both chains using setRemoteRouter()");
  console.log("3. Add liquidity for PFUSD on your DEX on both chains");
  console.log("4. Test cross-chain swaps");
  
  if (dexRouterAddress === "0x0000000000000000000000000000000000000000") {
    console.log("\n⚠️  IMPORTANT: Update DEX_ROUTER_ADDRESS environment variable with your actual router address!");
  }

  // Save deployment info to file
  const deploymentInfo = {
    network: networkName,
    deployer: deployer.address,
    contracts: {
      customStableCoin: stableCoinAddress,
      flexibleAxelarRouter: axelarRouterAddress
    },
    axelar: {
      gateway: config.gateway,
      gasService: config.gasService
    },
    dexRouter: dexRouterAddress,
    timestamp: new Date().toISOString()
  };

  const deploymentFile = `deployments-${networkName}.json`;
  writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to ${deploymentFile}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });