'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { ChainSelector, Chain } from '@/components/ChainSelector'
import { CrossChainTokenSelector } from '@/components/CrossChainTokenSelector'
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
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Reset tokens when chains change
  useEffect(() => {
    setSourceToken(null)
  }, [sourceChain])

  useEffect(() => {
    setDestinationToken(null)
  }, [destinationChain])

  const handleSwapChains = () => {
    const tempChain = sourceChain
    const tempToken = sourceToken
    const tempAmount = sourceAmount

    setSourceChain(destinationChain)
    setDestinationChain(tempChain)
    setSourceToken(destinationToken)
    setDestinationToken(tempToken)
    setSourceAmount(destinationAmount)
    setDestinationAmount(tempAmount)
  }

  const handleCrossChainSwap = async () => {
    if (!sourceChain || !destinationChain || !sourceToken || !destinationToken || !sourceAmount) {
      alert('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      // TODO: Implement cross-chain swap logic
      console.log('Cross-chain swap:', {
        sourceChain,
        destinationChain,
        sourceToken,
        destinationToken,
        sourceAmount,
        destinationAmount
      })
      
      alert('Cross-chain swap functionality will be implemented next!')
    } catch (error) {
      console.error('Error in cross-chain swap:', error)
      alert('Failed to execute cross-chain swap')
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
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-2xl border border-gray-100">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Cross-Chain Swap
        </h2>
        <p className="text-gray-500">Swap tokens across different blockchains seamlessly</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Source Chain Section */}
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                1
              </span>
              From Chain
            </h3>
            
            <div className="space-y-4">
              <ChainSelector
                selectedChain={sourceChain}
                onChainSelect={setSourceChain}
                label="Source Chain"
                excludeChain={destinationChain?.id}
              />

              <CrossChainTokenSelector
                chainId={sourceChain?.id || null}
                selectedToken={sourceToken}
                onTokenSelect={setSourceToken}
                label="Source Token"
                excludeToken={destinationToken?.address}
              />

              {sourceToken && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Amount to Send
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={sourceAmount}
                      onChange={(e) => setSourceAmount(e.target.value)}
                      placeholder="0.0"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-4 pr-20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm font-medium text-gray-500">
                      {sourceToken.data.symbol}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Swap Arrow */}
        <div className="lg:hidden flex justify-center">
          <button
            type="button"
            onClick={handleSwapChains}
            className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <svg className="w-6 h-6 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>
        </div>

        <div className="hidden lg:flex lg:flex-col lg:justify-center lg:items-center">
          <button
            type="button"
            onClick={handleSwapChains}
            className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>
        </div>

        {/* Destination Chain Section */}
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                2
              </span>
              To Chain
            </h3>
            
            <div className="space-y-4">
              <ChainSelector
                selectedChain={destinationChain}
                onChainSelect={setDestinationChain}
                label="Destination Chain"
                excludeChain={sourceChain?.id}
              />

              <CrossChainTokenSelector
                chainId={destinationChain?.id || null}
                selectedToken={destinationToken}
                onTokenSelect={setDestinationToken}
                label="Destination Token"
                excludeToken={sourceToken?.address}
              />

              {destinationToken && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Amount to Receive (Estimated)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={destinationAmount}
                      onChange={(e) => setDestinationAmount(e.target.value)}
                      placeholder="0.0"
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-4 pr-20 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                      readOnly
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm font-medium text-gray-500">
                      {destinationToken.data.symbol}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Estimated amount based on current rates
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Swap Summary */}
      {sourceChain && destinationChain && sourceToken && destinationToken && sourceAmount && (
        <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Swap Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">From:</span>
              <div className="font-medium">{sourceAmount} {sourceToken.data.symbol} on {sourceChain.name}</div>
            </div>
            <div>
              <span className="text-gray-600">To:</span>
              <div className="font-medium">{destinationAmount || '~'} {destinationToken.data.symbol} on {destinationChain.name}</div>
            </div>
            <div>
              <span className="text-gray-600">Bridge Fee:</span>
              <div className="font-medium">~0.01 {sourceChain.nativeCurrency.symbol}</div>
            </div>
            <div>
              <span className="text-gray-600">Estimated Time:</span>
              <div className="font-medium">2-5 minutes</div>
            </div>
          </div>
        </div>
      )}

      {/* Swap Button */}
      <div className="mt-8">
        {sourceChain && destinationChain && sourceToken && destinationToken && sourceAmount ? (
          <button
            type="button"
            onClick={handleCrossChainSwap}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing Cross-Chain Swap...
              </div>
            ) : (
              'Execute Cross-Chain Swap'
            )}
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="w-full bg-gray-300 text-gray-500 font-semibold py-4 px-6 rounded-xl cursor-not-allowed"
          >
            Please fill in all fields to continue
          </button>
        )}
      </div>

      {/* Info Section */}
      <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
        <h4 className="text-lg font-semibold text-blue-800 mb-3">How Cross-Chain Swap Works</h4>
        <div className="space-y-2 text-sm text-blue-700">
          <div className="flex items-start space-x-2">
            <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</span>
            <span>Your tokens are locked on the source chain</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</span>
            <span>LayerZero protocol bridges the transaction</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</span>
            <span>Equivalent tokens are minted/released on destination chain</span>
          </div>
        </div>
      </div>
    </div>
  )
}