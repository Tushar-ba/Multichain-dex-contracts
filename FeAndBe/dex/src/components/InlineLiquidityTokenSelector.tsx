'use client'

import { useState, useEffect } from "react";
import { Token, TokenBalance } from "@/types";
import { ApiService } from "@/services/api";

interface InlineLiquidityTokenSelectorProps {
  chainId: number;
  selectedToken: Token | null;
  onTokenSelect: (token: Token) => void;
  userAddress?: string;
  excludeToken?: string;
}

export function InlineLiquidityTokenSelector({
  chainId,
  selectedToken,
  onTokenSelect,
  userAddress,
  excludeToken
}: InlineLiquidityTokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (chainId) {
      fetchTokens();
    } else {
      setTokens([]);
    }
  }, [chainId, userAddress]);

  const fetchTokens = async () => {
    if (!chainId) return;
    
    setLoading(true);
    try {
      let response;
      console.log('Fetching tokens for chainId:', chainId, 'userAddress:', userAddress);
      
      if (userAddress) {
        try {
          const balanceResponse = await ApiService.getAllTokenBalances(chainId, userAddress);
          console.log('Balance response:', balanceResponse);
          // The API returns { balances: [...] } so we need to extract the balances array
          response = balanceResponse.balances || [];
        } catch (balanceError) {
          console.warn('Failed to fetch token balances, falling back to tokens without balances:', balanceError);
          // Fallback to tokens without balances
          const tokenResponse = await ApiService.getTokensByChain(chainId);
          response = tokenResponse.map(token => ({
            ...token,
            balance: '0',
            formattedBalance: '0.00'
          }));
        }
      } else {
        console.log('No user address, fetching tokens without balances');
        const tokenResponse = await ApiService.getTokensByChain(chainId);
        response = tokenResponse.map(token => ({
          ...token,
          balance: '0',
          formattedBalance: '0.00'
        }));
      }
      
      console.log('Final response:', response);
      const filteredTokens = response.filter(token => token.address !== excludeToken);
      console.log('Filtered tokens:', filteredTokens);
      setTokens(filteredTokens);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      setTokens([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSelect = (token: Token) => {
    onTokenSelect(token);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center justify-between w-full px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            <span className="text-sm text-gray-500">Loading tokens...</span>
          </div>
        ) : selectedToken ? (
          <div className="flex items-center space-x-3">
            <img
              src={selectedToken.data.uri}
              alt={selectedToken.data.name}
              className="w-6 h-6 rounded-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-token.png';
              }}
            />
            <div className="text-left">
              <div className="font-medium text-gray-900">{selectedToken.data.symbol}</div>
              <div className="text-sm text-gray-500">{selectedToken.data.name}</div>
            </div>
          </div>
        ) : (
          <span className="text-gray-500">Select Token</span>
        )}
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
      </button>

      {isOpen && !loading && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto">
          {tokens.length > 0 ? (
            tokens.map((token) => (
              <button
                key={token.address}
                type="button"
                onClick={() => handleTokenSelect(token)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={token.data.uri}
                      alt={token.data.name}
                      className="w-6 h-6 rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-token.png';
                      }}
                    />
                    <div>
                      <div className="font-medium text-gray-900">{token.data.symbol}</div>
                      <div className="text-sm text-gray-500">{token.data.name}</div>
                    </div>
                  </div>
                  {userAddress && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {parseFloat(token.formattedBalance).toFixed(4)}
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-gray-500 text-center">
              No tokens available
            </div>
          )}
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
  );
}