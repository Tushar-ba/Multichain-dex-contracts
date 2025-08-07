'use client'

import { Chain } from '@/components/ChainSelector'
import { Token } from '@/types'

interface CompactRoutingPathProps {
  sourceChain: Chain | null
  destinationChain: Chain | null
  sourceToken: Token | null
  destinationToken: Token | null
  onSwapChains?: () => void
}

export function CompactRoutingPath({
  sourceChain,
  destinationChain,
  sourceToken,
  destinationToken,
  onSwapChains
}: CompactRoutingPathProps) {
  if (!sourceChain || !destinationChain || !sourceToken || !destinationToken) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <p className="text-sm text-gray-500 text-center">
          Select tokens to see<br />routing path
        </p>
      </div>
    )
  }

  const getChainLogo = (chainId: number) => {
    const logoMap: { [key: number]: string } = {
      11155111: '/holesky.png', // Ethereum Sepolia (using Holesky logo as requested)
      80002: '/Polygon-logo.webp', // Polygon Amoy
      421614: '/arbitrum.webp', // Arbitrum Sepolia
      11155420: '/optimism.webp', // Optimism Sepolia
      43113: '/avalanche-avax-logo.webp', // Avalanche Fuji
      97: '/bnb.webp', // BSC Testnet
      84532: '/base.png', // Base Sepolia
      17000: '/holesky.png', // Holesky
    }
    return logoMap[chainId] || '/placeholder-token.png'
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-4">
      {/* Routing Path Header */}
      <div className="text-center">
        <h4 className="text-sm font-semibold text-gray-700 mb-1">Routing Path</h4>
        <p className="text-xs text-gray-500">via PFUSD Bridge</p>
      </div>

      {/* Step 1: Source Token to PFUSD */}
      <div className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <img
            src={getChainLogo(sourceChain.id)}
            alt={sourceChain.name}
            className="w-5 h-5 rounded-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-token.png';
            }}
          />
          <img
            src={sourceToken.data.uri}
            alt={sourceToken.data.symbol}
            className="w-5 h-5 rounded-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-token.png';
            }}
          />
        </div>
        
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        
        <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">PF</span>
        </div>
      </div>

      {/* LayerZero Bridge */}
      <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="text-xs font-semibold">LayerZero</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>

      {/* Step 2: PFUSD to Destination Token */}
      <div className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
        <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">PF</span>
        </div>
        
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        
        <div className="flex items-center space-x-2">
          <img
            src={destinationToken.data.uri}
            alt={destinationToken.data.symbol}
            className="w-5 h-5 rounded-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-token.png';
            }}
          />
          <img
            src={getChainLogo(destinationChain.id)}
            alt={destinationChain.name}
            className="w-5 h-5 rounded-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-token.png';
            }}
          />
        </div>
      </div>

      {/* Time Estimate */}
      <div className="text-center">
        <div className="text-xs text-gray-500">Estimated Time</div>
        <div className="text-sm font-semibold text-green-600">~2 minutes</div>
      </div>

      {/* Swap Direction Button */}
      {onSwapChains && (
        <button
          type="button"
          onClick={onSwapChains}
          className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white hover:shadow-lg transition-all duration-200 transform hover:scale-105 mt-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>
      )}
    </div>
  )
}