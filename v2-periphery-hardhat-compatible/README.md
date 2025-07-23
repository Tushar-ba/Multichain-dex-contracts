Token address: 0x8a9B512cD44f45377E95E2D21B10086a266686c9

##########################

1. https://consultanubhav-1596.medium.com/implementing-meta-transactions-on-your-smart-contract-using-biconomy-sdk-ddf85b49ea97

2. https://medium.com/ginete-technologies/gasless-meta-transactions-on-matic-using-biconomy-bfae7ae8e743

3. https://dashboard-gasless.biconomy.io/dapps
4. https://docs-gasless.biconomy.io/tutorials/native-meta-transactions/how-to-build-your-first-dapp/executing-first-blockchain-transaction
5. https://github.com/bcnmy/dapp-demo/blob/master/src/App.js#L76

6.https://github.com/aniforverizon/blockchain-meta

7. https://github.com/vanshika-srivastava/scw-gasless-bico-modular/blob/main/smartContract/contracts/Counter.sol

8. https://github.com/bcnmy/sdk-demo/tree/dev/src/components

// const ethers = require("ethers");

// // Your inputs
// const senderAddress = "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4";
// const string2 = "subj";

// // Construct the hash using ethers.js
// const hash = ethers.solidityPackedKeccak256(
// ["address", "string"],
// [senderAddress, string2]
// );

// console.log(hash);
const { MerkleTree } = require("merkletreejs");
// const keccak256 = require("keccak256");
const ethers = require("ethers");

let whitelistAddresses = [
"0x5B38Da6a701c568545dCfcB03FcB875f56beddC4",
"0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2",
"0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db",
"0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB",
"0xdD870fA1b7C4700F2BD7f44238821C26f7392148",
];

const proofOfAddress = whitelistAddresses[2];

// Creates a new array "leaf Nodes" by hashing all indexes of the "whitelistAddresses" // using keccak256. Then creates a new Merkle Tree object using keccak256 as the // desired hashing algorithm.
const leafNodes = whitelistAddresses.map((addr) =>
ethers.solidityPackedKeccak256(["address"], [addr])
);

const merkleTree = new MerkleTree(leafNodes, ethers.keccak256, {
sortPairs: true,
});

//rootHash
const rootHash = merkleTree.getRoot().toString("hex");
console.log("Root Hash :", "0x" + rootHash);

const proof = merkleTree.getHexProof(
ethers.solidityPackedKeccak256(["address"], [proofOfAddress])
);

// console.log("MerkleTree \n", merkleTree.toString());

console.log(proof);
// console.log(
// "leaf \n",
// ethers.solidityPackedKeccak256(
// ["address"],
// ["0x5b38da6a701c568545dcfcb03fcb875f56beddc4"]
// )
// );

[
"0xdfbe3e504ac4e35541bebad4d0e7574668e16fefa26cd4172f93e18b59ce9486",
"0x9d997719c0a5b5f6db9b8ac69a988be57cf324cb9fffd51dc2c37544bb520d65",
"0xafe7c546eb582218cf94b848c36f3b058e2518876240ae6100c4ef23d38f3e07",
];

// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.21;

import "./interfaces/IPayfundsRouter02.sol";
import "./interfaces/IPayfundsFactory.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TestSwap {

     /// @dev PayfundsRouter02 contract on mumbai network
    address public router = 0xb71c52BA5E0690A7cE3A0214391F4c03F5cbFB0d;
    /// @dev PayfundsFactory contract on mumbai network
    address public factory = 0xD4790c528848e3B789196Ba90E3AbcA8aA1292f9;
    // address public factory = 0xD4790c528848e3B789196Ba90E3AbcA8aA1292f9;



    mapping(address => mapping(address => uint256)) public liquidityOf;

     event AddedLiquidity(
        uint256 amountA,
        uint256 amountB,
        uint256 LPToken,
        address PoolAddress
    );
    event TokenSwapped(uint256 TokenAmountOut, address tokenReciever);

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB
    ) external {
        require(
            address(0) != tokenA && address(0) != tokenB,
            "Token address cannot be zero address"
        );
        require(
            amountA >= 10000 && amountB >= 10000,
            "both token amount should be greater than or equal 10000"
        );

        /// @dev transfer all the tokens to this contract
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountB);

        /// @dev approve the router contract
        IERC20(tokenA).approve(router, amountA);
        IERC20(tokenB).approve(router, amountB);

        /// @dev call the function addLiquidity in router contract
        (
            uint256 TokenAamount,
            uint256 TokenBamountB,
            uint256 LPToken
        ) = IPayfundsRouter02(router).addLiquidity(
                tokenA,
                tokenB,
                amountA,
                amountB,
                1,
                1,
                address(this),
                block.timestamp
            );

        /// @dev get the pair address(pool)
        address pair = IPayfundsFactory(factory).getPair(tokenA, tokenB);

        /// @dev this contract address holds all the lp tokens
        /// @dev check it with IERC(pair).balanceOf(address(this))

        /// @dev add the liquidity to the collection
        liquidityOf[msg.sender][pair] += LPToken;

        /// @dev emit the event
        emit AddedLiquidity(TokenAamount, TokenBamountB, LPToken, pair);
    }

    /// @notice call the function to swap tokens (ex. tokenA -> tokenB)
    /// @notice caller need to approve the token amount (amount user want to swap) to the contract
    /// @dev after swapping the token ,caller will get the desired tokens to his address
    /// @param fromToken the address of the token user is ready to swap
    /// @param toToken the address of the token user wants to get
    /// @param tokenAmountForSwap the amount of token user wants to swap to get the toToken
    function swapTokens(
        address fromToken,
        address toToken,
        uint256 tokenAmountForSwap
    ) external {
        address pair = IPayfundsFactory(factory).getPair(fromToken, toToken);

        /// @dev if pool is not exist,revert
        require(pair != address(0), "Pool is not exist");
        /// @dev transfer the tokens from sender address to contract address
        IERC20(fromToken).transferFrom(
            msg.sender,
            address(this),
            tokenAmountForSwap
        );

        /// @dev approve this token for the router contract
        IERC20(fromToken).approve(router, tokenAmountForSwap);

        /// @dev path of swapping the token
        address[] memory path = new address[](2);
        path[0] = fromToken;
        path[1] = toToken;
        /// @dev get the token amount , user will get after the swapping
        uint256 tokenAmountOut = IPayfundsRouter02(router).getAmountsOut(
            tokenAmountForSwap,
            path
        )[1];
        /// @dev swap the tokns
        IPayfundsRouter02(router).swapExactTokensForTokens(
            tokenAmountForSwap,
            tokenAmountOut,
            path,
            msg.sender,
            block.timestamp
        );
        /// @dev emit the event
        emit TokenSwapped(tokenAmountOut, msg.sender);
    }

    function swapEth(
        address toToken
    )external payable {
        address pair = IPayfundsFactory(factory).getPair(IPayfundsRouter02(router).WMATIC(), toToken);
        /// @dev if pool is not exist,revert
        require(pair != address(0), "Pool is not exist");

        address[] memory path = new address[](2);
        path[0] = IPayfundsRouter02(router).WMATIC();
        path[1] = toToken;

        IPayfundsRouter02(router).swapExactMATICForTokens{value: msg.value}(
            1,
            path,
            msg.sender,
            block.timestamp
        );

        // uint amountOutMin, address[] calldata path, address to, uint deadline
    }

}

// contract Test {

// receive() external payable {
// }
// function WorngWay(uint deno) public pure returns (uint256){
// uint test = 10*5 / deno*5; //if deno=2 shound get 5
// return test;
// }

// function RightWay(uint deno) public pure returns (uint256){
// uint test = 10*5 / (deno*5); //if deno=2 shound get 5
// return test;
// }

// function transferFunds(address payable to,uint amount) public {
// bool success = to.send(amount);
// require(success, "failed to send balance from maturity wallet");
// }
// }
