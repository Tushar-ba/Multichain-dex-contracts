import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  const [user] = await ethers.getSigners();
  console.log("🪙 GETTING AXELAR TEST TOKENS");
  console.log("👤 Address:", user.address);
  console.log("📍 Network:", hre.network.name);

  // Available Axelar tokens we found
  const availableTokens = {
    "avalanche-fuji": [
      { symbol: "aUSDC", address: "0x57F1c63497AEe0bE305B8852b354CEc793da43bB" },
      { symbol: "USDC", address: "0x3fb643De114d5dc03dDE8DFDBC06c60dcAF7D3C4" },
      { symbol: "WETH", address: "0x3613C187b3eF813619A25322595bA5E297E4C08a" },
      { symbol: "axlWETH", address: "0xe840BE8D9aB1ACD5AfC7168b05EC350B7FD18709" },
      { symbol: "WMATIC", address: "0xB923E2374639D0605388D91CFedAfCeCE03Cfd8f" },
      { symbol: "WAVAX", address: "0xd00ae08403B9bbb9124bB305C09058E32C39A48c" }
    ],
    "optimism-sepolia": [
      { symbol: "aUSDC", address: "0x254d06f33bDc5b8ee05b2ea472107E300226659A" },
      { symbol: "WMATIC", address: "0x21ba4f6aEdA155DD77Cc33Fb93646910543F0380" },
      { symbol: "WAVAX", address: "0x2a87806561C550ba2dA9677c5323413E6e539740" }
    ]
  };

  const currentNetwork = hre.network.name as keyof typeof availableTokens;
  const networkTokens = availableTokens[currentNetwork];

  if (!networkTokens) {
    console.log("❌ No token configuration for this network");
    console.log("💡 Supported networks: avalanche-fuji, optimism-sepolia");
    return;
  }

  console.log(`\n🔍 Found ${networkTokens.length} available tokens on ${currentNetwork}`);

  // Try to get tokens for each available token
  console.log("\n💰 ATTEMPTING TO GET TOKENS...");
  
  for (const token of networkTokens) {
    console.log(`\n🔄 Trying to get ${token.symbol}...`);
    
    try {
      // Standard ERC20 interface + common mint functions
      const tokenABI = [
        "function name() external view returns (string)",
        "function symbol() external view returns (string)",
        "function decimals() external view returns (uint8)",
        "function balanceOf(address account) external view returns (uint256)",
        "function totalSupply() external view returns (uint256)",
        // Common mint function signatures
        "function mint(address to, uint256 amount) external",
        "function mint(uint256 amount) external",
        "function faucet() external",
        "function faucet(uint256 amount) external",
        "function claim() external",
        "function claim(uint256 amount) external",
        "function drip() external",
        "function getTokens() external",
        "function requestTokens() external",
        // Additional faucet methods
        "function allocateTo(address to, uint256 value) external",
        "function allocate(uint256 value) external"
      ];

      const tokenContract = new ethers.Contract(token.address, tokenABI, user);
      
      // Get basic token info
      try {
        const name = await tokenContract.name();
        const symbol = await tokenContract.symbol();
        const decimals = await tokenContract.decimals();
        const balance = await tokenContract.balanceOf(user.address);
        
        console.log(`📋 Token Info: ${name} (${symbol})`);
        console.log(`   Address: ${token.address}`);
        console.log(`   Decimals: ${decimals}`);
        console.log(`   Your Balance: ${ethers.formatUnits(balance, decimals)}`);
        
        const desiredAmount = ethers.parseUnits("10000000", decimals);
        
        if (balance >= desiredAmount) {
          console.log(`✅ You already have enough ${symbol}!`);
          continue;
        }
        
        console.log(`   Need: ${ethers.formatUnits(desiredAmount, decimals)} ${symbol}`);
        
      } catch (infoError) {
        console.log(`⚠️ Could not read token info: ${infoError.message}`);
        continue;
      }

      // Try different mint/faucet functions
      const decimals = await tokenContract.decimals();
      const mintMethods = [
        { name: "mint", params: [user.address, ethers.parseUnits("10000000", decimals)] },
        { name: "mint", params: [ethers.parseUnits("10000000", decimals)] },
        { name: "faucet", params: [] },
        { name: "faucet", params: [ethers.parseUnits("10000000", decimals)] },
        { name: "faucet", params: [ethers.parseUnits("1000", decimals)] }, // Try smaller amount
        { name: "claim", params: [] },
        { name: "claim", params: [ethers.parseUnits("10000000", decimals)] },
        { name: "claim", params: [ethers.parseUnits("1000", decimals)] }, // Try smaller amount
        { name: "drip", params: [] },
        { name: "getTokens", params: [] },
        { name: "requestTokens", params: [] },
        { name: "allocateTo", params: [user.address, ethers.parseUnits("10000000", decimals)] },
        { name: "allocate", params: [ethers.parseUnits("10000000", decimals)] }
      ];

      let success = false;
      for (const method of mintMethods) {
        try {
          console.log(`   Trying ${method.name}...`);
          
          // First try to estimate gas
          const gasEstimate = await tokenContract[method.name].estimateGas(...method.params);
          console.log(`   Gas estimate: ${gasEstimate.toString()}`);
          
          // Execute the transaction
          const tx = await tokenContract[method.name](...method.params);
          const receipt = await tx.wait();
          
          console.log(`   ✅ Success! Transaction: ${tx.hash}`);
          
          // Check new balance
          const newBalance = await tokenContract.balanceOf(user.address);
          console.log(`   New Balance: ${ethers.formatUnits(newBalance, decimals)} ${token.symbol}`);
          
          success = true;
          break;
          
        } catch (methodError) {
          const errorMsg = methodError.message.slice(0, 100);
          console.log(`   ❌ ${method.name} failed: ${errorMsg}...`);
        }
      }
      
      if (!success) {
        console.log(`   💡 No mint/faucet function found for ${token.symbol}`);
        console.log(`   💡 Try these alternatives:`);
        console.log(`   1. Axelar Faucet: https://faucet.testnet.axelar.dev/`);
        console.log(`   2. Circle USDC Faucet: https://faucet.circle.com/`);
        console.log(`   3. Chainlink Faucets: https://faucets.chain.link/`);
        console.log(`   4. Bridge from another chain where you have this token`);
        
        // For aUSDC specifically, give more targeted advice
        if (token.symbol === "aUSDC") {
          console.log(`   \n🎯 SPECIFIC FOR aUSDC:`);
          console.log(`   • This is Axelar's wrapped USDC`);
          console.log(`   • Try the official Axelar faucet first`);
          console.log(`   • You can also bridge USDC from other testnets`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Failed to interact with ${token.symbol}: ${error.message}`);
    }
  }

  console.log("\n📋 MANUAL FAUCET OPTIONS:");
  console.log("1. 🌐 Axelar Faucet: https://faucet.testnet.axelar.dev/");
  console.log("   • Select your network and request aUSDC");
  console.log("   • Usually gives 1000+ tokens per request");
  console.log("   • May require social verification");
  console.log("");
  console.log("2. 🔗 Circle USDC Faucet: https://faucet.circle.com/");
  console.log("   • Get regular USDC, then bridge to get aUSDC");
  console.log("   • Works on multiple testnets");
  console.log("");
  console.log("3. 🔗 Chainlink Faucets: https://faucets.chain.link/");
  console.log("   • Multiple token types available");
  console.log("   • Select your network and token");
  console.log("");
  console.log("4. 💬 Axelar Discord: https://discord.gg/axelar");
  console.log("   • Ask in #testnet-faucet channel");
  console.log("   • Community can help with tokens");
  
  console.log("\n✅ Token acquisition attempt completed!");
  console.log("\n🎯 NEXT STEPS:");
  console.log("1. Get aUSDC tokens (10M+ recommended)");
  console.log("2. Update your routers to use aUSDC as bridge token");
  console.log("3. Add TestToken/aUSDC liquidity to your DEXs");
  console.log("4. Test cross-chain swaps!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });