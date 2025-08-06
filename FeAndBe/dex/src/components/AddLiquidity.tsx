'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { ethers } from 'ethers'
import { TokenSelector } from './TokenSelector'
import { Token } from '@/types'
import { ContractService } from '@/services/contracts'
import { ApiService } from '@/services/api'

export function AddLiquidity() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()

  const [tokenA, setTokenA] = useState<Token | null>(null)
  const [tokenB, setTokenB] = useState<Token | null>(null)
  const [amountA, setAmountA] = useState('')
  const [amountB, setAmountB] = useState('')
  const [loading, setLoading] = useState(false)
  const [pairExists, setPairExists] = useState<boolean | null>(null)
  const [approvalA, setApprovalA] = useState<boolean>(false)
  const [approvalB, setApprovalB] = useState<boolean>(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if pair exists when tokens are selected
  useEffect(() => {
    if (tokenA && tokenB && chainId) {
      checkPairExists()
    }
  }, [tokenA, tokenB, chainId])

  // Check approvals when amounts change
  useEffect(() => {
    if (tokenA && tokenB && amountA && amountB && address && chainId) {
      checkApprovals()
    }
  }, [tokenA, tokenB, amountA, amountB, address, chainId])

  const checkPairExists = async () => {
    if (!tokenA || !tokenB || !chainId) return

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contractService = new ContractService(provider, undefined, chainId)
      
      const pairAddress = await contractService.getPairAddress(tokenA.address, tokenB.address)
      setPairExists(pairAddress !== '0x0000000000000000000000000000000000000000')
    } catch (error) {
      console.error('Error checking pair:', error)
      setPairExists(false)
    }
  }

  const checkApprovals = async () => {
    if (!tokenA || !tokenB || !amountA || !amountB || !address || !chainId) return

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contractService = new ContractService(provider, undefined, chainId)
      
      const routerAddress = contractService.getRouterContract(true).target as string
      
      // Check token A approval
      const allowanceA = await contractService.getTokenAllowance(tokenA.address, address, routerAddress)
      const amountAWei = ethers.parseUnits(amountA, tokenA.data.decimals)
      setApprovalA(BigInt(allowanceA) >= amountAWei)

      // Check token B approval
      const allowanceB = await contractService.getTokenAllowance(tokenB.address, address, routerAddress)
      const amountBWei = ethers.parseUnits(amountB, tokenB.data.decimals)
      setApprovalB(BigInt(allowanceB) >= amountBWei)
    } catch (error) {
      console.error('Error checking approvals:', error)
    }
  }

  const handleApprove = async (token: Token, amount: string) => {
    if (!address || !chainId) return

    setLoading(true)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contractService = new ContractService(provider, signer, chainId)
      
      const routerAddress = contractService.getRouterContract(true).target as string
      const amountWei = ethers.parseUnits(amount, token.data.decimals)
      
      await contractService.approveToken(token.address, routerAddress, amountWei.toString())
      
      // Recheck approvals
      await checkApprovals()
    } catch (error) {
      console.error('Error approving token:', error)
      alert('Failed to approve token')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePair = async () => {
    if (!tokenA || !tokenB || !address || !chainId) return

    setLoading(true)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contractService = new ContractService(provider, signer, chainId)
      
      const receipt = await contractService.createPair(tokenA.address, tokenB.address)
      
      // Store pair creation event in database
      const eventData = {
        transactionHash: receipt.transactionHash,
        chainId,
        factoryAddress: contractService.getFactoryContract(true).target,
        token0: tokenA.address < tokenB.address ? tokenA.address : tokenB.address,
        token1: tokenA.address < tokenB.address ? tokenB.address : tokenA.address,
        pairAddress: receipt.logs[0]?.address || '', // This would need proper parsing
        pairIndex: 1, // This would need to be fetched from the event
        blockNumber: receipt.blockNumber,
        blockTimestamp: new Date(),
        gasUsed: receipt.gasUsed?.toString(),
        gasPrice: receipt.gasPrice?.toString(),
        creator: address
      }
      
      await ApiService.createPairEvent(eventData)
      
      setPairExists(true)
      alert('Pair created successfully!')
    } catch (error) {
      console.error('Error creating pair:', error)
      alert('Failed to create pair')
    } finally {
      setLoading(false)
    }
  }

  const handleAddLiquidity = async () => {
    if (!tokenA || !tokenB || !amountA || !amountB || !address || !chainId) return

    setLoading(true)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contractService = new ContractService(provider, signer, chainId)
      
      const amountAWei = ethers.parseUnits(amountA, tokenA.data.decimals)
      const amountBWei = ethers.parseUnits(amountB, tokenB.data.decimals)
      
      // Calculate minimum amounts (5% slippage)
      const amountAMin = (amountAWei * BigInt(95)) / BigInt(100)
      const amountBMin = (amountBWei * BigInt(95)) / BigInt(100)
      
      const deadline = contractService.getDeadline()

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
          actualAmount: amountA // This would need proper parsing from receipt
        },
        tokenB: {
          address: tokenB.address,
          symbol: tokenB.data.symbol,
          decimals: tokenB.data.decimals,
          amountDesired: amountB,
          actualAmount: amountB // This would need proper parsing from receipt
        },
        liquidity: '0', // This would need to be parsed from receipt
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
    } catch (error) {
      console.error('Error adding liquidity:', error)
      alert('Failed to add liquidity')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Add Liquidity</h2>
        <div className="text-center text-gray-500">
          Loading...
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Add Liquidity</h2>
        <div className="text-center text-gray-500">
          Please connect your wallet to add liquidity
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto p-8 bg-white rounded-2xl shadow-2xl border border-gray-100">
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

      {/* Action Buttons */}
      <div className="space-y-4">
        {/* Create Pair Button */}
        {tokenA && tokenB && pairExists === false && (
          <button
            onClick={handleCreatePair}
            disabled={loading}
            className="w-full btn-warning disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating Pair...
              </div>
            ) : (
              'Create Pair'
            )}
          </button>
        )}

        {/* Approval Buttons */}
        {tokenA && amountA && !approvalA && (
          <button
            onClick={() => handleApprove(tokenA, amountA)}
            disabled={loading}
            className="w-full btn-secondary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Approving...
              </div>
            ) : (
              `Approve ${tokenA.data.symbol}`
            )}
          </button>
        )}

        {tokenB && amountB && !approvalB && (
          <button
            onClick={() => handleApprove(tokenB, amountB)}
            disabled={loading}
            className="w-full btn-secondary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Approving...
              </div>
            ) : (
              `Approve ${tokenB.data.symbol}`
            )}
          </button>
        )}

        {/* Add Liquidity Button */}
        {tokenA && tokenB && amountA && amountB && pairExists && approvalA && approvalB && (
          <button
            onClick={handleAddLiquidity}
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Adding Liquidity...
              </div>
            ) : (
              'Add Liquidity'
            )}
          </button>
        )}
      </div>
    </div>
  )
}