'use client'

import { useState, useEffect } from "react";
import { Token } from "@/types";
import { ApiService } from "@/services/api";

interface CrossChainTokenSelectorProps {
  chainId: number | null;
  selectedToken: Token | null;
  onTokenSelect: (token: Token) => void;
  label: string;
  excludeToken?: string;
}

export function CrossChainTokenSelector({
  chainId,
  selectedToken,
  onTokenSelect,
  label,
  excludeToken
}: CrossChainTokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (chainId) {
      fetchTokens();
    } else {
      setTokens([]);
    }
  }, [chainId]);

  const fetchTokens = async () => {
    if (!chainId) return;
    
    setLoading(true);
    try {
      const response = await ApiService.getTokensByChain(chainId);
      const filteredTokens = response.filter(token => token.address !== excludeToken);
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

  if (!chainId) {
    return (
      <div className="relative">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          {label}
        </label>
        <div className="w-full bg-gray-100 border border-gray-300 rounded-xl px-4 py-4 text-gray-500">
          Please select a chain first
        </div>
      </div>
    );
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
          disabled={loading}
          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-4 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Loading tokens...</span>
              <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : selectedToken ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedToken.data.uri}
                  alt={selectedToken.data.name}
                  className="w-8 h-8 rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/32x32/E5E7EB/9CA3AF?text=?';
                  }}
                />
                <div>
                  <div className="font-medium text-gray-900">{selectedToken.data.symbol}</div>
                  <div className="text-sm text-gray-500">{selectedToken.data.name}</div>
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
              <span className="text-gray-500">Select a token</span>
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
                  <div className="flex items-center space-x-3">
                    <img
                      src={token.data.uri}
                      alt={token.data.name}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/32x32/E5E7EB/9CA3AF?text=?';
                      }}
                    />
                    <div>
                      <div className="font-medium text-gray-900">{token.data.symbol}</div>
                      <div className="text-sm text-gray-500">{token.data.name}</div>
                    </div>
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
      </div>

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