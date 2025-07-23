pragma solidity >=0.5.0;

interface IPayfundsMigrator {
    function migrate(address token, uint amountTokenMin, uint amountMATICMin, address to, uint deadline) external;
}
