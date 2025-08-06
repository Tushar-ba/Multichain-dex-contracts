"use client";

import { useState, useEffect } from "react";
import { Token, TokenBalance } from "@/types";
import { ApiService } from "@/services/api";

interface TokenSelectorProps {
  chainId: number;
  selectedToken?: Token;
  onTokenSelect: (token: Token) => void;
  userAddress?: string;
  excludeToken?: string;
}

export function TokenSelector({
  chainId,
  selectedToken,
  onTokenSelect,
  userAddress,
  excludeToken,
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (chainId && mounted) {
      loadTokens();
    }
  }, [chainId, userAddress, mounted]);

  const loadTokens = async () => {
    setLoading(true);
    try {
      if (userAddress) {
        // Fetch tokens with balances
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/balances/chain/${chainId}/user/${userAddress}/all`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          setTokens(data.data.balances);
        } else {
          throw new Error(data.error || 'Failed to fetch token balances');
        }
      } else {
        // Fetch tokens without balances
        const tokensData = await ApiService.getTokensByChain(chainId);
        const tokensWithBalance = tokensData.map((token) => ({
          ...token,
          balance: "0",
          formattedBalance: "0",
        }));
        setTokens(tokensWithBalance);
      }
    } catch (error) {
      console.error("Error loading tokens:", error);
      // Fallback: try to load tokens without balances
      try {
        const tokensData = await ApiService.getTokensByChain(chainId);
        const tokensWithBalance = tokensData.map((token) => ({
          ...token,
          balance: "0",
          formattedBalance: "0",
        }));
        setTokens(tokensWithBalance);
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
        setTokens([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredTokens = tokens.filter((token) => {
    const matchesSearch =
      token.data.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.data.name.toLowerCase().includes(searchQuery.toLowerCase());
    const notExcluded =
      !excludeToken ||
      token.address.toLowerCase() !== excludeToken.toLowerCase();
    return matchesSearch && notExcluded;
  });

  if (!mounted) {
    return (
      <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
      >
        {selectedToken ? (
          <div className="flex items-center gap-4">
            <img
              src={selectedToken.data.uri}
              alt={selectedToken.data.symbol}
              className="w-8 h-8 rounded-full shadow-sm"
              onError={(e) => {
                e.currentTarget.src = "/placeholder-token.png";
              }}
            />
            <div className="text-left">
              <div className="font-semibold text-gray-900">{selectedToken.data.symbol}</div>
              <div className="text-sm text-gray-500">
                {selectedToken.data.name}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-gray-500 font-medium">Select a token</span>
        )}
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl z-50 max-h-80 overflow-hidden token-selector-dropdown">
          <div className="p-4 border-b border-gray-100">
            <input
              type="text"
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="overflow-y-auto max-h-60 custom-scrollbar">
            {loading ? (
              <div className="p-6 text-center">
                <div className="inline-flex items-center gap-2 text-gray-500">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  Loading tokens...
                </div>
              </div>
            ) : filteredTokens.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No tokens found
              </div>
            ) : (
              filteredTokens.map((token) => (
                <button
                  key={token.address}
                  type="button"
                  onClick={() => {
                    onTokenSelect(token);
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                  className="w-full flex items-center justify-between p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 text-left transition-all duration-200 border-b border-gray-50 last:border-b-0"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={token.data.uri}
                      alt={token.data.symbol}
                      className="w-10 h-10 rounded-full shadow-sm"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder-token.png";
                      }}
                    />
                    <div>
                      <div className="font-semibold text-gray-900">{token.data.symbol}</div>
                      <div className="text-sm text-gray-500">
                        {token.data.name}
                      </div>
                    </div>
                  </div>
                  {userAddress && (
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {parseFloat(token.formattedBalance).toFixed(4)}
                      </div>
                      <div className="text-xs text-gray-500">Balance</div>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
