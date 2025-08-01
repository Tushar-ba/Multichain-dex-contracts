import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  // Configuration - Updated with your deployed contract addresses
  const config = {
    "optimism-sepolia": {
      router: "0xA6AAf9c0b2d3b129a9616eF976aF7478e9A13c1E", // Will be updated after deployment
      chainName: "optimism-sepolia" // Axelar chain identifier for Optimism Sepolia
    },
    "avalanche-fuji": {
      router: "0xa9d663860157B2bACB6849aed2f4b71329410D10", 
      chainName: "Avalanche" // Axelar chain identifier for Fuji
    }
  };

  const currentNetwork = hre.network.name;
  console.log("Setting up cross-chain routing on:", currentNetwork);

  // Get the contract instance
  let routerAddress: string;
  let remoteChain: string;
  let remoteRouter: string;

  if (currentNetwork === "optimism-sepolia") {
    routerAddress = config["optimism-sepolia"].router;
    remoteChain = config["avalanche-fuji"].chainName;
    remoteRouter = config["avalanche-fuji"].router;
  } else if (currentNetwork === "avalanche-fuji") {
    routerAddress = config["avalanche-fuji"].router;
    remoteChain = config["optimism-sepolia"].chainName;
    remoteRouter = config["optimism-sepolia"].router;
  } else {
    throw new Error("Unsupported network. Use 'optimism-sepolia' or 'avalanche-fuji'");
  }

  // Get contract instance
  const FlexibleAxelarRouter = await ethers.getContractFactory("FlexibleAxelarRouter");
  const router = FlexibleAxelarRouter.attach(routerAddress);

  console.log("Router contract:", routerAddress);
  console.log("Setting remote chain:", remoteChain);
  console.log("Remote router address:", remoteRouter);

  // Set remote router
  console.log("\nSetting remote router...");
  const tx = await router.setRemoteRouter(remoteChain, remoteRouter);
  await tx.wait();
  
  console.log("Transaction hash:", tx.hash);
  console.log("✅ Remote router set successfully!");

  // Verify the setup
  console.log("\nVerifying setup...");
  const isSupported = await router.isChainSupported(remoteChain);
  console.log("Is remote chain supported:", isSupported);

  const bridgeToken = await router.bridgeToken();
  const bridgeSymbol = await router.bridgeTokenSymbol();
  console.log("Bridge token:", bridgeToken);
  console.log("Bridge symbol:", bridgeSymbol);

  console.log("\n✅ Setup completed successfully!");
  console.log("\n📋 Next steps:");
  console.log("1. Run this setup script on the other chain");
  console.log("2. Add liquidity for your bridge token (PFUSD) on both DEXs");
  console.log("3. Test cross-chain swaps");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });