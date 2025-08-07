'use client'

import { useState, useEffect } from "react";
import { Token } from "@/types";
import { ApiService } from "@/services/api";

interface InlineTokenSelectorProps {
  chainId: number | null;
  selectedToken: Token | null;
  onTokenSelect: (token: Token) => void;
  excludeToken?: string;
}

export function InlineTokenSelector({
  chainId,
  selectedToken,
  onTokenSelect,
  excludeToken
}: InlineTokenSelectorProps) {
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
      <button
        type="button"
        disabled
        className="flex items-center space-x-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
      >
        <span className="text-sm text-gray-400">Select Token</span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            <span className="text-sm text-gray-500">Loading...</span>
          </>
        ) : selectedToken ? (
          <>
            <img
              src={selectedToken.data.uri}
              alt={selectedToken.data.name}
              className="w-5 h-5 rounded-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-token.png';
              }}
            />
            <span className="text-sm font-medium text-gray-900">{selectedToken.data.symbol}</span>
          </>
        ) : (
          <span className="text-sm text-gray-500">Select Token</span>
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

      {isOpen && !loading && (
        <div className="absolute z-50 w-64 mt-2 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto right-0">
          {tokens.length > 0 ? (
            tokens.map((token) => (
              <button
                key={token.address}
                type="button"
                onClick={() => handleTokenSelect(token)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl flex items-center space-x-3"
              >
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