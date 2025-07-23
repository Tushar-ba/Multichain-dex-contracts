pragma solidity >=0.5.0;

interface IPayfundsExchange {
    function balanceOf(address owner) external view returns (uint);
    function transferFrom(address from, address to, uint value) external returns (bool);
    function removeLiquidity(uint, uint, uint, uint) external returns (uint, uint);
    function tokenToEthSwapInput(uint tokens_sold, uint min_eth, uint deadline) external returns (uint);
}
