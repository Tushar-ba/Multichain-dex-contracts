import { task } from "hardhat/config";
import { EndpointId } from '@layerzerolabs/lz-definitions';

// Network configurations - UPDATED WITH NEW DEPLOYED ADDRESSES
const NETWORK_CONFIG: Record<string, any> = {
  'avalanche-fuji-testnet': {
    eid: EndpointId.AVALANCHE_V2_TESTNET,
    CustomStablecoinOFT: '0x5025D762AA65e578115614C6B04c819C987673a8', 
    CrossChainRouter: '0xAEf0D767bD76Ee4922643B385D90A9767f8dB580', 
    Endpoint: '0x6EDCE65403992e310A62460808c4b910D972f10f',
    Router: '0x011b561002A1D2522210BA3d687131AB1F6AcF79',
    TokenB: '0x1963f6163D9eaFCb1aF6DB7207b21E8aD6548751'
  },
  'arbitrum-sepolia-testnet': {
    eid: EndpointId.ARBSEP_V2_TESTNET,
    CustomStablecoinOFT: '0x5b5E7E791cD268d0539AE98bd651f29C84D639F9', 
    CrossChainRouter: '0x18b3E79A5293366D05099879309A7D60Fa7900A3', 
    Endpoint: '0x6EDCE65403992e310A62460808c4b910D972f10f',
    Router: '0xA9a558fB3269F307eE57270b41fcBaFFC56d5290',
    TokenA: '0x9340DA78eC04aD53CFbD6970D7F6C2A0a33cD42a'
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
  // 'base-sepolia': {
  //   eid: EndpointId.BASESEP_V2_TESTNET,
  //   CustomStablecoinOFT: '0x0000000000000000000000000000000000000000', // Update when deployed
  //   CrossChainRouter: '0x0000000000000000000000000000000000000000', // Update when deployed
  //   Endpoint: '0x6EDCE65403992e310A62460808c4b910D972f10f',
  //   Router: '0xC3b415C823366DC2222d979b0a17ce9C72A4feEB'
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
function getPeerAddress(address: string): string {
  // Ensure checksum format and pad to bytes32
  const checksumAddress = hre.ethers.utils.getAddress(address);
  return hre.ethers.utils.hexZeroPad(checksumAddress, 32);
}

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

      // Step 3: Quote total swap fee (bridge + message) - CRITICAL CHANGE
      console.log("\n💰 === DETAILED FEE BREAKDOWN ===");
      const options = "0x";
      const recipientBytes32 = hre.ethers.utils.hexZeroPad(recipient, 32);
      const destinationTokenBytes32 = hre.ethers.utils.hexZeroPad(destinationToken, 32);
      
      // Get individual fee components for verification
      try {
        // Quote OFT bridge fee
        console.log("🔍 Quoting OFT Bridge Fee...");
        const StablecoinOFT = await hre.ethers.getContractAt("IOFT", sourceConfig.CustomStablecoinOFT);
        const minAmountAfterFee = estimatedStableAmount.mul(950).div(1000);
        const sendParam = {
          dstEid: destConfig.eid,
          to: hre.ethers.utils.hexZeroPad(destConfig.CrossChainRouter, 32),
          amountLD: estimatedStableAmount,
          minAmountLD: minAmountAfterFee,
          extraOptions: options,
          composeMsg: "0x",
          oftCmd: "0x"
        };
        
        const bridgeFee = await StablecoinOFT.quoteSend(sendParam, false);
        console.log(`Bridge Fee: ${hre.ethers.utils.formatEther(bridgeFee.nativeFee)} ETH`);
        
        // Quote message fee
        console.log("🔍 Quoting Message Fee...");
        const payload = hre.ethers.utils.defaultAbiCoder.encode(
          ["bytes32", "bytes32", "uint256", "uint256", "address"],
          [recipientBytes32, destinationTokenBytes32, amountOutMinWei, estimatedStableAmount, recipient]
        );
        
        const msgFee = await CrossChainRouter.quote(destConfig.eid, payload, combinedOptions, false);
        console.log(`Message Fee: ${hre.ethers.utils.formatEther(msgFee.nativeFee)} ETH`);
        
        const manualTotal = bridgeFee.nativeFee.add(msgFee.nativeFee);
        console.log(`Manual Total: ${hre.ethers.utils.formatEther(manualTotal)} ETH`);
        
        // Now try the combined quote function
        console.log("\n🔍 Testing Combined Quote Function...");
        const totalFee = await CrossChainRouter.quoteSwapFee(
          destConfig.eid,
          recipientBytes32,
          destinationTokenBytes32,
          amountOutMinWei,
          estimatedStableAmount,
          options
        );
        
        console.log(`\n📊 === FEE COMPARISON ===`);
        console.log(`Manual calculation: ${hre.ethers.utils.formatEther(manualTotal)} ETH`);
        console.log(`Contract quote: ${hre.ethers.utils.formatEther(totalFee.nativeFee)} ETH`);
        console.log(`Provided fee: ${feeEth} ETH`);
        
        // Use the higher of the two estimates for safety
        const requiredFee = totalFee.nativeFee.gt(manualTotal) ? totalFee.nativeFee : manualTotal;
        
        if (requiredFee.gt(feeWei)) {
          console.log(`\n⚠️  ERROR: Insufficient fee provided!`);
          console.log(`   Required: ${hre.ethers.utils.formatEther(requiredFee)} ETH`);
          console.log(`   Provided: ${feeEth} ETH`);
          console.log(`   Shortfall: ${hre.ethers.utils.formatEther(requiredFee.sub(feeWei))} ETH`);
          console.log(`\n💡 Try with: --fee-eth ${hre.ethers.utils.formatEther(requiredFee.mul(110).div(100))}`);
          throw new Error("Insufficient fee provided - see details above");
        } else {
          console.log(`✅ Fee is sufficient!`);
          console.log(`   Buffer: ${hre.ethers.utils.formatEther(feeWei.sub(requiredFee))} ETH`);
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
      
      // CRITICAL: The contract should now handle fee splitting internally
      const swapTx = await CrossChainRouter.crossChainSwap(
        destConfig.eid,
        recipientBytes32,
        sourceToken,
        destinationTokenBytes32,
        amountInWei,
        amountOutMinWei,
        options,
        {
          value: feeWei, // Contract will split this internally
          gasLimit: 3000000,
          gasPrice: hre.ethers.utils.parseUnits("50", "gwei")
        }
      );

      console.log(`🚀 Transaction sent: ${swapTx.hash}`);
      console.log("⏳ Waiting for confirmation...");

      const receipt = await swapTx.wait();
      
      if (receipt.status === 0) {
        console.error("❌ Transaction failed");
        console.log(`🔗 Check transaction: https://sepolia.arbiscan.io/tx/${swapTx.hash}`);
        return;
      }

      console.log(`✅ Transaction confirmed!`);
      console.log(`📦 Block: ${receipt.blockNumber}`);
      console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
      console.log(`🔗 Transaction: https://sepolia.arbiscan.io/tx/${swapTx.hash}`);

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
        console.error("💡 Run the quote-cross-chain-fee task first to get accurate estimates");
      } else if (error.message.includes('deadline')) {
        console.error("💡 Transaction took too long, try again");
      } else if (error.message.includes('execution reverted')) {
        console.error("💡 Contract execution failed - check contract state and parameters");
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
  
  // FIXED: Apply 5% slippage and use correct destination address
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

  // Quote message fee separately
  console.log("\n📨 Quoting Message Fee...");
  const payload = hre.ethers.utils.defaultAbiCoder.encode(
    ["bytes32", "bytes32", "uint256", "uint256", "address"],
    [recipientBytes32, destinationTokenBytes32, amountOutMinWei, estimatedStableAmount, recipient]
  );
  
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





