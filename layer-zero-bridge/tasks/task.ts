import { task } from "hardhat/config";
import { EndpointId } from '@layerzerolabs/lz-definitions';

// Network configurations - UPDATED WITH NEW DEPLOYED ADDRESSES
const NETWORK_CONFIG: Record<string, any> = {
  'avalanche-fuji-testnet': {
    eid: EndpointId.AVALANCHE_V2_TESTNET,
    CustomStablecoinOFT: '0x79F5bba2fa86D631fEd5F87211b0619a2635A167', 
    CrossChainRouter: '0x095Cd2f67F3b932a18f39eBC48bF5E7ef263BcAA', 
    Endpoint: '0x6EDCE65403992e310A62460808c4b910D972f10f',
    Router: '0x011b561002A1D2522210BA3d687131AB1F6AcF79',
    TokenB: '0x1963f6163D9eaFCb1aF6DB7207b21E8aD6548751'
  },
  'arbitrum-sepolia-testnet': {
    eid: EndpointId.ARBSEP_V2_TESTNET,
    CustomStablecoinOFT: '0x47F655BeE339Eb0ae8c51a7aa827055811b1C344', 
    CrossChainRouter: '0xD96d3eC1d7eF8f49F8966E88d5F3E80E71BED6Ba', 
    Endpoint: '0x6EDCE65403992e310A62460808c4b910D972f10f',
    Router: '0xA9a558fB3269F307eE57270b41fcBaFFC56d5290',
    TokenA: '0x9340DA78eC04aD53CFbD6970D7F6C2A0a33cD42a'
  },
  // Additional networks for better coverage (update addresses when deployed)
  'ethereum-sepolia': {
    eid: EndpointId.SEPOLIA_V2_TESTNET,
    CustomStablecoinOFT: '0x0000000000000000000000000000000000000000', // Update when deployed
    CrossChainRouter: '0x0000000000000000000000000000000000000000', // Update when deployed
    Endpoint: '0x6EDCE65403992e310A62460808c4b910D972f10f',
    Router: '0xC235d41016435B1034aeC94f9de17a78d9dA7028'
  },
  'optimism-sepolia-testnet': {
    eid: EndpointId.OPTSEP_V2_TESTNET,
    CustomStablecoinOFT: '0x0000000000000000000000000000000000000000', // Update when deployed
    CrossChainRouter: '0x0000000000000000000000000000000000000000', // Update when deployed
    Endpoint: '0x6EDCE65403992e310A62460808c4b910D972f10f',
    Router: '0x3DfCfA2730f768cf4cf931f4896109ffa9c3e202'
  },
  'bsc-testnet': {
    eid: EndpointId.BSC_V2_TESTNET,
    CustomStablecoinOFT: '0x0000000000000000000000000000000000000000', // Update when deployed
    CrossChainRouter: '0x0000000000000000000000000000000000000000', // Update when deployed
    Endpoint: '0x6EDCE65403992e310A62460808c4b910D972f10f',
    Router: '0x78069aF1280A73D240cCDF16Ab4a483555246665'
  },
  'base-sepolia': {
    eid: EndpointId.BASESEP_V2_TESTNET,
    CustomStablecoinOFT: '0x0000000000000000000000000000000000000000', // Update when deployed
    CrossChainRouter: '0x0000000000000000000000000000000000000000', // Update when deployed
    Endpoint: '0x6EDCE65403992e310A62460808c4b910D972f10f',
    Router: '0xC3b415C823366DC2222d979b0a17ce9C72A4feEB'
  },
  'polygon-amoy': {
    eid: EndpointId.AMOY_V2_TESTNET,
    CustomStablecoinOFT: '0x0000000000000000000000000000000000000000', // Update when deployed
    CrossChainRouter: '0x0000000000000000000000000000000000000000', // Update when deployed
    Endpoint: '0x6EDCE65403992e310A62460808c4b910D972f10f',
    Router: '0xa5812cE58B6Cb897b9B02ED1bAA1f9AC01D4F67e'
  }
};

