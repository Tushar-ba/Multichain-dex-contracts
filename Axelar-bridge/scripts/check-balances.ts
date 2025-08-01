import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  // Configuration
  const config = {
    "optimism-sepolia": {
      stableCoin: "0x0EBcFE9Fc5817DD541B2EAdc1e8fe92D35bc2470",
      testToken: "0x2258Db39FCdAB899661fBA6a1246Cc7a0F4E9ff0",
      router: "0xA6AAf9c0b2d3b129a9616eF976aF7478e9A13c1E"
    },
    "avalanche-fuji": {
      stableCoin: "0xD76E4041761870CdaceDE467C21Bd417F83C7dC5",
      testToken: "0x1963f6163D9eaFCb1aF6DB7207b21E8aD6548751",
      router: "0xaEbB997bDa00E8509322c3768a2Ba88D0358b67e"
    }
  };

  const currentNetwork = hre.network.name;
  const [user] = await ethers.getSigners();
  
  console.log("💳 BALANCE CHECK");
  console.log("📍 Network:", currentNetwork);
  console.log("👤 Address:", user.address);
  console.log("⛽ Native Balance:", ethers.formatEther(await user.provider.getBalance(user.address)), currentNetwork === "optimism-sepolia" ? "ETH" : "AVAX");

  if (currentNetwork !== "optimism-sepolia" && currentNetwork !== "avalanche-fuji") {
    throw new Error("This script only works on optimism-sepolia or avalanche-fuji networks");
  }

  const currentConfig = config[currentNetwork as keyof typeof config];
  
  // Get contract instances
  const IERC20 = await ethers.getContractFactory("CustomStableCoin");
  const stableCoin = IERC20.attach(currentConfig.stableCoin);
  const testToken = IERC20.attach(currentConfig.testToken);
  const router = IERC20.attach(currentConfig.router);

  console.log("\n🪙 TOKEN BALANCES:");
  
  try {
    // Get token information
    const stableName = await stableCoin.name();
    const stableSymbol = await stableCoin.symbol();
    console.log("💵", stableName, `(${stableSymbol}):`);
    
    const userStableBalance = await stableCoin.balanceOf(user.address);
    const routerStableBalance = await stableCoin.balanceOf(currentConfig.router);
    console.log("   User Balance:", ethers.formatEther(userStableBalance), stableSymbol);
    console.log("   Router Balance:", ethers.formatEther(routerStableBalance), stableSymbol);
    
  } catch (error) {
    console.log("❌ Could not read stable coin info:", error.message);
  }

  try {
    // Get test token information  
    const testName = await testToken.name();
    const testSymbol = await testToken.symbol();
    console.log("🪙", testName, `(${testSymbol}):`);
    
    const userTestBalance = await testToken.balanceOf(user.address);
    const routerTestBalance = await testToken.balanceOf(currentConfig.router);
    console.log("   User Balance:", ethers.formatEther(userTestBalance), testSymbol);
    console.log("   Router Balance:", ethers.formatEther(routerTestBalance), testSymbol);
    
  } catch (error) {
    console.log("❌ Could not read test token info:", error.message);
  }

  console.log("\n🔗 CROSS-CHAIN STATUS:");
  try {
    const FlexibleAxelarRouter = await ethers.getContractFactory("FlexibleAxelarRouter");
    const routerContract = FlexibleAxelarRouter.attach(currentConfig.router);
    
    const remoteChain = currentNetwork === "optimism-sepolia" ? "Avalanche" : "optimism-sepolia";
    const isSupported = await routerContract.isChainSupported(remoteChain);
    console.log("Remote chain supported:", isSupported ? "✅ Yes" : "❌ No");
    
    if (isSupported) {
      console.log("🌉 Cross-chain routing is configured!");
    } else {
      console.log("⚠️ Run setup script to configure cross-chain routing");
    }
    
  } catch (error) {
    console.log("❌ Could not check cross-chain status:", error.message);
  }

  console.log("\n📋 CONTRACT ADDRESSES:");
  console.log("🔀 Router:", currentConfig.router);
  console.log("💵 Stable Coin:", currentConfig.stableCoin);
  console.log("🪙 Test Token:", currentConfig.testToken);

  console.log("\n✅ Balance check completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });