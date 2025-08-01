import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  const currentNetwork = hre.network.name;
  const [user] = await ethers.getSigners();
  
  console.log("🔍 DEBUG CONFIGURATION");
  console.log("📍 Network:", currentNetwork);
  console.log("👤 Address:", user.address);

  const config = {
    "optimism-sepolia": {
      router: "0xA6AAf9c0b2d3b129a9616eF976aF7478e9A13c1E",
      chainName: "optimism-sepolia"
    },
    "avalanche-fuji": {
      router: "0xa9d663860157B2bACB6849aed2f4b71329410D10",
      chainName: "Avalanche"
    }
  };

  if (currentNetwork !== "avalanche-fuji" && currentNetwork !== "optimism-sepolia") {
    throw new Error("This script only works on avalanche-fuji or optimism-sepolia networks");
  }

  const currentConfig = config[currentNetwork as keyof typeof config];
  const FlexibleAxelarRouter = await ethers.getContractFactory("FlexibleAxelarRouter");
  const router = FlexibleAxelarRouter.attach(currentConfig.router);

  console.log("\n📋 CURRENT ROUTER CONFIG:");
  console.log("Router Address:", currentConfig.router);
  console.log("Chain Name:", currentConfig.chainName);

  // Check all possible remote chains
  const possibleChains = ["optimism-sepolia", "Avalanche", "avalanche-fuji", "optimism", "op-sepolia"];
  
  console.log("\n🔗 CHECKING REMOTE CHAIN CONFIGURATIONS:");
  for (const chainName of possibleChains) {
    try {
      const isSupported = await router.isChainSupported(chainName);
      console.log(`${chainName}: ${isSupported ? "✅ Supported" : "❌ Not Supported"}`);
      
      if (isSupported) {
        // Try to get the remote router address
        const remoteRouter = await router.remoteRouters(chainName);
        console.log(`  Remote Router: ${remoteRouter || "Not set"}`);
      }
    } catch (error) {
      console.log(`${chainName}: ❌ Error checking`);
    }
  }

  console.log("\n🎯 BRIDGE TOKEN INFO:");
  try {
    const bridgeToken = await router.bridgeToken();
    const bridgeSymbol = await router.bridgeTokenSymbol();
    const defaultSlippage = await router.defaultSlippage();
    
    console.log("Bridge Token:", bridgeToken);
    console.log("Bridge Symbol:", bridgeSymbol);
    console.log("Default Slippage:", defaultSlippage.toString(), "basis points");
  } catch (error) {
    console.log("Error reading bridge token info:", error.message);
  }

  console.log("\n✅ Debug completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });