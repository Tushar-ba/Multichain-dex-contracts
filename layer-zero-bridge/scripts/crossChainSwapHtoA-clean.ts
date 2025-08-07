import { ethers } from "hardhat";

async function main() {
    console.log("🚀 === CROSS-CHAIN SWAP: HOLESKY -> AVALANCHE ===");
    console.log("📍 TRUMP (Holesky) -> PFUSD -> USDC (Avalanche)");
    console.log("💰 Amount: 100 tokens");
    console.log("===============================================");

    // Network configurations based on your UI selection
    const HOLESKY_CONFIG = {
        eid: 40217,
        CustomStablecoinOFT: '0x0a44Dc381949F6128Ca0615B4c68F0D15818dE74', // PFUSD on Holesky
        CrossChainRouter: '0xC411824F1695feeC0f9b8C3d4810c2FD1AB1000a',
        SourceToken: '0x32c2aeDF58244188d04658BFE940b8168a82b56e'  // TRUMP token (SOURCE)
    };

    const AVALANCHE_CONFIG = {
        eid: 40106,
        CustomStablecoinOFT: '0x55C192C8bF6749F65dE78E524273A481C4b1f667', // PFUSD on Avalanche
        CrossChainRouter: '0x9F577e8A1be3ec65BE0fb139425988dfE438196e',
        DestinationToken: '0x6eF270de76beaD742E3f82083b8b0EA2C3E45Bd1'   // USDC token (DESTINATION)
    };

    // Swap parameters
    const amountIn = ethers.utils.parseEther("100"); // 100 TRUMP
    const amountOutMin = ethers.utils.parseEther("95"); // Minimum 95 USDC output
    const feeAmount = ethers.utils.parseEther("0.5"); // 0.5 ETH for fees

    const [deployer] = await ethers.getSigners();
    console.log(`🔑 Deployer address: ${deployer.address}`);

    try {
        // Get contract instances
        console.log("\n📋 === GETTING CONTRACT INSTANCES ===");
        const CrossChainRouter = await ethers.getContractAt("SimpleCrossChainRouter", HOLESKY_CONFIG.CrossChainRouter);
        const SourceToken = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", HOLESKY_CONFIG.SourceToken);
        
        console.log(`✅ CrossChainRouter: ${HOLESKY_CONFIG.CrossChainRouter}`);
        console.log(`✅ Source Token (TRUMP): ${HOLESKY_CONFIG.SourceToken}`);
        console.log(`✅ Destination Token (USDC): ${AVALANCHE_CONFIG.DestinationToken}`);

        // Check balances
        console.log("\n💰 === BALANCE CHECKS ===");
        const tokenBalance = await SourceToken.balanceOf(deployer.address);
        const ethBalance = await deployer.getBalance();
        
        console.log(`TRUMP Balance: ${ethers.utils.formatEther(tokenBalance)}`);
        console.log(`ETH Balance: ${ethers.utils.formatEther(ethBalance)}`);

        if (tokenBalance.lt(amountIn)) {
            throw new Error(`❌ Insufficient TRUMP balance. Required: 100, Available: ${ethers.utils.formatEther(tokenBalance)}`);
        }

        if (ethBalance.lt(feeAmount)) {
            throw new Error(`❌ Insufficient ETH for fees. Required: 0.5, Available: ${ethers.utils.formatEther(ethBalance)}`);
        }

        // Check and approve tokens
        console.log("\n🔐 === TOKEN APPROVAL ===");
        const currentAllowance = await SourceToken.allowance(deployer.address, HOLESKY_CONFIG.CrossChainRouter);
        
        if (currentAllowance.lt(amountIn)) {
            console.log("📝 Approving tokens for CrossChainRouter...");
            const approveTx = await SourceToken.approve(HOLESKY_CONFIG.CrossChainRouter, amountIn, {
                gasLimit: 100000
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
            const estimatedStableAmount = await CrossChainRouter.estimateSwapOutput(HOLESKY_CONFIG.SourceToken, amountIn);
            console.log(`📈 Estimated PFUSD output: ${ethers.utils.formatEther(estimatedStableAmount)}`);
        } catch (estimationError) {
            console.log("⚠️ Swap estimation failed, proceeding anyway...");
        }

        // Quote fees
        console.log("\n💸 === FEE QUOTATION ===");
        const options = "0x"; // Default options

        try {
            const quotedFee = await CrossChainRouter.quoteCrossChainSwap(
                AVALANCHE_CONFIG.eid,                    // DESTINATION: Avalanche
                deployer.address,
                AVALANCHE_CONFIG.DestinationToken,       // DESTINATION TOKEN: USDC
                ethers.utils.parseEther("95"),           // Estimated stable amount
                amountOutMin,
                options,
                false
            );
            console.log(`💰 Quoted fee: ${ethers.utils.formatEther(quotedFee.nativeFee)} ETH`);
            console.log(`💰 Provided fee: ${ethers.utils.formatEther(feeAmount)} ETH`);
        } catch (quoteError) {
            console.log("⚠️ Fee quotation failed, using provided fee amount...");
        }

        // Execute cross-chain swap
        console.log("\n🌉 === EXECUTING CROSS-CHAIN SWAP ===");
        console.log("This transaction will:");
        console.log("1. 🔄 Swap TRUMP -> PFUSD on Holesky");
        console.log("2. 🌉 Send LayerZero message to Avalanche");
        console.log("3. 🔄 Swap PFUSD -> USDC on Avalanche");
        console.log("4. 📤 Send USDC to recipient");

        const swapTx = await CrossChainRouter.crossChainSwap(
            AVALANCHE_CONFIG.eid,                    // destination EID (Avalanche)
            deployer.address,                        // recipient address (deployer)
            HOLESKY_CONFIG.SourceToken,              // source token (TRUMP)
            AVALANCHE_CONFIG.DestinationToken,       // destination token (USDC) - KEY: Use destination token, not stablecoin!
            amountIn,                                // amount in (100 tokens)
            amountOutMin,                            // minimum amount out (95 tokens)
            options,                                 // LayerZero options
            {
                value: feeAmount,                    // ETH for fees
                gasLimit: 3000000                    // High gas limit
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
                    console.log(`   📈 Amount In: ${ethers.utils.formatEther(parsedLog.args.amountIn)} TRUMP`);
                    console.log(`   💰 Stable Amount: ${ethers.utils.formatEther(parsedLog.args.stableAmount)} PFUSD`);
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
        console.log(`📍 Final USDC tokens will be delivered to: ${deployer.address}`);
        console.log(`🎯 Expected USDC amount: ~${ethers.utils.formatEther(amountOutMin)} (minimum guaranteed)`);
        console.log("");
        console.log("🔍 Monitor progress:");
        console.log("   - Holesky transaction: https://holesky.etherscan.io/tx/" + swapTx.hash);
        console.log("   - LayerZero tracking: https://testnet.layerzeroscan.com/");
        console.log("   - Avalanche events: https://testnet.snowtrace.io/");

    } catch (error: any) {
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
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

// Run this with: npx hardhat run scripts/crossChainSwapHtoA-clean.ts --network holesky