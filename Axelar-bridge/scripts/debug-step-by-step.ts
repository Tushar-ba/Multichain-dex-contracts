import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  const currentNetwork = hre.network.name;
  const [user] = await ethers.getSigners();

  console.log("🔍 STEP-BY-STEP DEBUG");
  console.log("📍 Network:", currentNetwork);

  if (currentNetwork !== "avalanche-fuji") {
    throw new Error("Run this on avalanche-fuji");
  }

  const routerAddress = "0xaEbB997bDa00E8509322c3768a2Ba88D0358b67e";
  const testTokenAddress = "0x1963f6163D9eaFCb1aF6DB7207b21E8aD6548751";
  const stableCoinAddress = "0xD76E4041761870CdaceDE467C21Bd417F83C7dC5";

  const FlexibleAxelarRouter = await ethers.getContractFactory("FlexibleAxelarRouter");
  const router = FlexibleAxelarRouter.attach(routerAddress);

  const IERC20 = await ethers.getContractFactory("CustomStableCoin");
  const testToken = IERC20.attach(testTokenAddress);

  // Test parameters
  const swapAmount = ethers.parseEther("10");
  const minDestAmount = ethers.parseEther("8");
  const deadline = Math.floor(Date.now() / 1000) + 3600;

  console.log("\n1️⃣ TESTING BASIC CONTRACT CALLS...");

  try {
    const bridgeToken = await router.bridgeToken();
    console.log("✅ Bridge token:", bridgeToken);
  } catch (error) {
    console.log("❌ Failed to read bridge token:", error.message);
    return;
  }

  try {
    const bridgeSymbol = await router.bridgeTokenSymbol();
    console.log("✅ Bridge symbol:", bridgeSymbol);
  } catch (error) {
    console.log("❌ Failed to read bridge symbol:", error.message);
    return;
  }

  console.log("\n2️⃣ TESTING REMOTE ROUTER CONFIGURATION...");

  try {
    const isSupported = await router.isChainSupported("optimism-sepolia");
    console.log("✅ Remote chain supported:", isSupported);
    
    if (!isSupported) {
      console.log("❌ CRITICAL: Remote chain not supported!");
      console.log("This will cause the transaction to revert immediately.");
      console.log("Check your setup script configuration.");
      return;
    }
  } catch (error) {
    console.log("❌ Failed to check remote chain:", error.message);
    return;
  }

  try {
    const remoteRouter = await router.remoteRouters("optimism-sepolia");
    console.log("✅ Remote router address:", remoteRouter);
    
    if (remoteRouter === "0x0000000000000000000000000000000000000000") {
      console.log("❌ CRITICAL: Remote router not set!");
      return;
    }
  } catch (error) {
    console.log("❌ Failed to read remote router:", error.message);
    return;
  }

  console.log("\n3️⃣ TESTING TOKEN OPERATIONS...");

  try {
    const balance = await testToken.balanceOf(user.address);
    console.log("✅ Test token balance:", ethers.formatEther(balance));
    
    if (balance < swapAmount) {
      console.log("❌ CRITICAL: Insufficient token balance!");
      return;
    }
  } catch (error) {
    console.log("❌ Failed to read token balance:", error.message);
    return;
  }

  try {
    const allowance = await testToken.allowance(user.address, routerAddress);
    console.log("✅ Token allowance:", ethers.formatEther(allowance));
    
    if (allowance < swapAmount) {
      console.log("📝 Approving tokens...");
      try {
        const approveTx = await testToken.approve(routerAddress, swapAmount);
        await approveTx.wait();
        console.log("✅ Approval successful");
      } catch (approveError) {
        console.log("❌ Approval failed:", approveError.message);
        return;
      }
    }
  } catch (error) {
    console.log("❌ Failed to check allowance:", error.message);
    return;
  }

  console.log("\n4️⃣ TESTING PARAMETER VALIDATION...");

  // Test the exact parameters we'll use
  const crossChainParams = {
    destinationChain: "optimism-sepolia",
    sourceToken: testTokenAddress,
    destinationToken: "0x2258Db39FCdAB899661fBA6a1246Cc7a0F4E9ff0",
    amount: swapAmount,
    minDestAmount: minDestAmount,
    recipient: user.address,
    deadline: deadline
  };

  // Validate each parameter
  console.log("Destination Chain:", crossChainParams.destinationChain);
  console.log("Source Token:", crossChainParams.sourceToken);
  console.log("Destination Token:", crossChainParams.destinationToken);
  console.log("Amount:", ethers.formatEther(crossChainParams.amount));
  console.log("Min Dest Amount:", ethers.formatEther(crossChainParams.minDestAmount));
  console.log("Recipient:", crossChainParams.recipient);
  console.log("Deadline:", new Date(crossChainParams.deadline * 1000).toLocaleString());

  // Check each validation condition from the contract
  if (crossChainParams.amount === 0n || crossChainParams.minDestAmount === 0n) {
    console.log("❌ CRITICAL: Amount or minDestAmount is zero!");
    return;
  }

  if (crossChainParams.sourceToken === "0x0000000000000000000000000000000000000000" || 
      crossChainParams.destinationToken === "0x0000000000000000000000000000000000000000") {
    console.log("❌ CRITICAL: Invalid token addresses!");
    return;
  }

  if (crossChainParams.recipient === "0x0000000000000000000000000000000000000000") {
    console.log("❌ CRITICAL: Invalid recipient address!");
    return;
  }

  if (Date.now() / 1000 > crossChainParams.deadline) {
    console.log("❌ CRITICAL: Deadline expired!");
    return;
  }

  console.log("✅ All parameter validations passed");

  console.log("\n5️⃣ TESTING GAS ESTIMATION...");

  try {
    const gasEstimate = await router.crossChainSwap.estimateGas(
      crossChainParams,
      { value: ethers.parseEther("0.005") }
    );
    console.log("✅ Gas estimate:", gasEstimate.toString());
  } catch (error) {
    console.log("❌ CRITICAL: Gas estimation failed!");
    console.log("Error:", error.message);
    
    // This is the most likely place where we'll find the actual error
    if (error.message.includes("execution reverted")) {
      console.log("\n🔍 DETAILED ERROR ANALYSIS:");
      
      // Try to get more specific error information
      try {
        // Try with a call (read-only) to get better error info
        await router.crossChainSwap.staticCall(
          crossChainParams,
          { value: ethers.parseEther("0.005") }
        );
      } catch (staticError) {
        console.log("Static call error:", staticError.message);
        
        // Check for specific error patterns
        if (staticError.message.includes("RemoteRouterNotSet")) {
          console.log("💡 SOLUTION: Remote router is not set properly");
        } else if (staticError.message.includes("InvalidAddress")) {
          console.log("💡 SOLUTION: One of the addresses is invalid");
        } else if (staticError.message.includes("InvalidAmount")) {
          console.log("💡 SOLUTION: Amount validation failed");
        } else if (staticError.message.includes("DeadlineExpired")) {
          console.log("💡 SOLUTION: Deadline has expired");
        } else if (staticError.message.includes("SwapFailed")) {
          console.log("💡 SOLUTION: DEX swap failed - check liquidity");
        } else {
          console.log("💡 This might be a more complex issue in the contract logic");
        }
      }
    }
    return;
  }

  console.log("\n✅ All checks passed! The contract should work correctly.");
  console.log("If it still fails, the issue might be in the Axelar network communication.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });