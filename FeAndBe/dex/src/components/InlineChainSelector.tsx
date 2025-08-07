'use client'

import { useState } from 'react'
import { supportedChains } from '@/config/chains'
import { Chain } from '@/components/ChainSelector'

interface InlineChainSelectorProps {
  selectedChain: Chain | null
  onChainSelect: (chain: Chain) => void
  excludeChain?: number
}

export function InlineChainSelector({ selectedChain, onChainSelect, excludeChain }: InlineChainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const availableChains = supportedChains.filter(chain => chain.id !== excludeChain)

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

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
      >
        {selectedChain ? (
          <>
            <img
              src={getChainLogo(selectedChain.id)}
              alt={selectedChain.name}
              className="w-5 h-5 rounded-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-token.png';
              }}
            />
            <span className="text-sm font-medium text-gray-900">{selectedChain.name}</span>
          </>
        ) : (
          <span className="text-sm text-gray-500">Select Chain</span>
        )}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-64 mt-2 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Select Chain</h3>
          </div>
          <div className="p-2">
            <input
              type="text"
              placeholder="Search by chain name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {availableChains.map((chain) => (
              <button
                key={chain.id}
                type="button"
                onClick={() => {
                  onChainSelect(chain)
                  setIsOpen(false)
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors duration-150 flex items-center space-x-3"
              >
                <img
                  src={getChainLogo(chain.id)}
                  alt={chain.name}
                  className="w-6 h-6 rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-token.png';
                  }}
                />
                <span className="font-medium text-gray-900">{chain.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

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