// Complete cross-chain swap task (SourceToken → DestinationToken)
task("cross-chain-swap", "Perform complete cross-chain swap with automatic destination token conversion")
  .addParam("sourceNetwork", "Source network name")
  .addParam("destinationNetwork", "Destination network name")
  .addParam("sourceToken", "Source token address")
  .addParam("destinationToken", "Destination token address")
  .addParam("amountIn", "Amount of source tokens to swap")
  .addParam("amountOutMin", "Minimum amount of destination tokens to receive")
  .addParam("recipient", "Recipient address on destination chain")
  .addParam("feeEth", "Fee amount in ETH to send with transaction (e.g., 0.05)")
  .setAction(async (taskArgs: any, hre: any) => {
    const { sourceNetwork, destinationNetwork, sourceToken, destinationToken, amountIn, amountOutMin, recipient, feeEth } = taskArgs;
    
    console.log("🚀 === COMPLETE CROSS-CHAIN SWAP ===");
    console.log(`Source Network: ${sourceNetwork}`);
    console.log(`Destination Network: ${destinationNetwork}`);
    console.log(`Source Token: ${sourceToken}`);
    console.log(`Destination Token: ${destinationToken}`);
    console.log(`Amount In: ${amountIn}`);
    console.log(`Amount Out Min: ${amountOutMin}`);
    console.log(`Recipient: ${recipient}`);
    console.log(`Fee: ${feeEth} ETH`);
    console.log("========================================");

    const sourceConfig = NETWORK_CONFIG[sourceNetwork];
    const destConfig = NETWORK_CONFIG[destinationNetwork];
    
    if (!sourceConfig || !destConfig) {
      throw new Error(`Unsupported network configuration`);
    }

    const [signer] = await hre.ethers.getSigners();
    console.log(`🔑 Signer address: ${signer.address}`);

    // Get contract instances
    const CrossChainRouter = await hre.ethers.getContractAt("CrossChainRouter", sourceConfig.CrossChainRouter);
    const SourceToken = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", sourceToken);

    // Check balances
    console.log("\n💰 === BALANCE CHECK ===");
    const sourceBalance = await SourceToken.balanceOf(signer.address);
    const nativeBalance = await signer.getBalance();
    console.log(`Source Token Balance: ${hre.ethers.utils.formatEther(sourceBalance)}`);
    console.log(`Native Balance: ${hre.ethers.utils.formatEther(nativeBalance)} ETH`);

    const amountInWei = hre.ethers.utils.parseEther(amountIn);
    const amountOutMinWei = hre.ethers.utils.parseEther(amountOutMin);
    const feeWei = hre.ethers.utils.parseEther(feeEth);

    // Validate balances
    if (sourceBalance.lt(amountInWei)) {
      throw new Error(`❌ Insufficient source token balance. Required: ${amountIn}, Available: ${hre.ethers.utils.formatEther(sourceBalance)}`);
    }
    
    if (nativeBalance.lt(feeWei.add(hre.ethers.utils.parseEther("0.01")))) {
      throw new Error(`❌ Insufficient native balance. Required: ${hre.ethers.utils.formatEther(feeWei.add(hre.ethers.utils.parseEther("0.01")))} ETH`);
    }

    try {
      // Step 1: Approve tokens
      console.log("\n🔐 === TOKEN APPROVAL ===");
      const currentAllowance = await SourceToken.allowance(signer.address, sourceConfig.CrossChainRouter);
      
      if (currentAllowance.lt(amountInWei)) {
        console.log(`Approving ${amountIn} tokens...`);
        const approveTx = await SourceToken.approve(sourceConfig.CrossChainRouter, amountInWei, {
          gasLimit: 100000,
          gasPrice: hre.ethers.utils.parseUnits("25", "gwei")
        });
        console.log(`Approve TX: ${approveTx.hash}`);
        await approveTx.wait();
        console.log("✅ Approval confirmed!");
      } else {
        console.log("✅ Sufficient allowance exists!");
      }

      // Step 2: Estimate source swap output
      console.log("\n📊 === SWAP ESTIMATION ===");
      const estimatedStableAmount = await CrossChainRouter.estimateSwapOutput(sourceToken, amountInWei);
      console.log(`Estimated stablecoin output: ${hre.ethers.utils.formatEther(estimatedStableAmount)}`);

      // Step 3: Quote total swap fee (bridge + message)
      console.log("\n💰 === FEE QUOTE ===");
      const options = "0x";
      const recipientBytes32 = hre.ethers.utils.hexZeroPad(recipient, 32);
      const destinationTokenBytes32 = hre.ethers.utils.hexZeroPad(destinationToken, 32);
      
      try {
        const totalFee = await CrossChainRouter.quoteSwapFee(
          destConfig.eid,
          recipientBytes32,
          destinationTokenBytes32,
          amountOutMinWei,
          estimatedStableAmount,
          options
        );
        
        console.log(`Required total fee: ${hre.ethers.utils.formatEther(totalFee.nativeFee)} ETH`);
        console.log(`Provided fee: ${feeEth} ETH`);
        
        if (totalFee.nativeFee.gt(feeWei)) {
          console.log(`⚠️  Warning: Provided fee is insufficient!`);
          console.log(`   Required: ${hre.ethers.utils.formatEther(totalFee.nativeFee)} ETH`);
          console.log(`   Consider using: ${hre.ethers.utils.formatEther(totalFee.nativeFee.mul(110).div(100))} ETH (with 10% buffer)`);
          throw new Error("Insufficient fee provided");
        } else {
          console.log(`✅ Fee is sufficient`);
        }
      } catch (feeError: any) {
        if (feeError.message.includes("Insufficient fee")) {
          throw feeError;
        }
        console.log(`⚠️  Could not quote fees precisely, proceeding with provided fee`);
        console.log(`   This might fail if fee is insufficient`);
      }

      // Step 4: Execute complete cross-chain swap
      console.log("\n🌉 === EXECUTING COMPLETE CROSS-CHAIN SWAP ===");
      console.log("This will:");
      console.log("1. Swap your source tokens to stablecoins");
      console.log("2. Bridge stablecoins to destination chain");
      console.log("3. Automatically swap stablecoins to destination tokens");
      console.log("4. Send destination tokens directly to recipient");
      
      const swapTx = await CrossChainRouter.crossChainSwap(
        destConfig.eid,
        recipientBytes32,
        sourceToken,
        destinationTokenBytes32,
        amountInWei,
        amountOutMinWei,
        options,
        {
          value: feeWei,
          gasLimit: 3000000,
          gasPrice: hre.ethers.utils.parseUnits("50", "gwei")
        }
      );

      console.log(`🚀 Transaction sent: ${swapTx.hash}`);
      console.log("⏳ Waiting for confirmation...");

      const receipt = await swapTx.wait();
      
      if (receipt.status === 0) {
        console.error("❌ Transaction failed");
        console.log(`🔗 Check transaction: https://testnet.snowtrace.io/tx/${swapTx.hash}`);
        return;
      }

      console.log(`✅ Transaction confirmed!`);
      console.log(`📦 Block: ${receipt.blockNumber}`);
      console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
      console.log(`🔗 Transaction: https://testnet.snowtrace.io/tx/${swapTx.hash}`);

      // Parse events
      console.log("\n📋 === EVENTS ===");
      for (const log of receipt.logs) {
        try {
          const parsedLog = CrossChainRouter.interface.parseLog(log);
          if (parsedLog.name === "CrossChainSwapInitiated") {
            console.log("🎉 CrossChainSwapInitiated:");
            console.log(`   Amount In: ${hre.ethers.utils.formatEther(parsedLog.args.amountIn)}`);
            console.log(`   Stable Amount: ${hre.ethers.utils.formatEther(parsedLog.args.stableAmount)}`);
            console.log(`   Destination EID: ${parsedLog.args.destinationEid}`);
            console.log(`   Recipient: ${parsedLog.args.recipient}`);
            console.log(`   Destination Token: ${parsedLog.args.destinationToken}`);
          }
        } catch (e) {
          // Not our event
        }
      }

      console.log("\n🎉 === COMPLETE CROSS-CHAIN SWAP INITIATED! ===");
      console.log("✅ Step 1: Source tokens swapped to stablecoins");
      console.log("✅ Step 2: Stablecoins being bridged to destination chain");
      console.log("⏳ Step 3: Destination swap will happen automatically");
      console.log("");
      console.log("🕐 Timeline:");
      console.log("   - LayerZero bridging: 1-5 minutes");
      console.log("   - Automatic destination swap: ~30 seconds after bridge");
      console.log("   - Total time: 2-6 minutes");
      console.log("");
      console.log(`📍 Recipient will receive ${destinationToken} tokens at: ${recipient}`);
      console.log(`🎯 Expected amount: ~${amountOutMin} tokens (minimum)`);

    } catch (error: any) {
      console.error("\n❌ === SWAP FAILED ===");
      console.error(`Error: ${error.message}`);
      
      if (error.message.includes('Token transfer failed')) {
        console.error("💡 Check token allowance and balance");
      } else if (error.message.includes('Insufficient fee')) {
        console.error("💡 Increase the fee amount for LayerZero messaging");
      } else if (error.message.includes('deadline')) {
        console.error("💡 Transaction took too long, try again");
      }
      
      throw error;
    }
  });

// Quote fees for cross-chain swap - FIXED VERSION
task("quote-cross-chain-fee", "Quote fees for complete cross-chain swap")
  .addParam("sourceNetwork", "Source network name")
  .addParam("destinationNetwork", "Destination network name")
  .addParam("sourceToken", "Source token address")
  .addParam("destinationToken", "Destination token address")
  .addParam("amountIn", "Amount of source tokens to swap")
  .addParam("amountOutMin", "Minimum amount of destination tokens to receive")
  .addParam("recipient", "Recipient address on destination chain")
  .setAction(async (taskArgs: any, hre: any) => {
    const { sourceNetwork, destinationNetwork, sourceToken, destinationToken, amountIn, amountOutMin, recipient } = taskArgs;
    
    console.log("💰 === FEE QUOTE ANALYSIS ===");
    console.log(`Source: ${sourceNetwork} → Destination: ${destinationNetwork}`);
    console.log(`Token Path: ${sourceToken} → ${destinationToken}`);
    console.log(`Amount: ${amountIn} → Min: ${amountOutMin}`);
    console.log(`Recipient: ${recipient}`);
    console.log("=====================================");

    const sourceConfig = NETWORK_CONFIG[sourceNetwork];
    const destConfig = NETWORK_CONFIG[destinationNetwork];
    
    if (!sourceConfig || !destConfig) {
      throw new Error(`Unsupported network configuration`);
    }

    try {
      const CrossChainRouter = await hre.ethers.getContractAt("CrossChainRouter", sourceConfig.CrossChainRouter);

      // Step 1: Estimate stablecoin amount from source swap
      console.log("\n📊 Step 1: Source Token → Stablecoin Estimation");
      const amountInWei = hre.ethers.utils.parseEther(amountIn);
      const estimatedStableAmount = await CrossChainRouter.estimateSwapOutput(sourceToken, amountInWei);
      console.log(`Input: ${amountIn} source tokens`);
      console.log(`Estimated stablecoin output: ${hre.ethers.utils.formatEther(estimatedStableAmount)}`);

      // Step 2: Prepare parameters for fee quote
      console.log("\n🔧 Step 2: Preparing Fee Quote Parameters");
      const options = "0x"; // Empty options
      const recipientBytes32 = hre.ethers.utils.hexZeroPad(recipient, 32);
      const destinationTokenBytes32 = hre.ethers.utils.hexZeroPad(destinationToken, 32);
      const amountOutMinWei = hre.ethers.utils.parseEther(amountOutMin);

      console.log(`Destination EID: ${destConfig.eid}`);
      console.log(`Recipient (bytes32): ${recipientBytes32}`);
      console.log(`Destination Token (bytes32): ${destinationTokenBytes32}`);
      console.log(`Amount Out Min: ${hre.ethers.utils.formatEther(amountOutMinWei)}`);
      console.log(`Stable Amount: ${hre.ethers.utils.formatEther(estimatedStableAmount)}`);

      // Step 3: Debug contract state
      console.log("\n🔍 Step 3: Contract State Verification");
      
      // Check if contract has required functions
      try {
        const stablecoinAddr = await CrossChainRouter.stablecoin();
        const stablecoinOFTAddr = await CrossChainRouter.stablecoinOFT();
        const dexRouterAddr = await CrossChainRouter.dexRouter();
        
        console.log(`✅ Stablecoin: ${stablecoinAddr}`);
        console.log(`✅ Stablecoin OFT: ${stablecoinOFTAddr}`);
        console.log(`✅ DEX Router: ${dexRouterAddr}`);

        // Verify stablecoin and OFT match
        if (stablecoinAddr.toLowerCase() !== stablecoinOFTAddr.toLowerCase()) {
          console.log(`⚠️  WARNING: Stablecoin address mismatch!`);
          console.log(`   This could cause the fee quote to fail`);
        }
      } catch (e: any) {
        console.log(`❌ Could not read contract state: ${e.message}`);
      }

      // Step 4: Try individual quote components
      console.log("\n💰 Step 4: Individual Fee Components");
      
      try {
        // Quote OFT bridge fee separately
        console.log("🌉 Quoting OFT Bridge Fee...");
        const StablecoinOFT = await hre.ethers.getContractAt("IOFT", sourceConfig.CustomStablecoinOFT);
        
        const sendParam = {
          dstEid: destConfig.eid,
          to: recipientBytes32, // Use the CrossChainRouter address on destination
          amountLD: estimatedStableAmount,
          minAmountLD: estimatedStableAmount,
          extraOptions: options,
          composeMsg: "0x",
          oftCmd: "0x"
        };

        const bridgeFee = await StablecoinOFT.quoteSend(sendParam, false);
        console.log(`✅ Bridge Fee: ${hre.ethers.utils.formatEther(bridgeFee.nativeFee)} ETH`);
        console.log(`   LZ Token Fee: ${hre.ethers.utils.formatEther(bridgeFee.lzTokenFee)}`);

        // Quote message fee separately
        console.log("\n📨 Quoting Message Fee...");
        const payload = hre.ethers.utils.defaultAbiCoder.encode(
          ["bytes32", "bytes32", "uint256", "uint256", "address"],
          [recipientBytes32, destinationTokenBytes32, amountOutMinWei, estimatedStableAmount, recipient]
        );
        
        // Try to get message fee using internal _quote function
        // This might fail because _quote is internal, but let's try
        try {
          const msgFee = await CrossChainRouter.quote(destConfig.eid, payload, options, false);
          console.log(`✅ Message Fee: ${hre.ethers.utils.formatEther(msgFee.nativeFee)} ETH`);
          
          // Calculate total
          const totalNativeFee = bridgeFee.nativeFee.add(msgFee.nativeFee);
          const totalLZTokenFee = bridgeFee.lzTokenFee.add(msgFee.lzTokenFee);
          
          console.log("\n🎯 === TOTAL FEE BREAKDOWN ===");
          console.log(`Bridge Fee: ${hre.ethers.utils.formatEther(bridgeFee.nativeFee)} ETH`);
          console.log(`Message Fee: ${hre.ethers.utils.formatEther(msgFee.nativeFee)} ETH`);
          console.log(`Total Native Fee: ${hre.ethers.utils.formatEther(totalNativeFee)} ETH`);
          console.log(`Total LZ Token Fee: ${hre.ethers.utils.formatEther(totalLZTokenFee)}`);
          console.log(`Recommended (with 15% buffer): ${hre.ethers.utils.formatEther(totalNativeFee.mul(115).div(100))} ETH`);
          
        } catch (quoteError: any) {
          console.log(`⚠️  Could not quote message fee directly: ${quoteError.message}`);
          
          // Provide estimate based on bridge fee
          const estimatedTotal = bridgeFee.nativeFee.mul(2); // Rough estimate
          console.log("\n🎯 === ESTIMATED TOTAL FEE ===");
          console.log(`Bridge Fee: ${hre.ethers.utils.formatEther(bridgeFee.nativeFee)} ETH`);
          console.log(`Estimated Message Fee: ~${hre.ethers.utils.formatEther(bridgeFee.nativeFee)} ETH`);
          console.log(`Estimated Total: ~${hre.ethers.utils.formatEther(estimatedTotal)} ETH`);
          console.log(`Recommended (with buffer): ${hre.ethers.utils.formatEther(estimatedTotal.mul(130).div(100))} ETH`);
        }

      } catch (oftError: any) {
        console.log(`❌ Could not quote bridge fee: ${oftError.message}`);
        
        // Provide general estimates
        console.log("\n💡 === GENERAL FEE ESTIMATES ===");
        console.log("Cross-chain swap fees typically include:");
        console.log("  - OFT Bridge Fee: 0.01-0.05 ETH");
        console.log("  - Message + Gas Fee: 0.01-0.05 ETH");
        console.log("  - Total Estimate: 0.02-0.1 ETH");
        console.log("  - Recommended: 0.08-0.12 ETH (with buffer)");
      }

      // Step 5: Try the original quoteSwapFee function
      console.log("\n🔧 Step 5: Testing Original quoteSwapFee Function");
      try {
        const totalFee = await CrossChainRouter.quoteSwapFee(
          destConfig.eid,
          recipientBytes32,
          destinationTokenBytes32,
          amountOutMinWei,
          estimatedStableAmount,
          options
        );
        
        console.log("✅ SUCCESS! Original function worked:");
        console.log(`Total required fee: ${hre.ethers.utils.formatEther(totalFee.nativeFee)} ETH`);
        console.log(`LZ Token fee: ${hre.ethers.utils.formatEther(totalFee.lzTokenFee)}`);
        console.log(`Recommended (with 10% buffer): ${hre.ethers.utils.formatEther(totalFee.nativeFee.mul(110).div(100))} ETH`);
        
      } catch (originalError: any) {
        console.log(`❌ Original function still fails: ${originalError.message}`);
        
        // Analyze the error
        if (originalError.message.includes("0x71c4efed")) {
          console.log("🔍 Error Analysis:");
          console.log("   Error signature: 0x71c4efed");
          console.log("   This suggests a revert in the contract logic");
          console.log("   Possible causes:");
          console.log("   1. OFT contract quoteSend function reverts");
          console.log("   2. Invalid destination EID");
          console.log("   3. Stablecoin amount is 0 or invalid");
          console.log("   4. Options parameter issue");
        }

        // Try to diagnose further
        console.log("\n🔍 Additional Diagnostics:");
        
        // Check if destination EID is valid
        try {
          const endpoint = await hre.ethers.getContractAt("ILayerZeroEndpointV2", sourceConfig.Endpoint);
          // This might not work, but worth trying
          console.log(`Endpoint address: ${sourceConfig.Endpoint}`);
        } catch (e) {
          console.log("Could not verify endpoint");
        }

        // Check stablecoin amount validity
        if (estimatedStableAmount.eq(0)) {
          console.log("❌ Estimated stablecoin amount is 0!");
          console.log("   This suggests the source token → stablecoin swap would fail");
          console.log("   Check if liquidity pools exist");
        }
      }

    } catch (error: any) {
      console.error(`\n❌ === FEE QUOTE FAILED ===`);
      console.error(`Error: ${error.message}`);
      
      // Provide troubleshooting guidance
      console.log("\n🛠️  === TROUBLESHOOTING GUIDE ===");
      console.log("1. Check if contracts are properly deployed:");
      console.log(`   CrossChainRouter: ${sourceConfig.CrossChainRouter}`);
      console.log(`   StablecoinOFT: ${sourceConfig.CustomStablecoinOFT}`);
      
      console.log("\n2. Verify liquidity pools exist:");
      console.log(`   Run: npx hardhat check-pools --source-network ${sourceNetwork} --destination-network ${destinationNetwork} --source-token ${sourceToken} --destination-token ${destinationToken} --network ${sourceNetwork}`);
      
      console.log("\n3. Try with different parameters:");
      console.log("   - Use smaller amounts");
      console.log("   - Check token addresses are correct");
      console.log("   - Verify recipient address format");
      
      console.log("\n4. Manual fee estimation:");
      console.log("   - Bridge fees: typically 0.01-0.05 ETH");
      console.log("   - Message fees: typically 0.01-0.03 ETH");
      console.log("   - Total: 0.02-0.08 ETH + buffer");
      
      throw error;
    }
  });

// Estimate complete cross-chain swap output
task("estimate-cross-chain-swap", "Estimate output for complete cross-chain swap")
  .addParam("sourceNetwork", "Source network name")
  .addParam("destinationNetwork", "Destination network name")
  .addParam("sourceToken", "Source token address")
  .addParam("destinationToken", "Destination token address")
  .addParam("amountIn", "Amount of source tokens to swap")
  .setAction(async (taskArgs: any, hre: any) => {
    const { sourceNetwork, destinationNetwork, sourceToken, destinationToken, amountIn } = taskArgs;
    
    const sourceConfig = NETWORK_CONFIG[sourceNetwork];
    const destConfig = NETWORK_CONFIG[destinationNetwork];
    
    console.log("📊 === CROSS-CHAIN SWAP ESTIMATION ===");
    
    // Source chain estimation
    const SourceCrossChainRouter = await hre.ethers.getContractAt("CrossChainRouter", sourceConfig.CrossChainRouter);
    const amountInWei = hre.ethers.utils.parseEther(amountIn);
    const estimatedStableAmount = await SourceCrossChainRouter.estimateSwapOutput(sourceToken, amountInWei);
    
    console.log(`Step 1 - Source Swap (${sourceNetwork}):`);
    console.log(`  ${amountIn} ${sourceToken}`);
    console.log(`  ↓`);
    console.log(`  ${hre.ethers.utils.formatEther(estimatedStableAmount)} stablecoins`);
    
    // Destination chain estimation (if we can connect to it)
    try {
      // Switch to destination network context - this might not work in practice
      // In real usage, you'd need to run this on the destination network
      console.log(`\nStep 2 - Bridge (LayerZero):`);
      console.log(`  ${hre.ethers.utils.formatEther(estimatedStableAmount)} stablecoins → ${destinationNetwork}`);
      
      console.log(`\nStep 3 - Destination Swap (${destinationNetwork}):`);
      console.log(`  ${hre.ethers.utils.formatEther(estimatedStableAmount)} stablecoins`);
      console.log(`  ↓`);
      console.log(`  Estimated ${destinationToken} tokens (check destination chain)`);
      console.log("\n💡 To get exact destination estimate, run this task on the destination network");
      
    } catch (error) {
      console.log(`\n⚠️  Could not estimate destination output (different network)`);
      console.log(`💡 Run: npx hardhat estimate-destination-output --network ${destinationNetwork} --destination-token ${destinationToken} --stable-amount ${hre.ethers.utils.formatEther(estimatedStableAmount)}`);
    }
  });

// Estimate destination output (run on destination chain)
task("estimate-destination-output", "Estimate destination token output from stablecoins")
  .addParam("targetNetwork", "Target network name")
  .addParam("destinationToken", "Destination token address")
  .addParam("stableAmount", "Amount of stablecoins")
  .setAction(async (taskArgs: any, hre: any) => {
    const { targetNetwork, destinationToken, stableAmount } = taskArgs;
    
    const config = NETWORK_CONFIG[targetNetwork];
    const CrossChainRouter = await hre.ethers.getContractAt("CrossChainRouter", config.CrossChainRouter);
    
    const stableAmountWei = hre.ethers.utils.parseEther(stableAmount);
    const destinationTokenBytes32 = hre.ethers.utils.hexZeroPad(destinationToken, 32);
    
    try {
      const estimatedOutput = await CrossChainRouter.estimateDestinationOutput(
        destinationTokenBytes32,
        stableAmountWei
      );
      
      console.log("📊 === DESTINATION SWAP ESTIMATION ===");
      console.log(`Network: ${targetNetwork}`);
      console.log(`Input: ${stableAmount} stablecoins`);
      console.log(`Output: ${hre.ethers.utils.formatEther(estimatedOutput)} ${destinationToken}`);
    } catch (error: any) {
      console.error(`❌ Estimation failed: ${error.message}`);
    }
  });

// Check pool existence and liquidity
task("check-pools", "Check if liquidity pools exist for cross-chain swap")
  .addParam("sourceNetwork", "Source network name")
  .addParam("destinationNetwork", "Destination network name") 
  .addParam("sourceToken", "Source token address")
  .addParam("destinationToken", "Destination token address")
  .setAction(async (taskArgs: any, hre: any) => {
    const { sourceNetwork, destinationNetwork, sourceToken, destinationToken } = taskArgs;
    
    console.log("🔍 === POOL DIAGNOSTICS ===");
    console.log(`Source Network: ${sourceNetwork}`);
    console.log(`Source Token: ${sourceToken}`);
    console.log(`Destination Network: ${destinationNetwork}`);
    console.log(`Destination Token: ${destinationToken}`);
    console.log("==============================");

    const sourceConfig = NETWORK_CONFIG[sourceNetwork];
    const destConfig = NETWORK_CONFIG[destinationNetwork];
    
    try {
      // Check source chain contracts
      console.log("\n🔧 === SOURCE CHAIN ANALYSIS ===");
      const CrossChainRouter = await hre.ethers.getContractAt("CrossChainRouter", sourceConfig.CrossChainRouter);
      const DexRouter = await hre.ethers.getContractAt("contracts/CrossChainRouter.sol:IPayfundsRouter02", sourceConfig.Router);
      
      // Get stablecoin address
      const stablecoinAddress = await CrossChainRouter.stablecoin();
      console.log(`✅ CrossChainRouter: ${sourceConfig.CrossChainRouter}`);
      console.log(`✅ DEX Router: ${sourceConfig.Router}`);
      console.log(`✅ Stablecoin: ${stablecoinAddress}`);
      console.log(`✅ Stablecoin OFT: ${sourceConfig.CustomStablecoinOFT}`);

      // Check if stablecoin matches OFT
      if (stablecoinAddress.toLowerCase() !== sourceConfig.CustomStablecoinOFT.toLowerCase()) {
        console.log(`⚠️  WARNING: Stablecoin address mismatch!`);
        console.log(`   Contract says: ${stablecoinAddress}`);
        console.log(`   Config says: ${sourceConfig.CustomStablecoinOFT}`);
      }

      // Get factory address
      const factoryAddress = await DexRouter.factory();
      console.log(`✅ Factory: ${factoryAddress}`);

      // Check source token → stablecoin pool
      console.log("\n💧 === POOL EXISTENCE CHECK ===");
      const Factory = await hre.ethers.getContractAt(
        [
          "function getPair(address,address) view returns (address)",
          "function allPairsLength() view returns (uint256)"
        ], 
        factoryAddress
      );

      const sourcePair = await Factory.getPair(sourceToken, stablecoinAddress);
      console.log(`Source Pair (${sourceToken} ↔ Stablecoin): ${sourcePair}`);
      
      if (sourcePair === "0x0000000000000000000000000000000000000000") {
        console.log("❌ NO POOL EXISTS between source token and stablecoin!");
        console.log("💡 Solutions:");
        console.log("   1. Create a liquidity pool");
        console.log("   2. Use a different token path (via WETH/WMATIC)");
        console.log("   3. Check if token addresses are correct");
      } else {
        console.log("✅ Pool exists! Checking liquidity...");
        
        // Check pool liquidity
        const Pair = await hre.ethers.getContractAt(
          [
            "function getReserves() view returns (uint112,uint112,uint32)",
            "function token0() view returns (address)",
            "function token1() view returns (address)",
            "function totalSupply() view returns (uint256)"
          ],
          sourcePair
        );

        const [reserve0, reserve1] = await Pair.getReserves();
        const token0 = await Pair.token0();
        const token1 = await Pair.token1();
        const totalSupply = await Pair.totalSupply();

        console.log(`   Token0: ${token0}`);
        console.log(`   Token1: ${token1}`);
        console.log(`   Reserve0: ${hre.ethers.utils.formatEther(reserve0)}`);
        console.log(`   Reserve1: ${hre.ethers.utils.formatEther(reserve1)}`);
        console.log(`   LP Supply: ${hre.ethers.utils.formatEther(totalSupply)}`);

        if (reserve0.eq(0) || reserve1.eq(0)) {
          console.log("⚠️  Pool has no liquidity!");
        } else {
          console.log("✅ Pool has liquidity!");
        }
      }

      // Check token balances
      console.log("\n💰 === TOKEN INFO ===");
      const SourceToken = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", sourceToken);
      const [signer] = await hre.ethers.getSigners();
      
      try {
        const sourceBalance = await SourceToken.balanceOf(signer.address);
        const sourceSymbol = await SourceToken.symbol();
        const sourceDecimals = await SourceToken.decimals();
        console.log(`Source Token (${sourceSymbol}): ${hre.ethers.utils.formatUnits(sourceBalance, sourceDecimals)}`);
      } catch (e: any) {
        console.log(`❌ Could not read source token info: ${e.message}`);
      }

      try {
        const Stablecoin = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", stablecoinAddress);
        const stableBalance = await Stablecoin.balanceOf(signer.address);
        const stableSymbol = await Stablecoin.symbol();
        const stableDecimals = await Stablecoin.decimals();
        console.log(`Stablecoin (${stableSymbol}): ${hre.ethers.utils.formatUnits(stableBalance, stableDecimals)}`);
      } catch (e: any) {
        console.log(`❌ Could not read stablecoin info: ${e.message}`);
      }

    } catch (error: any) {
      console.error(`❌ Pool check failed: ${error.message}`);
      
      if (error.message.includes("CALL_EXCEPTION")) {
        console.log("💡 Possible issues:");
        console.log("   - Contract not deployed at given address");
        console.log("   - Network RPC issue");
        console.log("   - Contract bytecode mismatch");
      }
    }
  });

console.log("CrossChainRouter tasks loaded successfully!");
console.log("Available tasks:");
console.log("  - cross-chain-swap: Complete cross-chain token swap");
console.log("  - quote-cross-chain-fee: Quote fees for cross-chain swap");
console.log("  - estimate-cross-chain-swap: Estimate swap outputs");
console.log("  - estimate-destination-output: Estimate destination token output");
console.log("  - check-pools: Check if liquidity pools exist for tokens");
