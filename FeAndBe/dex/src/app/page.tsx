'use client'

import { AddLiquidity } from '@/components/AddLiquidity'

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">


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