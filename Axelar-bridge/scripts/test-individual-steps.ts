import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  const [user] = await ethers.getSigners();
  console.log("🧪 TESTING INDIVIDUAL SWAP STEPS");

  // Contract addresses
  const routerAddress = "0xa9d663860157B2bACB6849aed2f4b71329410D10";
  const testTokenAddress = "0x1963f6163D9eaFCb1aF6DB7207b21E8aD6548751";
  const stableCoinAddress = "0x0F6eC6D1A81915ba6538b129b2E3a6E46b1c501f";
  const dexRouterAddress = "0x011b561002A1D2522210BA3d687131AB1F6AcF79";


  // Test amount
  const testAmount = ethers.parseEther("10");

  // Contract instances
  const IERC20 = await ethers.getContractFactory("CustomStableCoin");
  const testToken = IERC20.attach(testTokenAddress);
  const stableCoin = IERC20.attach(stableCoinAddress);

  // DEX Router interface
  const dexRouterABI = [
    "function getAmountsOut(uint amountIn, address[] memory path) external view returns (uint[] memory amounts)",
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)"
  ];
  const dexRouter = new ethers.Contract(dexRouterAddress, dexRouterABI, user);

  console.log("\n1️⃣ TESTING DIRECT DEX SWAP (TestToken → PFUSD)");
  
  try {
    // Check DEX quote first
    const path = [testTokenAddress, stableCoinAddress];
    const amounts = await dexRouter.getAmountsOut(testAmount, path);
    console.log("✅ DEX Quote successful:");
    console.log("   Input:", ethers.formatEther(amounts[0]), "DOGE");
    console.log("   Output:", ethers.formatEther(amounts[1]), "PFUSD");
    
    const minAmountOut = amounts[1] * 97n / 100n; // 3% slippage
    console.log("   Min Output (3% slippage):", ethers.formatEther(minAmountOut), "PFUSD");

    // Check if we have enough allowance for DEX router
    const dexAllowance = await testToken.allowance(user.address, dexRouterAddress);
    console.log("   DEX Allowance:", ethers.formatEther(dexAllowance));

    if (dexAllowance < testAmount) {
      console.log("📝 Approving DEX router...");
      const approveTx = await testToken.approve(dexRouterAddress, testAmount);
      await approveTx.wait();
      console.log("✅ DEX approval successful");
    }

    // Try the actual DEX swap
    console.log("🔄 Testing direct DEX swap...");
    const deadline = Math.floor(Date.now() / 1000) + 300;
    
    // Get initial balances
    const initialTestBalance = await testToken.balanceOf(user.address);
    const initialStableBalance = await stableCoin.balanceOf(user.address);
    
    console.log("Pre-swap balances:");
    console.log("   DOGE:", ethers.formatEther(initialTestBalance));
    console.log("   PFUSD:", ethers.formatEther(initialStableBalance));

    // Execute DEX swap
    const swapTx = await dexRouter.swapExactTokensForTokens(
      testAmount,
      minAmountOut,
      path,
      user.address,
      deadline
    );
    
    const receipt = await swapTx.wait();
    console.log("✅ Direct DEX swap successful!");
    console.log("   Transaction:", swapTx.hash);
    console.log("   Gas used:", receipt.gasUsed.toString());

    // Check new balances
    const finalTestBalance = await testToken.balanceOf(user.address);
    const finalStableBalance = await stableCoin.balanceOf(user.address);
    
    console.log("Post-swap balances:");
    console.log("   DOGE:", ethers.formatEther(finalTestBalance));
    console.log("   PFUSD:", ethers.formatEther(finalStableBalance));
    console.log("   Received:", ethers.formatEther(finalStableBalance - initialStableBalance), "PFUSD");

  } catch (error) {
    console.log("❌ Direct DEX swap failed!");
    console.log("Error:", error.message);
    console.log("\n💡 This means the issue is with the DEX interaction");
    console.log("Possible causes:");
    console.log("1. DEX router address is wrong");
    console.log("2. Token pair doesn't exist on DEX");
    console.log("3. Insufficient liquidity reserves");
    console.log("4. Token contract compatibility issues");
    return;
  }

  console.log("\n2️⃣ TESTING AXELAR ROUTER'S DEX INTERACTION");
  
  // Now test if the Axelar router can do the same swap
  const FlexibleAxelarRouter = await ethers.getContractFactory("FlexibleAxelarRouter");
  const axelarRouter = FlexibleAxelarRouter.attach(routerAddress);

  try {
    // Check if Axelar router has the right DEX router address
    const axelarDexRouter = await axelarRouter.dexRouter();
    console.log("✅ Axelar router's DEX router:", axelarDexRouter);
    
    if (axelarDexRouter.toLowerCase() !== dexRouterAddress.toLowerCase()) {
      console.log("❌ CRITICAL: DEX router address mismatch!");
      console.log("   Expected:", dexRouterAddress);
      console.log("   Actual:", axelarDexRouter);
      console.log("💡 The Axelar router is pointing to the wrong DEX router!");
      return;
    }

  } catch (error) {
    console.log("❌ Failed to read Axelar router's DEX router:", error.message);
    return;
  }

  console.log("\n3️⃣ TESTING AXELAR GAS SERVICE");
  
  try {
    const gasServiceAddress = await axelarRouter.gasService();
    console.log("✅ Gas service address:", gasServiceAddress);
    
    // Check if gas service is valid (not zero address)
    if (gasServiceAddress === "0x0000000000000000000000000000000000000000") {
      console.log("❌ CRITICAL: Gas service not set!");
      return;
    }

  } catch (error) {
    console.log("❌ Failed to read gas service:", error.message);
    return;
  }

  console.log("\n4️⃣ TESTING GATEWAY ADDRESS");
  
  try {
    const gatewayAddress = await axelarRouter.gatewayAddress();
    console.log("✅ Gateway address:", gatewayAddress);
    
    if (gatewayAddress === "0x0000000000000000000000000000000000000000") {
      console.log("❌ CRITICAL: Gateway not set!");
      return;
    }

  } catch (error) {
    console.log("❌ Failed to read gateway address:", error.message);
    return;
  }

  console.log("\n✅ DIAGNOSIS COMPLETE");
  console.log("If the direct DEX swap worked but the Axelar router fails,");
  console.log("the issue is likely in the cross-chain logic or gas estimation.");
  console.log("\n🔧 Next steps:");
  console.log("1. The DEX integration is working correctly");
  console.log("2. All addresses are configured properly");
  console.log("3. The issue might be in Axelar-specific logic");
  console.log("4. Try reducing the cross-chain gas amount");
  console.log("5. Check if the destination chain's router is properly deployed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });