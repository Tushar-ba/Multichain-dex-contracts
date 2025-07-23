pragma solidity >=0.5.0;

interface IPayfundsFactory {
    function getExchange(address) external view returns (address);
}
