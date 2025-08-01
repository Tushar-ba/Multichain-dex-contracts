import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  const [user] = await ethers.getSigners();
  console.log("🔬 FINAL DIAGNOSIS - AXELAR NETWORK CALLS");

  // Your new router address
  const routerAddress = "0xa9d663860157B2bACB6849aed2f4b71329410D10";
  
  const FlexibleAxelarRouter = await ethers.getContractFactory("FlexibleAxelarRouter");
  const router = FlexibleAxelarRouter.attach(routerAddress);

  console.log("\n1️⃣ CHECKING AXELAR GATEWAY INTERACTION");
  
  try {
    // Test if we can call the gateway
    const gatewayABI = [
      "function tokenAddresses(string memory symbol) external view returns (address)"
    ];
    
    const gatewayAddress = "0xC249632c2D40b9001FE907806902f63038B737Ab";
    const gateway = new ethers.Contract(gatewayAddress, gatewayABI, user);
    
    console.log("Testing gateway call...");
    const pfusdAddress = await gateway.tokenAddresses("PFUSD");
    console.log("✅ Gateway responds:", pfusdAddress);
    
    if (pfusdAddress === "0x0000000000000000000000000000000000000000") {
      console.log("❌ CRITICAL: PFUSD not registered with Axelar gateway!");
      console.log("💡 This means your custom PFUSD token is not recognized by Axelar");
      console.log("💡 Solution: Use Axelar's test tokens instead of custom PFUSD");
      return;
    }
    
  } catch (error) {
    console.log("❌ Gateway call failed:", error.message);
    console.log("💡 This means the gateway address is wrong or unreachable");
    return;
  }

  console.log("\n2️⃣ CHECKING GAS SERVICE INTERACTION");
  
  try {
    // Test gas service
    const gasServiceABI = [
      "function payNativeGasForContractCallWithToken(address sender, string calldata destinationChain, string calldata destinationAddress, bytes calldata payload, string calldata symbol, uint256 amount, address refundAddress) external payable"
    ];
    
    const gasServiceAddress = "0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6";
    const gasService = new ethers.Contract(gasServiceAddress, gasServiceABI, user);
    
    console.log("Testing gas service (estimate only)...");
    
    // Try to estimate gas for the gas service call
    const testPayload = ethers.solidityPacked(["string"], ["test"]);
    
    try {
      const gasEstimate = await gasService.payNativeGasForContractCallWithToken.estimateGas(
        routerAddress,
        "optimism-sepolia",
        "0xA6AAf9c0b2d3b129a9616eF976aF7478e9A13c1E",
        testPayload,
        "PFUSD",
        ethers.parseEther("1"),
        user.address,
        { value: ethers.parseEther("0.01") }
      );
      console.log("✅ Gas service estimate:", gasEstimate.toString());
    } catch (gasError) {
      console.log("❌ Gas service estimation failed:", gasError.message);
      
      if (gasError.message.includes("insufficient funds")) {
        console.log("💡 Try with more ETH for gas payment");
      } else if (gasError.message.includes("invalid chain")) {
        console.log("💡 Chain name 'optimism-sepolia' might not be supported");
        console.log("💡 Try using 'optimism' instead");
      } else {
        console.log("💡 Gas service configuration issue");
      }
      return;
    }
    
  } catch (error) {
    console.log("❌ Gas service setup failed:", error.message);
    return;
  }

  console.log("\n3️⃣ TESTING TOKEN BRIDGE REGISTRATION");
  
  try {
    const bridgeToken = await router.bridgeToken();
    const bridgeSymbol = await router.bridgeTokenSymbol();
    
    console.log("Bridge token:", bridgeToken);
    console.log("Bridge symbol:", bridgeSymbol);
    
    // Check if this token is registered with Axelar
    const gatewayABI = ["function tokenAddresses(string memory symbol) external view returns (address)"];
    const gatewayAddress = "0xC249632c2D40b9001FE907806902f63038B737Ab";
    const gateway = new ethers.Contract(gatewayAddress, gatewayABI, user);
    
    const axelarTokenAddress = await gateway.tokenAddresses(bridgeSymbol);
    console.log("Axelar gateway token address for", bridgeSymbol + ":", axelarTokenAddress);
    
    if (axelarTokenAddress === "0x0000000000000000000000000000000000000000") {
      console.log("❌ CRITICAL ISSUE FOUND!");
      console.log("🔍 Your custom PFUSD token is NOT registered with Axelar gateway");
      console.log("💡 SOLUTION: You need to use Axelar's official test tokens");
      console.log("\n📋 Use these instead:");
      console.log("   - axlUSDC (Axelar wrapped USDC)");
      console.log("   - Or deploy a token that's compatible with Axelar");
      console.log("\n🔧 To check available tokens:");
      
      // Try some common test token symbols
      const testSymbols = ["axlUSDC", "USDC", "aUSDC", "testUSDC"];
      for (const symbol of testSymbols) {
        try {
          const tokenAddr = await gateway.tokenAddresses(symbol);
          if (tokenAddr !== "0x0000000000000000000000000000000000000000") {
            console.log("   ✅", symbol + ":", tokenAddr);
          }
        } catch (e) {
          // Skip
        }
      }
      
      return;
    } else {
      console.log("✅ Token is registered with Axelar!");
      
      if (axelarTokenAddress.toLowerCase() !== bridgeToken.toLowerCase()) {
        console.log("⚠️ WARNING: Token address mismatch");
        console.log("   Your token:", bridgeToken);
        console.log("   Axelar token:", axelarTokenAddress);
        console.log("💡 This might cause bridging issues");
      }
    }
    
  } catch (error) {
    console.log("❌ Token registration check failed:", error.message);
    return;
  }

  console.log("\n4️⃣ TESTING CHAIN NAME COMPATIBILITY");
  
  // Test if Axelar recognizes our chain names
  const chainNames = ["optimism-sepolia", "optimism", "op-sepolia"];
  console.log("Testing chain name recognition...");
  
  for (const chainName of chainNames) {
    try {
      const isSupported = await router.isChainSupported(chainName);
      console.log(`${chainName}: ${isSupported ? "✅ Supported" : "❌ Not supported"}`);
    } catch (e) {
      console.log(`${chainName}: ❌ Error checking`);
    }
  }

  console.log("\n✅ DIAGNOSIS COMPLETE");
  console.log("\n💡 MOST LIKELY ISSUE:");
  console.log("Your custom PFUSD token is not registered with Axelar's gateway.");
  console.log("Axelar can only bridge tokens that are officially registered in their system.");
  console.log("\n🔧 SOLUTIONS:");
  console.log("1. Use Axelar's official test tokens (like axlUSDC)");
  console.log("2. Register your token with Axelar (complex process)");
  console.log("3. Modify your router to use existing Axelar tokens");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });