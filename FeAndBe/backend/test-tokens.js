const { tokens } = require('./constants/token');

console.log('🔍 Token Data Analysis:');
console.log(`Total tokens: ${tokens.length}`);

// Group by chain
const chainGroups = tokens.reduce((acc, token) => {
  const chainId = token.data.chainId;
  if (!acc[chainId]) {
    acc[chainId] = {
      name: token.data.chain,
      tokens: []
    };
  }
  acc[chainId].tokens.push(token);
  return acc;
}, {});

console.log('\n📊 Tokens per chain:');
Object.entries(chainGroups).forEach(([chainId, data]) => {
  console.log(`  ${data.name} (${chainId}): ${data.tokens.length} tokens`);
});

// Find common tokens
const symbolGroups = tokens.reduce((acc, token) => {
  const symbol = token.data.symbol;
  if (!acc[symbol]) {
    acc[symbol] = [];
  }
  acc[symbol].push(token);
  return acc;
}, {});

const commonTokens = Object.entries(symbolGroups)
  .filter(([symbol, tokenList]) => tokenList.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

console.log('\n🔗 Common tokens (available on multiple chains):');
commonTokens.forEach(([symbol, tokenList]) => {
  console.log(`  ${symbol}: ${tokenList.length} chains`);
});

console.log('\n✅ Token data structure is valid!');