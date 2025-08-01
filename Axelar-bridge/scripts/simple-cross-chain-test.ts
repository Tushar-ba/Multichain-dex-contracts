import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  const currentNetwork = hre.network.name;
  const [user] = await ethers.getSigners();

  console.log("🧪 SIMPLE CROSS-CHAIN SWAP TEST");
  console.log("📍 Network:", currentNetwork);
  console.log("👤 Address:", user.address);

  const config = {
    "optimism-sepolia": {
      router: "0xA6AAf9c0b2d3b129a9616eF976aF7478e9A13c1E",
      stableCoin: "0x0EBcFE9Fc5817DD541B2EAdc1e8fe92D35bc2470",
      testToken: "0x2258Db39FCdAB899661fBA6a1246Cc7a0F4E9ff0",
      chainName: "optimism-sepolia"
    },
    "avalanche-fuji": {
      router: "0xaEbB997bDa00E8509322c3768a2Ba88D0358b67e",
      stableCoin: "0xD76E4041761870CdaceDE467C21Bd417F83C7dC5",
      testToken: "0x1963f6163D9eaFCb1aF6DB7207b21E8aD6548751",
      chainName: "Avalanche"
    }
  };

  if (currentNetwork !== "avalanche-fuji" && currentNetwork !== "optimism-sepolia") {
    throw new Error("This script only works on avalanche-fuji or optimism-sepolia networks");
  }

  const currentConfig = config[currentNetwork as keyof typeof config];
  const destinationNetwork = currentNetwork === "avalanche-fuji" ? "optimism-sepolia" : "avalanche-fuji";
  const destinationConfig = config[destinationNetwork as keyof typeof config];

  // Get contract instances
  const FlexibleAxelarRouter = await ethers.getContractFactory("FlexibleAxelarRouter");
  const router = FlexibleAxelarRouter.attach(currentConfig.router);

  const IERC20 = await ethers.getContractFactory("CustomStableCoin");
  const sourceToken = IERC20.attach(currentConfig.testToken);

  console.log("\n📋 SWAP DETAILS:");
  console.log("From:", currentNetwork);
  console.log("To:", destinationNetwork);
  console.log("Source Token:", currentConfig.testToken);
  console.log("Destination Token:", destinationConfig.testToken);

  // Use small amounts for testing
  const swapAmount = ethers.parseEther("10"); // 10 tokens instead of 100
  const minDestAmount = ethers.parseEther("8"); // Expecting at least 8 tokens (20% slippage)
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour
  const gasForCrossChain = ethers.parseEther("0.005"); // Reduced gas amount

  console.log("\n⚙️ TEST PARAMETERS:");
  console.log("Swap Amount:", ethers.formatEther(swapAmount), "tokens");
  console.log("Min Destination:", ethers.formatEther(minDestAmount), "tokens");
  console.log("Cross-chain Gas:", ethers.formatEther(gasForCrossChain), "ETH/AVAX");

  // Check balances
  try {
    const sourceBalance = await sourceToken.balanceOf(user.address);
    const userNativeBalance = await user.provider.getBalance(user.address);
    
    console.log("\n💰 PRE-SWAP BALANCES:");
    console.log("Source Token:", ethers.formatEther(sourceBalance));
    console.log("Native Balance:", ethers.formatEther(userNativeBalance));

    if (sourceBalance < swapAmount) {
      console.log("❌ Insufficient source tokens!");
      return;
    }

    if (userNativeBalance < gasForCrossChain) {
      console.log("❌ Insufficient native tokens for gas!");
      return;
    }
  } catch (error) {
    console.log("⚠️ Could not check balances, proceeding anyway...");
  }

  // Check and approve tokens
  console.log("\n🔐 CHECKING ALLOWANCE...");
  try {
    const currentAllowance = await sourceToken.allowance(user.address, currentConfig.router);
    console.log("Current Allowance:", ethers.formatEther(currentAllowance));
    
    if (currentAllowance < swapAmount) {
      console.log("📝 Approving tokens...");
      const approveTx = await sourceToken.approve(currentConfig.router, swapAmount);
      await approveTx.wait();
      console.log("✅ Approval confirmed!");
    } else {
      console.log("✅ Sufficient allowance exists");
    }
  } catch (error) {
    console.log("⚠️ Could not check allowance:", error.message);
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

  console.log("\n🚀 EXECUTING CROSS-CHAIN SWAP...");
  console.log("This is a REAL transaction that will:");
  console.log("1. Swap your tokens to PFUSD");
  console.log("2. Bridge PFUSD via Axelar");
  console.log("3. Swap to destination tokens");

  try {
    // Execute the cross-chain swap with more specific error handling
    const tx = await router.crossChainSwap(crossChainParams, { 
      value: gasForCrossChain,
      gasLimit: 800000 // Increased gas limit
    });
    
    console.log("\n📋 TRANSACTION SUBMITTED:");
    console.log("Hash:", tx.hash);
    console.log("⏳ Waiting for confirmation...");
    
    const receipt = await tx.wait();
    
    console.log("\n✅ TRANSACTION CONFIRMED:");
    console.log("Block:", receipt.blockNumber);
    console.log("Gas Used:", receipt.gasUsed.toString());
    console.log("Status:", receipt.status === 1 ? "✅ Success" : "❌ Failed");

    if (receipt.status === 1) {
      console.log("\n🎉 CROSS-CHAIN SWAP INITIATED SUCCESSFULLY!");
      console.log("🔍 Monitor progress:");
      console.log("Axelarscan:", `https://testnet.axelarscan.io/gmp/${tx.hash}`);
      console.log("⏰ Expected completion: 3-6 minutes");
      
      // Parse events
      for (const log of receipt.logs) {
        try {
          const parsedLog = router.interface.parseLog(log);
          if (parsedLog?.name === "CrossChainSwapInitiated") {
            console.log("\n📨 CrossChainSwapInitiated Event:");
            console.log("Bridge Amount:", ethers.formatEther(parsedLog.args.bridgeAmount), "PFUSD");
          }
        } catch (e) {
          // Skip unparseable logs
        }
      }
    } else {
      console.log("\n❌ Transaction failed but was mined");
    }

  } catch (error) {
    console.log("\n❌ SWAP FAILED:");
    console.log("Error:", error.message);
    
    if (error.message.includes("execution reverted")) {
      console.log("\n🔍 POSSIBLE CAUSES:");
      console.log("1. Insufficient slippage tolerance");
      console.log("2. DEX swap failed due to price impact");
      console.log("3. Remote router not properly configured");
      console.log("4. Token approval issues");
      console.log("\n💡 SOLUTIONS:");
      console.log("1. Try with smaller amounts");
      console.log("2. Increase slippage tolerance");
      console.log("3. Check DEX liquidity again");
    }
  }

  console.log("\n✅ Test completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });