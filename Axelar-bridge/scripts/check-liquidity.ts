import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  const currentNetwork = hre.network.name;
  const [user] = await ethers.getSigners();

  console.log("🔍 LIQUIDITY CHECK");
  console.log("📍 Network:", currentNetwork);
  console.log("👤 Address:", user.address);

  const config = {
    "optimism-sepolia": {
      router: "0xA6AAf9c0b2d3b129a9616eF976aF7478e9A13c1E",
      stableCoin: "0x0EBcFE9Fc5817DD541B2EAdc1e8fe92D35bc2470",
      testToken: "0x2258Db39FCdAB899661fBA6a1246Cc7a0F4E9ff0",
      dexRouter: "0x3DfCfA2730f768cf4cf931f4896109ffa9c3e202"
    },
    "avalanche-fuji": {
      router: "0xaEbB997bDa00E8509322c3768a2Ba88D0358b67e",
      stableCoin: "0xD76E4041761870CdaceDE467C21Bd417F83C7dC5",
      testToken: "0x1963f6163D9eaFCb1aF6DB7207b21E8aD6548751",
      dexRouter: "0x011b561002A1D2522210BA3d687131AB1F6AcF79"
    }
  };

  if (currentNetwork !== "avalanche-fuji" && currentNetwork !== "optimism-sepolia") {
    throw new Error("This script only works on avalanche-fuji or optimism-sepolia networks");
  }

  const currentConfig = config[currentNetwork as keyof typeof config];
  
  // Get contract instances
  const FlexibleAxelarRouter = await ethers.getContractFactory("FlexibleAxelarRouter");
  const axelarRouter = FlexibleAxelarRouter.attach(currentConfig.router);

  // Simple router interface for checking quotes
  const routerABI = [
    "function getAmountsOut(uint amountIn, address[] memory path) external view returns (uint[] memory amounts)"
  ];
  const dexRouter = new ethers.Contract(currentConfig.dexRouter, routerABI, user);

  console.log("\n📋 CONTRACT INFO:");
  console.log("Axelar Router:", currentConfig.router);
  console.log("DEX Router:", currentConfig.dexRouter);
  console.log("Stable Coin:", currentConfig.stableCoin);
  console.log("Test Token:", currentConfig.testToken);

  // Test amount for checking liquidity
  const testAmount = ethers.parseEther("100");

  console.log("\n🔍 CHECKING DEX LIQUIDITY:");
  console.log("Test Amount:", ethers.formatEther(testAmount), "tokens");

  // Check if we can get a quote from TestToken -> StableCoin
  console.log("\n1️⃣ Testing: TestToken → PFUSD");
  try {
    const path1 = [currentConfig.testToken, currentConfig.stableCoin];
    const amounts1 = await dexRouter.getAmountsOut(testAmount, path1);
    console.log("✅ Liquidity exists!");
    console.log("   Input:", ethers.formatEther(amounts1[0]), "TestToken");
    console.log("   Output:", ethers.formatEther(amounts1[1]), "PFUSD");
    console.log("   Exchange Rate:", (Number(ethers.formatEther(amounts1[1])) / Number(ethers.formatEther(amounts1[0]))).toFixed(4));
  } catch (error) {
    console.log("❌ No liquidity or insufficient reserves");
    console.log("   Error:", error.message);
  }

  // Check if we can get a quote from StableCoin -> TestToken
  console.log("\n2️⃣ Testing: PFUSD → TestToken");
  try {
    const path2 = [currentConfig.stableCoin, currentConfig.testToken];
    const amounts2 = await dexRouter.getAmountsOut(testAmount, path2);
    console.log("✅ Liquidity exists!");
    console.log("   Input:", ethers.formatEther(amounts2[0]), "PFUSD");
    console.log("   Output:", ethers.formatEther(amounts2[1]), "TestToken");
    console.log("   Exchange Rate:", (Number(ethers.formatEther(amounts2[1])) / Number(ethers.formatEther(amounts2[0]))).toFixed(4));
  } catch (error) {
    console.log("❌ No liquidity or insufficient reserves");
    console.log("   Error:", error.message);
  }

  // Test Axelar router quote function
  console.log("\n3️⃣ Testing: Axelar Router Quote");
  try {
    const destinationToken = currentNetwork === "avalanche-fuji" ? "0x2258Db39FCdAB899661fBA6a1246Cc7a0F4E9ff0" : "0x1963f6163D9eaFCb1aF6DB7207b21E8aD6548751";
    const [bridgeAmount, estimatedOutput] = await axelarRouter.getSwapQuote(
      currentConfig.testToken,
      destinationToken,
      testAmount
    );
    console.log("✅ Cross-chain quote successful!");
    console.log("   Bridge Amount:", ethers.formatEther(bridgeAmount), "PFUSD");
    console.log("   Estimated Output:", ethers.formatEther(estimatedOutput), "destination tokens");
  } catch (error) {
    console.log("❌ Cross-chain quote failed");
    console.log("   Error:", error.message);
  }

  console.log("\n💡 RECOMMENDATIONS:");
  console.log("If you see ❌ errors above, you need to:");
  console.log("1. 🏊 Add liquidity to your DEX for TestToken/PFUSD pair");
  console.log("2. 📊 Ensure both tokens have sufficient reserves");
  console.log("3. 🔄 Make sure the DEX router address is correct");
  console.log("4. ✅ Test with smaller amounts first");

  if (currentNetwork === "avalanche-fuji") {
    console.log("\n🔗 For Avalanche Fuji:");
    console.log("   Add liquidity: DOGE/PFUSD pair");
    console.log("   Ratio: 2000:2000 (as you mentioned)");
  } else {
    console.log("\n🔗 For Optimism Sepolia:");
    console.log("   Add liquidity: TestToken/PFUSD pair");  
    console.log("   Ratio: 2000:2000 (as you mentioned)");
  }

  console.log("\n✅ Liquidity check completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });