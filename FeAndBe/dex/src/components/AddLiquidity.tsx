'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { ethers } from 'ethers'
import { TokenSelector } from './TokenSelector'
import { Token } from '@/types'
import { ContractService } from '@/services/contracts'
import { ApiService } from '@/services/api'
import { getContractAddress } from '@/config/contracts'

export function AddLiquidity() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()

  const [tokenA, setTokenA] = useState<Token | null>(null)
  const [tokenB, setTokenB] = useState<Token | null>(null)
  const [amountA, setAmountA] = useState('')
  const [amountB, setAmountB] = useState('')
  const [loading, setLoading] = useState(false)
  const [pairExists, setPairExists] = useState<boolean | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if pair exists when tokens are selected
  useEffect(() => {
    if (tokenA && tokenB && chainId) {
      checkPairExists()
    } else {
      setPairExists(null)
    }
  }, [tokenA, tokenB, chainId])

  const checkPairExists = async () => {
    if (!tokenA || !tokenB || !chainId) return

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contractService = new ContractService(provider, undefined, chainId)
      
      const pairAddress = await contractService.getPairAddress(tokenA.address, tokenB.address)
      const exists = pairAddress !== '0x0000000000000000000000000000000000000000'
      setPairExists(exists)
    } catch (error) {
      console.error('Error checking pair:', error)
      setPairExists(false)
    }
  }

  // Main function that handles everything: pair creation, approvals, and adding liquidity
  const handleApproveAndProvideLiquidity = async () => {
    if (!tokenA || !tokenB || !amountA || !amountB || !address || !chainId) return

    setLoading(true)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contractService = new ContractService(provider, signer, chainId)
      
      const routerAddress = contractService.getRouterContract(true).target as string
      const amountAWei = ethers.parseUnits(amountA, tokenA.data.decimals)
      const amountBWei = ethers.parseUnits(amountB, tokenB.data.decimals)

      // Step 1: Create pair if it doesn't exist
      if (pairExists === false) {
        console.log('Creating pair...')
        const receipt = await contractService.createPair(tokenA.address, tokenB.address)
        
        // Store pair creation event in database
        const eventData = {
          transactionHash: receipt.hash || receipt.transactionHash || receipt.tx || 'unknown',
          chainId: chainId,
          factoryAddress: getContractAddress(chainId, 'factory') || '0x0000000000000000000000000000000000000000',
          token0: tokenA.address < tokenB.address ? tokenA.address : tokenB.address,
          token1: tokenA.address < tokenB.address ? tokenB.address : tokenA.address,
          pairAddress: receipt.logs?.[0]?.address || '0x0000000000000000000000000000000000000000',
          pairIndex: 1,
          blockNumber: receipt.blockNumber || 0,
          blockTimestamp: Math.floor(Date.now() / 1000),
          gasUsed: receipt.gasUsed?.toString() || '0',
          gasPrice: receipt.gasPrice?.toString() || '0',
          creator: address,
          token0Symbol: tokenA.data.symbol,
          token1Symbol: tokenB.data.symbol,
          token0Decimals: tokenA.data.decimals,
          token1Decimals: tokenB.data.decimals,
          isActive: true
        }
        
        try {
          await ApiService.createPairEvent(eventData)
        } catch (dbError) {
          console.warn('Failed to store pair creation event:', dbError)
        }
        
        setPairExists(true)
      }

      // Step 2: Check and approve Token A if needed
      console.log('Checking Token A approval...')
      const allowanceA = await contractService.getTokenAllowance(tokenA.address, address, routerAddress)
      if (BigInt(allowanceA) < amountAWei) {
        console.log('Approving Token A...')
        await contractService.approveToken(tokenA.address, routerAddress, amountAWei.toString())
      }

      // Step 3: Check and approve Token B if needed
      console.log('Checking Token B approval...')
      const allowanceB = await contractService.getTokenAllowance(tokenB.address, address, routerAddress)
      if (BigInt(allowanceB) < amountBWei) {
        console.log('Approving Token B...')
        await contractService.approveToken(tokenB.address, routerAddress, amountBWei.toString())
      }

      // Step 4: Add liquidity
      console.log('Adding liquidity...')
      const deadline = contractService.getDeadline()
      
      // Calculate minimum amounts (5% slippage)
      const amountAMin = (amountAWei * BigInt(95)) / BigInt(100)
      const amountBMin = (amountBWei * BigInt(95)) / BigInt(100)

      let receipt
      
      // Check if either token is native token
      const isTokenANative = tokenA.address === '0x0000000000000000000000000000000000000000' ||
                            tokenA.address === '0x0000000000000000000000000000000000001010'
      const isTokenBNative = tokenB.address === '0x0000000000000000000000000000000000000000' ||
                            tokenB.address === '0x0000000000000000000000000000000000001010'

      if (isTokenANative || isTokenBNative) {
        // Add liquidity with native token
        const tokenAddress = isTokenANative ? tokenB.address : tokenA.address
        const tokenAmount = isTokenANative ? amountBWei.toString() : amountAWei.toString()
        const tokenMin = isTokenANative ? amountBMin.toString() : amountAMin.toString()
        const nativeAmount = isTokenANative ? amountAWei.toString() : amountBWei.toString()
        const nativeMin = isTokenANative ? amountAMin.toString() : amountBMin.toString()

        receipt = await contractService.addLiquidityNative({
          token: tokenAddress,
          amountTokenDesired: tokenAmount,
          amountTokenMin: tokenMin,
          amountNativeMin: nativeMin,
          to: address,
          deadline,
          nativeAmount
        })
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
          deadline
        })
      }

      // Store liquidity event in database
      const eventData = {
        transactionHash: receipt.transactionHash,
        chainId,
        routerAddress: contractService.getRouterContract(true).target,
        userAddress: address,
        action: 'add',
        tokenA: {
          address: tokenA.address,
          symbol: tokenA.data.symbol,
          decimals: tokenA.data.decimals,
          amountDesired: amountA,
          actualAmount: amountA
        },
        tokenB: {
          address: tokenB.address,
          symbol: tokenB.data.symbol,
          decimals: tokenB.data.decimals,
          amountDesired: amountB,
          actualAmount: amountB
        },
        liquidity: '0',
        pairAddress: await contractService.getPairAddress(tokenA.address, tokenB.address),
        to: address,
        deadline,
        blockNumber: receipt.blockNumber,
        blockTimestamp: new Date(),
        gasUsed: receipt.gasUsed?.toString(),
        gasPrice: receipt.gasPrice?.toString(),
        status: 'confirmed'
      }
      
      await ApiService.addLiquidityEvent(eventData)
      
      alert('Liquidity added successfully!')
      setAmountA('')
      setAmountB('')
      
      // Refresh pair status
      await checkPairExists()
    } catch (error) {
      console.error('Error in approve and provide liquidity:', error)
      alert('Failed to provide liquidity. Please try again.')
    } finally {
      setLoading(false)
    }
  }



  if (!mounted) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-2xl border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Add Liquidity
          </h2>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-2xl border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Add Liquidity
          </h2>
          <p className="text-gray-500">Please connect your wallet to add liquidity</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-2xl border border-gray-100">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Add Liquidity
        </h2>
        <p className="text-gray-500">Provide liquidity to earn trading fees</p>
      </div>
      
      {/* Token A Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          First Token
        </label>
        <TokenSelector
          chainId={chainId || 1}
          selectedToken={tokenA}
          onTokenSelect={setTokenA}
          userAddress={address}
          excludeToken={tokenB?.address}
        />
      </div>

      {/* Amount A Input */}
      {tokenA && (
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Amount {tokenA.data.symbol}
          </label>
          <div className="relative">
            <input
              type="number"
              value={amountA}
              onChange={(e) => setAmountA(e.target.value)}
              placeholder="0.0"
              className="input-field pr-20"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm font-medium text-gray-500">
              {tokenA.data.symbol}
            </div>
          </div>
        </div>
      )}

      {/* Plus Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
      </div>

      {/* Token B Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Second Token
        </label>
        <TokenSelector
          chainId={chainId || 1}
          selectedToken={tokenB}
          onTokenSelect={setTokenB}
          userAddress={address}
          excludeToken={tokenA?.address}
        />
      </div>

      {/* Amount B Input */}
      {tokenB && (
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Amount {tokenB.data.symbol}
          </label>
          <div className="relative">
            <input
              type="number"
              value={amountB}
              onChange={(e) => setAmountB(e.target.value)}
              placeholder="0.0"
              className="input-field pr-20"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm font-medium text-gray-500">
              {tokenB.data.symbol}
            </div>
          </div>
        </div>
      )}

      {/* Pair Status */}
      {tokenA && tokenB && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              pairExists === null ? 'bg-yellow-400 animate-pulse' : 
              pairExists ? 'bg-green-400' : 'bg-red-400'
            }`}></div>
            <span className="text-sm font-medium text-gray-700">
              Pair Status: {pairExists === null ? 'Checking...' : pairExists ? 'Pool exists' : 'Pool does not exist'}
            </span>
          </div>
        </div>
      )}

      {/* Single Action Button */}
      {tokenA && tokenB && amountA && amountB && (
        <button
          type="button"
          onClick={handleApproveAndProvideLiquidity}
          disabled={loading}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {pairExists === false ? 'Creating Pair, Approving & Adding Liquidity...' : 'Approving & Adding Liquidity...'}
            </div>
          ) : (
            pairExists === false ? 'Create Pair, Approve & Provide Liquidity' : 'Approve & Provide Liquidity'
          )}
        </button>
      )}
    </div>
  )
}