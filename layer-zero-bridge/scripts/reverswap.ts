import { ethers } from "hardhat";

async function main() {
    console.log("🚀 === CROSS-CHAIN SWAP: AVALANCHE -> HOLESKY ===");
    console.log("📍 TokenB (Avalanche) -> Stablecoin -> TokenA (Holesky)");
    console.log("💰 Amount: 100 tokens");
    console.log("===============================================");

    // Network configurations
    const AVALANCHE_CONFIG = {
        eid: 40106,
        CustomStablecoinOFT: '0x55C192C8bF6749F65dE78E524273A481C4b1f667',
        CrossChainRouter: '0x9F577e8A1be3ec65BE0fb139425988dfE438196e',
        TokenB: '0x1963f6163D9eaFCb1aF6DB7207b21E8aD6548751'  // SOURCE TOKEN
    };

    const HOLESKY_CONFIG = {
        eid: 40217,
        CustomStablecoinOFT: '0x0a44Dc381949F6128Ca0615B4c68F0D15818dE74',
        CrossChainRouter: '0xC411824F1695feeC0f9b8C3d4810c2FD1AB1000a',
        TokenA: '0x31a210d4BaD0D1f1a7d96acfD637E082B854ADE8'   // DESTINATION TOKEN
    };

    // Swap parameters
    const amountIn = ethers.utils.parseEther("100"); // 100 TokenB
    const amountOutMin = ethers.utils.parseEther("95"); // Minimum 95 TokenA output
    const feeAmount = ethers.utils.parseEther("0.5"); // 0.5 ETH for fees

    const [deployer] = await ethers.getSigners();
    console.log(`🔑 Deployer address: ${deployer.address}`);

    try {
        // Get contract instances
        console.log("\n📋 === GETTING CONTRACT INSTANCES ===");
        const CrossChainRouter = await ethers.getContractAt("SimpleCrossChainRouter", AVALANCHE_CONFIG.CrossChainRouter);
        const SourceToken = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", AVALANCHE_CONFIG.TokenB);
        
        console.log(`✅ CrossChainRouter: ${AVALANCHE_CONFIG.CrossChainRouter}`);
        console.log(`✅ Source Token (TokenB): ${AVALANCHE_CONFIG.TokenB}`);
        console.log(`✅ Destination Token (TokenA): ${HOLESKY_CONFIG.TokenA}`);

        // Check balances
        console.log("\n💰 === BALANCE CHECKS ===");
        const tokenBalance = await SourceToken.balanceOf(deployer.address);
        const ethBalance = await deployer.getBalance();
        
        console.log(`TokenB Balance: ${ethers.utils.formatEther(tokenBalance)}`);
        console.log(`ETH Balance: ${ethers.utils.formatEther(ethBalance)}`);

        if (tokenBalance.lt(amountIn)) {
            throw new Error(`❌ Insufficient TokenB balance. Required: 100, Available: ${ethers.utils.formatEther(tokenBalance)}`);
        }

        if (ethBalance.lt(feeAmount)) {
            throw new Error(`❌ Insufficient ETH for fees. Required: 0.5, Available: ${ethers.utils.formatEther(ethBalance)}`);
        }

        // Check and approve tokens
        console.log("\n🔐 === TOKEN APPROVAL ===");
        const currentAllowance = await SourceToken.allowance(deployer.address, AVALANCHE_CONFIG.CrossChainRouter);
        
        if (currentAllowance.lt(amountIn)) {
            console.log("📝 Approving tokens for CrossChainRouter...");
            const approveTx = await SourceToken.approve(AVALANCHE_CONFIG.CrossChainRouter, amountIn, {
                gasLimit: 100000,
                gasPrice: ethers.utils.parseUnits("25", "gwei")
            });
            console.log(`🚀 Approve TX: ${approveTx.hash}`);
            await approveTx.wait();
            console.log("✅ Token approval confirmed!");
        } else {
            console.log("✅ Sufficient allowance already exists!");
        }

        // Estimate swap output
        console.log("\n📊 === SWAP ESTIMATION ===");
        try {
            const estimatedStableAmount = await CrossChainRouter.estimateSwapOutput(AVALANCHE_CONFIG.TokenB, amountIn);
            console.log(`📈 Estimated stablecoin output: ${ethers.utils.formatEther(estimatedStableAmount)}`);
        } catch (estimationError) {
            console.log("⚠️ Swap estimation failed, proceeding anyway...");
        }

        // Quote fees
        console.log("\n💸 === FEE QUOTATION ===");
        const options = "0x"; // Default options

        try {
            const quotedFee = await CrossChainRouter.quoteCrossChainSwap(
                HOLESKY_CONFIG.eid,       // DESTINATION: Holesky
                deployer.address,
                HOLESKY_CONFIG.TokenA,    // DESTINATION TOKEN: TokenA
                ethers.utils.parseEther("95"), // Estimated stable amount
                amountOutMin,
                options,
                false
            );
            console.log(`💰 Quoted fee: ${ethers.utils.formatEther(quotedFee.nativeFee)} ETH`);
            console.log(`💰 Provided fee: ${ethers.utils.formatEther(feeAmount)} ETH`);
        } catch (quoteError) {
            console.log("⚠️ Fee quotation failed, using provided fee amount...");
        }

        // ⚠️ IMPORTANT WARNING
        console.log("\n⚠️  === IMPORTANT: HOLESKY ROUTER FUNDING CHECK ===");
        console.log("🚨 Make sure Holesky router has stablecoins for the destination swap!");
        console.log("💡 If this fails, run: npx hardhat run scripts/fund-holesky-router.ts --network holesky-testnet");
        console.log("💡 The Holesky router needs ~100+ stablecoins to perform TokenA swaps");

        // Execute cross-chain swap
        console.log("\n🌉 === EXECUTING CROSS-CHAIN SWAP ===");
        console.log("This transaction will:");
        console.log("1. 🔄 Swap TokenB -> Stablecoin on Avalanche");
        console.log("2. 🌉 Send LayerZero message to Holesky");
        console.log("3. 🔄 Swap Stablecoin -> TokenA on Holesky (needs router funding!)");
        console.log("4. 📤 Send TokenA to recipient");

        const swapTx = await CrossChainRouter.crossChainSwap(
            HOLESKY_CONFIG.eid,           // destination EID (Holesky)
            deployer.address,             // recipient address (deployer)
            AVALANCHE_CONFIG.TokenB,      // source token (TokenB)
            HOLESKY_CONFIG.TokenA,        // destination token (TokenA)
            amountIn,                     // amount in (100 tokens)
            amountOutMin,                 // minimum amount out (95 tokens)
            options,                      // LayerZero options
            {
                value: feeAmount,         // ETH for fees
                gasLimit: 3000000,        // High gas limit
                gasPrice: ethers.utils.parseUnits("25", "gwei")
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
                    console.log(`   📈 Amount In: ${ethers.utils.formatEther(parsedLog.args.amountIn)} TokenB`);
                    console.log(`   💰 Stable Amount: ${ethers.utils.formatEther(parsedLog.args.stableAmount)} USDC`);
                }
            } catch (e) {
                // Not our event, skip silently
            }
        }

        console.log("\n🎉 === CROSS-CHAIN SWAP INITIATED SUCCESSFULLY! ===");
        console.log("✅ Step 1: TokenB swapped to stablecoin on Avalanche");
        console.log("🌉 Step 2: LayerZero message sent to Holesky");
        console.log("⏳ Step 3: Automatic swap to TokenA will happen on Holesky");
        console.log("");
        console.log("🕐 Expected Timeline:");
        console.log("   - LayerZero bridging: 2-5 minutes");
        console.log("   - Destination swap execution: ~30 seconds after bridge");
        console.log("   - Total completion time: 3-6 minutes");
        console.log("");
        console.log(`📍 Final TokenA tokens will be delivered to: ${deployer.address}`);
        console.log(`🎯 Expected TokenA amount: ~${ethers.utils.formatEther(amountOutMin)} (minimum guaranteed)`);
        console.log("");
        console.log("🔍 Monitor progress:");
        console.log("   - Avalanche transaction: https://testnet.snowtrace.io/tx/" + swapTx.hash);
        console.log("   - LayerZero tracking: https://testnet.layerzeroscan.com/");
        console.log("   - Holesky events: https://holesky.etherscan.io/");

    } catch (error: any) {
        console.error("\n❌ === CROSS-CHAIN SWAP FAILED ===");
        console.error(`Error: ${error.message}`);
        
        if (error.message.includes('Token transfer failed')) {
            console.error("💡 Check TokenB allowance and balance");
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
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

// Run this with: npx hardhat run scripts/avalanche-to-holesky.ts --network avalanche-fuji-testnet