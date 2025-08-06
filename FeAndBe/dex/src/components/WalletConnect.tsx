'use client'

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { supportedChains } from '@/config/chains'
import { useEffect, useState } from 'react'

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-gray-300 text-gray-500 rounded-md text-sm cursor-not-allowed">
          Loading...
        </button>
      </div>
    )
  }

  if (isConnected) {
    return (
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white rounded-xl p-4 shadow-lg border border-gray-100">
        <div className="flex items-center gap-3 bg-green-50 px-3 py-2 rounded-lg">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
        </div>
        
        <select
          value={chainId || ''}
          onChange={(e) => switchChain({ chainId: Number(e.target.value) })}
          className="px-4 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[160px]"
        >
          {supportedChains.map((chain) => (
            <option key={chain.id} value={chain.id}>
              {chain.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => disconnect()}
          className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          onClick={() => connect({ connector })}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          Connect {connector.name}
        </button>
      ))}
    </div>
  )
}