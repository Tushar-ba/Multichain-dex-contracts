import { task } from "hardhat/config";
import { EndpointId } from '@layerzerolabs/lz-definitions';

// Network configurations - UPDATED WITH NEW DEPLOYED ADDRESSES
const NETWORK_CONFIG: Record<string, any> = {

  'holesky': {
    eid: 40217,
    CustomStablecoinOFT: '0x0a44Dc381949F6128Ca0615B4c68F0D15818dE74',
    CrossChainRouter: '0xC411824F1695feeC0f9b8C3d4810c2FD1AB1000a',
    Endpoint: '0x6EDCE65403992e310A62460808c4b910D972f10f',
    Router: '0x1F2Ea7012Be2Fb0Ba2ce8B7B2A1ab3357Ab2315d', // PayfundsRouter02
    TRUMP: '0x32c2aeDF58244188d04658BFE940b8168a82b56e', // TRUMP token on Holesky
    TokenA: '0x31a210d4BaD0D1f1a7d96acfD637E082B854ADE8' // Legacy TokenA
  },
  'avalanche-fuji-testnet': {
    eid: 40106,
    CustomStablecoinOFT: '0x55C192C8bF6749F65dE78E524273A481C4b1f667',
    CrossChainRouter: '0x9F577e8A1be3ec65BE0fb139425988dfE438196e',
    Endpoint: '0x6EDCE65403992e310A62460808c4b910D972f10f',
    Router: '0x011b561002A1D2522210BA3d687131AB1F6AcF79', // PayfundsRouter02
    USDC: '0x6eF270de76beaD742E3f82083b8b0EA2C3E45Bd1', // USDC token on Avalanche
    TokenB: '0x1963f6163D9eaFCb1aF6DB7207b21E8aD6548751' // Legacy TokenB
  },

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

task("debug-oft-bridge", "Debug OFT bridging separately")
  .addParam("sourceNetwork", "Source network name")
  .addParam("destinationNetwork", "Destination network name")
  .addParam("amount", "Amount of stablecoins to bridge")
  .addParam("recipient", "Recipient address on destination chain")
  .addParam("feeEth", "Fee amount in ETH")
  .setAction(async (taskArgs, hre) => {
    const { sourceNetwork, destinationNetwork, amount, recipient, feeEth } = taskArgs;

    console.log("🔍 === DEBUGGING OFT BRIDGE ONLY ===");
    console.log(`Source Network: ${sourceNetwork}`);
    console.log(`Destination Network: ${destinationNetwork}`);
    console.log(`Amount: ${amount}`);
    console.log(`Recipient: ${recipient}`);
    console.log(`Fee: ${feeEth} ETH`);
    console.log("=======================================");

    const sourceConfig = NETWORK_CONFIG[sourceNetwork];
    const destConfig = NETWORK_CONFIG[destinationNetwork];

    const [signer] = await hre.ethers.getSigners();
    console.log(`🔑 Signer address: ${signer.address}`);

    // Get OFT contract
    const StablecoinOFT = await hre.ethers.getContractAt("IOFT", sourceConfig.CustomStablecoinOFT);

    const amountWei = hre.ethers.utils.parseEther(amount);
    const feeWei = hre.ethers.utils.parseEther(feeEth);
    const recipientBytes32 = hre.ethers.utils.hexZeroPad(recipient, 32);

    try {
      // Check balance
      console.log("\n💰 === STABLECOIN BALANCE CHECK ===");
      const balance = await StablecoinOFT.balanceOf(signer.address);
      console.log(`Stablecoin Balance: ${hre.ethers.utils.formatEther(balance)}`);

      if (balance.lt(amountWei)) {
        throw new Error(`❌ Insufficient stablecoin balance. Required: ${amount}, Available: ${hre.ethers.utils.formatEther(balance)}`);
      }

      // Create SendParam for OFT bridge
      console.log("\n🌉 === PREPARING OFT BRIDGE ===");
      const minAmountAfterFee = amountWei.mul(95).div(100); // 5% slippage

      const sendParam = {
        dstEid: destConfig.eid,
        to: recipientBytes32,
        amountLD: amountWei,
        minAmountLD: minAmountAfterFee,
        extraOptions: "0x",
        composeMsg: "0x",
        oftCmd: "0x"
      };

      // Quote the bridge fee
      console.log("🔍 Quoting OFT bridge fee...");
      const quotedFee = await StablecoinOFT.quoteSend(sendParam, false);
      console.log(`Required fee: ${hre.ethers.utils.formatEther(quotedFee.nativeFee)} ETH`);
      console.log(`Provided fee: ${feeEth} ETH`);

      if (quotedFee.nativeFee.gt(feeWei)) {
        console.log(`⚠️ WARNING: Fee might be insufficient`);
        console.log(`Required: ${hre.ethers.utils.formatEther(quotedFee.nativeFee)} ETH`);
        console.log(`Provided: ${feeEth} ETH`);
      }

      // Execute OFT bridge
      console.log("\n🚀 === EXECUTING OFT BRIDGE ===");
      const bridgeTx = await StablecoinOFT.send(
        sendParam,
        quotedFee,
        signer.address, // refund address
        {
          value: feeWei,
          gasLimit: 2000000,
          gasPrice: hre.ethers.utils.parseUnits("50", "gwei")
        }
      );

      console.log(`🚀 Bridge transaction sent: ${bridgeTx.hash}`);
      console.log("⏳ Waiting for confirmation...");

      const receipt = await bridgeTx.wait();

      if (receipt.status === 0) {
        console.error("❌ OFT Bridge transaction failed");
        return;
      }

      console.log(`✅ OFT Bridge transaction confirmed!`);
      console.log(`📦 Block: ${receipt.blockNumber}`);
      console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);

      const explorerUrl = sourceNetwork === 'holesky' ?
        `https://holesky.etherscan.io/tx/${bridgeTx.hash}` :
        `https://testnet.snowtrace.io/tx/${bridgeTx.hash}`;
      console.log(`🔗 Transaction: ${explorerUrl}`);

      console.log("\n✅ === OFT BRIDGE SUCCESSFUL ===");
      console.log("The stablecoins should arrive on the destination chain in 1-5 minutes");

    } catch (error) {
      console.error("\n❌ === OFT BRIDGE FAILED ===");
      console.error(`Error: ${error.message}`);

      if (error.message.includes('insufficient funds')) {
        console.error("💡 You need more ETH for fees");
      } else if (error.message.includes('OFT_InsufficientAllowance')) {
        console.error("💡 Need to approve OFT contract to spend stablecoins");
      } else if (error.message.includes('OFT_InsufficientBalance')) {
        console.error("💡 Insufficient stablecoin balance");
      }

      throw error;
    }
  });

task("debug-simple-swap", "Debug just the DEX swap part")
  .addParam("sourceNetwork", "Source network name")
  .addParam("sourceToken", "Source token address")
  .addParam("amountIn", "Amount to swap")
  .setAction(async (taskArgs, hre) => {
    const { sourceNetwork, sourceToken, amountIn } = taskArgs;

    console.log("🔍 === DEBUGGING DEX SWAP ONLY ===");

    const sourceConfig = NETWORK_CONFIG[sourceNetwork];
    const [signer] = await hre.ethers.getSigners();

    // Get contracts
    const DexRouter = await hre.ethers.getContractAt("IPayfundsRouter02", sourceConfig.Router);
    const SourceToken = await hre.ethers.getContractAt("IERC20", sourceToken);
    const stablecoin = sourceConfig.CustomStablecoinOFT;

    const amountInWei = hre.ethers.utils.parseEther(amountIn);

    try {
      // Check and approve if needed
      console.log("🔐 Checking token approval...");
      const allowance = await SourceToken.allowance(signer.address, sourceConfig.Router);

      if (allowance.lt(amountInWei)) {
        console.log("Approving tokens...");
        const approveTx = await SourceToken.approve(sourceConfig.Router, amountInWei);
        await approveTx.wait();
        console.log("✅ Approval confirmed");
      }

      // Execute swap
      console.log("🔄 Executing DEX swap...");
      const path = [sourceToken, stablecoin];

      const swapTx = await DexRouter.swapExactTokensForTokens(
        amountInWei,
        0, // No minimum for testing
        path,
        signer.address,
        Math.floor(Date.now() / 1000) + 1200, // 20 minutes deadline
        {
          gasLimit: 500000,
          gasPrice: hre.ethers.utils.parseUnits("25", "gwei")
        }
      );

      console.log(`🚀 Swap transaction sent: ${swapTx.hash}`);
      const receipt = await swapTx.wait();

      if (receipt.status === 0) {
        console.error("❌ DEX swap failed");
        return;
      }

      console.log("✅ DEX swap successful!");
      console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);

      // Check resulting stablecoin balance
      const StablecoinContract = await hre.ethers.getContractAt("IERC20", stablecoin);
      const stableBalance = await StablecoinContract.balanceOf(signer.address);
      console.log(`📊 Stablecoin balance after swap: ${hre.ethers.utils.formatEther(stableBalance)}`);

    } catch (error) {
      console.error("❌ DEX swap failed:", error.message);
      throw error;
    }
  });

task("trump-to-usdc-swap", "Swap TRUMP (Holesky) to USDC (Avalanche)")
  .addParam("amountIn", "Amount of TRUMP tokens to swap")
  .addParam("amountOutMin", "Minimum amount of USDC tokens to receive")
  .addParam("recipient", "Recipient address on Avalanche")
  .addParam("feeEth", "Fee amount in ETH to send with transaction (e.g., 0.5)")
  .setAction(async (taskArgs, hre) => {
    const { amountIn, amountOutMin, recipient, feeEth } = taskArgs;

    console.log("🚀 === TRUMP (HOLESKY) → USDC (AVALANCHE) SWAP ===");
    console.log(`TRUMP Amount In: ${amountIn}`);
    console.log(`USDC Amount Out Min: ${amountOutMin}`);
    console.log(`Recipient: ${recipient}`);
    console.log(`Fee: ${feeEth} ETH`);
    console.log("=============================================");

    const sourceConfig = NETWORK_CONFIG['holesky'];
    const destConfig = NETWORK_CONFIG['avalanche-fuji-testnet'];

    const [signer] = await hre.ethers.getSigners();
    console.log(`🔑 Signer address: ${signer.address}`);

    // Get contract instances
    const CrossChainRouter = await hre.ethers.getContractAt("SimpleCrossChainRouter", sourceConfig.CrossChainRouter);
    const TrumpToken = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", sourceConfig.TRUMP);

    const amountInWei = hre.ethers.utils.parseEther(amountIn);
    const amountOutMinWei = hre.ethers.utils.parseEther(amountOutMin);
    const feeWei = hre.ethers.utils.parseEther(feeEth);

    try {
      // Check balances
      console.log("\n💰 === BALANCE CHECKS ===");
      const trumpBalance = await TrumpToken.balanceOf(signer.address);
      const ethBalance = await signer.getBalance();

      console.log(`TRUMP Balance: ${hre.ethers.utils.formatEther(trumpBalance)}`);
      console.log(`ETH Balance: ${hre.ethers.utils.formatEther(ethBalance)}`);

      if (trumpBalance.lt(amountInWei)) {
        throw new Error(`❌ Insufficient TRUMP balance. Required: ${amountIn}, Available: ${hre.ethers.utils.formatEther(trumpBalance)}`);
      }

      if (ethBalance.lt(feeWei)) {
        throw new Error(`❌ Insufficient ETH for fees. Required: ${feeEth}, Available: ${hre.ethers.utils.formatEther(ethBalance)}`);
      }

      // Step 1: Approve tokens
      console.log("\n🔐 === TOKEN APPROVAL ===");
      const currentAllowance = await TrumpToken.allowance(signer.address, sourceConfig.CrossChainRouter);

      if (currentAllowance.lt(amountInWei)) {
        console.log(`📝 Approving ${amountIn} TRUMP tokens...`);
        const approveTx = await TrumpToken.approve(sourceConfig.CrossChainRouter, amountInWei, {
          gasLimit: 100000
        });
        console.log(`🚀 Approve TX: ${approveTx.hash}`);
        await approveTx.wait();
        console.log("✅ TRUMP approval confirmed!");
      } else {
        console.log("✅ Sufficient TRUMP allowance exists!");
      }

      // Step 2: Estimate swap output
      console.log("\n📊 === SWAP ESTIMATION ===");
      try {
        const estimatedStableAmount = await CrossChainRouter.estimateSwapOutput(sourceConfig.TRUMP, amountInWei);
        console.log(`📈 Estimated PFUSD output: ${hre.ethers.utils.formatEther(estimatedStableAmount)}`);
      } catch (estimationError) {
        console.log("⚠️ Swap estimation failed, proceeding anyway...");
      }

      // Step 3: Quote fees
      console.log("\n💸 === FEE QUOTATION ===");
      const options = "0x";

      try {
        const quotedFee = await CrossChainRouter.quoteCrossChainSwap(
          destConfig.eid,
          recipient,
          destConfig.USDC, // Use USDC as destination token
          hre.ethers.utils.parseEther("95"), // Estimated stable amount
          amountOutMinWei,
          options,
          false
        );
        console.log(`💰 Quoted fee: ${hre.ethers.utils.formatEther(quotedFee.nativeFee)} ETH`);
        console.log(`💰 Provided fee: ${feeEth} ETH`);
      } catch (quoteError) {
        console.log("⚠️ Fee quotation failed, using provided fee amount...");
      }

      // Step 4: Execute cross-chain swap
      console.log("\n🌉 === EXECUTING CROSS-CHAIN SWAP ===");
      console.log("This transaction will:");
      console.log("1. 🔄 Swap TRUMP → PFUSD on Holesky");
      console.log("2. 🌉 Send LayerZero message to Avalanche");
      console.log("3. 🔄 Swap PFUSD → USDC on Avalanche");
      console.log("4. 📤 Send USDC to recipient");

      const swapTx = await CrossChainRouter.crossChainSwap(
        destConfig.eid,           // destination EID (Avalanche)
        recipient,                // recipient address
        sourceConfig.TRUMP,       // source token (TRUMP)
        destConfig.USDC,          // destination token (USDC)
        amountInWei,              // amount in
        amountOutMinWei,          // minimum amount out
        options,                  // LayerZero options
        {
          value: feeWei,          // ETH for fees
          gasLimit: 3000000       // High gas limit
        }
      );

      console.log(`🚀 Transaction sent: ${swapTx.hash}`);
      console.log("⏳ Waiting for confirmation...");

      const receipt = await swapTx.wait();

      if (receipt.status === 0) {
        console.error("❌ Transaction failed");
        console.log(`🔗 Check transaction: https://holesky.etherscan.io/tx/${swapTx.hash}`);
        return;
      }

      console.log(`✅ Transaction confirmed!`);
      console.log(`📦 Block: ${receipt.blockNumber}`);
      console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
      console.log(`🔗 Transaction: https://holesky.etherscan.io/tx/${swapTx.hash}`);

      // Parse events
      console.log("\n📋 === TRANSACTION EVENTS ===");
      for (const log of receipt.logs) {
        try {
          const parsedLog = CrossChainRouter.interface.parseLog(log);
          if (parsedLog.name === "CrossChainSwapInitiated") {
            console.log("🎉 CrossChainSwapInitiated:");
            console.log(`   📤 Sender: ${parsedLog.args.sender}`);
            console.log(`   🎯 Destination EID: ${parsedLog.args.destinationEid}`);
            console.log(`   👤 Recipient: ${parsedLog.args.recipient}`);
            console.log(`   🪙 Source Token: ${parsedLog.args.sourceToken}`);
            console.log(`   🪙 Destination Token: ${parsedLog.args.destinationToken}`);
            console.log(`   📈 Amount In: ${hre.ethers.utils.formatEther(parsedLog.args.amountIn)} TRUMP`);
            console.log(`   💰 Stable Amount: ${hre.ethers.utils.formatEther(parsedLog.args.stableAmount)} PFUSD`);
          }
        } catch (e) {
          // Not our event, skip silently
        }
      }

      console.log("\n🎉 === CROSS-CHAIN SWAP INITIATED SUCCESSFULLY! ===");
      console.log("✅ Step 1: TRUMP swapped to PFUSD on Holesky");
      console.log("🌉 Step 2: LayerZero message sent to Avalanche");
      console.log("⏳ Step 3: Automatic swap to USDC will happen on Avalanche");
      console.log("");
      console.log("🕐 Expected Timeline:");
      console.log("   - LayerZero bridging: 2-5 minutes");
      console.log("   - Destination swap execution: ~30 seconds after bridge");
      console.log("   - Total completion time: 3-6 minutes");
      console.log("");
      console.log(`📍 Final USDC tokens will be delivered to: ${recipient}`);
      console.log(`🎯 Expected USDC amount: ~${amountOutMin} (minimum guaranteed)`);
      console.log("");
      console.log("🔍 Monitor progress:");
      console.log("   - Holesky transaction: https://holesky.etherscan.io/tx/" + swapTx.hash);
      console.log("   - LayerZero tracking: https://testnet.layerzeroscan.com/");
      console.log("   - Avalanche events: https://testnet.snowtrace.io/");

    } catch (error) {
      console.error("\n❌ === CROSS-CHAIN SWAP FAILED ===");
      console.error(`Error: ${error.message}`);

      if (error.message.includes('Token transfer failed')) {
        console.error("💡 Check TRUMP allowance and balance");
      } else if (error.message.includes('Insufficient fee') || error.message.includes('NotEnoughNative')) {
        console.error("💡 Increase the ETH fee amount for LayerZero messaging");
      } else if (error.message.includes('deadline')) {
        console.error("💡 Transaction deadline exceeded, try again");
      } else if (error.message.includes('execution reverted')) {
        console.error("💡 Contract execution failed - check:");
        console.error("   - Contract state and parameters");
        console.error("   - LayerZero peer configuration");
        console.error("   - Token pair liquidity on DEX");
      } else if (error.message.includes('No peer set')) {
        console.error("💡 CrossChain router peers not configured");
        console.error("💡 Run: npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts");
      }

      throw error;
    }
  });

task("cross-chain-swap", "Perform complete cross-chain swap with automatic destination token conversion")
  .addParam("sourceNetwork", "Source network name")
  .addParam("destinationNetwork", "Destination network name")
  .addParam("sourceToken", "Source token address")
  .addParam("destinationToken", "Destination token address")
  .addParam("amountIn", "Amount of source tokens to swap")
  .addParam("amountOutMin", "Minimum amount of destination tokens to receive")
  .addParam("recipient", "Recipient address on destination chain")
  .addParam("feeEth", "Fee amount in ETH to send with transaction (e.g., 0.05)")
  .setAction(async (taskArgs, hre) => {
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

    const amountInWei = hre.ethers.utils.parseEther(amountIn);
    const amountOutMinWei = hre.ethers.utils.parseEther(amountOutMin);
    const feeWei = hre.ethers.utils.parseEther(feeEth);

    try {
      // Step 1: Approve tokens
      console.log("\n🔐 === TOKEN APPROVAL ===");
      try {
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
      } catch (approvalError) {
        console.log("⚠️ Token approval check failed, proceeding with swap...");
      }

      // Step 2: Estimate source swap output
      console.log("\n📊 === SWAP ESTIMATION ===");
      try {
        const estimatedStableAmount = await CrossChainRouter.estimateSwapOutput(sourceToken, amountInWei);
        console.log(`Estimated stablecoin output: ${hre.ethers.utils.formatEther(estimatedStableAmount)}`);
      } catch (estimationError) {
        console.log("⚠️ Swap estimation failed, proceeding with transaction...");
      }

      // Step 3: Execute complete cross-chain swap directly
      console.log("\n🌉 === EXECUTING COMPLETE CROSS-CHAIN SWAP ===");
      console.log("This will:");
      console.log("1. Swap your source tokens to stablecoins");
      console.log("2. Bridge stablecoins to destination chain");
      console.log("3. Automatically swap stablecoins to destination tokens");
      console.log("4. Send destination tokens directly to recipient");

      const options = "0x";
      const recipientBytes32 = hre.ethers.utils.hexZeroPad(recipient, 32);
      const destinationTokenBytes32 = hre.ethers.utils.hexZeroPad(destinationToken, 32);

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
          `https://testnet.snowtrace.io/tx/${swapTx.hash}`;
        console.log(`🔗 Check transaction: ${explorerUrl}`);
        return;
      }

      console.log(`✅ Transaction confirmed!`);
      console.log(`📦 Block: ${receipt.blockNumber}`);
      console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);

      const explorerUrl = sourceNetwork === 'holesky' ?
        `https://holesky.etherscan.io/tx/${swapTx.hash}` :
        `https://testnet.snowtrace.io/tx/${swapTx.hash}`;
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

    } catch (error) {
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