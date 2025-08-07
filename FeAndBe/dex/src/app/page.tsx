'use client'

import { WalletConnect } from '@/components/WalletConnect'
import { AddLiquidity } from '@/components/AddLiquidity'

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Add Liquidity
          </h1>
          <p className="text-gray-600 text-lg">Provide liquidity to earn trading fees</p>
        </div>
        <div className="flex-shrink-0">
          <WalletConnect />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex justify-center">
        <AddLiquidity />
      </div>

      {/* Footer */}
      <div className="mt-16 text-center text-gray-500 text-sm">
        <p>Powered by Payfunds Protocol • Multi-Chain Liquidity Solutions</p>
      </div>
    </main>
  )
}