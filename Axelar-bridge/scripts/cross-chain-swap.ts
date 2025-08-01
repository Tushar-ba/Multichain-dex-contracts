import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  // Configuration
  const config = {
    "optimism-sepolia": {
      router: "0xA6AAf9c0b2d3b129a9616eF976aF7478e9A13c1E",
      stableCoin: "0x0EBcFE9Fc5817DD541B2EAdc1e8fe92D35bc2470",
      testToken: "0x2258Db39FCdAB899661fBA6a1246Cc7a0F4E9ff0", // Optimism Sepolia test token
      chainName: "optimism-sepolia"
    },
    "avalanche-fuji": {
      router: "0xa9d663860157B2bACB6849aed2f4b71329410D10",
      stableCoin: "0x0F6eC6D1A81915ba6538b129b2E3a6E46b1c501f",
      testToken: "0x1963f6163D9eaFCb1aF6DB7207b21E8aD6548751", // Avalanche Fuji test token
      chainName: "Avalanche"
    }
  };

  const currentNetwork = hre.network.name;
  console.log("🚀 Starting Cross-Chain Swap Demo");
  console.log("📍 Current Network:", currentNetwork);
  
  if (currentNetwork !== "optimism-sepolia" && currentNetwork !== "avalanche-fuji") {
    throw new Error("This script only works on optimism-sepolia or avalanche-fuji networks");
  }

  const [user] = await ethers.getSigners();
  console.log("👤 User Address:", user.address);
  console.log("💰 User Balance:", ethers.formatEther(await user.provider.getBalance(user.address)), "ETH/AVAX");

  // Get contract instances for current network
  const currentConfig = config[currentNetwork as keyof typeof config];
  const FlexibleAxelarRouter = await ethers.getContractFactory("FlexibleAxelarRouter");
  const router = FlexibleAxelarRouter.attach(currentConfig.router);

  // Get ERC20 contract instances
  const IERC20 = await ethers.getContractFactory("CustomStableCoin"); // Using our stable coin contract for interface
  const sourceToken = IERC20.attach(currentConfig.testToken);
  const stableCoin = IERC20.attach(currentConfig.stableCoin);

  console.log("\n📋 CONTRACT ADDRESSES:");
  console.log("🔀 Router:", currentConfig.router);
  console.log("🪙 Source Token:", currentConfig.testToken);
  console.log("💵 Stable Coin (PFUSD):", currentConfig.stableCoin);

  // Determine destination
  const destinationNetwork = currentNetwork === "optimism-sepolia" ? "avalanche-fuji" : "optimism-sepolia";
  const destinationConfig = config[destinationNetwork as keyof typeof config];
  
  console.log("\n🎯 SWAP CONFIGURATION:");
  console.log("📤 From:", currentNetwork);
  console.log("📥 To:", destinationNetwork);
  console.log("🔄 Source Token → Destination Token");
  console.log("   ", currentConfig.testToken, "→", destinationConfig.testToken);

  // Check user balances before swap
  console.log("\n💳 PRE-SWAP BALANCES:");
  try {
    const sourceTokenBalance = await sourceToken.balanceOf(user.address);
    const stableCoinBalance = await stableCoin.balanceOf(user.address);
    console.log("🪙 Source Token Balance:", ethers.formatEther(sourceTokenBalance));
    console.log("💵 PFUSD Balance:", ethers.formatEther(stableCoinBalance));
  } catch (error) {
    console.log("⚠️ Could not read token balances, continuing anyway...");
  }

  // Swap parameters
  const swapAmount = ethers.parseEther("100"); // 100 tokens
  const minDestAmount = ethers.parseEther("95"); // Expecting at least 95 tokens (5% slippage tolerance)
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  const gasForCrossChain = ethers.parseEther("0.01"); // 0.01 ETH/AVAX for Axelar gas

  console.log("\n⚙️ SWAP PARAMETERS:");
  console.log("💱 Swap Amount:", ethers.formatEther(swapAmount), "tokens");
  console.log("📉 Min Destination Amount:", ethers.formatEther(minDestAmount), "tokens");
  console.log("⏰ Deadline:", new Date(deadline * 1000).toLocaleString());
  console.log("⛽ Cross-chain Gas:", ethers.formatEther(gasForCrossChain), "ETH/AVAX");

  // Check if user has enough source tokens
  try {
    const sourceTokenBalance = await sourceToken.balanceOf(user.address);
    if (sourceTokenBalance < swapAmount) {
      console.log("\n❌ ERROR: Insufficient source token balance!");
      console.log("Required:", ethers.formatEther(swapAmount));
      console.log("Available:", ethers.formatEther(sourceTokenBalance));
      console.log("\n💡 SOLUTION: You need to:");
      console.log("1. Get test tokens from faucet or mint them");
      console.log("2. Make sure you have the test token on", currentNetwork);
      return;
    }
  } catch (error) {
    console.log("⚠️ Could not verify source token balance, proceeding with caution...");
  }

  // Get quote for the swap
  console.log("\n📊 GETTING SWAP QUOTE...");
  try {
    const [bridgeAmount, estimatedOutput] = await router.getSwapQuote(
      currentConfig.testToken,
      destinationConfig.testToken,
      swapAmount
    );
    
    console.log("🔄 Quote Results:");
    console.log("   Bridge Amount (PFUSD):", ethers.formatEther(bridgeAmount));
    console.log("   Estimated Output:", ethers.formatEther(estimatedOutput), "destination tokens");
    console.log("   Exchange Rate:", (Number(ethers.formatEther(estimatedOutput)) / Number(ethers.formatEther(swapAmount))).toFixed(4), "dest/source");
  } catch (error) {
    console.log("⚠️ Could not get quote (might be due to no liquidity):", error.message);
    console.log("Proceeding anyway for demonstration...");
  }

  // Check allowance and approve if needed
  console.log("\n🔐 CHECKING TOKEN ALLOWANCE...");
  try {
    const currentAllowance = await sourceToken.allowance(user.address, currentConfig.router);
    console.log("Current Allowance:", ethers.formatEther(currentAllowance));
    
    if (currentAllowance < swapAmount) {
      console.log("📝 Approving tokens for router...");
      const approveTx = await sourceToken.approve(currentConfig.router, swapAmount);
      console.log("   Transaction Hash:", approveTx.hash);
      await approveTx.wait();
      console.log("✅ Approval confirmed!");
    } else {
      console.log("✅ Sufficient allowance already exists");
    }
  } catch (error) {
    console.log("⚠️ Could not check/set allowance:", error.message);
  }

  // Prepare cross-chain swap parameters
  const crossChainParams = {
    destinationChain: destinationConfig.chainName,
    sourceToken: currentConfig.testToken,
    destinationToken: destinationConfig.testToken,
    amount: swapAmount,
    minDestAmount: minDestAmount,
    recipient: user.address,
    deadline: deadline
  };

  console.log("\n🌉 INITIATING CROSS-CHAIN SWAP...");
  console.log("📤 Step 1: Swap", ethers.formatEther(swapAmount), "source tokens → PFUSD on", currentNetwork);
  console.log("🌐 Step 2: Bridge PFUSD from", currentNetwork, "→", destinationNetwork);
  console.log("📥 Step 3: Swap PFUSD → destination tokens on", destinationNetwork);
  console.log("👤 Step 4: Send destination tokens to recipient:", user.address);

  try {
    // Execute the cross-chain swap
    const tx = await router.crossChainSwap(crossChainParams, { 
      value: gasForCrossChain,
      gasLimit: 500000 // Set a reasonable gas limit
    });
    
    console.log("\n📋 TRANSACTION SUBMITTED:");
    console.log("   Hash:", tx.hash);
    console.log("   From:", user.address);
    console.log("   To:", currentConfig.router);
    console.log("   Gas Paid:", ethers.formatEther(gasForCrossChain), "ETH/AVAX");
    
    console.log("\n⏳ Waiting for transaction confirmation...");
    const receipt = await tx.wait();
    
    console.log("\n✅ TRANSACTION CONFIRMED:");
    console.log("   Block Number:", receipt.blockNumber);
    console.log("   Gas Used:", receipt.gasUsed.toString());
    console.log("   Status:", receipt.status === 1 ? "Success" : "Failed");

    // Parse events
    console.log("\n📨 TRANSACTION EVENTS:");
    for (const log of receipt.logs) {
      try {
        const parsedLog = router.interface.parseLog(log);
        if (parsedLog?.name === "CrossChainSwapInitiated") {
          console.log("🚀 CrossChainSwapInitiated Event:");
          console.log("   Destination Chain:", parsedLog.args.destinationChain);
          console.log("   Sender:", parsedLog.args.sender);
          console.log("   Recipient:", parsedLog.args.recipient);
          console.log("   Source Token:", parsedLog.args.sourceToken);
          console.log("   Source Amount:", ethers.formatEther(parsedLog.args.sourceAmount));
          console.log("   Bridge Amount:", ethers.formatEther(parsedLog.args.bridgeAmount));
        }
      } catch (e) {
        // Skip logs that can't be parsed by our contract
      }
    }

    console.log("\n🔍 NEXT STEPS TO MONITOR:");
    console.log("1. 🌐 Check Axelarscan for cross-chain progress:");
    console.log("   https://testnet.axelarscan.io/gmp/" + tx.hash);
    console.log("\n2. ⏰ Expected timeline:");
    console.log("   • Source chain confirmation: ~30 seconds");
    console.log("   • Axelar processing: ~2-5 minutes");
    console.log("   • Destination execution: ~30 seconds");
    console.log("   • Total time: ~3-6 minutes");
    
    console.log("\n3. 🔍 To check completion:");
    console.log("   • Check your destination token balance on", destinationNetwork);
    console.log("   • Look for CrossChainSwapCompleted event on destination");
    console.log("   • Monitor Axelarscan link above");

    console.log("\n💳 POST-SWAP BALANCES (Source Chain):");
    try {
      const sourceTokenBalance = await sourceToken.balanceOf(user.address);
      const stableCoinBalance = await stableCoin.balanceOf(user.address);
      console.log("🪙 Source Token Balance:", ethers.formatEther(sourceTokenBalance));
      console.log("💵 PFUSD Balance:", ethers.formatEther(stableCoinBalance));
    } catch (error) {
      console.log("⚠️ Could not read post-swap balances");
    }

  } catch (error) {
    console.log("\n❌ SWAP FAILED:");
    console.log("Error:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.log("\n💡 POSSIBLE SOLUTIONS:");
      console.log("• Get more ETH/AVAX for gas fees");
      console.log("• Reduce the gas amount for cross-chain");
    } else if (error.message.includes("allowance")) {
      console.log("\n💡 POSSIBLE SOLUTIONS:");
      console.log("• Increase token allowance for the router");
      console.log("• Check if you have enough source tokens");
    } else if (error.message.includes("RemoteRouterNotSet")) {
      console.log("\n💡 POSSIBLE SOLUTIONS:");
      console.log("• Run the setup script to configure remote routers");
      console.log("• Ensure both chains are properly configured");
    }
  }

  console.log("\n🎉 Cross-chain swap script completed!");
  console.log("📝 Remember to check the destination chain for your tokens!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });