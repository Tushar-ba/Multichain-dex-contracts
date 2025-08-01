import { ethers } from "hardhat";
import { readFileSync } from "fs";
import hre from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;
  
  console.log("Running post-deployment setup on:", networkName);
  console.log("Using account:", deployer.address);

  // Read deployment info
  const deploymentFile = `deployments-${networkName}.json`;
  let deploymentInfo;
  
  try {
    const data = readFileSync(deploymentFile, 'utf8');
    deploymentInfo = JSON.parse(data);
  } catch (error) {
    console.error("Could not read deployment file:", deploymentFile);
    console.error("Please run the deployment script first");
    process.exit(1);
  }

  console.log("Stable coin address:", deploymentInfo.contracts.customStableCoin);
  console.log("Router address:", deploymentInfo.contracts.flexibleAxelarRouter);

  // Get contract instances
  const CustomStableCoin = await ethers.getContractFactory("CustomStableCoin");
  const stableCoin = CustomStableCoin.attach(deploymentInfo.contracts.customStableCoin);

  const FlexibleAxelarRouter = await ethers.getContractFactory("FlexibleAxelarRouter");
  const router = FlexibleAxelarRouter.attach(deploymentInfo.contracts.flexibleAxelarRouter);

  console.log("\n=== Contract Information ===");
  
  try {
    const totalSupply = await stableCoin.totalSupply();
    const symbol = await stableCoin.symbol();
    const name = await stableCoin.name();
    const decimals = await stableCoin.decimals();
    
    console.log("Token name:", name);
    console.log("Token symbol:", symbol);
    console.log("Token decimals:", decimals);
    console.log("Total supply:", ethers.formatEther(totalSupply), symbol);
    
    const deployerBalance = await stableCoin.balanceOf(deployer.address);
    const routerBalance = await stableCoin.balanceOf(deploymentInfo.contracts.flexibleAxelarRouter);
    
    console.log("Deployer balance:", ethers.formatEther(deployerBalance), symbol);
    console.log("Router balance:", ethers.formatEther(routerBalance), symbol);
  } catch (error) {
    console.log("Could not read token information:", error.message);
  }

  try {
    const bridgeToken = await router.bridgeToken();
    const bridgeSymbol = await router.bridgeTokenSymbol();
    const defaultSlippage = await router.defaultSlippage();
    
    console.log("Bridge token:", bridgeToken);
    console.log("Bridge symbol:", bridgeSymbol);
    console.log("Default slippage:", defaultSlippage.toString(), "basis points");
  } catch (error) {
    console.log("Could not read router information:", error.message);
  }

  // Mint tokens if balances are zero
  console.log("\n=== Minting Initial Tokens ===");
  
  try {
    const deployerBalance = await stableCoin.balanceOf(deployer.address);
    const routerBalance = await stableCoin.balanceOf(deploymentInfo.contracts.flexibleAxelarRouter);
    
    const mintAmount = ethers.parseEther("10000");
    
    if (deployerBalance === 0n) {
      console.log("Minting tokens to deployer...");
      const tx1 = await stableCoin.mint(deployer.address, mintAmount);
      await tx1.wait();
      console.log("✅ Minted", ethers.formatEther(mintAmount), "PFUSD to deployer");
    } else {
      console.log("Deployer already has tokens:", ethers.formatEther(deployerBalance), "PFUSD");
    }
    
    if (routerBalance === 0n) {
      console.log("Minting tokens to router...");
      const tx2 = await stableCoin.mint(deploymentInfo.contracts.flexibleAxelarRouter, mintAmount);
      await tx2.wait();
      console.log("✅ Minted", ethers.formatEther(mintAmount), "PFUSD to router");
    } else {
      console.log("Router already has tokens:", ethers.formatEther(routerBalance), "PFUSD");
    }
  } catch (error) {
    console.log("Error minting tokens:", error.message);
  }

  console.log("\n✅ Post-deployment setup completed!");
  console.log("\n📋 Next steps:");
  console.log("1. Deploy on the other chain");
  console.log("2. Run setup script to configure cross-chain routing");
  console.log("3. Add liquidity to your DEX");
  console.log("4. Test cross-chain swaps");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });