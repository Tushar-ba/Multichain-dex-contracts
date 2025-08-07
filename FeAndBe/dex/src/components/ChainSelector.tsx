'use client'

import { useState } from 'react'
import { supportedChains } from '@/config/chains'

export interface Chain {
  id: number
  name: string
  network: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  testnet: boolean
}

interface ChainSelectorProps {
  selectedChain: Chain | null
  onChainSelect: (chain: Chain) => void
  label: string
  excludeChain?: number
}

export function ChainSelector({ selectedChain, onChainSelect, label, excludeChain }: ChainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const availableChains = supportedChains.filter(chain => chain.id !== excludeChain)

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
    <div className="relative">
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        {label}
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-4 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
        >
          {selectedChain ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={getChainLogo(selectedChain.id)}
                  alt={selectedChain.name}
                  className="w-8 h-8 rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-token.png';
                  }}
                />
                <div>
                  <div className="font-medium text-gray-900">{selectedChain.name}</div>
                  <div className="text-sm text-gray-500">{selectedChain.nativeCurrency.symbol}</div>
                </div>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                  isOpen ? 'transform rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Select a chain</span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                  isOpen ? 'transform rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto">
            {availableChains.map((chain) => (
              <button
                key={chain.id}
                type="button"
                onClick={() => {
                  onChainSelect(chain)
                  setIsOpen(false)
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={getChainLogo(chain.id)}
                    alt={chain.name}
                    className="w-8 h-8 rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-token.png';
                    }}
                  />
                  <div>
                    <div className="font-medium text-gray-900">{chain.name}</div>
                    <div className="text-sm text-gray-500">{chain.nativeCurrency.symbol}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}