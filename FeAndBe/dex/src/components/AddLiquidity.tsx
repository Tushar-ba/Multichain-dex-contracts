"use client";

import { useState, useEffect } from "react";
import { useAccount, useChainId } from "wagmi";
import { ethers } from "ethers";
import { InlineLiquidityTokenSelector } from "./InlineLiquidityTokenSelector";
import { Token } from "@/types";
import { ContractService } from "@/services/contracts";
import { ApiService } from "@/services/api";
import { getContractAddress } from "@/config/contracts";
import { supportedChains } from "@/config/chains";

export function AddLiquidity() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const [tokenA, setTokenA] = useState<Token | null>(null);
  const [tokenB, setTokenB] = useState<Token | null>(null);
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [loading, setLoading] = useState(false);
  const [pairExists, setPairExists] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);

  // Get current chain info
  const currentChain = supportedChains.find(chain => chain.id === chainId);
  
  const getChainLogo = (chainId: number) => {
    const logoMap: { [key: number]: string } = {
      11155111: '/holesky.png',
      80002: '/Polygon-logo.webp',
      421614: '/arbitrum.webp',
      11155420: '/optimism.webp',
      43113: '/avalanche-avax-logo.webp',
      97: '/bnb.webp',
      84532: '/base.png',
      17000: '/holesky.png',
    }
    return logoMap[chainId] || '/placeholder-token.png'
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if pair exists when tokens are selected
  useEffect(() => {
    if (tokenA && tokenB && chainId) {
      checkPairExists();
    } else {
      setPairExists(null);
    }
  }, [tokenA, tokenB, chainId]);

  const checkPairExists = async () => {
    if (!tokenA || !tokenB || !chainId) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contractService = new ContractService(provider, undefined, chainId);

      const pairAddress = await contractService.getPairAddress(
        tokenA.address,
        tokenB.address
      );
      const exists =
        pairAddress !== "0x0000000000000000000000000000000000000000";
      setPairExists(exists);
    } catch (error) {
      console.error("Error checking pair:", error);
      setPairExists(false);
    }
  };

  // Main function that handles everything: pair creation, approvals, and adding liquidity
  const handleApproveAndProvideLiquidity = async () => {
    if (!tokenA || !tokenB || !amountA || !amountB || !address || !chainId)
      return;

    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractService = new ContractService(provider, signer, chainId);

      const routerAddress = contractService.getRouterContract(true)
        .target as string;
      const amountAWei = ethers.parseUnits(amountA, tokenA.data.decimals);
      const amountBWei = ethers.parseUnits(amountB, tokenB.data.decimals);

      // Step 1: Create pair if it doesn't exist
      if (pairExists === false) {
        console.log("Creating pair...");
        const receipt = await contractService.createPair(
          tokenA.address,
          tokenB.address
        );

        // Store pair creation event in database
        const eventData = {
          transactionHash:
            receipt.hash || receipt.transactionHash || receipt.tx || "unknown",
          chainId: chainId,
          factoryAddress:
            getContractAddress(chainId, "factory") ||
            "0x0000000000000000000000000000000000000000",
          token0:
            tokenA.address < tokenB.address ? tokenA.address : tokenB.address,
          token1:
            tokenA.address < tokenB.address ? tokenB.address : tokenA.address,
          pairAddress:
            receipt.logs?.[0]?.address ||
            "0x0000000000000000000000000000000000000000",
          pairIndex: 1,
          blockNumber: receipt.blockNumber || 0,
          blockTimestamp: Math.floor(Date.now() / 1000),
          gasUsed: receipt.gasUsed?.toString() || "0",
          gasPrice: receipt.gasPrice?.toString() || "0",
          creator: address,
          token0Symbol: tokenA.data.symbol,
          token1Symbol: tokenB.data.symbol,
          token0Decimals: tokenA.data.decimals,
          token1Decimals: tokenB.data.decimals,
          isActive: true,
        };

        try {
          await ApiService.createPairEvent(eventData);
        } catch (dbError) {
          console.warn("Failed to store pair creation event:", dbError);
        }

        setPairExists(true);
      }

      // Step 2: Check and approve Token A if needed
      console.log("Checking Token A approval...");
      const allowanceA = await contractService.getTokenAllowance(
        tokenA.address,
        address,
        routerAddress
      );
      if (BigInt(allowanceA) < amountAWei) {
        console.log("Approving Token A...");
        await contractService.approveToken(
          tokenA.address,
          routerAddress,
          amountAWei.toString()
        );
      }

      // Step 3: Check and approve Token B if needed
      console.log("Checking Token B approval...");
      const allowanceB = await contractService.getTokenAllowance(
        tokenB.address,
        address,
        routerAddress
      );
      if (BigInt(allowanceB) < amountBWei) {
        console.log("Approving Token B...");
        await contractService.approveToken(
          tokenB.address,
          routerAddress,
          amountBWei.toString()
        );
      }

      // Step 4: Add liquidity
      console.log("Adding liquidity...");
      const deadline = contractService.getDeadline();

      // Calculate minimum amounts (5% slippage)
      const amountAMin = (amountAWei * BigInt(95)) / BigInt(100);
      const amountBMin = (amountBWei * BigInt(95)) / BigInt(100);

      let receipt;

      // Check if either token is native token
      const isTokenANative =
        tokenA.address === "0x0000000000000000000000000000000000000000" ||
        tokenA.address === "0x0000000000000000000000000000000000001010";
      const isTokenBNative =
        tokenB.address === "0x0000000000000000000000000000000000000000" ||
        tokenB.address === "0x0000000000000000000000000000000000001010";

      if (isTokenANative || isTokenBNative) {
        // Add liquidity with native token
        const tokenAddress = isTokenANative ? tokenB.address : tokenA.address;
        const tokenAmount = isTokenANative
          ? amountBWei.toString()
          : amountAWei.toString();
        const tokenMin = isTokenANative
          ? amountBMin.toString()
          : amountAMin.toString();
        const nativeAmount = isTokenANative
          ? amountAWei.toString()
          : amountBWei.toString();
        const nativeMin = isTokenANative
          ? amountAMin.toString()
          : amountBMin.toString();

        receipt = await contractService.addLiquidityNative({
          token: tokenAddress,
          amountTokenDesired: tokenAmount,
          amountTokenMin: tokenMin,
          amountNativeMin: nativeMin,
          to: address,
          deadline,
          nativeAmount,
        });
      } else {
        // Add liquidity with ERC20 tokens
        receipt = await contractService.addLiquidity({
          tokenA: tokenA.address,
          tokenB: tokenB.address,
          amountADesired: amountAWei.toString(),
          amountBDesired: amountBWei.toString(),
          amountAMin: amountAMin.toString(),
          amountBMin: amountBMin.toString(),
          to: address,
          deadline,
        });
      }

      // Store liquidity event in database
      console.log("Receipt object:", receipt); // Debug log
      console.log("Transaction hash:", receipt.hash || receipt.transactionHash); // Debug log

      const eventData = {
        transactionHash: receipt.hash || receipt.transactionHash || receipt.tx,
        chainId,
        routerAddress: contractService.getRouterContract(true).target,
        userAddress: address,
        action: "add",
        tokenA: {
          address: tokenA.address,
          symbol: tokenA.data.symbol,
          decimals: tokenA.data.decimals,
          amountDesired: amountA,
          actualAmount: amountA,
        },
        tokenB: {
          address: tokenB.address,
          symbol: tokenB.data.symbol,
          decimals: tokenB.data.decimals,
          amountDesired: amountB,
          actualAmount: amountB,
        },
        liquidity: "0",
        pairAddress: await contractService.getPairAddress(
          tokenA.address,
          tokenB.address
        ),
        to: address,
        deadline,
        blockNumber: receipt.blockNumber || 0,
        blockTimestamp: Math.floor(Date.now() / 1000), // Use current timestamp in seconds
        gasUsed: receipt.gasUsed?.toString() || "0",
        gasPrice: receipt.gasPrice?.toString() || "0",
        status: "confirmed",
      };

      await ApiService.addLiquidityEvent(eventData);

      alert("Liquidity added successfully!");
      setAmountA("");
      setAmountB("");

      // Refresh pair status
      await checkPairExists();
    } catch (error) {
      console.error("Error in approve and provide liquidity:", error);
      alert("Failed to provide liquidity. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="max-w-lg mx-auto p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Add Liquidity</h2>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="max-w-lg mx-auto p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Add Liquidity</h2>
          <p className="text-gray-500">Please connect your wallet to add liquidity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
      <div className="text-center mb-6">
        <div className="flex items-center justify-between">
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Add Liquidity</h2>
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        
        {/* Chain Info */}
        {currentChain && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-sm text-gray-600">Selected Chain:</span>
              <img
                src={getChainLogo(currentChain.id)}
                alt={currentChain.name}
                className="w-5 h-5 rounded-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-token.png';
                }}
              />
              <span className="text-sm font-medium text-gray-900">{currentChain.name}</span>
            </div>
          </div>
        )}
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> When you add liquidity, you will receive pool tokens representing your position. 
            These tokens automatically earn fees proportional to your share of the pool, and can be redeemed at any time.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Token 1 Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Token 1 --</span>
            <span className="text-sm text-gray-500">Select Token</span>
          </div>
          
          <InlineLiquidityTokenSelector
            chainId={chainId || 1}
            selectedToken={tokenA}
            onTokenSelect={setTokenA}
            userAddress={address}
            excludeToken={tokenB?.address}
          />
          
          <div className="bg-gray-50 rounded-xl p-4">
            <input
              type="number"
              value={amountA}
              onChange={(e) => setAmountA(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent text-2xl font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
            />
            <div className="text-xs text-gray-500 mt-2">
              Balance: 0.00
            </div>
          </div>
        </div>

        {/* Plus Icon */}
        <div className="flex justify-center py-2">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        </div>

        {/* Token 2 Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Token 2 --</span>
            <span className="text-sm text-gray-500">Select Token</span>
          </div>
          
          <InlineLiquidityTokenSelector
            chainId={chainId || 1}
            selectedToken={tokenB}
            onTokenSelect={setTokenB}
            userAddress={address}
            excludeToken={tokenA?.address}
          />
          
          <div className="bg-gray-50 rounded-xl p-4">
            <input
              type="number"
              value={amountB}
              onChange={(e) => setAmountB(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent text-2xl font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
            />
            <div className="text-xs text-gray-500 mt-2">
              Balance: 0.00
            </div>
          </div>
        </div>
      </div>



      {/* Action Button */}
      <div className="mt-6">
        {tokenA && tokenB && amountA && amountB ? (
          <button
            type="button"
            onClick={handleApproveAndProvideLiquidity}
            disabled={loading}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {pairExists === false
                  ? "Creating Pair & Adding Liquidity..."
                  : "Adding Liquidity..."}
              </div>
            ) : pairExists === false ? (
              "Create Pair"
            ) : (
              "Approve & Provide Liquidity"
            )}
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="w-full bg-red-500 text-white font-medium py-4 px-6 rounded-xl cursor-not-allowed opacity-50"
          >
            Please fill in all fields to continue
          </button>
        )}
      </div>
    </div>
  );
}
