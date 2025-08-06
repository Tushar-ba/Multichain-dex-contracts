import { Token, ChainInfo } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export class ApiService {
  private static async request<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`)
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }
    const data = await response.json()
    return data
  }

  static async getTokensByChain(chainId: number): Promise<Token[]> {
    const response = await this.request<{ success: boolean; data: Token[] }>(`/api/tokens/chain/${chainId}`)
    return response.data
  }

  static async getSupportedChains(): Promise<ChainInfo[]> {
    const response = await this.request<{ success: boolean; data: ChainInfo[] }>('/api/tokens/chains')
    return response.data
  }

  static async getTokenByAddress(chainId: number, address: string): Promise<Token> {
    const response = await this.request<{ success: boolean; data: Token }>(`/api/tokens/chain/${chainId}/address/${address}`)
    return response.data
  }

  static async searchTokens(query: string, chainId?: number): Promise<Token[]> {
    const url = chainId 
      ? `/api/tokens/search?query=${query}&chainId=${chainId}`
      : `/api/tokens/search?query=${query}`
    const response = await this.request<{ success: boolean; data: Token[] }>(url)
    return response.data
  }

  static async createPairEvent(eventData: any): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/events/pair-created`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to create pair event: ${response.statusText}`)
    }
  }

  static async addLiquidityEvent(eventData: any): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/events/liquidity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to create liquidity event: ${response.statusText}`)
    }
  }

  static async getTokenBalance(chainId: number, tokenAddress: string, userAddress: string): Promise<any> {
    const response = await this.request<any>(`/api/balances/chain/${chainId}/token/${tokenAddress}/user/${userAddress}`)
    return response.data
  }

  static async getAllTokenBalances(chainId: number, userAddress: string): Promise<any> {
    const response = await this.request<any>(`/api/balances/chain/${chainId}/user/${userAddress}/all`)
    return response.data
  }
}