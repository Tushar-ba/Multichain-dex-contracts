'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { ethers } from 'ethers'
import { Chain } from '@/components/ChainSelector'
import { InlineChainSelector } from '@/components/InlineChainSelector'
import { InlineTokenSelector } from '@/components/InlineTokenSelector'
import { CrossChainService } from '@/services/crosschain'
import { ApiService } from '@/services/api'
import { Token } from '@/types'

export default function CrossChainSwapPage() {
  const { address, isConnected } = useAccount()
  const currentChainId = useChainId()

  const [sourceChain, setSourceChain] = useState<Chain | null>(null)
  const [destinationChain, setDestinationChain] = useState<Chain | null>(null)
  const [sourceToken, setSourceToken] = useState<Token | null>(null)
  const [destinationToken, setDestinationToken] = useState<Token | null>(null)
  const [sourceAmount, setSourceAmount] = useState('')
  const [destinationAmount, setDestinationAmount] = useState('')
  const [sourceBalance, setSourceBalance] = useState('0.00')
  const [destinationBalance, setDestinationBalance] = useState('0.00')
  const [loadingSourceBalance, setLoadingSourceBalance] = useState(false)
  const [loadingDestinationBalance, setLoadingDestinationBalance] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Reset tokens when chains change
  useEffect(() => {
    setSourceToken(null)
    setSourceBalance('0.00')
  }, [sourceChain])

  useEffect(() => {
    setDestinationToken(null)
    setDestinationBalance('0.00')
  }, [destinationChain])

  // Fetch source token balance
  useEffect(() => {
    const fetchSourceBalance = async () => {
      if (sourceToken && address && sourceChain && currentChainId === sourceChain.id) {
        setLoadingSourceBalance(true)
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const tokenContract = new ethers.Contract(
            sourceToken.address,
            ['function balanceOf(address owner) view returns (uint256)'],
            provider
          )
          
          const balance = await tokenContract.balanceOf(address)
          const formattedBalance = ethers.formatUnits(balance, sourceToken.data.decimals)
          setSourceBalance(parseFloat(formattedBalance).toFixed(6))
        } catch (error) {
          console.error('Error fetching source token balance:', error)
          setSourceBalance('0.00')
        } finally {
          setLoadingSourceBalance(false)
        }
      } else {
        setSourceBalance('0.00')
        setLoadingSourceBalance(false)
      }
    }

    fetchSourceBalance()
  }, [sourceToken, address, sourceChain, currentChainId])

  // Fetch destination token balance
  useEffect(() => {
    const fetchDestinationBalance = async () => {
      if (destinationToken && address && destinationChain && currentChainId === destinationChain.id) {
        setLoadingDestinationBalance(true)
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const tokenContract = new ethers.Contract(
            destinationToken.address,
            ['function balanceOf(address owner) view returns (uint256)'],
            provider
          )
          
          const balance = await tokenContract.balanceOf(address)
          const formattedBalance = ethers.formatUnits(balance, destinationToken.data.decimals)
          setDestinationBalance(parseFloat(formattedBalance).toFixed(6))
        } catch (error) {
          console.error('Error fetching destination token balance:', error)
          setDestinationBalance('0.00')
        } finally {
          setLoadingDestinationBalance(false)
        }
      } else {
        setDestinationBalance('0.00')
        setLoadingDestinationBalance(false)
      }
    }

    fetchDestinationBalance()
  }, [destinationToken, address, destinationChain, currentChainId])

  // Calculate estimated destination amount using real cross-chain quotes
  useEffect(() => {
    const calculateQuote = async () => {
      if (sourceAmount && sourceToken && destinationToken && sourceChain && destinationChain && address) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const crossChainService = new CrossChainService(provider, undefined, sourceChain.id)
          
          const amountInWei = ethers.parseUnits(sourceAmount, sourceToken.data.decimals)
          
          const swapParams = {
            sourceChainId: sourceChain.id,
            destinationChainId: destinationChain.id,
            sourceToken: sourceToken.address,
            destinationToken: destinationToken.address,
            amountIn: amountInWei.toString(),
            amountOutMin: '0',
            recipient: address
          }

          const quote = await crossChainService.quoteCrossChainSwap(swapParams)
          
          // Estimate destination amount (stable amount with 2% slippage for destination swap)
          const stableAmount = parseFloat(ethers.formatUnits(quote.estimatedStableAmount, 18))
          const estimatedDestination = (stableAmount * 0.98).toFixed(6) // 2% slippage
          
          setDestinationAmount(estimatedDestination)
        } catch (error) {
          console.error('Error calculating cross-chain quote:', error)
          // Fallback to simple calculation
          const rate = 0.95 // 5% slippage/fees for cross-chain
          const estimated = (parseFloat(sourceAmount) * rate).toFixed(6)
          setDestinationAmount(estimated)
        }
      } else {
        setDestinationAmount('')
      }
    }

    const timeoutId = setTimeout(calculateQuote, 500) // Debounce API calls
    return () => clearTimeout(timeoutId)
  }, [sourceAmount, sourceToken, destinationToken, sourceChain, destinationChain, address])

  const handleSwapChains = () => {
    const tempChain = sourceChain
    const tempToken = sourceToken
    const tempAmount = sourceAmount
    const tempBalance = sourceBalance

    setSourceChain(destinationChain)
    setDestinationChain(tempChain)
    setSourceToken(destinationToken)
    setDestinationToken(tempToken)
    setSourceAmount(destinationAmount)
    setDestinationAmount(tempAmount)
    setSourceBalance(destinationBalance)
    setDestinationBalance(tempBalance)
  }

  const handleMaxAmount = () => {
    if (sourceBalance && parseFloat(sourceBalance) > 0) {
      setSourceAmount(sourceBalance)
    }
  }

  const handleCrossChainSwap = async () => {
    if (!sourceChain || !destinationChain || !sourceToken || !destinationToken || !sourceAmount || !address) {
      alert('Please fill in all fields and connect your wallet')
      return
    }

    setLoading(true)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const crossChainService = new CrossChainService(provider, signer, sourceChain.id)
      
      const amountInWei = ethers.parseUnits(sourceAmount, sourceToken.data.decimals)
      const amountOutMinWei = ethers.parseUnits(destinationAmount || '0', destinationToken.data.decimals)
      
      // Calculate 5% slippage for minimum output
      const minAmountOut = (amountOutMinWei * BigInt(95)) / BigInt(100)

      const swapParams = {
        sourceChainId: sourceChain.id,
        destinationChainId: destinationChain.id,
        sourceToken: sourceToken.address,
        destinationToken: destinationToken.address,
        amountIn: amountInWei.toString(),
        amountOutMin: minAmountOut.toString(),
        recipient: address
      }

      console.log('Getting quote for cross-chain swap...')
      
      // Get quote for fees
      const quote = await crossChainService.quoteCrossChainSwap(swapParams)
      console.log('Cross-chain swap quote:', quote)

      // Check all required approvals (4 total)
      console.log('Checking all required approvals...')
      const approvalStatus = await crossChainService.checkAllApprovals(swapParams, address)
      console.log('Approval status:', approvalStatus)

      // Execute all required approvals (4 approvals total)
      const needsApprovals = !approvalStatus.sourceTokenForRouterApproved || 
                           !approvalStatus.sourceTokenForCrossChainApproved ||
                           !approvalStatus.stablecoinForRouterApproved ||
                           !approvalStatus.stablecoinForCrossChainApproved

      if (needsApprovals) {
        console.log('🔐 Executing all required approvals...')
        const approvalResult = await crossChainService.executeAllApprovals(swapParams)
        console.log(`✅ All approvals completed! Total transactions: ${approvalResult.totalApprovals}`)
      } else {
        console.log('✅ All approvals already exist!')
      }

      console.log('All approvals completed. Executing cross-chain swap...')
      
      // Execute the cross-chain swap
      const receipt = await crossChainService.executeCrossChainSwap(
        swapParams,
        quote.layerZeroFee
      )

      console.log('Cross-chain swap initiated:', receipt)

      // Parse transaction events
      const events = crossChainService.parseTransactionEvents(receipt, sourceChain.id)
      const swapEvent = events.find(e => e.type === 'CrossChainSwapInitiated')
      
      // Get explorer URLs
      const explorerUrls = crossChainService.getExplorerUrls(
        receipt.transactionHash,
        sourceChain.id,
        destinationChain.id
      )

      // Store cross-chain transaction in database
      const eventData = {
        sourceTransactionHash: receipt.transactionHash,
        sourceChainId: sourceChain.id,
        destinationChainId: destinationChain.id,
        sender: address,
        recipient: address,
        sourceToken: {
          address: sourceToken.address,
          symbol: sourceToken.data.symbol,
          amount: sourceAmount
        },
        destinationToken: {
          address: destinationToken.address,
          symbol: destinationToken.data.symbol
        },
        stableAmount: swapEvent ? ethers.formatUnits(swapEvent.stableAmount, 18) : ethers.formatUnits(quote.estimatedStableAmount, 18),
        amountOutMin: destinationAmount,
        layerZeroFee: ethers.formatEther(quote.layerZeroFee),
        status: 'initiated',
        sourceBlockNumber: receipt.blockNumber,
        sourceBlockTimestamp: new Date(),
        sourceGasUsed: receipt.gasUsed?.toString(),
        sourceGasPrice: receipt.gasPrice?.toString()
      }

      try {
        await ApiService.createCrossChainEvent(eventData)
      } catch (dbError) {
        console.warn('Failed to store cross-chain event:', dbError)
      }

      const stableAmountFormatted = swapEvent 
        ? ethers.formatUnits(swapEvent.stableAmount, 18)
        : ethers.formatUnits(quote.estimatedStableAmount, 18)

      alert(`🎉 Cross-chain swap initiated successfully!

📋 Transaction Details:
• Transaction Hash: ${receipt.transactionHash}
• Source: ${sourceAmount} ${sourceToken.data.symbol} (${sourceChain.name})
• Bridge: ${parseFloat(stableAmountFormatted).toFixed(6)} PFUSD
• Destination: ~${destinationAmount} ${destinationToken.data.symbol} (${destinationChain.name})
• LayerZero Fee: ${ethers.formatEther(quote.layerZeroFee)} ETH

🌉 Cross-Chain Flow:
1. ✅ ${sourceToken.data.symbol} → PFUSD (${sourceChain.name})
2. 🌉 PFUSD bridged via LayerZero
3. ⏳ PFUSD → ${destinationToken.data.symbol} (${destinationChain.name})
4. 📤 ${destinationToken.data.symbol} delivered to your wallet

⏱️ Timeline:
• LayerZero bridging: 2-5 minutes
• Destination swap: ~30 seconds after bridge
• Total completion: ${quote.estimatedTime}

🔍 Track Progress:
• Source TX: ${explorerUrls.sourceTransaction}
• LayerZero: ${explorerUrls.layerZeroScan}

Your ${destinationToken.data.symbol} tokens will be delivered to ${address} on ${destinationChain.name}.`)
      
      // Reset form and refresh balances
      setSourceAmount('')
      setDestinationAmount('')
      
      // Refresh source balance after successful swap
      if (sourceToken && address && sourceChain && currentChainId === sourceChain.id) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const tokenContract = new ethers.Contract(
            sourceToken.address,
            ['function balanceOf(address owner) view returns (uint256)'],
            provider
          )
          
          const balance = await tokenContract.balanceOf(address)
          const formattedBalance = ethers.formatUnits(balance, sourceToken.data.decimals)
          setSourceBalance(parseFloat(formattedBalance).toFixed(6))
        } catch (error) {
          console.error('Error refreshing source balance:', error)
        }
      }
    } catch (error: any) {
      console.error('Error in cross-chain swap:', error)
      
      let errorMessage = 'Failed to execute cross-chain swap'
      
      if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction fees'
      } else if (error.message.includes('Token transfer failed')) {
        errorMessage = 'Token transfer failed. Check your token balance and allowance.'
      } else if (error.message.includes('execution reverted')) {
        errorMessage = 'Transaction failed. Please check token balances and try again.'
      } else if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction was rejected by user'
      }
      
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-2xl border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Cross-Chain Swap
          </h2>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-2xl border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Cross-Chain Swap
          </h2>
          <p className="text-gray-500">Please connect your wallet to use cross-chain swap</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Swap Tokens Cross chain
        </h2>
        <div className="flex justify-end">
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Sell Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Sell --</span>
            <div className="flex items-center space-x-2">
              <InlineTokenSelector
                chainId={sourceChain?.id || null}
                selectedToken={sourceToken}
                onTokenSelect={setSourceToken}
                excludeToken={destinationToken?.address}
              />
              <InlineChainSelector
                selectedChain={sourceChain}
                onChainSelect={setSourceChain}
                excludeChain={destinationChain?.id}
              />
            </div>
          </div>
          
          <div className="text-xs text-gray-500 mb-2">From Chain</div>
          
          <div className={`rounded-xl p-4 ${
            sourceAmount && parseFloat(sourceAmount) > parseFloat(sourceBalance) 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-gray-50'
          }`}>
            <input
              type="number"
              value={sourceAmount}
              onChange={(e) => setSourceAmount(e.target.value)}
              placeholder="0.00"
              className={`w-full bg-transparent text-2xl font-medium placeholder-gray-400 focus:outline-none ${
                sourceAmount && parseFloat(sourceAmount) > parseFloat(sourceBalance)
                  ? 'text-red-600'
                  : 'text-gray-900'
              }`}
            />
            <div className="text-xs mt-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">
                  Balance: {sourceChain && currentChainId !== sourceChain.id ? (
                    <span className="text-orange-500">Switch to {sourceChain.name}</span>
                  ) : loadingSourceBalance ? (
                    <span className="inline-flex items-center gap-1">
                      <div className="w-3 h-3 border border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                      Loading...
                    </span>
                  ) : (
                    sourceBalance
                  )}
                </span>
                <button
                  type="button"
                  onClick={handleMaxAmount}
                  className="text-red-500 font-medium hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!sourceToken || parseFloat(sourceBalance) === 0 || (sourceChain && currentChainId !== sourceChain.id) || loadingSourceBalance}
                >
                  MAX
                </button>
              </div>
              {sourceAmount && parseFloat(sourceAmount) > parseFloat(sourceBalance) && (
                <div className="text-red-500 mt-1">
                  Insufficient balance. Maximum: {sourceBalance}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center py-2">
          <button
            type="button"
            onClick={handleSwapChains}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>

        {/* Buy Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Buy --</span>
            <div className="flex items-center space-x-2">
              <InlineTokenSelector
                chainId={destinationChain?.id || null}
                selectedToken={destinationToken}
                onTokenSelect={setDestinationToken}
                excludeToken={sourceToken?.address}
              />
              <InlineChainSelector
                selectedChain={destinationChain}
                onChainSelect={setDestinationChain}
                excludeChain={sourceChain?.id}
              />
            </div>
          </div>
          
          <div className="text-xs text-gray-500 mb-2">To Chain</div>
          
          <div className="bg-gray-50 rounded-xl p-4">
            <input
              type="number"
              value={destinationAmount}
              placeholder="0.00"
              className="w-full bg-transparent text-2xl font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
              readOnly
            />
            <div className="text-xs text-gray-500 mt-2">
              Balance: {destinationChain && currentChainId !== destinationChain.id ? (
                <span className="text-orange-500">Switch to {destinationChain.name}</span>
              ) : loadingDestinationBalance ? (
                <span className="inline-flex items-center gap-1">
                  <div className="w-3 h-3 border border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                  Loading...
                </span>
              ) : (
                destinationBalance
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Swap Button */}
      <div className="mt-6">
        {sourceChain && destinationChain && sourceToken && destinationToken && sourceAmount ? (
          <button
            type="button"
            onClick={handleCrossChainSwap}
            disabled={loading || parseFloat(sourceAmount) > parseFloat(sourceBalance) || parseFloat(sourceAmount) <= 0}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing Cross-Chain Swap...
              </div>
            ) : parseFloat(sourceAmount) > parseFloat(sourceBalance) ? (
              'Insufficient Balance'
            ) : parseFloat(sourceAmount) <= 0 ? (
              'Enter Amount'
            ) : (
              'Execute Cross-Chain Swap'
            )}
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="w-full bg-red-500 text-white font-medium py-4 px-6 rounded-xl cursor-not-allowed opacity-50"
          >
            {!isConnected ? 'Connect your Wallet' : 'Select Tokens and Chains'}
          </button>
        )}
      </div>
    </div>
  )
}