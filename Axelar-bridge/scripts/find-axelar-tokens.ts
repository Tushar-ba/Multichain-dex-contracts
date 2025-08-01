import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  const [user] = await ethers.getSigners();
  console.log("🔍 FINDING AXELAR-SUPPORTED TOKENS");

  const gatewayABI = [
    "function tokenAddresses(string memory symbol) external view returns (address)"
  ];
  
  const gateways = {
    "avalanche-fuji": "0xC249632c2D40b9001FE907806902f63038B737Ab",
    "optimism-sepolia": "0xe432150cce91c13a887f7D836923d5597adD8E31"
  };

  const currentNetwork = hre.network.name as keyof typeof gateways;
  const gatewayAddress = gateways[currentNetwork];
  
  if (!gatewayAddress) {
    throw new Error("Unsupported network");
  }

  const gateway = new ethers.Contract(gatewayAddress, gatewayABI, user);
  
  console.log("📍 Network:", currentNetwork);
  console.log("🔗 Gateway:", gatewayAddress);

  // Common Axelar test token symbols
  const testTokens = [
    "aUSDC", "axlUSDC", "USDC", "testUSDC", "USDT", "axlUSDT",
    "WETH", "axlWETH", "WBTC", "axlWBTC", "DAI", "axlDAI",
    "LINK", "UNI", "AAVE", "WMATIC", "WAVAX", "FRAX"
  ];

  console.log("\n🪙 CHECKING AVAILABLE TOKENS:");
  const availableTokens: Array<{symbol: string, address: string}> = [];

  for (const symbol of testTokens) {
    try {
      const tokenAddress = await gateway.tokenAddresses(symbol);
      if (tokenAddress !== "0x0000000000000000000000000000000000000000") {
        console.log(`✅ ${symbol}: ${tokenAddress}`);
        availableTokens.push({ symbol, address: tokenAddress });
      } else {
        console.log(`❌ ${symbol}: Not available`);
      }
    } catch (error) {
      console.log(`❌ ${symbol}: Error checking`);
    }
  }

  if (availableTokens.length === 0) {
    console.log("\n😞 No standard tokens found. Let's try other symbols...");
    
    // Try some other potential symbols
    const moreTokens = ["ETH", "AVAX", "OP", "BNB", "MATIC", "FTM"];
    for (const symbol of moreTokens) {
      try {
        const tokenAddress = await gateway.tokenAddresses(symbol);
        if (tokenAddress !== "0x0000000000000000000000000000000000000000") {
          console.log(`✅ ${symbol}: ${tokenAddress}`);
          availableTokens.push({ symbol, address: tokenAddress });
        }
      } catch (error) {
        // Skip
      }
    }
  }

  console.log("\n📋 RECOMMENDED SOLUTION:");
  
  if (availableTokens.length > 0) {
    console.log("✅ Found available Axelar tokens! Use one of these as your bridge token:");
    console.log("\n🔧 QUICK FIX:");
    console.log("1. Pick one of the available tokens above");
    console.log("2. Update your router to use this token instead of PFUSD");
    console.log("3. Add liquidity for TestToken/AxelarToken pairs on your DEXs");
    console.log("4. Test cross-chain swaps");
    
    console.log("\n💡 RECOMMENDED TOKEN:");
    const recommended = availableTokens.find(t => t.symbol.includes("USDC")) || availableTokens[0];
    console.log(`Use ${recommended.symbol} (${recommended.address}) as your bridge token`);
    
    console.log("\n🔧 TO UPDATE YOUR ROUTER:");
    console.log(`Call setBridgeToken("${recommended.address}", "${recommended.symbol}") on both routers`);
    
  } else {
    console.log("❌ No Axelar tokens found on this network");
    console.log("💡 This might mean:");
    console.log("1. The gateway address is incorrect");
    console.log("2. This testnet doesn't have Axelar token support yet");
    console.log("3. The token symbols are different than expected");
    
    console.log("\n🔧 ALTERNATIVE SOLUTIONS:");
    console.log("1. Check Axelar documentation for correct token symbols");
    console.log("2. Use a different testnet pair (like Ethereum Sepolia + Polygon Mumbai)");
    console.log("3. Contact Axelar team for Optimism Sepolia support status");
  }

  console.log("\n✅ Token search completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });