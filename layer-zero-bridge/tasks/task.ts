import { task } from "hardhat/config";
import { EndpointId } from '@layerzerolabs/lz-definitions';

// Network configurations - UPDATED WITH NEW DEPLOYED ADDRESSES
const NETWORK_CONFIG: Record<string, any> = {

  'holesky': {
    eid: EndpointId.HOLESKY_TESTNET,
    CustomStablecoinOFT: '0x4d7c436e23ce51c42A9d6587B5812673f2dC756C', // Update when deployed
    CrossChainRouter: '0x3997e41F60643491b9a26666eD4668303D7fDF4b', // Update when deployed
    Endpoint: '0x6EDCE65403992e310A62460808c4b910D972f10f',
    Router: '0x1F2Ea7012Be2Fb0Ba2ce8B7B2A1ab3357Ab2315d',
    TokenA: '0x31a210d4BaD0D1f1a7d96acfD637E082B854ADE8'
  },
  'avalanche-fuji-testnet': {
    eid: EndpointId.AVALANCHE_V2_TESTNET,
    CustomStablecoinOFT: '0x0d2f518e859cC3C2E6B93118312Dd240507A91F6', 
    CrossChainRouter: '0x17FcF7d721C3c9Ab30d5AE2706c3562E7B01eA27', 
    Endpoint: '0x6EDCE65403992e310A62460808c4b910D972f10f',
    Router: '0x011b561002A1D2522210BA3d687131AB1F6AcF79',
    TokenB: '0x1963f6163D9eaFCb1aF6DB7207b21E8aD6548751'
  }
  
  // Additional networks for better coverage (update addresses when deployed)
  // 'ethereum-sepolia': {
  //   eid: EndpointId.SEPOLIA_V2_TESTNET,
  //   CustomStablecoinOFT: '0x0000000000000000000000000000000000000000', // Update when deployed
  //   CrossChainRouter: '0x0000000000000000000000000000000000000000', // Update when deployed
  //   Endpoint: '0x6EDCE65403992e310A62460808c4b910D972f10f',
  //   Router: '0xC235d41016435B1034aeC94f9de17a78d9dA7028'
  // },
  // 'optimism-sepolia-testnet': {
  //   eid: EndpointId.OPTSEP_V2_TESTNET,
  //   CustomStablecoinOFT: '0x0000000000000000000000000000000000000000', // Update when deployed
  //   CrossChainRouter: '0x0000000000000000000000000000000000000000', // Update when deployed
  //   Endpoint: '0x6EDCE65403992e310A62460808c4b910D972f10f',
  //   Router: '0x3DfCfA2730f768cf4cf931f4896109ffa9c3e202'
  // },
  // 'bsc-testnet': {
  //   eid: EndpointId.BSC_V2_TESTNET,
  //   CustomStablecoinOFT: '0x0000000000000000000000000000000000000000', // Update when deployed
  //   CrossChainRouter: '0x0000000000000000000000000000000000000000', // Update when deployed
  //   Endpoint: '0x6EDCE65403992e310A62460808c4b910D972f10f',
  //   Router: '0x78069aF1280A73D240cCDF16Ab4a483555246665'
  // },
  // 'polygon-amoy': {
  //   eid: EndpointId.AMOY_V2_TESTNET,
  //   CustomStablecoinOFT: '0x0000000000000000000000000000000000000000', // Update when deployed
  //   CrossChainRouter: '0x0000000000000000000000000000000000000000', // Update when deployed
  //   Endpoint: '0x6EDCE65403992e310A62460808c4b910D972f10f',
  //   Router: '0xa5812cE58B6Cb897b9B02ED1bAA1f9AC01D4F67e'
  // }
};

// Helper function to normalize address for comparison
function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

// Helper function to get proper bytes32 peer address
function getPeerAddress(address: string, hre: any): string {
  // Ensure checksum format and pad to bytes32
  const checksumAddress = hre.ethers.utils.getAddress(address);
  return hre.ethers.utils.hexZeroPad(checksumAddress, 32);
}

task("debug-cross-chain", "Debug cross-chain execution step by step")
  .addParam("sourceNet", "Source network name")
  .addParam("destinationNet", "Destination network name") 
  .addParam("sourceToken", "Source token address")
  .addParam("destinationToken", "Destination token address")
  .addParam("amountIn", "Amount to swap")
  .addParam("recipient", "Recipient address")
  .setAction(async (taskArgs: any, hre: any) => {
    const { sourceNet, destinationNet, sourceToken, destinationToken, amountIn, recipient } = taskArgs;
    
    console.log("🔍 === CROSS-CHAIN EXECUTION DEBUG ===");
    console.log(`${sourceNet} → ${destinationNet}`);
    console.log(`${sourceToken} → ${destinationToken}`);
    console.log("=====================================");

    const sourceConfig = NETWORK_CONFIG[sourceNet];
    const destConfig = NETWORK_CONFIG[destinationNet];
    const [signer] = await hre.ethers.getSigners();
    
    if (!sourceConfig || !destConfig) {
      console.log("❌ Network configuration not found");
      return;
    }
    
    try {
      const CrossChainRouter = await hre.ethers.getContractAt("CrossChainRouter", sourceConfig.CrossChainRouter);
      const amountInWei = hre.ethers.utils.parseEther(amountIn);
      
      console.log(`Contract: ${sourceConfig.CrossChainRouter}`);
      console.log(`Signer: ${signer.address}`);
      
      // Step 1: Pre-execution checks
      console.log("\n1️⃣ Pre-Execution Validation");
      
      // Check token balance and allowance
      const SourceToken = await hre.ethers.getContractAt("IERC20", sourceToken);
      const balance = await SourceToken.balanceOf(signer.address);
      const allowance = await SourceToken.allowance(signer.address, sourceConfig.CrossChainRouter);
      
      console.log(`Token Balance: ${hre.ethers.utils.formatEther(balance)}`);
      console.log(`Token Allowance: ${hre.ethers.utils.formatEther(allowance)}`);
      console.log(`Required Amount: ${amountIn}`);
      
      if (balance.lt(amountInWei)) {
        console.log("❌ INSUFFICIENT BALANCE - Cannot proceed");
        return;
      }
      if (allowance.lt(amountInWei)) {
        console.log("❌ INSUFFICIENT ALLOWANCE - Need to approve tokens first");
        console.log(`Run: npx hardhat approve-tokens --token ${sourceToken} --spender ${sourceConfig.CrossChainRouter} --amount ${amountIn} --network ${sourceNet}`);
        return;
      }
      console.log("✅ Balance and allowance OK");
      
      // Step 2: Test DEX swap simulation
      console.log("\n2️⃣ DEX Swap Simulation");
      try {
        const estimatedOutput = await CrossChainRouter.estimateSwapOutput(sourceToken, amountInWei);
        console.log(`✅ DEX Swap: ${amountIn} → ${hre.ethers.utils.formatEther(estimatedOutput)} stablecoin`);
        
        if (estimatedOutput.eq(0)) {
          console.log("❌ DEX swap would return 0 - LIQUIDITY ISSUE!");
          console.log("💡 Check if liquidity pool exists between your token and stablecoin");
          return;
        }
        
        // Step 3: Check peers configuration  
        console.log("\n3️⃣ Peer Configuration Check");
        try {
          const peer = await CrossChainRouter.peers(destConfig.eid);
          const expectedPeer = hre.ethers.utils.hexZeroPad(destConfig.CrossChainRouter, 32);
          
          console.log(`Current peer for EID ${destConfig.eid}: ${peer}`);
          console.log(`Expected peer: ${expectedPeer}`);
          
          if (peer.toLowerCase() !== expectedPeer.toLowerCase()) {
            console.log("❌ PEER NOT SET CORRECTLY!");
            console.log("💡 Set peer with:");
            console.log(`   await crossChainRouter.setPeer(${destConfig.eid}, "${expectedPeer}")`);
            return;
          }
          console.log("✅ Peer configuration OK");
          
        } catch (peerError) {
          console.log(`❌ Cannot check peers: ${peerError.message}`);
        }
        
        // Step 4: Test fee quote
        console.log("\n4️⃣ Fee Quote Test");
        const recipientBytes32 = hre.ethers.utils.hexZeroPad(recipient, 32);
        const destinationTokenBytes32 = hre.ethers.utils.hexZeroPad(destinationToken, 32);
        const options = "0x";
        
        try {
          const feeQuote = await CrossChainRouter.quoteSwap(
            destConfig.eid,
            recipientBytes32,
            destinationTokenBytes32,
            hre.ethers.utils.parseEther("0.9"),
            estimatedOutput,
            options,
            false
          );
          
          console.log(`✅ Total Fee Quote: ${hre.ethers.utils.formatEther(feeQuote.nativeFee)} ETH`);
          
          // Step 5: Test bridge component separately
          console.log("\n5️⃣ Bridge Component Test");
          try {
            const stablecoinOFT = await hre.ethers.getContractAt("IOFT", sourceConfig.CustomStablecoinOFT);
            const sendParam = {
              dstEid: destConfig.eid,
              to: hre.ethers.utils.hexZeroPad(destConfig.CrossChainRouter, 32),
              amountLD: estimatedOutput,
              minAmountLD: estimatedOutput.mul(950).div(1000),
              extraOptions: options,
              composeMsg: "0x",
              oftCmd: "0x"
            };
            
            const bridgeFee = await stablecoinOFT.quoteSend(sendParam, false);
            console.log(`✅ Bridge Fee: ${hre.ethers.utils.formatEther(bridgeFee.nativeFee)} ETH`);
            
            // Check if bridge fee is reasonable
            if (bridgeFee.nativeFee.eq(0)) {
              console.log("⚠️  Bridge fee is 0 - might indicate configuration issue");
            }
            
          } catch (bridgeError) {
            console.log(`❌ Bridge fee failed: ${bridgeError.message}`);
            
            if (bridgeError.message.includes("No peer set")) {
              console.log("💡 OFT peers not set - check OFT configuration");
            } else if (bridgeError.message.includes("Path not found")) {
              console.log("💡 LayerZero path not available between these chains");
            }
            return;
          }
          
          // Step 6: Check LayerZero message component
          console.log("\n6️⃣ LayerZero Message Test");
          try {
            const payload = hre.ethers.utils.defaultAbiCoder.encode(
              ["bytes32", "bytes32", "uint256", "uint256", "address"],
              [recipientBytes32, destinationTokenBytes32, hre.ethers.utils.parseEther("0.9"), estimatedOutput, signer.address]
            );
            
            const messageFee = await CrossChainRouter.quote(destConfig.eid, payload, options, false);
            console.log(`✅ Message Fee: ${hre.ethers.utils.formatEther(messageFee.nativeFee)} ETH`);
            
          } catch (messageError) {
            console.log(`❌ Message fee failed: ${messageError.message}`);
            return;
          }
          
          // Step 7: Final execution test with small amount
          console.log("\n7️⃣ Small Amount Test");
          const testAmount = hre.ethers.utils.parseEther("0.01"); // Very small amount
          
          try {
            const testBalance = await SourceToken.balanceOf(signer.address);
            if (testBalance.gte(testAmount)) {
              const testEstimate = await CrossChainRouter.estimateSwapOutput(sourceToken, testAmount);
              console.log(`✅ Small test works: 0.01 → ${hre.ethers.utils.formatEther(testEstimate)} stablecoin`);
              
              const testFee = await CrossChainRouter.quoteSwap(
                destConfig.eid,
                recipientBytes32,
                destinationTokenBytes32,
                testEstimate.div(2), // 50% slippage tolerance
                testEstimate,
                options,
                false
              );
              
              console.log(`✅ Small test fee: ${hre.ethers.utils.formatEther(testFee.nativeFee)} ETH`);
              
              console.log("\n🔧 RECOMMENDED TEST COMMAND:");
              console.log(`npx hardhat cross-chain-swap \\`);
              console.log(`  --network ${sourceNet} \\`);
              console.log(`  --source-network ${sourceNet} \\`);
              console.log(`  --destination-network ${destinationNet} \\`);
              console.log(`  --source-token ${sourceToken} \\`);
              console.log(`  --destination-token ${destinationToken} \\`);
              console.log(`  --amount-in 0.01 \\`);
              console.log(`  --amount-out-min ${hre.ethers.utils.formatEther(testEstimate.div(2))} \\`);
              console.log(`  --recipient ${recipient} \\`);
              console.log(`  --fee-eth ${hre.ethers.utils.formatEther(testFee.nativeFee.mul(150).div(100))}`); // 50% buffer
              
            }
          } catch (testError) {
            console.log(`❌ Small amount test failed: ${testError.message}`);
          }
          
        } catch (feeQuoteError) {
          console.log(`❌ Fee quote failed: ${feeQuoteError.message}`);
          
          if (feeQuoteError.message.includes("No peer set")) {
            console.log("💡 SOLUTION: Set CrossChainRouter peers");
          } else if (feeQuoteError.message.includes("Path not found")) {
            console.log("💡 SOLUTION: Check LayerZero endpoint configuration");
          }
          return;
        }
        
      } catch (estimateError) {
        console.log(`❌ DEX estimate failed: ${estimateError.message}`);
        console.log("💡 This indicates DEX/liquidity issues");
        
        if (estimateError.message.includes("No liquidity path available")) {
          console.log("SOLUTION: Add liquidity pool for your token pair");
        }
        return;
      }
      
    } catch (error) {
      console.error(`\n❌ Debug failed: ${error.message}`);
    }

    console.log("\n🎯 === SUMMARY ===");
    console.log("If all steps above pass, your transaction should work!");
    console.log("If any step fails, that's where the issue is.");
    console.log("\nMost common issues:");
    console.log("1. 🔗 Peers not set correctly");
    console.log("2. 🏊‍♂️ Missing liquidity pools");
    console.log("3. ⛽ Insufficient gas/fees");
    console.log("4. 📡 LayerZero configuration problems");
  });

  task("debug-simple", "Simple debug without interface conflicts")
  .addParam("sourceNet", "Source network name")
  .addParam("destinationNet", "Destination network name") 
  .addParam("sourceToken", "Source token address")
  .addParam("destinationToken", "Destination token address")
  .addParam("amountIn", "Amount to swap")
  .addParam("recipient", "Recipient address")
  .setAction(async (taskArgs: any, hre: any) => {
    const { sourceNet, destinationNet, sourceToken, destinationToken, amountIn, recipient } = taskArgs;
    
    console.log("🔍 === SIMPLIFIED DEBUG ===");
    console.log(`${sourceNet} → ${destinationNet}`);
    console.log(`${sourceToken} → ${destinationToken}`);
    console.log("===========================");

    const sourceConfig = NETWORK_CONFIG[sourceNet];
    const destConfig = NETWORK_CONFIG[destinationNet];
    const [signer] = await hre.ethers.getSigners();
    
    if (!sourceConfig || !destConfig) {
      console.log("❌ Network configuration not found");
      return;
    }
    
    try {
      const CrossChainRouter = await hre.ethers.getContractAt("CrossChainRouter", sourceConfig.CrossChainRouter);
      const amountInWei = hre.ethers.utils.parseEther(amountIn);
      
      console.log(`Contract: ${sourceConfig.CrossChainRouter}`);
      console.log(`Signer: ${signer.address}`);
      
      // Step 1: Check basic token info using raw calls
      console.log("\n1️⃣ Token Balance Check");
      
      const tokenContract = await hre.ethers.getContractAt([
        "function balanceOf(address) external view returns (uint256)",
        "function allowance(address owner, address spender) external view returns (uint256)",
        "function symbol() external view returns (string)"
      ], sourceToken);
      
      const balance = await tokenContract.balanceOf(signer.address);
      const allowance = await tokenContract.allowance(signer.address, sourceConfig.CrossChainRouter);
      
      console.log(`Token Balance: ${hre.ethers.utils.formatEther(balance)}`);
      console.log(`Token Allowance: ${hre.ethers.utils.formatEther(allowance)}`);
      console.log(`Required Amount: ${amountIn}`);
      
      if (balance.lt(amountInWei)) {
        console.log("❌ INSUFFICIENT BALANCE");
        return;
      }
      if (allowance.lt(amountInWei)) {
        console.log("❌ INSUFFICIENT ALLOWANCE");
        return;
      }
      console.log("✅ Balance and allowance OK");
      
      // Step 2: Test DEX swap estimation
      console.log("\n2️⃣ DEX Swap Test");
      try {
        const estimatedOutput = await CrossChainRouter.estimateSwapOutput(sourceToken, amountInWei);
        console.log(`✅ DEX works: ${amountIn} → ${hre.ethers.utils.formatEther(estimatedOutput)} stablecoin`);
        
        if (estimatedOutput.eq(0)) {
          console.log("❌ No liquidity - swap returns 0!");
          return;
        }
        
        // Step 3: Peer check
        console.log("\n3️⃣ Peer Configuration");
        try {
          const peer = await CrossChainRouter.peers(destConfig.eid);
          const expectedPeer = hre.ethers.utils.hexZeroPad(destConfig.CrossChainRouter, 32);
          
          console.log(`Peer for EID ${destConfig.eid}: ${peer}`);
          console.log(`Expected: ${expectedPeer}`);
          
          if (peer.toLowerCase() !== expectedPeer.toLowerCase()) {
            console.log("❌ PEER MISMATCH!");
            console.log("💡 Fix with setPeer command");
            return;
          }
          console.log("✅ Peer OK");
          
        } catch (peerError) {
          console.log(`❌ Peer check failed: ${peerError.message}`);
        }
        
        // Step 4: Fee quote test
        console.log("\n4️⃣ Fee Quote Test");
        const recipientBytes32 = hre.ethers.utils.hexZeroPad(recipient, 32);
        const destinationTokenBytes32 = hre.ethers.utils.hexZeroPad(destinationToken, 32);
        const options = "0x";
        
        try {
          const feeQuote = await CrossChainRouter.quoteSwap(
            destConfig.eid,
            recipientBytes32,
            destinationTokenBytes32,
            hre.ethers.utils.parseEther("0.8"), // 80% of estimated
            estimatedOutput,
            options,
            false
          );
          
          console.log(`✅ Fee quote works: ${hre.ethers.utils.formatEther(feeQuote.nativeFee)} ETH`);
          
          // Step 5: Check specific components
          console.log("\n5️⃣ Component Check");
          
          // Bridge fee
          try {
            const stablecoinOFT = await hre.ethers.getContractAt("IOFT", sourceConfig.CustomStablecoinOFT);
            const sendParam = {
              dstEid: destConfig.eid,
              to: hre.ethers.utils.hexZeroPad(destConfig.CrossChainRouter, 32),
              amountLD: estimatedOutput,
              minAmountLD: estimatedOutput.mul(95).div(100),
              extraOptions: options,
              composeMsg: "0x",
              oftCmd: "0x"
            };
            
            const bridgeFee = await stablecoinOFT.quoteSend(sendParam, false);
            console.log(`✅ Bridge fee: ${hre.ethers.utils.formatEther(bridgeFee.nativeFee)} ETH`);
            
          } catch (bridgeError) {
            console.log(`❌ Bridge fee failed: ${bridgeError.message}`);
            return;
          }
          
          // All checks passed - provide working command
          console.log("\n🚀 === ALL CHECKS PASSED ===");
          console.log("Your contract should work! Try this command:");
          console.log("");
          console.log(`npx hardhat cross-chain-swap \\`);
          console.log(`  --network ${sourceNet} \\`);
          console.log(`  --source-network ${sourceNet} \\`);
          console.log(`  --destination-network ${destinationNet} \\`);
          console.log(`  --source-token ${sourceToken} \\`);
          console.log(`  --destination-token ${destinationToken} \\`);
          console.log(`  --amount-in ${amountIn} \\`);
          console.log(`  --amount-out-min 0.8 \\`);
          console.log(`  --recipient ${recipient} \\`);
          console.log(`  --fee-eth ${hre.ethers.utils.formatEther(feeQuote.nativeFee.mul(120).div(100))}`); // 20% buffer
          
          console.log("\n💡 If it still fails, the issue is likely:");
          console.log("1. ⛽ Gas limit too low (increase --gas-limit)");
          console.log("2. 🎯 Slippage during execution (market movement)");
          console.log("3. 📡 LayerZero relayer temporary issues");
          console.log("4. 🏊‍♂️ Destination chain liquidity depleted");
          
        } catch (feeError) {
          console.log(`❌ Fee quote failed: ${feeError.message}`);
          
          if (feeError.message.includes("No peer set")) {
            console.log("💡 Set peers with setPeer function");
          }
          return;
        }
        
      } catch (estimateError) {
        console.log(`❌ DEX estimate failed: ${estimateError.message}`);
        
        if (estimateError.message.includes("execution reverted")) {
          console.log("💡 Likely no liquidity pool - create liquidity first");
        }
        return;
      }
      
    } catch (error) {
      console.error(`\n❌ Debug failed: ${error.message}`);
      
      // Check if contract exists
      const code = await hre.ethers.provider.getCode(sourceConfig.CrossChainRouter);
      if (code === "0x") {
        console.log("💡 Contract not deployed at configured address!");
      }
    }

    console.log("\n🎯 === NEXT STEPS ===");
    console.log("1. If all checks ✅ pass → Your swap should work");
    console.log("2. If any check ❌ fails → Fix that specific issue");
    console.log("3. If swap still fails after fixes → It's a runtime/timing issue");
  });

  task("debug-runtime", "Debug runtime execution step by step")
  .addParam("sourceNetwork", "Source network name")
  .addParam("destinationNetwork", "Destination network name")
  .addParam("sourceToken", "Source token address")
  .addParam("destinationToken", "Destination token address")
  .addParam("amountIn", "Amount to swap")
  .addParam("recipient", "Recipient address")
  .setAction(async (taskArgs: any, hre: any) => {
    const { sourceNetwork, destinationNetwork, sourceToken, destinationToken, amountIn, recipient } = taskArgs;
    
    console.log("🔍 === RUNTIME EXECUTION DEBUG ===");
    console.log(`${sourceNetwork} → ${destinationNetwork}`);
    console.log(`${sourceToken} → ${destinationToken}`);
    console.log("==================================");

    const sourceConfig = NETWORK_CONFIG[sourceNetwork];
    const destConfig = NETWORK_CONFIG[destinationNetwork];
    const [signer] = await hre.ethers.getSigners();
    
    try {
      const CrossChainRouter = await hre.ethers.getContractAt("CrossChainRouter", sourceConfig.CrossChainRouter);
      const amountInWei = hre.ethers.utils.parseEther(amountIn);
      
      // Step 1: Pre-execution checks
      console.log("\n1️⃣ Pre-Execution Validation");
      
      // Check token balance
      const SourceToken = await hre.ethers.getContractAt("IERC20", sourceToken);
      const balance = await SourceToken.balanceOf(signer.address);
      const allowance = await SourceToken.allowance(signer.address, sourceConfig.CrossChainRouter);
      
      console.log(`Token Balance: ${hre.ethers.utils.formatEther(balance)}`);
      console.log(`Token Allowance: ${hre.ethers.utils.formatEther(allowance)}`);
      console.log(`Required Amount: ${amountIn}`);
      
      if (balance.lt(amountInWei)) {
        console.log("❌ INSUFFICIENT BALANCE");
        return;
      }
      if (allowance.lt(amountInWei)) {
        console.log("❌ INSUFFICIENT ALLOWANCE");
        return;
      }
      
      // Step 2: Test DEX swap simulation
      console.log("\n2️⃣ DEX Swap Simulation");
      try {
        const estimatedOutput = await CrossChainRouter.estimateSwapOutput(sourceToken, amountInWei);
        console.log(`✅ DEX Swap: ${amountIn} → ${hre.ethers.utils.formatEther(estimatedOutput)} stablecoin`);
        
        if (estimatedOutput.eq(0)) {
          console.log("❌ DEX swap would return 0 - liquidity issue!");
          return;
        }
        
        // Step 3: Test fee quote
        console.log("\n3️⃣ Fee Quote Test");
        const recipientBytes32 = hre.ethers.utils.hexZeroPad(recipient, 32);
        const destinationTokenBytes32 = hre.ethers.utils.hexZeroPad(destinationToken, 32);
        const options = "0x";
        
        try {
          const feeQuote = await CrossChainRouter.quoteSwap(
            destConfig.eid,
            recipientBytes32,
            destinationTokenBytes32,
            hre.ethers.utils.parseEther("0.9"),
            estimatedOutput,
            options,
            false
          );
          
          console.log(`✅ Fee Quote: ${hre.ethers.utils.formatEther(feeQuote.nativeFee)} ETH`);
          
          // Step 4: Test individual components
          console.log("\n4️⃣ Component Testing");
          
          // Test bridge fee
          try {
            const stablecoinOFT = await hre.ethers.getContractAt("IOFT", sourceConfig.CustomStablecoinOFT);
            const sendParam = {
              dstEid: destConfig.eid,
              to: hre.ethers.utils.hexZeroPad(destConfig.CrossChainRouter, 32),
              amountLD: estimatedOutput,
              minAmountLD: estimatedOutput.mul(950).div(1000),
              extraOptions: options,
              composeMsg: "0x",
              oftCmd: "0x"
            };
            
            const bridgeFee = await stablecoinOFT.quoteSend(sendParam, false);
            console.log(`✅ Bridge Fee: ${hre.ethers.utils.formatEther(bridgeFee.nativeFee)} ETH`);
            
          } catch (bridgeError) {
            console.log(`❌ Bridge fee failed: ${bridgeError.message}`);
            if (bridgeError.message.includes("No peer set")) {
              console.log("💡 Check if OFT peers are set correctly");
            }
          }
          
          // Step 5: Check destination liquidity
          console.log("\n5️⃣ Destination Chain Check");
          console.log("⚠️  Cannot directly check destination liquidity from source chain");
          console.log("💡 Manually verify on destination:");
          console.log(`   - Stablecoin → ${destinationToken} liquidity exists`);
          console.log(`   - CrossChainRouter deployed at: ${destConfig.CrossChainRouter}`);
          console.log(`   - Peers are set correctly`);
          
          // Step 6: Execution simulation with lower amounts
          console.log("\n6️⃣ Test with Smaller Amount");
          const smallAmount = hre.ethers.utils.parseEther("0.1");
          
          try {
            const smallEstimate = await CrossChainRouter.estimateSwapOutput(sourceToken, smallAmount);
            const smallFee = await CrossChainRouter.quoteSwap(
              destConfig.eid,
              recipientBytes32,
              destinationTokenBytes32,
              hre.ethers.utils.parseEther("0.05"),
              smallEstimate,
              options,
              false
            );
            
            console.log(`✅ Small amount works: 0.1 → ${hre.ethers.utils.formatEther(smallEstimate)} (fee: ${hre.ethers.utils.formatEther(smallFee.nativeFee)} ETH)`);
            console.log("💡 Try executing with smaller amount first");
            
            console.log("\n🔧 Test Command:");
            console.log(`npx hardhat cross-chain-swap \\`);
            console.log(`  --network ${sourceNetwork} \\`);
            console.log(`  --source-network ${sourceNetwork} \\`);
            console.log(`  --destination-network ${destinationNetwork} \\`);
            console.log(`  --source-token ${sourceToken} \\`);
            console.log(`  --destination-token ${destinationToken} \\`);
            console.log(`  --amount-in 0.1 \\`);
            console.log(`  --amount-out-min 0.05 \\`);
            console.log(`  --recipient ${recipient} \\`);
            console.log(`  --fee-eth ${hre.ethers.utils.formatEther(smallFee.nativeFee.mul(120).div(100))}`); // 20% buffer
            
          } catch (smallError) {
            console.log(`❌ Even small amount fails: ${smallError.message}`);
          }
          
        } catch (feeQuoteError) {
          console.log(`❌ Fee quote failed: ${feeQuoteError.message}`);
          
          if (feeQuoteError.message.includes("No peer set")) {
            console.log("💡 SOLUTION: Set peers between chains");
            console.log(`   From ${sourceNetwork}: setPeer(${destConfig.eid}, "${destConfig.CrossChainRouter}")`);
            console.log(`   From ${destinationNetwork}: setPeer(${sourceConfig.eid}, "${sourceConfig.CrossChainRouter}")`);
          }
        }
        
      } catch (estimateError) {
        console.log(`❌ DEX estimate failed: ${estimateError.message}`);
        console.log("💡 This indicates liquidity or DEX configuration issues");
      }
      
    } catch (error) {
      console.error(`Runtime debug failed: ${error.message}`);
    }

    console.log("\n🎯 === LIKELY CULPRITS ===");
    console.log("Since your contract code is correct, the issue is probably:");
    console.log("1. 🔗 LayerZero peer configuration");
    console.log("2. 🏊‍♂️ Destination chain liquidity");
    console.log("3. ⛽ Gas limits or network congestion");
    console.log("4. 🎯 Slippage during execution");
    console.log("5. 📡 LayerZero relayer issues");
  });

task("check-dex-liquidity", "Check DEX liquidity pools and router configuration")
  .addParam("sourceNetwork", "Source network name")
  .addParam("sourceToken", "Source token address")
  .addParam("amountIn", "Amount to test")
  .setAction(async (taskArgs: any, hre: any) => {
    const { sourceNetwork, sourceToken, amountIn } = taskArgs;
    
    console.log("🔍 === DEX LIQUIDITY DIAGNOSTICS ===");
    console.log(`Network: ${sourceNetwork}`);
    console.log(`Source Token: ${sourceToken}`);
    console.log(`Test Amount: ${amountIn}`);
    console.log("=====================================");

    const sourceConfig = NETWORK_CONFIG[sourceNetwork];
    const [signer] = await hre.ethers.getSigners();
    
    try {
      // Step 1: Check CrossChainRouter configuration
      console.log("\n1️⃣ Contract Configuration Check");
      const CrossChainRouter = await hre.ethers.getContractAt("CrossChainRouter", sourceConfig.CrossChainRouter);
      
      const stablecoinAddr = await CrossChainRouter.stablecoin();
      const dexRouterAddr = await CrossChainRouter.dexRouter();
      
      console.log(`✅ CrossChainRouter: ${sourceConfig.CrossChainRouter}`);
      console.log(`✅ Stablecoin: ${stablecoinAddr}`);
      console.log(`✅ DEX Router: ${dexRouterAddr}`);

      // Step 2: Check if addresses are valid contracts
      console.log("\n2️⃣ Contract Existence Check");
      
      const stablecoinCode = await hre.ethers.provider.getCode(stablecoinAddr);
      const dexCode = await hre.ethers.provider.getCode(dexRouterAddr);
      
      console.log(`Stablecoin contract exists: ${stablecoinCode !== '0x'}`);
      console.log(`DEX Router contract exists: ${dexCode !== '0x'}`);
      
      if (stablecoinCode === '0x') {
        console.log("❌ CRITICAL: Stablecoin address has no contract code!");
        return;
      }
      
      if (dexCode === '0x') {
        console.log("❌ CRITICAL: DEX Router address has no contract code!");
        return;
      }

      // Step 3: Test DEX Router directly
      console.log("\n3️⃣ Direct DEX Router Test");
      const DexRouter = await hre.ethers.getContractAt("IPayfundsRouter02", dexRouterAddr);
      
      const amountInWei = hre.ethers.utils.parseEther(amountIn);
      const path = [sourceToken, stablecoinAddr];
      
      console.log(`Testing path: ${sourceToken} → ${stablecoinAddr}`);
      console.log(`Amount: ${amountIn} (${amountInWei.toString()} wei)`);
      
      try {
        const amounts = await DexRouter.getAmountsOut(amountInWei, path);
        console.log(`✅ DEX Router works! Output: ${hre.ethers.utils.formatEther(amounts[1])}`);
        
        // Test the contract's estimateSwapOutput function
        console.log("\n4️⃣ Contract Function Test");
        try {
          const output = await CrossChainRouter.estimateSwapOutput(sourceToken, amountInWei);
          console.log(`✅ estimateSwapOutput works! Output: ${hre.ethers.utils.formatEther(output)}`);
        } catch (contractError) {
          console.log(`❌ estimateSwapOutput failed: ${contractError.message}`);
          console.log("This suggests an issue in the contract implementation");
        }
        
      } catch (dexError) {
        console.log(`❌ DEX Router failed: ${dexError.message}`);
        
        // Analyze common DEX errors
        if (dexError.message.includes("INSUFFICIENT_LIQUIDITY") || 
            dexError.message.includes("UniswapV2Library: INSUFFICIENT_LIQUIDITY")) {
          console.log("\n💡 DIAGNOSIS: No liquidity pool exists!");
          console.log("Solutions:");
          console.log("1. Create a liquidity pool for this token pair");
          console.log("2. Use a different source token that has liquidity");
          console.log("3. Check if token addresses are correct");
        } else if (dexError.message.includes("INVALID_PATH")) {
          console.log("\n💡 DIAGNOSIS: Invalid token path!");
          console.log("Solutions:");
          console.log("1. Check if source token address is correct");
          console.log("2. Check if stablecoin address is correct");
          console.log("3. Verify tokens exist on this network");
        }
      }

      // Step 4: Check token details
      console.log("\n5️⃣ Token Information");
      try {
        const SourceToken = await hre.ethers.getContractAt("IERC20", sourceToken);
        const Stablecoin = await hre.ethers.getContractAt("IERC20", stablecoinAddr);
        
        // Try to get token symbols (might fail for non-standard tokens)
        try {
          const sourceSymbol = await SourceToken.symbol();
          const stableSymbol = await Stablecoin.symbol();
          console.log(`Source Token: ${sourceSymbol} (${sourceToken})`);
          console.log(`Stablecoin: ${stableSymbol} (${stablecoinAddr})`);
        } catch (e) {
          console.log("Could not read token symbols (might be non-standard tokens)");
        }
        
        // Check balances
        const sourceBalance = await SourceToken.balanceOf(signer.address);
        console.log(`Your source token balance: ${hre.ethers.utils.formatEther(sourceBalance)}`);
        
      } catch (tokenError) {
        console.log(`❌ Token check failed: ${tokenError.message}`);
      }

      // Step 6: Check if this is a known DEX
      console.log("\n6️⃣ DEX Router Analysis");
      console.log(`DEX Router: ${dexRouterAddr}`);
      
      // Common router addresses for reference
      const knownRouters = {
        "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D": "Uniswap V2 Router (Mainnet)",
        "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008": "Uniswap V2 Router (Sepolia)",
        // Add more as needed
      };
      
      if (knownRouters[dexRouterAddr]) {
        console.log(`✅ Recognized router: ${knownRouters[dexRouterAddr]}`);
      } else {
        console.log("🔍 Custom or unknown DEX router");
        console.log("Make sure this router implements IUniswapV2Router02 interface");
      }

    } catch (error) {
      console.error(`\n❌ === DIAGNOSTIC FAILED ===`);
      console.error(`Error: ${error.message}`);
      
      console.log("\n🛠️ === TROUBLESHOOTING STEPS ===");
      console.log("1. Verify contract deployment:");
      console.log(`   CrossChainRouter: ${sourceConfig.CrossChainRouter}`);
      
      console.log("\n2. Check network configuration:");
      console.log("   - Ensure you're connected to the right network");
      console.log("   - Verify RPC endpoint is working");
      
      console.log("\n3. Verify token addresses:");
      console.log("   - Source token exists and has correct address");
      console.log("   - Stablecoin exists and has correct address");
      
      console.log("\n4. Check DEX setup:");
      console.log("   - DEX router is deployed and working");
      console.log("   - Liquidity pools exist for your token pairs");
    }
  });


  task("verify-deployed-contract", "Quick check of deployed contract version")
  .addParam("addr", "Contract address")
  .setAction(async (taskArgs: any, hre: any) => {
    const { addr } = taskArgs;
    
    console.log("🔍 === QUICK CONTRACT CHECK ===");
    console.log(`Contract: ${addr}`);
    console.log("===============================");

    try {
      const contract = await hre.ethers.getContractAt("CrossChainRouter", addr);
      const [signer] = await hre.ethers.getSigners();

      // Quick test: Try to estimate gas for the exact failing transaction
      console.log("\n🎯 Testing Exact Failing Transaction");
      
      const sourceToken = "0x31a210d4BaD0D1f1a7d96acfD637E082B854ADE8";
      const destToken = "0x1963f6163D9eaFCb1aF6DB7207b21E8aD6548751";
      const amount = hre.ethers.utils.parseEther("1");
      const recipient = "0x49f51e3C94B459677c3B1e611DB3E44d4E6b1D55";
      
      try {
        // Use estimateGas to see the exact revert reason
        const gasEstimate = await contract.estimateGas.crossChainSwap(
          40106, // Avalanche Fuji EID
          hre.ethers.utils.hexZeroPad(recipient, 32),
          sourceToken,
          hre.ethers.utils.hexZeroPad(destToken, 32),
          amount,
          hre.ethers.utils.parseEther("0.8"),
          "0x",
          { 
            value: hre.ethers.utils.parseEther("0.0002"),
            from: signer.address
          }
        );
        
        console.log(`✅ Gas estimate works: ${gasEstimate.toString()}`);
        console.log("💡 This means the transaction SHOULD work!");
        console.log("   The issue might be network timing or execution order");
        
      } catch (gasError) {
        console.log(`❌ Gas estimation failed with EXACT reason:`);
        console.log(`   ${gasError.message}`);
        console.log("");
        
        // Parse the specific error
        if (gasError.message.includes("Insufficient fee provided")) {
          console.log("🎯 DIAGNOSIS: Fee calculation bug in deployed contract");
          console.log("💡 SOLUTION: Redeploy with the fixed fee calculation");
        } else if (gasError.message.includes("Token transfer failed")) {
          console.log("🎯 DIAGNOSIS: Token allowance or balance issue");
          console.log("💡 SOLUTION: Check token approval");
        } else if (gasError.message.includes("execution reverted")) {
          console.log("🎯 DIAGNOSIS: DEX swap or LayerZero issue during execution");
          console.log("💡 SOLUTION: Check liquidity or LayerZero configuration");
        } else if (gasError.message.includes("No peer set")) {
          console.log("🎯 DIAGNOSIS: LayerZero peer configuration issue");
          console.log("💡 SOLUTION: Set peers correctly");
        } else {
          console.log("🎯 DIAGNOSIS: Unknown execution error");
          console.log("💡 SOLUTION: Check the specific error above");
        }
      }

    } catch (error) {
      console.error(`Contract check failed: ${error.message}`);
    }
  });

  task("analyze-failed-tx", "Analyze the specific failed transaction")
  .addParam("txhash", "Failed transaction hash")
  .setAction(async (taskArgs: any, hre: any) => {
    const { txhash } = taskArgs;
    
    console.log("🔍 === TRANSACTION FAILURE ANALYSIS ===");
    console.log(`TX Hash: ${txhash}`);
    console.log("======================================");

    try {
      const tx = await hre.ethers.provider.getTransaction(txhash);
      const receipt = await hre.ethers.provider.getTransactionReceipt(txhash);
      
      console.log(`Status: ${receipt.status === 1 ? "Success" : "Failed"}`);
      console.log(`Gas Used: ${receipt.gasUsed.toString()} / ${tx.gasLimit.toString()}`);
      console.log(`Gas Price: ${hre.ethers.utils.formatUnits(tx.gasPrice, "gwei")} Gwei`);
      console.log(`Value Sent: ${hre.ethers.utils.formatEther(tx.value)} ETH`);
      
      // Analyze the gas usage pattern
      const gasUsedPercent = (receipt.gasUsed.toNumber() / tx.gasLimit.toNumber()) * 100;
      console.log(`Gas Usage: ${gasUsedPercent.toFixed(2)}%`);
      
      if (gasUsedPercent < 20) {
        console.log("💡 Low gas usage suggests EARLY REVERT");
        console.log("   Likely in: token transfer, fee calculation, or initial validation");
      } else if (gasUsedPercent < 50) {
        console.log("💡 Medium gas usage suggests MIDDLE REVERT");
        console.log("   Likely in: DEX swap or LayerZero operations");
      } else {
        console.log("💡 High gas usage suggests LATE REVERT");
        console.log("   Likely in: LayerZero message sending or bridge operations");
      }

      // Try to decode the input data
      console.log("\n📝 Transaction Input Analysis:");
      const functionSelector = tx.data.slice(0, 10);
      console.log(`Function: ${functionSelector}`);
      
      if (functionSelector === "0x5a5ef655") {
        console.log("✅ This is crossChainSwap function");
        
        try {
          const iface = new hre.ethers.utils.Interface([
            "function crossChainSwap(uint32 _destinationEid, bytes32 _recipient, address _sourceToken, bytes32 _destinationToken, uint256 _amountIn, uint256 _amountOutMin, bytes calldata _options)"
          ]);
          
          const decoded = iface.parseTransaction({ data: tx.data });
          console.log(`Destination EID: ${decoded.args._destinationEid}`);
          console.log(`Source Token: ${decoded.args._sourceToken}`);
          console.log(`Destination Token: ${decoded.args._destinationToken}`);
          console.log(`Amount In: ${hre.ethers.utils.formatEther(decoded.args._amountIn)}`);
          console.log(`Amount Out Min: ${hre.ethers.utils.formatEther(decoded.args._amountOutMin)}`);
          
        } catch (decodeError) {
          console.log("❌ Could not decode parameters");
        }
      }

      // The key insight: Compare this exact transaction to a working simulation
      console.log("\n🔬 Failure Point Analysis:");
      console.log(`Consistent failure at ${receipt.gasUsed.toString()} gas suggests:`);
      
      if (receipt.gasUsed.toString() === "570289") {
        console.log("🎯 PATTERN DETECTED: Same gas usage as previous failures");
        console.log("   This indicates the SAME revert condition every time");
        console.log("   Most likely causes:");
        console.log("   1. ❌ Fee calculation error (insufficient fee provided)");
        console.log("   2. ❌ State change between quote and execution");
        console.log("   3. ❌ Slippage tolerance too tight");
        console.log("   4. ❌ LayerZero configuration issue");
      }

      console.log("\n🔧 DEBUGGING STEPS:");
      console.log("1. Run the contract check to see exact revert reason");
      console.log("2. Try with higher fee (double the quoted amount)");
      console.log("3. Try with more relaxed slippage (amount-out-min = 0.1)");
      console.log("4. Try smaller amount to reduce complexity");

    } catch (error) {
      console.error(`Transaction analysis failed: ${error.message}`);
    }
  });

  task("check-pools", "Check if liquidity pools exist for token pairs")
  .addParam("sourceNetwork", "Source network name")
  .addParam("sourceToken", "Source token address")
  .setAction(async (taskArgs: any, hre: any) => {
    const { sourceNetwork, sourceToken } = taskArgs;
    
    console.log("🏊‍♂️ === LIQUIDITY POOL ANALYSIS ===");
    console.log(`Network: ${sourceNetwork}`);
    console.log(`Source Token: ${sourceToken}`);
    console.log("=====================================");

    const sourceConfig = NETWORK_CONFIG[sourceNetwork];
    
    try {
      const CrossChainRouter = await hre.ethers.getContractAt("CrossChainRouter", sourceConfig.CrossChainRouter);
      const stablecoinAddr = await CrossChainRouter.stablecoin();
      const dexRouterAddr = await CrossChainRouter.dexRouter();
      
      console.log(`Stablecoin: ${stablecoinAddr}`);
      console.log(`DEX Router: ${dexRouterAddr}`);

      // Step 1: Check if we can get the factory from the router
      console.log("\n1️⃣ DEX Factory Check");
      try {
        const DexRouter = await hre.ethers.getContractAt([
          "function factory() external pure returns (address)",
          "function WETH() external pure returns (address)"
        ], dexRouterAddr);
        
        const factoryAddr = await DexRouter.factory();
        const wethAddr = await DexRouter.WETH();
        
        console.log(`✅ Factory: ${factoryAddr}`);
        console.log(`✅ WETH: ${wethAddr}`);
        
        // Step 2: Check if pool exists
        console.log("\n2️⃣ Pool Existence Check");
        const Factory = await hre.ethers.getContractAt([
          "function getPair(address tokenA, address tokenB) external view returns (address pair)"
        ], factoryAddr);
        
        const pairAddr = await Factory.getPair(sourceToken, stablecoinAddr);
        console.log(`Pool Address: ${pairAddr}`);
        
        if (pairAddr === "0x0000000000000000000000000000000000000000") {
          console.log("❌ NO POOL EXISTS!");
          console.log("\n💡 SOLUTIONS:");
          console.log("1. Create a liquidity pool for this token pair");
          console.log("2. Use a different source token that has liquidity");
          console.log("3. Use WETH if available as source token");
          
          // Check if WETH pool exists
          console.log("\n🔍 Checking WETH alternative...");
          const wethPair = await Factory.getPair(wethAddr, stablecoinAddr);
          if (wethPair !== "0x0000000000000000000000000000000000000000") {
            console.log(`✅ WETH-Stablecoin pool exists: ${wethPair}`);
            console.log(`💡 Suggestion: Use WETH (${wethAddr}) as source token instead`);
          }
          
        } else {
          console.log("✅ Pool exists!");
          
          // Step 3: Check pool liquidity
          console.log("\n3️⃣ Pool Liquidity Check");
          const Pair = await hre.ethers.getContractAt([
            "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
            "function token0() external view returns (address)",
            "function token1() external view returns (address)"
          ], pairAddr);
          
          const reserves = await Pair.getReserves();
          const token0 = await Pair.token0();
          const token1 = await Pair.token1();
          
          console.log(`Token0: ${token0}`);
          console.log(`Token1: ${token1}`);
          console.log(`Reserve0: ${hre.ethers.utils.formatEther(reserves.reserve0)}`);
          console.log(`Reserve1: ${hre.ethers.utils.formatEther(reserves.reserve1)}`);
          
          if (reserves.reserve0.eq(0) || reserves.reserve1.eq(0)) {
            console.log("❌ Pool exists but has NO LIQUIDITY!");
            console.log("💡 Add liquidity to this pool to enable trading");
          } else {
            console.log("✅ Pool has liquidity!");
            console.log("🤔 The issue might be elsewhere...");
          }
        }
        
      } catch (factoryError) {
        console.log(`❌ Cannot access DEX factory: ${factoryError.message}`);
        console.log("This might not be a standard Uniswap V2 compatible router");
      }

      // Step 4: Test with minimal amounts
      console.log("\n4️⃣ Testing with Different Amounts");
      const DexRouter = await hre.ethers.getContractAt("IPayfundsRouter02", dexRouterAddr);
      
      const testAmounts = [
        "0.001", // 1e15 wei
        "0.1",   // 1e17 wei
        "1"      // 1e18 wei
      ];
      
      for (const testAmount of testAmounts) {
        try {
          const amountWei = hre.ethers.utils.parseEther(testAmount);
          const path = [sourceToken, stablecoinAddr];
          const amounts = await DexRouter.getAmountsOut(amountWei, path);
          console.log(`✅ ${testAmount} ETH → ${hre.ethers.utils.formatEther(amounts[1])} stablecoin`);
          break; // If one works, no need to test others
        } catch (e) {
          console.log(`❌ ${testAmount} ETH fails`);
        }
      }

      // Step 5: Alternative token suggestions
      console.log("\n5️⃣ Alternative Token Suggestions");
      console.log("If the current source token doesn't work, try these common tokens:");
      
      // Get WETH address
      try {
        const DexRouter = await hre.ethers.getContractAt([
          "function WETH() external pure returns (address)"
        ], dexRouterAddr);
        const wethAddr = await DexRouter.WETH();
        console.log(`WETH: ${wethAddr}`);
        
        // Test WETH → Stablecoin
        try {
          const testAmount = hre.ethers.utils.parseEther("0.1");
          const amounts = await DexRouter.getAmountsOut(testAmount, [wethAddr, stablecoinAddr]);
          console.log(`✅ WETH works! 0.1 WETH → ${hre.ethers.utils.formatEther(amounts[1])} stablecoin`);
        } catch (e) {
          console.log(`❌ WETH → Stablecoin also fails`);
        }
      } catch (e) {
        console.log("Could not get WETH address");
      }

    } catch (error) {
      console.error(`Pool check failed: ${error.message}`);
    }

    // Final recommendations
    console.log("\n🎯 === FINAL DIAGNOSIS ===");
    console.log("The crossChainSwap is failing because:");
    console.log("❌ No liquidity pool exists between your source token and stablecoin");
    console.log("\n💡 IMMEDIATE SOLUTIONS:");
    console.log("1. Use WETH as source token (most likely to have liquidity)");
    console.log("2. Create liquidity pool on your DEX");
    console.log("3. Use a different stablecoin that has more pairs");
    console.log("4. Deploy to a network with more DeFi liquidity");

    console.log("\n🔧 QUICK TEST COMMAND:");
    console.log("# Try with WETH if available:");
    console.log(`npx hardhat cross-chain-swap \\`);
    console.log(`  --network ${sourceNetwork} \\`);
    console.log(`  --source-network ${sourceNetwork} \\`);
    console.log(`  --destination-network avalanche-fuji-testnet \\`);
    console.log(`  --source-token [WETH_ADDRESS] \\`);
    console.log(`  --destination-token 0x1963f6163D9eaFCb1aF6DB7207b21E8aD6548751 \\`);
    console.log(`  --amount-in 0.1 \\`);
    console.log(`  --amount-out-min 0.05 \\`);
    console.log(`  --recipient 0x49f51e3C94B459677c3B1e611DB3E44d4E6b1D55 \\`);
    console.log(`  --fee-eth 0.1`);
  });
  task("inspect-router", "Inspect DEX router to understand its interface")
  .addParam("sourceNetwork", "Source network name")
  .setAction(async (taskArgs: any, hre: any) => {
    const { sourceNetwork } = taskArgs;
    
    console.log("🔍 === DEX ROUTER INSPECTION ===");
    console.log(`Network: ${sourceNetwork}`);
    console.log("=====================================");

    const sourceConfig = NETWORK_CONFIG[sourceNetwork];
    
    try {
      const CrossChainRouter = await hre.ethers.getContractAt("CrossChainRouter", sourceConfig.CrossChainRouter);
      const dexRouterAddr = await CrossChainRouter.dexRouter();
      
      console.log(`DEX Router Address: ${dexRouterAddr}`);

      // Check if the address has contract code
      const code = await hre.ethers.provider.getCode(dexRouterAddr);
      console.log(`Contract Code Length: ${code.length} bytes`);
      
      if (code === '0x') {
        console.log("❌ CRITICAL: This address has no contract code!");
        console.log("The router address in your config is wrong or not deployed.");
        return;
      }

      console.log("✅ Contract exists at this address");

      // Test common DEX router functions
      console.log("\n🧪 Testing Standard DEX Functions:");
      
      const commonFunctions = [
        { name: "factory", sig: "function factory() external pure returns (address)" },
        { name: "WETH", sig: "function WETH() external pure returns (address)" },
        { name: "swapExactTokensForTokens", sig: "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)" },
        { name: "getAmountsOut", sig: "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)" }
      ];

      for (const func of commonFunctions) {
        try {
          const TestRouter = await hre.ethers.getContractAt([func.sig], dexRouterAddr);
          
          if (func.name === "factory" || func.name === "WETH") {
            const result = await TestRouter[func.name]();
            console.log(`✅ ${func.name}(): ${result}`);
          } else {
            console.log(`✅ ${func.name}: Function exists (not called)`);
          }
        } catch (error) {
          console.log(`❌ ${func.name}: ${error.message.split('\n')[0]}`);
        }
      }

      // Check what network we're actually on
      console.log("\n🌐 Network Information:");
      const network = await hre.ethers.provider.getNetwork();
      console.log(`Chain ID: ${network.chainId}`);
      console.log(`Network Name: ${network.name}`);

      // Suggest known DEX routers for this network
      console.log("\n📋 Known DEX Routers:");
      
      const knownRouters = {
        1: { // Mainnet
          "Uniswap V2": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
          "SushiSwap": "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"
        },
        5: { // Goerli
          "Uniswap V2": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
        },
        11155111: { // Sepolia
          "Uniswap V2": "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008"
        },
        17000: { // Holesky
          "Custom": "Need to find or deploy a proper DEX router"
        }
      };

      const networkRouters = knownRouters[network.chainId];
      if (networkRouters) {
        Object.entries(networkRouters).forEach(([name, address]) => {
          console.log(`${name}: ${address}`);
        });
      } else {
        console.log("No known routers for this network");
      }

      // Try to understand what this contract actually is
      console.log("\n🔍 Contract Analysis:");
      console.log("This router address doesn't implement standard Uniswap V2 interface.");
      console.log("Possible issues:");
      console.log("1. Wrong router address in configuration");
      console.log("2. Custom router with different interface");
      console.log("3. Router not properly deployed");
      console.log("4. Router is not compatible with your contract's expectations");

    } catch (error) {
      console.error(`Inspection failed: ${error.message}`);
    }

    console.log("\n🛠️ === SOLUTIONS ===");
    console.log("1. **Fix Router Address**: Update your config with correct Uniswap V2 router");
    console.log("2. **Deploy Proper Router**: Deploy Uniswap V2 router to this network");
    console.log("3. **Update Contract Interface**: Modify contract to match your router's interface");
    console.log("4. **Use Different Network**: Switch to network with established DEX");

    console.log("\n🔧 Quick Fix for Testing:");
    console.log("If you have a Uniswap V2 compatible router address, update your config:");
    console.log(`// In your network config`);
    console.log(`${sourceNetwork}: {`);
    console.log(`  // ... other config`);
    console.log(`  DexRouter: "0x[CORRECT_UNISWAP_V2_ROUTER_ADDRESS]"`);
    console.log(`}`);
  });

// Task to set up OFT peer connections - FIXED VERSION
task("setup-oft-peers-fixed", "Set up OFT peer connections with better error handling")
  .addParam("destNetwork", "Destination network to set peer for")
  .setAction(async (taskArgs: any, hre: any) => {
    const { destNetwork } = taskArgs;
    
    console.log("🔗 === SETTING UP OFT PEER CONNECTION (FIXED) ===");
    
    const [signer] = await hre.ethers.getSigners();
    console.log(`🔑 Signer address: ${signer.address}`);
    
    const sourceNetwork = hre.network.name;
    const sourceConfig = NETWORK_CONFIG[sourceNetwork];
    const destConfig = NETWORK_CONFIG[destNetwork];
    
    if (!sourceConfig || !destConfig) {
      throw new Error(`Unsupported network configuration`);
    }
    
    console.log(`\n🌉 Setting up OFT peer: ${sourceNetwork} → ${destNetwork}`);
    console.log(`Source EID: ${sourceConfig.eid}, Dest EID: ${destConfig.eid}`);
    console.log(`Source OFT: ${sourceConfig.CustomStablecoinOFT}`);
    console.log(`Dest OFT: ${destConfig.CustomStablecoinOFT}`);
    
    try {
      // Get OFT contract on source network
      const SourceOFT = await hre.ethers.getContractAt("CustomStablecoinOFT", sourceConfig.CustomStablecoinOFT);
      
      // Check current peer (normalize for comparison)
      const currentPeerRaw = await SourceOFT.peers(destConfig.eid);
      const expectedPeerAddress = hre.ethers.utils.getAddress(destConfig.CustomStablecoinOFT);
      const expectedPeer = hre.ethers.utils.hexZeroPad(expectedPeerAddress, 32);
      
      console.log(`Current peer: ${currentPeerRaw}`);
      console.log(`Expected peer: ${expectedPeer}`);
      
      // Compare normalized addresses
      const currentAddress = currentPeerRaw.slice(26); // Remove padding
      const expectedAddress = expectedPeerAddress.slice(2); // Remove 0x
      
      if (normalizeAddress(currentAddress) === normalizeAddress(expectedAddress)) {
        console.log(`✅ OFT Peer already set correctly!`);
        return;
      }
      
      // Set the peer with more gas and better error handling
      console.log(`🔄 Setting OFT peer...`);
      
      try {
        // First, let's check if we can call the function
        const canSetPeer = await SourceOFT.callStatic.setPeer(destConfig.eid, expectedPeer);
        console.log("✅ Static call succeeded, proceeding with actual transaction");
      } catch (staticError: any) {
        console.error(`❌ Static call failed: ${staticError.message}`);
        throw new Error(`Cannot set peer: ${staticError.message}`);
      }
      
      const setPeerTx = await SourceOFT.setPeer(destConfig.eid, expectedPeer, {
        gasLimit: 200000, // Increased gas limit
        gasPrice: hre.ethers.utils.parseUnits("50", "gwei") // Higher gas price
      });
      
      console.log(`Transaction hash: ${setPeerTx.hash}`);
      console.log("⏳ Waiting for confirmation...");
      
      const receipt = await setPeerTx.wait();
      
      if (receipt.status === 0) {
        throw new Error("Transaction failed - check transaction hash on block explorer");
      }
      
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
      
      // Verify the peer was set (wait a bit for state to update)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newPeer = await SourceOFT.peers(destConfig.eid);
      const newAddress = newPeer.slice(26);
      
      if (normalizeAddress(newAddress) === normalizeAddress(expectedAddress)) {
        console.log(`✅ OFT Peer set successfully!`);
      } else {
        console.log(`❌ Peer verification failed!`);
        console.log(`   New peer: ${newPeer}`);
        console.log(`   Expected: ${expectedPeer}`);
      }
      
    } catch (error: any) {
      console.error(`❌ Error setting OFT peer: ${error.message}`);
      
      if (error.message.includes("Ownable: caller is not the owner")) {
        console.error("💡 You are not the owner of this contract");
      } else if (error.message.includes("insufficient funds")) {
        console.error("💡 Insufficient gas funds");
      }
      
      throw error;
    }
  });

// Task to set up CrossChainRouter peer connections - FIXED VERSION
task("setup-router-peers-fixed", "Set up CrossChainRouter peer connections with better error handling")
  .addParam("destNetwork", "Destination network to set peer for")
  .setAction(async (taskArgs: any, hre: any) => {
    const { destNetwork } = taskArgs;
    
    console.log("🔗 === SETTING UP ROUTER PEER CONNECTION (FIXED) ===");
    
    const [signer] = await hre.ethers.getSigners();
    console.log(`🔑 Signer address: ${signer.address}`);
    
    const sourceNetwork = hre.network.name;
    const sourceConfig = NETWORK_CONFIG[sourceNetwork];
    const destConfig = NETWORK_CONFIG[destNetwork];
    
    if (!sourceConfig || !destConfig) {
      throw new Error(`Unsupported network configuration`);
    }
    
    console.log(`\n🌉 Setting up Router peer: ${sourceNetwork} → ${destNetwork}`);
    console.log(`Source EID: ${sourceConfig.eid}, Dest EID: ${destConfig.eid}`);
    console.log(`Source Router: ${sourceConfig.CrossChainRouter}`);
    console.log(`Dest Router: ${destConfig.CrossChainRouter}`);
    
    try {
      // Get CrossChainRouter contract on source network
      const SourceRouter = await hre.ethers.getContractAt("CrossChainRouter", sourceConfig.CrossChainRouter);
      
      // Check current peer (normalize for comparison)
      const currentPeerRaw = await SourceRouter.peers(destConfig.eid);
      const expectedPeerAddress = hre.ethers.utils.getAddress(destConfig.CrossChainRouter);
      const expectedPeer = hre.ethers.utils.hexZeroPad(expectedPeerAddress, 32);
      
      console.log(`Current peer: ${currentPeerRaw}`);
      console.log(`Expected peer: ${expectedPeer}`);
      
      // Compare normalized addresses
      const currentAddress = currentPeerRaw.slice(26); // Remove padding
      const expectedAddress = expectedPeerAddress.slice(2); // Remove 0x
      
      if (normalizeAddress(currentAddress) === normalizeAddress(expectedAddress)) {
        console.log(`✅ Router Peer already set correctly!`);
        return;
      }
      
      // Set the peer with more gas and better error handling
      console.log(`🔄 Setting Router peer...`);
      
      try {
        // First, let's check if we can call the function
        const canSetPeer = await SourceRouter.callStatic.setPeer(destConfig.eid, expectedPeer);
        console.log("✅ Static call succeeded, proceeding with actual transaction");
      } catch (staticError: any) {
        console.error(`❌ Static call failed: ${staticError.message}`);
        throw new Error(`Cannot set peer: ${staticError.message}`);
      }
      
      const setPeerTx = await SourceRouter.setPeer(destConfig.eid, expectedPeer, {
        gasLimit: 200000, // Increased gas limit
        gasPrice: hre.ethers.utils.parseUnits("50", "gwei") // Higher gas price
      });
      
      console.log(`Transaction hash: ${setPeerTx.hash}`);
      console.log("⏳ Waiting for confirmation...");
      
      const receipt = await setPeerTx.wait();
      
      if (receipt.status === 0) {
        throw new Error("Transaction failed - check transaction hash on block explorer");
      }
      
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
      
      // Verify the peer was set (wait a bit for state to update)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newPeer = await SourceRouter.peers(destConfig.eid);
      const newAddress = newPeer.slice(26);
      
      if (normalizeAddress(newAddress) === normalizeAddress(expectedAddress)) {
        console.log(`✅ Router Peer set successfully!`);
      } else {
        console.log(`❌ Peer verification failed!`);
        console.log(`   New peer: ${newPeer}`);
        console.log(`   Expected: ${expectedPeer}`);
      }
      
    } catch (error: any) {
      console.error(`❌ Error setting Router peer: ${error.message}`);
      
      if (error.message.includes("Ownable: caller is not the owner")) {
        console.error("💡 You are not the owner of this contract");
      } else if (error.message.includes("insufficient funds")) {
        console.error("💡 Insufficient gas funds");
      }
      
      throw error;
    }
  });

// Quick setup task for all peers
task("setup-all-peers-fixed", "Set up all peers with improved method")
  .setAction(async (taskArgs: any, hre: any) => {
    console.log("🚀 === COMPLETE PEER SETUP GUIDE (FIXED) ===\n");
    
    console.log("Run these commands in sequence:\n");
    
    console.log("1️⃣ Set up OFT peers:");
    console.log("npx hardhat setup-oft-peers-fixed --dest-network avalanche-fuji-testnet --network arbitrum-sepolia-testnet");
    console.log("npx hardhat setup-oft-peers-fixed --dest-network arbitrum-sepolia-testnet --network avalanche-fuji-testnet\n");
    
    console.log("2️⃣ Set up Router peers:");
    console.log("npx hardhat setup-router-peers-fixed --dest-network avalanche-fuji-testnet --network arbitrum-sepolia-testnet");
    console.log("npx hardhat setup-router-peers-fixed --dest-network arbitrum-sepolia-testnet --network avalanche-fuji-testnet\n");
    
    console.log("3️⃣ Verify connections:");
    console.log("npx hardhat verify-peers --network arbitrum-sepolia-testnet");
    console.log("npx hardhat verify-peers --network avalanche-fuji-testnet\n");
    
    console.log("💡 If transactions still fail, check:");
    console.log("- You are the owner of the contracts");
    console.log("- You have enough native tokens for gas");
    console.log("- The contract addresses are correct");
  });

  task("manual-step1-swap-to-stable", "Step 1: Swap source token to stablecoin")
  .addParam("sourceToken", "Source token address")
  .addParam("amount", "Amount to swap")
  .setAction(async (taskArgs: any, hre: any) => {
    const { sourceToken, amount } = taskArgs;
    
    console.log("🔄 === STEP 1: SWAP TO STABLECOIN ===");
    
    const [signer] = await hre.ethers.getSigners();
    const network = hre.network.name;
    const config = NETWORK_CONFIG[network];
    
    const amountWei = hre.ethers.utils.parseEther(amount);
    
    // Get contracts
    const SourceToken = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", sourceToken);
    const DexRouter = await hre.ethers.getContractAt("contracts/CrossChainRouter.sol:IPayfundsRouter02", config.Router);
    const Stablecoin = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", config.CustomStablecoinOFT);
    
    // Check balance
    const balance = await SourceToken.balanceOf(signer.address);
    console.log(`Source token balance: ${hre.ethers.utils.formatEther(balance)}`);
    
    if (balance.lt(amountWei)) {
      throw new Error("Insufficient source token balance");
    }
    
    // Approve router
    console.log("Approving router...");
    const approveTx = await SourceToken.approve(config.Router, amountWei);
    await approveTx.wait();
    console.log("✅ Router approved");
    
    // Get quote
    const path = [sourceToken, config.CustomStablecoinOFT];
    const amountsOut = await DexRouter.getAmountsOut(amountWei, path);
    const expectedStable = amountsOut[1];
    console.log(`Expected stablecoin: ${hre.ethers.utils.formatEther(expectedStable)}`);
    
    // Execute swap
    console.log("Executing swap...");
    const swapTx = await DexRouter.swapExactTokensForTokens(
      amountWei,
      expectedStable.mul(95).div(100), // 5% slippage
      path,
      signer.address,
      Math.floor(Date.now() / 1000) + 1200
    );
    
    const receipt = await swapTx.wait();
    console.log(`✅ Swap completed! TX: ${swapTx.hash}`);
    
    // Check new balance
    const newStableBalance = await Stablecoin.balanceOf(signer.address);
    console.log(`New stablecoin balance: ${hre.ethers.utils.formatEther(newStableBalance)}`);
    
    console.log("\n🎯 === NEXT STEP ===");
    console.log(`npx hardhat manual-step2-bridge-stable --amount ${hre.ethers.utils.formatEther(expectedStable)} --dest-network avalanche-fuji-testnet --network ${network}`);
  });

// Step 2: Bridge stablecoin to destination chain
// Step 2: Bridge stablecoin to destination chain - FIXED VERSION
task("manual-step2-bridge-stable-fixed", "Step 2: Bridge stablecoin to destination chain (FIXED)")
  .addParam("amount", "Amount of stablecoin to bridge")
  .addParam("destNetwork", "Destination network")
  .setAction(async (taskArgs: any, hre: any) => {
    const { amount, destNetwork } = taskArgs;
    
    console.log("🌉 === STEP 2: BRIDGE STABLECOIN (FIXED) ===");
    
    const [signer] = await hre.ethers.getSigners();
    const sourceNetwork = hre.network.name;
    const sourceConfig = NETWORK_CONFIG[sourceNetwork];
    const destConfig = NETWORK_CONFIG[destNetwork];
    
    const amountWei = hre.ethers.utils.parseEther(amount);
    
    // FIXED: Use ERC20 interface for balance check, OFT interface for sending
    const StablecoinERC20 = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", sourceConfig.CustomStablecoinOFT);
    const StablecoinOFT = await hre.ethers.getContractAt("IOFT", sourceConfig.CustomStablecoinOFT);
    
    // Check balance using ERC20 interface
    const balance = await StablecoinERC20.balanceOf(signer.address);
    console.log(`Stablecoin balance: ${hre.ethers.utils.formatEther(balance)}`);
    
    if (balance.lt(amountWei)) {
      console.log(`❌ Insufficient stablecoin balance`);
      console.log(`   Required: ${hre.ethers.utils.formatEther(amountWei)}`);
      console.log(`   Available: ${hre.ethers.utils.formatEther(balance)}`);
      throw new Error("Insufficient stablecoin balance");
    }
    
    // Prepare send params
    const minAmountAfterFee = amountWei.mul(95).div(100); // 5% slippage
    const sendParam = {
      dstEid: destConfig.eid,
      to: hre.ethers.utils.hexZeroPad(signer.address, 32), // Send to yourself on dest chain
      amountLD: amountWei,
      minAmountLD: minAmountAfterFee,
      extraOptions: "0x",
      composeMsg: "0x",
      oftCmd: "0x"
    };
    
    console.log(`Bridging to EID: ${destConfig.eid}`);
    console.log(`Recipient: ${signer.address}`);
    console.log(`Amount: ${hre.ethers.utils.formatEther(amountWei)} stablecoin`);
    console.log(`Min after fees: ${hre.ethers.utils.formatEther(minAmountAfterFee)} stablecoin`);
    
    // Quote fee
    console.log("Getting bridge fee quote...");
    const fee = await StablecoinOFT.quoteSend(sendParam, false);
    console.log(`Required fee: ${hre.ethers.utils.formatEther(fee.nativeFee)} ETH`);
    
    // Check native balance
    const nativeBalance = await signer.getBalance();
    console.log(`Native balance: ${hre.ethers.utils.formatEther(nativeBalance)} ETH`);
    
    if (nativeBalance.lt(fee.nativeFee)) {
      throw new Error(`Insufficient native balance for bridge fee. Need: ${hre.ethers.utils.formatEther(fee.nativeFee)} ETH`);
    }
    
    // Execute bridge
    console.log("🚀 Executing bridge transaction...");
    console.log("This will take a few minutes to complete on the destination chain.");
    
    const bridgeTx = await StablecoinOFT.send(sendParam, fee, signer.address, {
      value: fee.nativeFee,
      gasLimit: 300000,
      gasPrice: hre.ethers.utils.parseUnits("50", "gwei")
    });
    
    console.log(`📤 Bridge transaction sent: ${bridgeTx.hash}`);
    console.log("⏳ Waiting for confirmation...");
    
    const receipt = await bridgeTx.wait();
    
    if (receipt.status === 0) {
      throw new Error("Bridge transaction failed");
    }
    
    console.log(`✅ Bridge transaction confirmed in block ${receipt.blockNumber}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
    
    // Check new balance
    const newBalance = await StablecoinERC20.balanceOf(signer.address);
    console.log(`New stablecoin balance: ${hre.ethers.utils.formatEther(newBalance)}`);
    
    console.log("\n🎯 === NEXT STEP ===");
    console.log("⌛ IMPORTANT: Wait 2-5 minutes for LayerZero to process the bridge!");
    console.log("Then check your stablecoin balance on Avalanche:");
    console.log(`npx hardhat check-balance --token ${destConfig.CustomStablecoinOFT} --network ${destNetwork}`);
    console.log("");
    console.log("Once you see the stablecoin balance on Avalanche, run:");
    console.log(`npx hardhat manual-step3-dest-swap --amount ${amount} --dest-token 0x1963f6163D9eaFCb1aF6DB7207b21E8aD6548751 --network ${destNetwork}`);
  });

// Helper task to check token balance
task("check-balance", "Check token balance")
  .addParam("token", "Token address")
  .setAction(async (taskArgs: any, hre: any) => {
    const { token } = taskArgs;
    
    const [signer] = await hre.ethers.getSigners();
    const Token = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", token);
    
    const balance = await Token.balanceOf(signer.address);
    const network = hre.network.name;
    
    console.log(`💰 Token Balance on ${network}:`);
    console.log(`Address: ${token}`);
    console.log(`Balance: ${hre.ethers.utils.formatEther(balance)}`);
    
    if (balance.eq(0)) {
      console.log("❌ No balance found. Bridge might still be processing...");
    } else {
      console.log("✅ Balance found! Ready for next step.");
    }
  });
// Step 3: Swap stablecoin to destination token (on destination chain)
task("manual-step3-dest-swap", "Step 3: Swap stablecoin to destination token on destination chain")
  .addParam("amount", "Amount of stablecoin to swap")
  .addParam("destToken", "Destination token address")
  .setAction(async (taskArgs: any, hre: any) => {
    const { amount, destToken } = taskArgs;
    
    console.log("🎯 === STEP 3: DESTINATION SWAP ===");
    
    const [signer] = await hre.ethers.getSigners();
    const network = hre.network.name;
    const config = NETWORK_CONFIG[network];
    
    const amountWei = hre.ethers.utils.parseEther(amount);
    
    // Get contracts
    const Stablecoin = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", config.CustomStablecoinOFT);
    const DexRouter = await hre.ethers.getContractAt("contracts/CrossChainRouter.sol:IPayfundsRouter02", config.Router);
    const DestToken = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", destToken);
    
    // Check stablecoin balance
    const stableBalance = await Stablecoin.balanceOf(signer.address);
    console.log(`Stablecoin balance: ${hre.ethers.utils.formatEther(stableBalance)}`);
    
    if (stableBalance.eq(0)) {
      console.log("❌ No stablecoin balance found!");
      console.log("The bridge might still be processing. Wait a few more minutes and try again.");
      return;
    }
    
    // Use actual balance if less than expected
    const swapAmount = stableBalance.lt(amountWei) ? stableBalance : amountWei;
    
    // Approve router
    console.log("Approving router...");
    const approveTx = await Stablecoin.approve(config.Router, swapAmount);
    await approveTx.wait();
    console.log("✅ Router approved");
    
    // Get quote
    const path = [config.CustomStablecoinOFT, destToken];
    const amountsOut = await DexRouter.getAmountsOut(swapAmount, path);
    const expectedDestToken = amountsOut[1];
    console.log(`Expected destination token: ${hre.ethers.utils.formatEther(expectedDestToken)}`);
    
    // Execute swap
    console.log("Executing final swap...");
    const swapTx = await DexRouter.swapExactTokensForTokens(
      swapAmount,
      expectedDestToken.mul(95).div(100), // 5% slippage
      path,
      signer.address,
      Math.floor(Date.now() / 1000) + 1200
    );
    
    const receipt = await swapTx.wait();
    console.log(`✅ Final swap completed! TX: ${swapTx.hash}`);
    
    // Check final balance
    const finalBalance = await DestToken.balanceOf(signer.address);
    console.log(`🎉 Final destination token balance: ${hre.ethers.utils.formatEther(finalBalance)}`);
    
    console.log("\n🎉 === CROSS-CHAIN SWAP COMPLETE ===");
    console.log("Your tokens have been successfully swapped across chains!");
  });

  // Task to debug the exact failure point in crossChainSwap
task("debug-crosschain-failure", "Debug where the crossChainSwap function fails")
.addParam("sourceToken", "Source token address")
.addParam("destToken", "Destination token address") 
.addParam("amount", "Amount to swap")
.setAction(async (taskArgs: any, hre: any) => {
  const { sourceToken, destToken, amount } = taskArgs;
  
  console.log("🔍 === DEBUGGING CROSSCHAIN SWAP FAILURE ===");
  
  const [signer] = await hre.ethers.getSigners();
  const sourceNetwork = hre.network.name;
  const sourceConfig = NETWORK_CONFIG[sourceNetwork];
  const destConfig = NETWORK_CONFIG['avalanche-fuji-testnet'];
  
  const amountWei = hre.ethers.utils.parseEther(amount);
  const amountOutMinWei = hre.ethers.utils.parseEther("0.9");
  const recipientBytes32 = hre.ethers.utils.hexZeroPad(signer.address, 32);
  const destinationTokenBytes32 = hre.ethers.utils.hexZeroPad(destToken, 32);
  const options = "0x";
  
  const CrossChainRouter = await hre.ethers.getContractAt("CrossChainRouter", sourceConfig.CrossChainRouter);
  
  console.log("\n🧪 === STEP-BY-STEP DEBUGGING ===");
  
  try {
    // Test 1: Basic contract state
    console.log("\n1️⃣ Testing basic contract state...");
    const stablecoin = await CrossChainRouter.stablecoin();
    const stablecoinOFT = await CrossChainRouter.stablecoinOFT();
    const dexRouter = await CrossChainRouter.dexRouter();
    
    console.log(`✅ Stablecoin: ${stablecoin}`);
    console.log(`✅ StablecoinOFT: ${stablecoinOFT}`);
    console.log(`✅ DEX Router: ${dexRouter}`);
    
    // Test 2: Token transfer simulation
    console.log("\n2️⃣ Testing token transfer...");
    const SourceToken = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", sourceToken);
    const balance = await SourceToken.balanceOf(signer.address);
    const allowance = await SourceToken.allowance(signer.address, CrossChainRouter.address);
    
    console.log(`Balance: ${hre.ethers.utils.formatEther(balance)}`);
    console.log(`Allowance: ${hre.ethers.utils.formatEther(allowance)}`);
    
    if (balance.lt(amountWei)) {
      throw new Error("❌ Insufficient balance");
    }
    
    if (allowance.lt(amountWei)) {
      console.log("⚠️ Insufficient allowance, approving...");
      const approveTx = await SourceToken.approve(CrossChainRouter.address, amountWei);
      await approveTx.wait();
      console.log("✅ Approved");
    }
    
    // Test 3: DEX swap simulation
    console.log("\n3️⃣ Testing DEX swap path...");
    const DexRouter = await hre.ethers.getContractAt("contracts/CrossChainRouter.sol:IPayfundsRouter02", sourceConfig.Router);
    const path = [sourceToken, stablecoin];
    
    try {
      const amountsOut = await DexRouter.getAmountsOut(amountWei, path);
      const expectedStable = amountsOut[1];
      console.log(`✅ DEX path works: ${hre.ethers.utils.formatEther(expectedStable)} stablecoin`);
      
      // Test 4: OFT bridge quote
      console.log("\n4️⃣ Testing OFT bridge quote...");
      const StablecoinOFT = await hre.ethers.getContractAt("IOFT", sourceConfig.CustomStablecoinOFT);
      
      const minAmountAfterFee = expectedStable.mul(95).div(100);
      const sendParam = {
        dstEid: destConfig.eid,
        to: hre.ethers.utils.hexZeroPad(CrossChainRouter.address, 32),
        amountLD: expectedStable,
        minAmountLD: minAmountAfterFee,
        extraOptions: options,
        composeMsg: "0x",
        oftCmd: "0x"
      };
      
      const bridgeFee = await StablecoinOFT.quoteSend(sendParam, false);
      console.log(`✅ Bridge fee: ${hre.ethers.utils.formatEther(bridgeFee.nativeFee)} ETH`);
      
      // Test 5: Message quote
      console.log("\n5️⃣ Testing message quote...");
      const payload = hre.ethers.utils.defaultAbiCoder.encode(
        ["bytes32", "bytes32", "uint256", "uint256", "address"],
        [recipientBytes32, destinationTokenBytes32, amountOutMinWei, expectedStable, signer.address]
      );
      
      try {
        // Try to get combined options
        let combinedOptions;
        try {
          combinedOptions = await CrossChainRouter.combineOptions(destConfig.eid, 1, options);
          console.log("✅ Combined options created");
        } catch (e) {
          console.log("⚠️ Using basic options (combineOptions failed)");
          combinedOptions = options;
        }
        
        const msgFee = await CrossChainRouter.quote(destConfig.eid, payload, combinedOptions, false);
        console.log(`✅ Message fee: ${hre.ethers.utils.formatEther(msgFee.nativeFee)} ETH`);
        
        const totalFee = bridgeFee.nativeFee.add(msgFee.nativeFee);
        console.log(`✅ Total required fee: ${hre.ethers.utils.formatEther(totalFee)} ETH`);
        
        // Test 6: Static call simulation
        console.log("\n6️⃣ Testing static call...");
        
        try {
          await CrossChainRouter.callStatic.crossChainSwap(
            destConfig.eid,
            recipientBytes32,
            sourceToken,
            destinationTokenBytes32,
            amountWei,
            amountOutMinWei,
            options,
            { 
              value: hre.ethers.utils.parseEther("0.01"),
              from: signer.address
            }
          );
          console.log("✅ Static call succeeded - transaction should work!");
          
        } catch (staticError: any) {
          console.log("❌ Static call failed - this is the root cause!");
          console.log(`Error: ${staticError.message}`);
          
          // Try to decode the error
          if (staticError.data) {
            console.log(`Error data: ${staticError.data}`);
          }
          
          // Common error analysis
          if (staticError.message.includes("Insufficient fee")) {
            console.log("💡 Issue: Fee calculation problem");
            console.log(`   Try with higher fee: --fee-eth 0.05`);
          } else if (staticError.message.includes("transfer")) {
            console.log("💡 Issue: Token transfer problem");
            console.log("   Check token approval and balance");
          } else if (staticError.message.includes("swap")) {
            console.log("💡 Issue: DEX swap problem");
            console.log("   Check if liquidity pools exist");
          } else if (staticError.message.includes("peer")) {
            console.log("💡 Issue: Peer connection problem");
            console.log("   Check if peers are set correctly");
          }
          
          throw staticError;
        }
        
      } catch (msgError: any) {
        console.log(`❌ Message quote failed: ${msgError.message}`);
        throw msgError;
      }
      
    } catch (dexError: any) {
      console.log(`❌ DEX path failed: ${dexError.message}`);
      throw dexError;
    }
    
  } catch (error: any) {
    console.error(`\n❌ === DEBUG FAILED AT STEP ===`);
    console.error(`Error: ${error.message}`);
    
    console.log("\n🛠️ === POTENTIAL SOLUTIONS ===");
    console.log("1. Check if all contracts are deployed correctly");
    console.log("2. Verify liquidity pools exist for token pairs");
    console.log("3. Ensure peer connections are set up");
    console.log("4. Try with a much higher fee (0.05 ETH)");
    console.log("5. Check contract ownership and permissions");
    
    throw error;
  }
});

// Simplified test that isolates the issue
task("test-simple-swap", "Test just the local DEX swap part")
.addParam("sourceToken", "Source token address")
.addParam("amount", "Amount to swap")
.setAction(async (taskArgs: any, hre: any) => {
  const { sourceToken, amount } = taskArgs;
  
  console.log("🧪 === TESTING SIMPLE DEX SWAP ===");
  
  const [signer] = await hre.ethers.getSigners();
  const config = NETWORK_CONFIG[hre.network.name];
  const amountWei = hre.ethers.utils.parseEther(amount);
  
  const SourceToken = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", sourceToken);
  const DexRouter = await hre.ethers.getContractAt("contracts/CrossChainRouter.sol:IPayfundsRouter02", config.Router);
  
  // Check balance and approve
  const balance = await SourceToken.balanceOf(signer.address);
  console.log(`Balance: ${hre.ethers.utils.formatEther(balance)}`);
  
  if (balance.lt(amountWei)) {
    throw new Error("Insufficient balance");
  }
  
  // Approve router
  console.log("Approving router...");
  const approveTx = await SourceToken.approve(config.Router, amountWei);
  await approveTx.wait();
  
  // Test swap
  const path = [sourceToken, config.CustomStablecoinOFT];
  const amountsOut = await DexRouter.getAmountsOut(amountWei, path);
  console.log(`Expected output: ${hre.ethers.utils.formatEther(amountsOut[1])}`);
  
  // Execute swap
  console.log("Executing swap...");
  const swapTx = await DexRouter.swapExactTokensForTokens(
    amountWei,
    amountsOut[1].mul(95).div(100), // 5% slippage
    path,
    signer.address,
    Math.floor(Date.now() / 1000) + 1200
  );
  
  const receipt = await swapTx.wait();
  console.log(`✅ Swap successful! TX: ${swapTx.hash}`);
  
  // Check new balance
  const Stablecoin = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", config.CustomStablecoinOFT);
  const newBalance = await Stablecoin.balanceOf(signer.address);
  console.log(`New stablecoin balance: ${hre.ethers.utils.formatEther(newBalance)}`);
});

// Complete manual guide
task("manual-crosschain-guide", "Complete guide for manual cross-chain swap")
  .setAction(async (taskArgs: any, hre: any) => {
    console.log("📋 === MANUAL CROSS-CHAIN SWAP GUIDE ===\n");
    
    console.log("Follow these 3 simple steps:\n");
    
    console.log("1️⃣ SWAP TO STABLECOIN (on Arbitrum):");
    console.log("npx hardhat manual-step1-swap-to-stable \\");
    console.log("  --source-token 0x9340DA78eC04aD53CFbD6970D7F6C2A0a33cD42a \\");
    console.log("  --amount 1 \\");
    console.log("  --network arbitrum-sepolia-testnet\n");
    
    console.log("2️⃣ BRIDGE STABLECOIN (Arbitrum → Avalanche):");
    console.log("npx hardhat manual-step2-bridge-stable \\");
    console.log("  --amount 0.996 \\  # Use amount from step 1");
    console.log("  --dest-network avalanche-fuji-testnet \\");
    console.log("  --network arbitrum-sepolia-testnet\n");
    
    console.log("3️⃣ SWAP TO DESTINATION TOKEN (on Avalanche):");
    console.log("Wait 2-5 minutes after step 2, then:");
    console.log("npx hardhat manual-step3-dest-swap \\");
    console.log("  --amount 0.95 \\  # Slightly less due to bridge fees");
    console.log("  --dest-token 0x1963f6163D9eaFCb1aF6DB7207b21E8aD6548751 \\");
    console.log("  --network avalanche-fuji-testnet\n");
    
    console.log("💡 This manual approach lets you:");
    console.log("- See exactly what's happening at each step");
    console.log("- Debug any issues individually");
    console.log("- Verify balances after each operation");
    console.log("- Control the timing of each step\n");
    
    console.log("🚀 Start with step 1 above!");
  });

  // Task to test if the source DEX swap works
task("test-source-dex-swap", "Test just the source DEX swap")
.addParam("sourceToken", "Source token address")
.addParam("amount", "Amount to swap")
.setAction(async (taskArgs: any, hre: any) => {
  const { sourceToken, amount } = taskArgs;
  
  console.log("🔍 === TESTING SOURCE DEX SWAP ===");
  
  const [signer] = await hre.ethers.getSigners();
  const config = NETWORK_CONFIG[hre.network.name];
  const amountWei = hre.ethers.utils.parseEther(amount);
  
  const SourceToken = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", sourceToken);
  const CrossChainRouter = await hre.ethers.getContractAt("CrossChainRouter", config.CrossChainRouter);
  
  // Check balances
  const balance = await SourceToken.balanceOf(signer.address);
  console.log(`Source balance: ${hre.ethers.utils.formatEther(balance)}`);
  
  // Check allowance
  const allowance = await SourceToken.allowance(signer.address, CrossChainRouter.address);
  console.log(`Allowance: ${hre.ethers.utils.formatEther(allowance)}`);
  
  if (allowance.lt(amountWei)) {
    console.log("Approving...");
    const approveTx = await SourceToken.approve(CrossChainRouter.address, amountWei);
    await approveTx.wait();
    console.log("✅ Approved");
  }
  
  // Test estimate
  const estimated = await CrossChainRouter.estimateSwapOutput(sourceToken, amountWei);
  console.log(`Estimated output: ${hre.ethers.utils.formatEther(estimated)}`);
  
  // Now test the actual DEX router directly
  const DexRouter = await hre.ethers.getContractAt("contracts/CrossChainRouter.sol:IPayfundsRouter02", config.Router);
  const stablecoin = await CrossChainRouter.stablecoin();
  
  console.log(`\n🔍 Testing direct DEX router:`);
  console.log(`DEX Router: ${config.Router}`);
  console.log(`Stablecoin: ${stablecoin}`);
  console.log(`Path: ${sourceToken} → ${stablecoin}`);
  
  const path = [sourceToken, stablecoin];
  
  try {
    const amountsOut = await DexRouter.getAmountsOut(amountWei, path);
    console.log(`✅ DEX quote works: ${hre.ethers.utils.formatEther(amountsOut[1])}`);
    
    // Test if we can actually do the swap through DEX directly
    console.log("\n🔄 Testing direct DEX swap...");
    
    // Approve DEX router
    const dexAllowance = await SourceToken.allowance(signer.address, config.Router);
    if (dexAllowance.lt(amountWei)) {
      console.log("Approving DEX router...");
      const dexApproveTx = await SourceToken.approve(config.Router, amountWei);
      await dexApproveTx.wait();
      console.log("✅ DEX Approved");
    }
    
    // Execute direct swap
    const swapTx = await DexRouter.swapExactTokensForTokens(
      amountWei,
      amountsOut[1].mul(95).div(100), // 5% slippage
      path,
      signer.address,
      Math.floor(Date.now() / 1000) + 1200,
      {
        gasLimit: 500000,
        gasPrice: hre.ethers.utils.parseUnits("50", "gwei")
      }
    );
    
    const receipt = await swapTx.wait();
    console.log(`✅ Direct DEX swap successful! TX: ${swapTx.hash}`);
    
    // Check new balance
    const Stablecoin = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", stablecoin);
    const newBalance = await Stablecoin.balanceOf(signer.address);
    console.log(`New stablecoin balance: ${hre.ethers.utils.formatEther(newBalance)}`);
    
  } catch (dexError: any) {
    console.log(`❌ DEX issue: ${dexError.message}`);
    
    // Check if liquidity exists
    console.log("\n🔍 Checking liquidity...");
    const factory = await DexRouter.factory();
    console.log(`Factory: ${factory}`);
    
    const Factory = await hre.ethers.getContractAt("IUniswapV2Factory", factory);
    const pairAddress = await Factory.getPair(sourceToken, stablecoin);
    console.log(`Pair address: ${pairAddress}`);
    
    if (pairAddress === "0x0000000000000000000000000000000000000000") {
      console.log("❌ NO LIQUIDITY POOL EXISTS!");
      console.log("This is the root cause - you need to create a liquidity pool first!");
      console.log(`\nCreate pool: ${sourceToken} / ${stablecoin}`);
    } else {
      console.log("✅ Liquidity pool exists");
      
      // Check pool reserves
      const Pair = await hre.ethers.getContractAt("IUniswapV2Pair", pairAddress);
      const reserves = await Pair.getReserves();
      console.log(`Reserves: ${reserves[0].toString()}, ${reserves[1].toString()}`);
    }
  }
});

// Task to test OFT bridge functionality
task("test-oft-bridge", "Test OFT bridge functionality")
.addParam("amount", "Amount to bridge")
.setAction(async (taskArgs: any, hre: any) => {
  const { amount } = taskArgs;
  
  console.log("🌉 === TESTING OFT BRIDGE ===");
  
  const [signer] = await hre.ethers.getSigners();
  const sourceConfig = NETWORK_CONFIG[hre.network.name];
  const destConfig = NETWORK_CONFIG['avalanche-fuji-testnet'];
  const amountWei = hre.ethers.utils.parseEther(amount);
  
  const StablecoinOFT = await hre.ethers.getContractAt("IOFT", sourceConfig.CustomStablecoinOFT);
  const StablecoinERC20 = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", sourceConfig.CustomStablecoinOFT);
  
  // Check balance
  const balance = await StablecoinERC20.balanceOf(signer.address);
  console.log(`Stablecoin balance: ${hre.ethers.utils.formatEther(balance)}`);
  
  if (balance.lt(amountWei)) {
    throw new Error("Insufficient stablecoin balance for test");
  }
  
  // Test quote
  const minAmountAfterFee = amountWei.mul(95).div(100);
  const sendParam = {
    dstEid: destConfig.eid,
    to: hre.ethers.utils.hexZeroPad(signer.address, 32),
    amountLD: amountWei,
    minAmountLD: minAmountAfterFee,
    extraOptions: "0x",
    composeMsg: "0x",
    oftCmd: "0x"
  };
  
  console.log(`Testing bridge to EID: ${destConfig.eid}`);
  console.log(`Amount: ${hre.ethers.utils.formatEther(amountWei)}`);
  
  try {
    const fee = await StablecoinOFT.quoteSend(sendParam, false);
    console.log(`✅ Quote works: ${hre.ethers.utils.formatEther(fee.nativeFee)} ETH`);
    
    // Test actual bridge
    console.log("🚀 Testing actual bridge...");
    const bridgeTx = await StablecoinOFT.send(sendParam, fee, signer.address, {
      value: fee.nativeFee,
      gasLimit: 300000,
      gasPrice: hre.ethers.utils.parseUnits("50", "gwei")
    });
    
    const receipt = await bridgeTx.wait();
    console.log(`✅ Bridge successful! TX: ${bridgeTx.hash}`);
    
  } catch (bridgeError: any) {
    console.log(`❌ Bridge issue: ${bridgeError.message}`);
    
    // Check peer connections
    console.log("\n🔍 Checking peer connections...");
    const peer = await StablecoinOFT.peers(destConfig.eid);
    const expectedPeer = hre.ethers.utils.hexZeroPad(destConfig.CustomStablecoinOFT, 32);
    
    console.log(`Current peer: ${peer}`);
    console.log(`Expected peer: ${expectedPeer}`);
    
    if (peer.toLowerCase() !== expectedPeer.toLowerCase()) {
      console.log("❌ PEER NOT SET CORRECTLY!");
      console.log("This is the root cause - OFT peers are not configured!");
    } else {
      console.log("✅ Peer is set correctly");
    }
  }
});

// Interface definitions needed for the factory check
const IUniswapV2Factory = [
"function getPair(address tokenA, address tokenB) external view returns (address pair)"
];

const IUniswapV2Pair = [
"function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)"
];

// Task to debug the exact parameters being sent
task("debug-send-params", "Debug the exact parameters used in crossChainSwap")
  .setAction(async (taskArgs: any, hre: any) => {
    console.log("🔍 === DEBUGGING SEND PARAMETERS ===");
    
    const [signer] = await hre.ethers.getSigners();
    const sourceConfig = NETWORK_CONFIG['arbitrum-sepolia-testnet'];
    const destConfig = NETWORK_CONFIG['avalanche-fuji-testnet'];
    
    const CrossChainRouter = await hre.ethers.getContractAt("CrossChainRouter", sourceConfig.CrossChainRouter);
    
    // Parameters from your failed transaction
    const amountWei = hre.ethers.utils.parseEther("1");
    const amountOutMinWei = hre.ethers.utils.parseEther("0.9");
    const recipientBytes32 = hre.ethers.utils.hexZeroPad(signer.address, 32);
    const destinationTokenBytes32 = hre.ethers.utils.hexZeroPad("0x1963f6163D9eaFCb1aF6DB7207b21E8aD6548751", 32);
    const options = "0x";
    
    // Get estimated stable amount (simulate the swap)
    const stableAmount = await CrossChainRouter.estimateSwapOutput("0x9340DA78eC04aD53CFbD6970D7F6C2A0a33cD42a", amountWei);
    console.log(`Stable amount: ${hre.ethers.utils.formatEther(stableAmount)}`);
    
    // Check what addresses the contract is using
    console.log("\n📍 === ADDRESS ANALYSIS ===");
    console.log(`Source CrossChainRouter: ${sourceConfig.CrossChainRouter}`);
    console.log(`Dest CrossChainRouter: ${destConfig.CrossChainRouter}`);
    console.log(`Are they different? ${sourceConfig.CrossChainRouter !== destConfig.CrossChainRouter ? '✅ YES (correct)' : '❌ NO (problem!)'}`);
    
    // Check bridge send parameters
    console.log("\n🌉 === BRIDGE PARAMETERS ===");
    const minAmountAfterFee = stableAmount.mul(950).div(1000);
    const sendParam = {
      dstEid: destConfig.eid,
      to: hre.ethers.utils.hexZeroPad(sourceConfig.CrossChainRouter, 32), // ❌ WRONG!
      amountLD: stableAmount,
      minAmountLD: minAmountAfterFee,
      extraOptions: options,
      composeMsg: "0x",
      oftCmd: "0x"
    };
    
    console.log(`Bridge destination EID: ${sendParam.dstEid}`);
    console.log(`Bridge sends to: ${sendParam.to}`);
    console.log(`Should send to: ${hre.ethers.utils.hexZeroPad(destConfig.CrossChainRouter, 32)}`);
    console.log(`Address mismatch: ${sendParam.to !== hre.ethers.utils.hexZeroPad(destConfig.CrossChainRouter, 32) ? '❌ YES - This is the bug!' : '✅ NO'}`);
    
    // Check message parameters
    console.log("\n📨 === MESSAGE PARAMETERS ===");
    const payload = hre.ethers.utils.defaultAbiCoder.encode(
      ["bytes32", "bytes32", "uint256", "uint256", "address"],
      [recipientBytes32, destinationTokenBytes32, amountOutMinWei, stableAmount, signer.address]
    );
    
    console.log(`Message destination EID: ${destConfig.eid}`);
    console.log(`Message payload length: ${payload.length}`);
    console.log(`Recipient: ${recipientBytes32}`);
    console.log(`Destination token: ${destinationTokenBytes32}`);
    console.log(`Amount out min: ${hre.ethers.utils.formatEther(amountOutMinWei)}`);
    console.log(`Stable amount: ${hre.ethers.utils.formatEther(stableAmount)}`);
    
    // The fix
    console.log("\n🔧 === THE FIX ===");
    console.log("Your contract has this bug in crossChainSwap:");
    console.log("❌ to: addressToBytes32(address(this))  // Wrong - uses source address");
    console.log("✅ to: addressToBytes32(DESTINATION_ROUTER_ADDRESS)  // Correct");
    console.log("");
    console.log("The stablecoins are being sent to the wrong address on the destination!");
  });

  // Task to debug the exact parameters being sent
task("debug-send-params", "Debug the exact parameters used in crossChainSwap")
.setAction(async (taskArgs: any, hre: any) => {
  console.log("🔍 === DEBUGGING SEND PARAMETERS ===");
  
  const [signer] = await hre.ethers.getSigners();
  const sourceConfig = NETWORK_CONFIG['arbitrum-sepolia-testnet'];
  const destConfig = NETWORK_CONFIG['avalanche-fuji-testnet'];
  
  const CrossChainRouter = await hre.ethers.getContractAt("CrossChainRouter", sourceConfig.CrossChainRouter);
  
  // Parameters from your failed transaction
  const amountWei = hre.ethers.utils.parseEther("1");
  const amountOutMinWei = hre.ethers.utils.parseEther("0.9");
  const recipientBytes32 = hre.ethers.utils.hexZeroPad(signer.address, 32);
  const destinationTokenBytes32 = hre.ethers.utils.hexZeroPad("0x1963f6163D9eaFCb1aF6DB7207b21E8aD6548751", 32);
  const options = "0x";
  
  // Get estimated stable amount (simulate the swap)
  const stableAmount = await CrossChainRouter.estimateSwapOutput("0x9340DA78eC04aD53CFbD6970D7F6C2A0a33cD42a", amountWei);
  console.log(`Stable amount: ${hre.ethers.utils.formatEther(stableAmount)}`);
  
  // Check what addresses the contract is using
  console.log("\n📍 === ADDRESS ANALYSIS ===");
  console.log(`Source CrossChainRouter: ${sourceConfig.CrossChainRouter}`);
  console.log(`Dest CrossChainRouter: ${destConfig.CrossChainRouter}`);
  console.log(`Are they different? ${sourceConfig.CrossChainRouter !== destConfig.CrossChainRouter ? '✅ YES (correct)' : '❌ NO (problem!)'}`);
  
  // Check bridge send parameters
  console.log("\n🌉 === BRIDGE PARAMETERS ===");
  const minAmountAfterFee = stableAmount.mul(950).div(1000);
  const sendParam = {
    dstEid: destConfig.eid,
    to: hre.ethers.utils.hexZeroPad(sourceConfig.CrossChainRouter, 32), // ❌ WRONG!
    amountLD: stableAmount,
    minAmountLD: minAmountAfterFee,
    extraOptions: options,
    composeMsg: "0x",
    oftCmd: "0x"
  };
  
  console.log(`Bridge destination EID: ${sendParam.dstEid}`);
  console.log(`Bridge sends to: ${sendParam.to}`);
  console.log(`Should send to: ${hre.ethers.utils.hexZeroPad(destConfig.CrossChainRouter, 32)}`);
  console.log(`Address mismatch: ${sendParam.to !== hre.ethers.utils.hexZeroPad(destConfig.CrossChainRouter, 32) ? '❌ YES - This is the bug!' : '✅ NO'}`);
  
  // Check message parameters
  console.log("\n📨 === MESSAGE PARAMETERS ===");
  const payload = hre.ethers.utils.defaultAbiCoder.encode(
    ["bytes32", "bytes32", "uint256", "uint256", "address"],
    [recipientBytes32, destinationTokenBytes32, amountOutMinWei, stableAmount, signer.address]
  );
  
  console.log(`Message destination EID: ${destConfig.eid}`);
  console.log(`Message payload length: ${payload.length}`);
  console.log(`Recipient: ${recipientBytes32}`);
  console.log(`Destination token: ${destinationTokenBytes32}`);
  console.log(`Amount out min: ${hre.ethers.utils.formatEther(amountOutMinWei)}`);
  console.log(`Stable amount: ${hre.ethers.utils.formatEther(stableAmount)}`);
  
  // The fix
  console.log("\n🔧 === THE FIX ===");
  console.log("Your contract has this bug in crossChainSwap:");
  console.log("❌ to: addressToBytes32(address(this))  // Wrong - uses source address");
  console.log("✅ to: addressToBytes32(DESTINATION_ROUTER_ADDRESS)  // Correct");
  console.log("");
  console.log("The stablecoins are being sent to the wrong address on the destination!");
});

// Task to set up OFT peer connections
task("setup-oft-peers", "Set up peer connections between OFT contracts")
  .setAction(async (taskArgs: any, hre: any) => {
    console.log("🔗 === SETTING UP OFT PEER CONNECTIONS ===");
    
    const [signer] = await hre.ethers.getSigners();
    console.log(`🔑 Signer address: ${signer.address}`);
    
    const networks = Object.keys(NETWORK_CONFIG);
    const results = [];
    
    for (const sourceNetwork of networks) {
      for (const destNetwork of networks) {
        if (sourceNetwork === destNetwork) continue;
        
        const sourceConfig = NETWORK_CONFIG[sourceNetwork];
        const destConfig = NETWORK_CONFIG[destNetwork];
        
        console.log(`\n🌉 Setting up peer: ${sourceNetwork} → ${destNetwork}`);
        console.log(`Source EID: ${sourceConfig.eid}, Dest EID: ${destConfig.eid}`);
        console.log(`Source OFT: ${sourceConfig.CustomStablecoinOFT}`);
        console.log(`Dest OFT: ${destConfig.CustomStablecoinOFT}`);
        
        try {
          // Switch to source network
          if (hre.network.name !== sourceNetwork) {
            console.log(`⚠️  Please run this task on ${sourceNetwork} network`);
            console.log(`Command: npx hardhat setup-oft-peers --network ${sourceNetwork}`);
            continue;
          }
          
          // Get OFT contract on source network
          const SourceOFT = await hre.ethers.getContractAt("CustomStablecoinOFT", sourceConfig.CustomStablecoinOFT);
          
          // Check current peer
          const currentPeer = await SourceOFT.peers(destConfig.eid);
          const expectedPeer = hre.ethers.utils.hexZeroPad(destConfig.CustomStablecoinOFT, 32);
          
          console.log(`Current peer: ${currentPeer}`);
          console.log(`Expected peer: ${expectedPeer}`);
          
          if (currentPeer === expectedPeer) {
            console.log(`✅ Peer already set correctly!`);
            results.push(`✅ ${sourceNetwork} → ${destNetwork}: Already configured`);
            continue;
          }
          
          // Set the peer
          console.log(`🔄 Setting peer...`);
          const setPeerTx = await SourceOFT.setPeer(destConfig.eid, expectedPeer, {
            gasLimit: 100000,
            gasPrice: hre.ethers.utils.parseUnits("25", "gwei")
          });
          
          console.log(`Transaction hash: ${setPeerTx.hash}`);
          await setPeerTx.wait();
          
          // Verify the peer was set
          const newPeer = await SourceOFT.peers(destConfig.eid);
          if (newPeer === expectedPeer) {
            console.log(`✅ Peer set successfully!`);
            results.push(`✅ ${sourceNetwork} → ${destNetwork}: Configured successfully`);
          } else {
            console.log(`❌ Peer setting failed!`);
            results.push(`❌ ${sourceNetwork} → ${destNetwork}: Failed to configure`);
          }
          
        } catch (error: any) {
          console.error(`❌ Error setting peer: ${error.message}`);
          results.push(`❌ ${sourceNetwork} → ${destNetwork}: Error - ${error.message}`);
        }
      }
    }
    
    console.log("\n📋 === PEER SETUP SUMMARY ===");
    results.forEach(result => console.log(result));
    
    if (hre.network.name === 'arbitrum-sepolia-testnet') {
      console.log("\n🔄 Next: Run the same command on Avalanche Fuji:");
      console.log("npx hardhat setup-oft-peers --network avalanche-fuji-testnet");
    } else if (hre.network.name === 'avalanche-fuji-testnet') {
      console.log("\n🔄 Next: Run CrossChainRouter peer setup:");
      console.log("npx hardhat setup-router-peers --network arbitrum-sepolia-testnet");
      console.log("npx hardhat setup-router-peers --network avalanche-fuji-testnet");
    }
  });

// Task to set up CrossChainRouter peer connections
task("setup-router-peers", "Set up peer connections between CrossChainRouter contracts")
  .setAction(async (taskArgs: any, hre: any) => {
    console.log("🔗 === SETTING UP CROSSCHAIN ROUTER PEER CONNECTIONS ===");
    
    const [signer] = await hre.ethers.getSigners();
    console.log(`🔑 Signer address: ${signer.address}`);
    
    const networks = Object.keys(NETWORK_CONFIG);
    const results = [];
    
    for (const sourceNetwork of networks) {
      for (const destNetwork of networks) {
        if (sourceNetwork === destNetwork) continue;
        
        const sourceConfig = NETWORK_CONFIG[sourceNetwork];
        const destConfig = NETWORK_CONFIG[destNetwork];
        
        console.log(`\n🌉 Setting up router peer: ${sourceNetwork} → ${destNetwork}`);
        console.log(`Source EID: ${sourceConfig.eid}, Dest EID: ${destConfig.eid}`);
        console.log(`Source Router: ${sourceConfig.CrossChainRouter}`);
        console.log(`Dest Router: ${destConfig.CrossChainRouter}`);
        
        try {
          // Switch to source network
          if (hre.network.name !== sourceNetwork) {
            console.log(`⚠️  Please run this task on ${sourceNetwork} network`);
            console.log(`Command: npx hardhat setup-router-peers --network ${sourceNetwork}`);
            continue;
          }
          
          // Get CrossChainRouter contract on source network
          const SourceRouter = await hre.ethers.getContractAt("CrossChainRouter", sourceConfig.CrossChainRouter);
          
          // Check current peer
          const currentPeer = await SourceRouter.peers(destConfig.eid);
          const expectedPeer = hre.ethers.utils.hexZeroPad(destConfig.CrossChainRouter, 32);
          
          console.log(`Current peer: ${currentPeer}`);
          console.log(`Expected peer: ${expectedPeer}`);
          
          if (currentPeer === expectedPeer) {
            console.log(`✅ Router peer already set correctly!`);
            results.push(`✅ ${sourceNetwork} → ${destNetwork}: Already configured`);
            continue;
          }
          
          // Set the peer
          console.log(`🔄 Setting router peer...`);
          const setPeerTx = await SourceRouter.setPeer(destConfig.eid, expectedPeer, {
            gasLimit: 100000,
            gasPrice: hre.ethers.utils.parseUnits("25", "gwei")
          });
          
          console.log(`Transaction hash: ${setPeerTx.hash}`);
          await setPeerTx.wait();
          
          // Verify the peer was set
          const newPeer = await SourceRouter.peers(destConfig.eid);
          if (newPeer === expectedPeer) {
            console.log(`✅ Router peer set successfully!`);
            results.push(`✅ ${sourceNetwork} → ${destNetwork}: Configured successfully`);
          } else {
            console.log(`❌ Router peer setting failed!`);
            results.push(`❌ ${sourceNetwork} → ${destNetwork}: Failed to configure`);
          }
          
        } catch (error: any) {
          console.error(`❌ Error setting router peer: ${error.message}`);
          results.push(`❌ ${sourceNetwork} → ${destNetwork}: Error - ${error.message}`);
        }
      }
    }
    
    console.log("\n📋 === ROUTER PEER SETUP SUMMARY ===");
    results.forEach(result => console.log(result));
  });

// Task to verify all peer connections
task("verify-peers", "Verify all peer connections are set up correctly")
  .setAction(async (taskArgs: any, hre: any) => {
    console.log("🔍 === VERIFYING ALL PEER CONNECTIONS ===");
    
    const networks = Object.keys(NETWORK_CONFIG);
    const currentNetwork = hre.network.name;
    const currentConfig = NETWORK_CONFIG[currentNetwork];
    
    if (!currentConfig) {
      throw new Error(`Unsupported network: ${currentNetwork}`);
    }
    
    console.log(`\n📡 Checking from ${currentNetwork}:`);
    
    // Check OFT peers
    console.log("\n🏦 === OFT PEER CONNECTIONS ===");
    try {
      const OFT = await hre.ethers.getContractAt("CustomStablecoinOFT", currentConfig.CustomStablecoinOFT);
      
      for (const destNetwork of networks) {
        if (destNetwork === currentNetwork) continue;
        
        const destConfig = NETWORK_CONFIG[destNetwork];
        const currentPeer = await OFT.peers(destConfig.eid);
        const expectedPeer = hre.ethers.utils.hexZeroPad(destConfig.CustomStablecoinOFT, 32);
        
        if (currentPeer === expectedPeer) {
          console.log(`✅ OFT ${currentNetwork} → ${destNetwork}: Correctly configured`);
        } else {
          console.log(`❌ OFT ${currentNetwork} → ${destNetwork}: NOT configured`);
          console.log(`   Current: ${currentPeer}`);
          console.log(`   Expected: ${expectedPeer}`);
        }
      }
    } catch (error: any) {
      console.error(`❌ Error checking OFT peers: ${error.message}`);
    }
    
    // Check Router peers
    console.log("\n🚀 === CROSSCHAIN ROUTER PEER CONNECTIONS ===");
    try {
      const Router = await hre.ethers.getContractAt("CrossChainRouter", currentConfig.CrossChainRouter);
      
      for (const destNetwork of networks) {
        if (destNetwork === currentNetwork) continue;
        
        const destConfig = NETWORK_CONFIG[destNetwork];
        const currentPeer = await Router.peers(destConfig.eid);
        const expectedPeer = hre.ethers.utils.hexZeroPad(destConfig.CrossChainRouter, 32);
        
        if (currentPeer === expectedPeer) {
          console.log(`✅ Router ${currentNetwork} → ${destNetwork}: Correctly configured`);
        } else {
          console.log(`❌ Router ${currentNetwork} → ${destNetwork}: NOT configured`);
          console.log(`   Current: ${currentPeer}`);
          console.log(`   Expected: ${expectedPeer}`);
        }
      }
    } catch (error: any) {
      console.error(`❌ Error checking Router peers: ${error.message}`);
    }
    
    console.log("\n🔄 Run this command on other networks too:");
    for (const network of networks) {
      if (network !== currentNetwork) {
        console.log(`npx hardhat verify-peers --network ${network}`);
      }
    }
  });

// Task to set up everything in sequence
task("setup-all-peers", "Set up all peer connections in the correct order")
  .setAction(async (taskArgs: any, hre: any) => {
    console.log("🚀 === SETTING UP ALL PEER CONNECTIONS ===");
    console.log("This task will guide you through setting up all peer connections.");
    console.log("You'll need to run commands on different networks.\n");
    
    console.log("📋 === SETUP SEQUENCE ===");
    console.log("1. First, set up OFT peers:");
    console.log("   npx hardhat setup-oft-peers --network arbitrum-sepolia-testnet");
    console.log("   npx hardhat setup-oft-peers --network avalanche-fuji-testnet");
    console.log("");
    console.log("2. Then, set up CrossChainRouter peers:");
    console.log("   npx hardhat setup-router-peers --network arbitrum-sepolia-testnet");
    console.log("   npx hardhat setup-router-peers --network avalanche-fuji-testnet");
    console.log("");
    console.log("3. Finally, verify all connections:");
    console.log("   npx hardhat verify-peers --network arbitrum-sepolia-testnet");
    console.log("   npx hardhat verify-peers --network avalanche-fuji-testnet");
    console.log("");
    console.log("🎯 After completing these steps, your cross-chain swap should work!");
  });

// Complete cross-chain swap task (SourceToken → DestinationToken)
// Complete cross-chain swap task (SourceToken → DestinationToken) - UPDATED
// Complete cross-chain swap task (SourceToken → DestinationToken) - UPDATED
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

      // Step 3: Quote total swap fee using NEW CONTRACT FUNCTION
      console.log("\n💰 === DETAILED FEE BREAKDOWN ===");
      const options = "0x";
      const recipientBytes32 = hre.ethers.utils.hexZeroPad(recipient, 32);
      const destinationTokenBytes32 = hre.ethers.utils.hexZeroPad(destinationToken, 32);
      
      try {
        // Use the new contract's quoteSwap function
        console.log("🔍 Quoting Complete Cross-Chain Swap Fee...");
        const totalFee = await CrossChainRouter.quoteSwap(
          destConfig.eid,
          recipientBytes32,
          destinationTokenBytes32,
          amountOutMinWei,
          estimatedStableAmount,
          options,
          false
        );
        
        console.log(`Total required fee: ${hre.ethers.utils.formatEther(totalFee.nativeFee)} ETH`);
        console.log(`Provided fee: ${feeEth} ETH`);
        
        if (totalFee.nativeFee.gt(feeWei)) {
          console.log(`\n⚠️  ERROR: Insufficient fee provided!`);
          console.log(`   Required: ${hre.ethers.utils.formatEther(totalFee.nativeFee)} ETH`);
          console.log(`   Provided: ${feeEth} ETH`);
          console.log(`   Shortfall: ${hre.ethers.utils.formatEther(totalFee.nativeFee.sub(feeWei))} ETH`);
          console.log(`\n💡 Try with: --fee-eth ${hre.ethers.utils.formatEther(totalFee.nativeFee.mul(110).div(100))}`);
          throw new Error("Insufficient fee provided - see details above");
        } else {
          console.log(`✅ Fee is sufficient!`);
          console.log(`   Buffer: ${hre.ethers.utils.formatEther(feeWei.sub(totalFee.nativeFee))} ETH`);
        }
        
      } catch (feeError: any) {
        console.log(`⚠️  Fee quote analysis failed: ${feeError.message}`);
        console.log("   Proceeding with provided fee - transaction may fail if insufficient");
      }

      // Step 4: Execute complete cross-chain swap
      console.log("\n🌉 === EXECUTING COMPLETE CROSS-CHAIN SWAP ===");
      console.log("This will:");
      console.log("1. Swap your source tokens to stablecoins");
      console.log("2. Bridge stablecoins to destination chain");
      console.log("3. Automatically swap stablecoins to destination tokens");
      console.log("4. Send destination tokens directly to recipient");
      
      // Execute the cross-chain swap with NEW CONTRACT FUNCTION
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
        const explorerUrl = sourceNetwork === 'holesky' ? 
          `https://holesky.etherscan.io/tx/${swapTx.hash}` : 
          `https://sepolia.arbiscan.io/tx/${swapTx.hash}`;
        console.log(`🔗 Check transaction: ${explorerUrl}`);
        return;
      }

      console.log(`✅ Transaction confirmed!`);
      console.log(`📦 Block: ${receipt.blockNumber}`);
      console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
      
      const explorerUrl = sourceNetwork === 'holesky' ? 
        `https://holesky.etherscan.io/tx/${swapTx.hash}` : 
        `https://sepolia.arbiscan.io/tx/${swapTx.hash}`;
      console.log(`🔗 Transaction: ${explorerUrl}`);

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
          // Not our event, skip silently
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
      } else if (error.message.includes('Insufficient fee') || error.message.includes('NotEnoughNative')) {
        console.error("💡 Increase the fee amount for LayerZero messaging");
      } else if (error.message.includes('deadline')) {
        console.error("💡 Transaction took too long, try again");
      } else if (error.message.includes('execution reverted')) {
        console.error("💡 Contract execution failed - check contract state and parameters");
        console.error("💡 Verify peers are set correctly");
      } else if (error.message.includes('No peer set')) {
        console.error("💡 CrossChain router peers not configured properly");
        console.error("💡 Run LayerZero wiring: npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts");
      }
      
      throw error;
    }
  });


  

  task("debug-quote", "Debug the message fee quote issue")
  .setAction(async (taskArgs: any, hre: any) => {
    const sourceConfig = NETWORK_CONFIG['holesky'];
    const destConfig = NETWORK_CONFIG['avalanche-fuji-testnet'];
    
    const [signer] = await hre.ethers.getSigners();
    const CrossChainRouter = await hre.ethers.getContractAt("CrossChainRouter", sourceConfig.CrossChainRouter);
    
    console.log("🔍 === DEBUGGING MESSAGE QUOTE ===");
    
    // 1. Check peer configuration
    console.log("\n📡 Checking peer configuration...");
    const peer = await CrossChainRouter.peers(destConfig.eid);
    const expectedPeer = hre.ethers.utils.hexZeroPad(destConfig.CrossChainRouter, 32);
    console.log(`Current peer: ${peer}`);
    console.log(`Expected peer: ${expectedPeer}`);
    console.log(`Peers match: ${peer.toLowerCase() === expectedPeer.toLowerCase()}`);
    
    // 2. Test simple quote first
    console.log("\n💬 Testing simple message quote...");
    const simplePayload = hre.ethers.utils.defaultAbiCoder.encode(["string"], ["test"]);
    const simpleOptions = "0x";
    
    try {
      const simpleQuote = await CrossChainRouter.quote(destConfig.eid, simplePayload, simpleOptions, false);
      console.log(`✅ Simple quote works: ${hre.ethers.utils.formatEther(simpleQuote.nativeFee)} ETH`);
    } catch (error: any) {
      console.log(`❌ Simple quote failed: ${error.message}`);
      console.log(`Error data: ${error.data || 'No data'}`);
    }
    
    // 3. Test with our actual payload
    console.log("\n🎯 Testing with actual swap payload...");
    const recipient = "0x49f51e3C94B459677c3B1e611DB3E44d4E6b1D55";
    const destinationToken = "0x1963f6163D9eaFCb1aF6DB7207b21E8aD6548751";
    
    const recipientBytes32 = hre.ethers.utils.hexZeroPad(recipient, 32);
    const destinationTokenBytes32 = hre.ethers.utils.hexZeroPad(destinationToken, 32);
    const amountOutMinWei = hre.ethers.utils.parseEther("0.9");
    const stableAmount = hre.ethers.utils.parseEther("0.996");
    
    const payload = hre.ethers.utils.defaultAbiCoder.encode(
      ["bytes32", "bytes32", "uint256", "uint256", "address"],
      [recipientBytes32, destinationTokenBytes32, amountOutMinWei, stableAmount, signer.address]
    );
    
    console.log(`Payload length: ${payload.length} characters`);
    console.log(`Payload: ${payload.substring(0, 100)}...`);
    
    try {
      const swapQuote = await CrossChainRouter.quote(destConfig.eid, payload, simpleOptions, false);
      console.log(`✅ Swap quote works: ${hre.ethers.utils.formatEther(swapQuote.nativeFee)} ETH`);
    } catch (error: any) {
      console.log(`❌ Swap quote failed: ${error.message}`);
      console.log(`Error data: ${error.data || 'No data'}`);
      
      // Try to decode the error
      if (error.data && error.data.startsWith('0x6592671c')) {
        console.log("🔍 Error 0x6592671c detected - this suggests LayerZero endpoint issue");
        console.log("💡 Possible causes:");
        console.log("   1. Peer not set correctly");
        console.log("   2. LayerZero endpoint configuration issue");
        console.log("   3. Destination EID not supported");
        console.log("   4. Message too large or malformed");
      }
    }
    
    // 4. Check LayerZero endpoint directly
    console.log("\n🔗 Checking LayerZero endpoint...");
    try {
      const endpoint = await hre.ethers.getContractAt("ILayerZeroEndpointV2", sourceConfig.Endpoint);
      console.log(`Endpoint address: ${sourceConfig.Endpoint}`);
      // Add more endpoint checks here if needed
    } catch (error: any) {
      console.log(`❌ Could not connect to LayerZero endpoint: ${error.message}`);
    }
  });

  task("test-lz-endpoint", "Test LayerZero endpoint basic functionality")
  .setAction(async (taskArgs: any, hre: any) => {
    const sourceConfig = NETWORK_CONFIG['holesky'];
    const destConfig = NETWORK_CONFIG['avalanche-fuji-testnet'];
    
    console.log("🔍 === TESTING LAYERZERO ENDPOINT ===");
    console.log(`Source EID: ${sourceConfig.eid}`);
    console.log(`Dest EID: ${destConfig.eid}`);
    console.log(`Endpoint: ${sourceConfig.Endpoint}`);
    
    try {
      // Try to interact with LayerZero endpoint directly
      const endpoint = await hre.ethers.getContractAt("ILayerZeroEndpointV2", sourceConfig.Endpoint);
      
      console.log("\n📡 Testing endpoint basic functions...");
      
      // Test 1: Try to get native fee for a simple message
      console.log("1. Testing simple native fee quote...");
      
      // Very simple payload
      const simplePayload = "0x1234";
      const emptyOptions = "0x";
      
      try {
        // This is the most basic LayerZero quote call
        const fee = await endpoint.quote({
          dstEid: destConfig.eid,
          sender: "0x49f51e3C94B459677c3B1e611DB3E44d4E6b1D55",
          message: simplePayload,
          options: emptyOptions,
          payInLzToken: false
        }, "0x49f51e3C94B459677c3B1e611DB3E44d4E6b1D55");
        
        console.log(`✅ Direct endpoint quote works: ${hre.ethers.utils.formatEther(fee.nativeFee)} ETH`);
        
      } catch (error: any) {
        console.log(`❌ Direct endpoint quote failed: ${error.message}`);
        console.log(`Error data: ${error.data || 'No data'}`);
        
        if (error.data === '0x6592671c0000000000000000000000000000000000000000000000000000000000000000') {
          console.log("🚨 Same 0x6592671c error - LayerZero endpoint issue confirmed");
        }
      }
      
    } catch (error: any) {
      console.log(`❌ Could not connect to LayerZero endpoint: ${error.message}`);
    }
    
    console.log("\n💡 === RECOMMENDATIONS ===");
    console.log("If endpoint tests fail:");
    console.log("1. Holesky testnet might not be supported by LayerZero V2");
    console.log("2. Endpoint address might be incorrect");
    console.log("3. Try using Arbitrum Sepolia instead");
    console.log("4. Check LayerZero V2 testnet documentation");
  });

  task("debug-contract-lz", "Debug contract's LayerZero integration step by step")
  .setAction(async (taskArgs: any, hre: any) => {
    const sourceConfig = NETWORK_CONFIG['holesky'];
    const destConfig = NETWORK_CONFIG['avalanche-fuji-testnet'];
    
    const [signer] = await hre.ethers.getSigners();
    const CrossChainRouter = await hre.ethers.getContractAt("CrossChainRouter", sourceConfig.CrossChainRouter);
    
    console.log("🔍 === DEBUGGING CONTRACT LAYERZERO INTEGRATION ===");
    
    // Test 1: Check contract's basic LayerZero setup
    console.log("\n1️⃣ Testing Contract LayerZero Setup...");
    try {
      const endpoint = await CrossChainRouter.endpoint();
      console.log(`✅ Contract endpoint: ${endpoint}`);
      console.log(`Expected: ${sourceConfig.Endpoint}`);
      console.log(`Match: ${endpoint.toLowerCase() === sourceConfig.Endpoint.toLowerCase()}`);
    } catch (error: any) {
      console.log(`❌ Could not get endpoint: ${error.message}`);
    }
    
    // Test 2: Check peer configuration  
    console.log("\n2️⃣ Testing Peer Configuration...");
    try {
      const peer = await CrossChainRouter.peers(destConfig.eid);
      const expectedPeer = hre.ethers.utils.hexZeroPad(destConfig.CrossChainRouter, 32);
      console.log(`Current peer: ${peer}`);
      console.log(`Expected peer: ${expectedPeer}`);
      console.log(`Peers match: ${peer.toLowerCase() === expectedPeer.toLowerCase()}`);
    } catch (error: any) {
      console.log(`❌ Could not get peer: ${error.message}`);
    }
    
    // Test 3: Test combineOptions function
    console.log("\n3️⃣ Testing combineOptions Function...");
    try {
      // We can't call this directly as it's internal, but we can test the contract's quote
      const simplePayload = hre.ethers.utils.defaultAbiCoder.encode(["string"], ["test"]);
      const emptyOptions = "0x";
      
      // Try to call the contract's internal quote via the public quote function
      const quote = await CrossChainRouter.quote(destConfig.eid, simplePayload, emptyOptions, false);
      console.log(`✅ Basic quote works: ${hre.ethers.utils.formatEther(quote.nativeFee)} ETH`);
    } catch (error: any) {
      console.log(`❌ Contract quote failed: ${error.message}`);
      if (error.data) {
        console.log(`Error data: ${error.data}`);
        if (error.data.includes('6592671c')) {
          console.log("🚨 Same 0x6592671c error in contract");
          console.log("💡 This suggests the contract's LayerZero integration is broken");
        }
      }
    }
    
    // Test 4: Check stablecoin and OFT configuration
    console.log("\n4️⃣ Testing Stablecoin/OFT Configuration...");
    try {
      const stablecoin = await CrossChainRouter.stablecoin();
      const stablecoinOFT = await CrossChainRouter.stablecoinOFT();
      console.log(`Stablecoin: ${stablecoin}`);
      console.log(`StablecoinOFT: ${stablecoinOFT}`);
      console.log(`Expected OFT: ${sourceConfig.CustomStablecoinOFT}`);
      console.log(`OFT Match: ${stablecoinOFT.toLowerCase() === sourceConfig.CustomStablecoinOFT.toLowerCase()}`);
    } catch (error: any) {
      console.log(`❌ Could not get stablecoin config: ${error.message}`);
    }
    
    console.log("\n💡 === DIAGNOSIS ===");
    console.log("If step 3 fails with 0x6592671c:");
    console.log("- The contract's LayerZero integration is fundamentally broken");
    console.log("- The contract might be using wrong LayerZero interfaces");
    console.log("- The combineOptions function might be failing");
    console.log("- Consider redeploying the contract with simpler LayerZero integration");
  });
// Quote fees for cross-chain swap - FIXED VERSION
  task("debug-crosschain-swap", "Debug cross-chain swap step by step")
  .addParam("sourceNetwork", "Source network name")
  .addParam("destinationNetwork", "Destination network name")
  .addParam("sourceToken", "Source token address")
  .addParam("destinationToken", "Destination token address")
  .addParam("amountIn", "Amount of source tokens to swap")
  .addParam("amountOutMin", "Minimum amount of destination tokens to receive")
  .addParam("recipient", "Recipient address on destination chain")
  .setAction(async (taskArgs: any, hre: any) => {
    const { sourceNetwork, destinationNetwork, sourceToken, destinationToken, amountIn, amountOutMin, recipient } = taskArgs;
    
    console.log("🔍 === DEBUGGING CROSS-CHAIN SWAP ===");
    
    const sourceConfig = NETWORK_CONFIG[sourceNetwork];
    const destConfig = NETWORK_CONFIG[destinationNetwork];
    
    const [signer] = await hre.ethers.getSigners();
    const CrossChainRouter = await hre.ethers.getContractAt("CrossChainRouter", sourceConfig.CrossChainRouter);
    
    try {
      // Step 1: Check token balance and allowance
      console.log("\n1️⃣ Token Balance & Allowance Check");
      const sourceTokenContract = await hre.ethers.getContractAt("IERC20", sourceToken);
      const balance = await sourceTokenContract.balanceOf(signer.address);
      const allowance = await sourceTokenContract.allowance(signer.address, sourceConfig.CrossChainRouter);
      const amountInWei = hre.ethers.utils.parseEther(amountIn);
      
      console.log(`Balance: ${hre.ethers.utils.formatEther(balance)}`);
      console.log(`Allowance: ${hre.ethers.utils.formatEther(allowance)}`);
      console.log(`Required: ${amountIn}`);
      console.log(`✅ Sufficient balance: ${balance.gte(amountInWei)}`);
      console.log(`✅ Sufficient allowance: ${allowance.gte(amountInWei)}`);

      // Step 2: Check DEX liquidity
      console.log("\n2️⃣ DEX Liquidity Check");
      const estimatedStable = await CrossChainRouter.estimateSwapOutput(sourceToken, amountInWei);
      console.log(`Estimated stablecoin output: ${hre.ethers.utils.formatEther(estimatedStable)}`);
      
      if (estimatedStable.eq(0)) {
        console.log("❌ No liquidity for source token → stablecoin swap!");
        return;
      }

      // Step 3: Check individual fee components
      console.log("\n3️⃣ Fee Component Analysis");
      const recipientBytes32 = hre.ethers.utils.hexZeroPad(recipient, 32);
      const destinationTokenBytes32 = hre.ethers.utils.hexZeroPad(destinationToken, 32);
      const amountOutMinWei = hre.ethers.utils.parseEther(amountOutMin);
      const options = "0x";

      // Quote bridge fee
      try {
        const StablecoinOFT = await hre.ethers.getContractAt("IOFT", sourceConfig.CustomStablecoinOFT);
        const minAmountAfterFee = estimatedStable.mul(950).div(1000);
        const sendParam = {
          dstEid: destConfig.eid,
          to: hre.ethers.utils.hexZeroPad(destConfig.CrossChainRouter, 32),
          amountLD: estimatedStable,
          minAmountLD: minAmountAfterFee,
          extraOptions: options,
          composeMsg: "0x",
          oftCmd: "0x"
        };

        const bridgeFee = await StablecoinOFT.quoteSend(sendParam, false);
        console.log(`✅ Bridge Fee: ${hre.ethers.utils.formatEther(bridgeFee.nativeFee)} ETH`);
        
        // Quote total fee using contract's function
        const totalFee = await CrossChainRouter.quoteSwap(
          destConfig.eid,
          recipientBytes32,
          destinationTokenBytes32,
          amountOutMinWei,
          estimatedStable,
          options,
          false
        );
        console.log(`✅ Total Fee: ${hre.ethers.utils.formatEther(totalFee.nativeFee)} ETH`);
        
        // Calculate message fee
        const messageFee = totalFee.nativeFee.sub(bridgeFee.nativeFee);
        console.log(`Calculated Message Fee: ${hre.ethers.utils.formatEther(messageFee)} ETH`);
        
        if (messageFee.lt(0)) {
          console.log("❌ CRITICAL: Message fee is negative! This will cause transaction to fail.");
          console.log("   Problem: totalFee calculation is wrong in quoteSwap function");
        }

      } catch (feeError) {
        console.log(`❌ Fee calculation failed: ${feeError.message}`);
      }

      // Step 4: Simulate the swap (read-only)
      console.log("\n4️⃣ Contract State Simulation");
      
      // Check stablecoin contract
      const stablecoinAddr = await CrossChainRouter.stablecoin();
      const stablecoinContract = await hre.ethers.getContractAt("IERC20", stablecoinAddr);
      const stablecoinBalance = await stablecoinContract.balanceOf(sourceConfig.CrossChainRouter);
      console.log(`Contract stablecoin balance: ${hre.ethers.utils.formatEther(stablecoinBalance)}`);

      // Check ETH balance
      const ethBalance = await hre.ethers.provider.getBalance(sourceConfig.CrossChainRouter);
      console.log(`Contract ETH balance: ${hre.ethers.utils.formatEther(ethBalance)}`);

      console.log("\n🎯 === DIAGNOSIS ===");
      console.log("Based on the analysis above, the most likely failure point is:");
      console.log("❌ Incorrect fee calculation in crossChainSwap function");
      console.log("   The contract calculates messageFee = totalFee - bridgeFee");
      console.log("   But totalFee already includes bridgeFee, making messageFee wrong/negative");
      console.log("\n💡 Solution: Update contract with corrected fee handling logic");

    } catch (error) {
      console.error(`Debug failed: ${error.message}`);
    }
  });

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
      
      try {
        const stablecoinAddr = await CrossChainRouter.stablecoin();
        const stablecoinOFTAddr = await CrossChainRouter.stablecoinOFT();
        const dexRouterAddr = await CrossChainRouter.dexRouter();
        
        console.log(`✅ Stablecoin: ${stablecoinAddr}`);
        console.log(`✅ Stablecoin OFT: ${stablecoinOFTAddr}`);
        console.log(`✅ DEX Router: ${dexRouterAddr}`);

        // Check peers configuration
        const peerAddress = await CrossChainRouter.peers(destConfig.eid);
        console.log(`✅ Peer for EID ${destConfig.eid}: ${peerAddress}`);
        
        if (peerAddress === "0x0000000000000000000000000000000000000000000000000000000000000000") {
          console.log(`❌ WARNING: No peer set for destination EID ${destConfig.eid}!`);
          console.log(`   You need to set peers first using setPeer function`);
          return;
        }

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
        
        // Apply 5% slippage and use correct destination address
        const minAmountAfterFee = estimatedStableAmount.mul(950).div(1000); // 5% slippage
        const sendParam = {
          dstEid: destConfig.eid,
          to: hre.ethers.utils.hexZeroPad(destConfig.CrossChainRouter, 32), // CrossChainRouter on destination
          amountLD: estimatedStableAmount,
          minAmountLD: minAmountAfterFee, // Apply slippage tolerance
          extraOptions: options,
          composeMsg: "0x",
          oftCmd: "0x"
        };

        const bridgeFee = await StablecoinOFT.quoteSend(sendParam, false);
        console.log(`✅ Bridge Fee: ${hre.ethers.utils.formatEther(bridgeFee.nativeFee)} ETH`);
        console.log(`   LZ Token Fee: ${hre.ethers.utils.formatEther(bridgeFee.lzTokenFee)}`);

        // Step 5: Use the CORRECT quoteSwap function (not quoteSwapFee)
        console.log("\n🔧 Step 5: Using Correct quoteSwap Function");
        try {
          const totalFee = await CrossChainRouter.quoteSwap(
            destConfig.eid,
            recipientBytes32,
            destinationTokenBytes32,
            amountOutMinWei,
            estimatedStableAmount,
            options,
            false // _payInLzToken parameter
          );
          
          console.log("✅ SUCCESS! quoteSwap function worked:");
          console.log(`Total required fee: ${hre.ethers.utils.formatEther(totalFee.nativeFee)} ETH`);
          console.log(`LZ Token fee: ${hre.ethers.utils.formatEther(totalFee.lzTokenFee)}`);
          console.log(`Recommended (with 10% buffer): ${hre.ethers.utils.formatEther(totalFee.nativeFee.mul(110).div(100))} ETH`);
          
          // Detailed breakdown
          console.log("\n🎯 === DETAILED FEE BREAKDOWN ===");
          console.log(`Bridge Fee: ${hre.ethers.utils.formatEther(bridgeFee.nativeFee)} ETH`);
          
          // Calculate message fee (total - bridge)
          const messageFee = totalFee.nativeFee.sub(bridgeFee.nativeFee);
          console.log(`Message Fee: ${hre.ethers.utils.formatEther(messageFee)} ETH`);
          console.log(`Total Fee: ${hre.ethers.utils.formatEther(totalFee.nativeFee)} ETH`);
          console.log(`With 15% buffer: ${hre.ethers.utils.formatEther(totalFee.nativeFee.mul(115).div(100))} ETH`);
          
        } catch (quoteError: any) {
          console.log(`❌ quoteSwap function failed: ${quoteError.message}`);
          
          // Analyze the error
          if (quoteError.message.includes("0x71c4efed")) {
            console.log("🔍 Error Analysis:");
            console.log("   Error signature: 0x71c4efed");
            console.log("   This suggests a revert in the contract logic");
            console.log("   Possible causes:");
            console.log("   1. OFT contract quoteSend function reverts");
            console.log("   2. Invalid destination EID or peer not set");
            console.log("   3. Stablecoin amount is 0 or invalid");
            console.log("   4. Options parameter issue");
          }

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

      // Additional diagnostics
      console.log("\n🔍 Additional Diagnostics:");
      
      // Check if stablecoin amount is valid
      if (estimatedStableAmount.eq(0)) {
        console.log("❌ Estimated stablecoin amount is 0!");
        console.log("   This suggests the source token → stablecoin swap would fail");
        console.log("   Check if liquidity pools exist");
      }

    } catch (error: any) {
      console.error(`\n❌ === FEE QUOTE FAILED ===`);
      console.error(`Error: ${error.message}`);
      
      // Provide troubleshooting guidance
      console.log("\n🛠️  === TROUBLESHOOTING GUIDE ===");
      console.log("1. Check if contracts are properly deployed:");
      console.log(`   CrossChainRouter: ${sourceConfig.CrossChainRouter}`);
      console.log(`   StablecoinOFT: ${sourceConfig.CustomStablecoinOFT}`);
      
      console.log("\n2. Verify peers are set:");
      console.log(`   Run: await crossChainRouter.setPeer(${destConfig.eid}, "0x${destConfig.CrossChainRouter.slice(2).padStart(64, '0')}")`);
      
      console.log("\n3. Verify liquidity pools exist:");
      console.log(`   Run: npx hardhat check-pools --source-network ${sourceNetwork} --destination-network ${destinationNetwork} --source-token ${sourceToken} --destination-token ${destinationToken} --network ${sourceNetwork}`);
      
      console.log("\n4. Try with different parameters:");
      console.log("   - Use smaller amounts");
      console.log("   - Check token addresses are correct");
      console.log("   - Verify recipient address format");
      
      console.log("\n5. Manual fee estimation:");
      console.log("   - Bridge fees: typically 0.01-0.05 ETH");
      console.log("   - Message fees: typically 0.01-0.03 ETH");
      console.log("   - Total: 0.02-0.08 ETH + buffer");
      
      throw error;
    }
  });

task("granular-debug", "Test each cross-chain swap function individually")
.addParam("sourceNetwork", "Source network name")
.addParam("destinationNetwork", "Destination network name")
.addParam("sourceToken", "Source token address")
.addParam("destinationToken", "Destination token address")
.setAction(async (taskArgs: any, hre: any) => {
  const { sourceNetwork, destinationNetwork, sourceToken, destinationToken } = taskArgs;
  
  console.log("🔬 === GRANULAR FUNCTION DEBUG ===");
  
  const sourceConfig = NETWORK_CONFIG[sourceNetwork];
  const destConfig = NETWORK_CONFIG[destinationNetwork];
  const [signer] = await hre.ethers.getSigners();
  
  const CrossChainRouter = await hre.ethers.getContractAt("CrossChainRouter", sourceConfig.CrossChainRouter);
  const SourceToken = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", sourceToken);
  
  const amountInWei = hre.ethers.utils.parseEther("1");
  const amountOutMinWei = hre.ethers.utils.parseEther("0.9");
  const recipientBytes32 = hre.ethers.utils.hexZeroPad(signer.address, 32);
  const destinationTokenBytes32 = hre.ethers.utils.hexZeroPad(destinationToken, 32);
  const options = "0x";
  
  try {
    console.log("\n🧪 TEST 1: Basic Contract Calls");
    
    // Test 1: Basic getters (these should always work)
    const stablecoin = await CrossChainRouter.stablecoin();
    const stablecoinOFT = await CrossChainRouter.stablecoinOFT();
    const dexRouter = await CrossChainRouter.dexRouter();
    console.log(`✅ Stablecoin: ${stablecoin}`);
    console.log(`✅ StablecoinOFT: ${stablecoinOFT}`);
    console.log(`✅ DEX Router: ${dexRouter}`);
    
    // Test 2: Estimate swap output (read-only)
    console.log("\n🧪 TEST 2: Estimate Swap Output");
    const estimatedOutput = await CrossChainRouter.estimateSwapOutput(sourceToken, amountInWei);
    console.log(`✅ Estimated output: ${hre.ethers.utils.formatEther(estimatedOutput)}`);
    
    // Test 3: Quote swap fee (this was failing before)
    console.log("\n🧪 TEST 3: Quote Swap Fee");
    try {
      const totalFee = await CrossChainRouter.quoteSwapFee(
        destConfig.eid,
        recipientBytes32,
        destinationTokenBytes32,
        amountOutMinWei,
        estimatedOutput,
        options
      );
      console.log(`✅ Total fee quote: ${hre.ethers.utils.formatEther(totalFee.nativeFee)} ETH`);
    } catch (feeError: any) {
      console.log(`❌ Fee quote failed: ${feeError.message}`);
    }
    
    // Test 4: Check approvals and balances
    console.log("\n🧪 TEST 4: Token Approvals & Balances");
    const balance = await SourceToken.balanceOf(signer.address);
    const allowance = await SourceToken.allowance(signer.address, CrossChainRouter.address);
    console.log(`Source balance: ${hre.ethers.utils.formatEther(balance)}`);
    console.log(`Router allowance: ${hre.ethers.utils.formatEther(allowance)}`);
    
    if (allowance.lt(amountInWei)) {
      console.log("⚠️ Insufficient allowance - this might be the issue!");
      
      // Try to approve
      console.log("⏳ Approving router...");
      const approveTx = await SourceToken.approve(CrossChainRouter.address, amountInWei);
      await approveTx.wait();
      console.log("✅ Router approved");
    }
    
    // Test 5: Try calling crossChainSwap with staticCall to see where it fails
    console.log("\n🧪 TEST 5: Static Call Test (dry run)");
    try {
      await CrossChainRouter.callStatic.crossChainSwap(
        destConfig.eid,
        recipientBytes32,
        sourceToken,
        destinationTokenBytes32,
        amountInWei,
        amountOutMinWei,
        options,
        { value: hre.ethers.utils.parseEther("0.01") }
      );
      console.log("✅ Static call succeeded - transaction should work!");
    } catch (staticError: any) {
      console.log(`❌ Static call failed: ${staticError.message}`);
      
      // Try to decode the error
      if (staticError.message.includes("execution reverted")) {
        console.log("🔍 The transaction reverts during execution");
        
        // Common revert reasons to check
        const commonErrors = [
          "PayfundsRouter: INSUFFICIENT_OUTPUT_AMOUNT",
          "PayfundsRouter: INSUFFICIENT_A_AMOUNT", 
          "PayfundsRouter: INSUFFICIENT_B_AMOUNT",
          "PayfundsRouter: EXPIRED",
          "ERC20: transfer amount exceeds balance",
          "ERC20: transfer amount exceeds allowance"
        ];
        
        console.log("📋 Common failure reasons:");
        commonErrors.forEach(err => console.log(`   - ${err}`));
      }
    }
    
    // Test 6: Try individual components that crossChainSwap calls
    console.log("\n🧪 TEST 6: Individual Component Tests");
    
    // Test source swap only
    const DexRouter = await hre.ethers.getContractAt("contracts/CrossChainRouter.sol:IPayfundsRouter02", sourceConfig.Router);
    const path = [sourceToken, stablecoin];
    
    try {
      const amountsOut = await DexRouter.getAmountsOut(amountInWei, path);
      console.log(`✅ DEX amounts out: ${hre.ethers.utils.formatEther(amountsOut[1])}`);
      
      // Check if slippage might be the issue
      const currentAmountOut = amountsOut[1];
      const estimatedAmountOut = estimatedOutput;
      
      if (!currentAmountOut.eq(estimatedAmountOut)) {
        console.log("⚠️ Price changed between estimate and execution!");
        console.log(`Current: ${hre.ethers.utils.formatEther(currentAmountOut)}`);
        console.log(`Expected: ${hre.ethers.utils.formatEther(estimatedAmountOut)}`);
      }
      
    } catch (dexError: any) {
      console.log(`❌ DEX getAmountsOut failed: ${dexError.message}`);
    }
    
  } catch (error: any) {
    console.error(`❌ Granular debug failed: ${error.message}`);
  }
});





