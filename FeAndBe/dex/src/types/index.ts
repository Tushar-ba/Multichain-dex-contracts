export interface Token {
  address: string
  data: {
    name: string
    symbol: string
    uri: string
    decimals: number
    chain: string
    chainId: number
  }
}

export interface TokenBalance extends Token {
  balance: string
  formattedBalance: string
}

export interface PairData {
  token0: string
  token1: string
  pairAddress: string
  reserves: {
    reserve0: string
    reserve1: string
  }
}

export interface AddLiquidityParams {
  tokenA: string
  tokenB: string
  amountADesired: string
  amountBDesired: string
  amountAMin: string
  amountBMin: string
  to: string
  deadline: number
}

export interface CreatePairParams {
  tokenA: string
  tokenB: string
}

export interface ChainInfo {
  chainId: number
  name: string
  tokenCount: number
}