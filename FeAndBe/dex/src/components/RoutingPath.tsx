'use client'

import { Chain } from '@/components/ChainSelector'
import { Token } from '@/types'

interface RoutingPathProps {
  sourceChain: Chain | null
  destinationChain: Chain | null
  sourceToken: Token | null
  destinationToken: Token | null
  sourceAmount: string
  destinationAmount: string
}

export function RoutingPath({
  sourceChain,
  destinationChain,
  sourceToken,
  destinationToken,
  sourceAmount,
  destinationAmount
}: RoutingPathProps) {
  if (!sourceChain || !destinationChain || !sourceToken || !destinationToken) {
    return null
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
    <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
      <h4 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
        <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 01.553-.894L9 2l6 3 6-3v15l-6 3-6-3z" />
        </svg>
        Routing Path
      </h4>

      <div className="space-y-4">
        {/* Step 1: Source Token to PFUSD */}
        <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3 flex-1">
            <div className="flex items-center space-x-2">
              <img
                src={getChainLogo(sourceChain.id)}
                alt={sourceChain.name}
                className="w-6 h-6 rounded-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-token.png';
                }}
              />
              <div className="text-sm">
                <div className="font-medium text-gray-900">{sourceChain.name}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <img
                src={sourceToken.data.uri}
                alt={sourceToken.data.symbol}
                className="w-6 h-6 rounded-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-token.png';
                }}
              />
              <span className="font-medium text-gray-900">
                {sourceAmount} {sourceToken.data.symbol}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-xs font-medium">SWAP</span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">PF</span>
            </div>
            <span className="font-medium text-gray-900">
              ~{sourceAmount} PFUSD
            </span>
          </div>
        </div>

        {/* Step 2: LayerZero Bridge */}
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center space-x-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="font-semibold text-sm">LayerZero Bridge</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>

        {/* Step 3: PFUSD to Destination Token */}
        <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">PF</span>
            </div>
            <span className="font-medium text-gray-900">
              ~{sourceAmount} PFUSD
            </span>
          </div>

          <div className="flex items-center space-x-2 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-xs font-medium">SWAP</span>
          </div>

          <div className="flex items-center space-x-3 flex-1">
            <div className="flex items-center space-x-2">
              <img
                src={destinationToken.data.uri}
                alt={destinationToken.data.symbol}
                className="w-6 h-6 rounded-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-token.png';
                }}
              />
              <span className="font-medium text-gray-900">
                {destinationAmount || '~'} {destinationToken.data.symbol}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <img
                src={getChainLogo(destinationChain.id)}
                alt={destinationChain.name}
                className="w-6 h-6 rounded-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-token.png';
                }}
              />
              <div className="text-sm">
                <div className="font-medium text-gray-900">{destinationChain.name}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Route Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
          <div className="text-gray-600 mb-1">Total Steps</div>
          <div className="font-semibold text-lg text-indigo-600">3</div>
          <div className="text-xs text-gray-500">Swap → Bridge → Swap</div>
        </div>
        
        <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
          <div className="text-gray-600 mb-1">Estimated Time</div>
          <div className="font-semibold text-lg text-green-600">~2 mins</div>
          <div className="text-xs text-gray-500">Including confirmations</div>
        </div>
        
        <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
          <div className="text-gray-600 mb-1">Bridge Protocol</div>
          <div className="font-semibold text-lg text-purple-600">LayerZero</div>
          <div className="text-xs text-gray-500">V2 Omnichain</div>
        </div>
      </div>

      {/* Route Details */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-2">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">How it works:</div>
            <div className="space-y-1 text-blue-700">
              <div>1. Your {sourceToken.data.symbol} is swapped to PFUSD on {sourceChain.name}</div>
              <div>2. PFUSD is bridged to {destinationChain.name} via LayerZero protocol</div>
              <div>3. PFUSD is swapped to {destinationToken.data.symbol} on {destinationChain.name}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}