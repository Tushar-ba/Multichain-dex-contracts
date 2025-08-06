import { ethers } from 'ethers'
import { getContractAddress } from '@/config/contracts'
import FactoryABI from '@/app/ABI/Factory.json'
import RouterABI from '@/app/ABI/Router.json'

// ERC20 ABI for token operations
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
]

// Pair ABI for getting reserves
const PAIR_ABI = [
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() view returns (address)',
  'function token1() view returns (address)',
]

export class ContractService {
  private provider: ethers.Provider
  private signer?: ethers.Signer
  private chainId: number

  constructor(provider: ethers.Provider, signer?: ethers.Signer, chainId?: number) {
    this.provider = provider
    this.signer = signer
    this.chainId = chainId || 1
  }

  // Factory contract methods
  getFactoryContract(readOnly = false) {
    const factoryAddress = getContractAddress(this.chainId, 'factory')
    if (!factoryAddress) throw new Error('Factory contract not found for this chain')

    return new ethers.Contract(
      factoryAddress,
      FactoryABI,
      readOnly ? this.provider : this.signer || this.provider
    )
  }

  // Router contract methods
  getRouterContract(readOnly = false) {
    const routerAddress = getContractAddress(this.chainId, 'router')
    if (!routerAddress) throw new Error('Router contract not found for this chain')

    return new ethers.Contract(
      routerAddress,
      RouterABI,
      readOnly ? this.provider : this.signer || this.provider
    )
  }

  // ERC20 token contract
  getTokenContract(tokenAddress: string, readOnly = false) {
    return new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      readOnly ? this.provider : this.signer || this.provider
    )
  }

  // Pair contract
  getPairContract(pairAddress: string, readOnly = true) {
    return new ethers.Contract(
      pairAddress,
      PAIR_ABI,
      readOnly ? this.provider : this.signer || this.provider
    )
  }

  // Check if pair exists
  async getPairAddress(tokenA: string, tokenB: string): Promise<string> {
    const factory = this.getFactoryContract(true)
    return await factory.getPair(tokenA, tokenB)
  }

  // Create pair
  async createPair(tokenA: string, tokenB: string) {
    if (!this.signer) throw new Error('Signer required for creating pair')

    const factory = this.getFactoryContract()
    const tx = await factory.createPair(tokenA, tokenB)
    return await tx.wait()
  }

  // Get token balance
  async getTokenBalance(tokenAddress: string, userAddress: string): Promise<string> {
    // Handle native token
    if (tokenAddress === '0x0000000000000000000000000000000000000000' ||
      tokenAddress === '0x0000000000000000000000000000000000001010') {
      const balance = await this.provider.getBalance(userAddress)
      return balance.toString()
    }

    // Handle ERC20 token
    const token = this.getTokenContract(tokenAddress, true)
    const balance = await token.balanceOf(userAddress)
    return balance.toString()
  }

  // Get token allowance
  async getTokenAllowance(tokenAddress: string, owner: string, spender: string): Promise<string> {
    if (tokenAddress === '0x0000000000000000000000000000000000000000' ||
      tokenAddress === '0x0000000000000000000000000000000000001010') {
      return ethers.MaxUint256.toString() // Native tokens don't need approval
    }

    const token = this.getTokenContract(tokenAddress, true)
    const allowance = await token.allowance(owner, spender)
    return allowance.toString()
  }

  // Approve token spending
  async approveToken(tokenAddress: string, spender: string, amount: string) {
    if (!this.signer) throw new Error('Signer required for token approval')

    if (tokenAddress === '0x0000000000000000000000000000000000000000' ||
      tokenAddress === '0x0000000000000000000000000000000000001010') {
      return null // Native tokens don't need approval
    }

    const token = this.getTokenContract(tokenAddress)
    const tx = await token.approve(spender, amount)
    return await tx.wait()
  }

  // Add liquidity
  async addLiquidity(params: {
    tokenA: string
    tokenB: string
    amountADesired: string
    amountBDesired: string
    amountAMin: string
    amountBMin: string
    to: string
    deadline: number
  }) {
    if (!this.signer) throw new Error('Signer required for adding liquidity')

    const router = this.getRouterContract()
    const tx = await router.addLiquidity(
      params.tokenA,
      params.tokenB,
      params.amountADesired,
      params.amountBDesired,
      params.amountAMin,
      params.amountBMin,
      params.to,
      params.deadline
    )
    return await tx.wait()
  }

  // Add liquidity with native token (ETH/MATIC/BNB/AVAX)
  async addLiquidityNative(params: {
    token: string
    amountTokenDesired: string
    amountTokenMin: string
    amountNativeMin: string
    to: string
    deadline: number
    nativeAmount: string
  }) {
    if (!this.signer) throw new Error('Signer required for adding liquidity')

    const router = this.getRouterContract()
    const tx = await router.addLiquidityMATIC(
      params.token,
      params.amountTokenDesired,
      params.amountTokenMin,
      params.amountNativeMin,
      params.to,
      params.deadline,
      { value: params.nativeAmount }
    )
    return await tx.wait()
  }

  // Get pair reserves
  async getPairReserves(pairAddress: string) {
    const pair = this.getPairContract(pairAddress)
    const [reserve0, reserve1, blockTimestampLast] = await pair.getReserves()
    const token0 = await pair.token0()
    const token1 = await pair.token1()

    return {
      reserve0: reserve0.toString(),
      reserve1: reserve1.toString(),
      blockTimestampLast: blockTimestampLast.toString(),
      token0,
      token1
    }
  }

  // Calculate quote for adding liquidity
  async calculateLiquidityQuote(tokenA: string, tokenB: string, amountA: string) {
    const router = this.getRouterContract(true)
    const pairAddress = await this.getPairAddress(tokenA, tokenB)

    if (pairAddress === '0x0000000000000000000000000000000000000000') {
      // No pair exists, return the desired amounts
      return null
    }

    const reserves = await this.getPairReserves(pairAddress)
    const amountABigInt = BigInt(amountA)

    // Determine which token is token0 and token1
    const isTokenAFirst = tokenA.toLowerCase() < tokenB.toLowerCase()
    const reserveA = isTokenAFirst ? BigInt(reserves.reserve0) : BigInt(reserves.reserve1)
    const reserveB = isTokenAFirst ? BigInt(reserves.reserve1) : BigInt(reserves.reserve0)

    if (reserveA === 0n || reserveB === 0n) {
      // Pool has no liquidity, return null
      return null
    }

    // Calculate quote using the router's quote function
    const quotedAmountB = await router.quote(amountABigInt, reserveA, reserveB)

    return {
      amountB: quotedAmountB.toString(),
      reserveA: reserveA.toString(),
      reserveB: reserveB.toString()
    }
  }

  // Calculate deadline (20 minutes from now)
  getDeadline(): number {
    return Math.floor(Date.now() / 1000) + 1200
  }
}