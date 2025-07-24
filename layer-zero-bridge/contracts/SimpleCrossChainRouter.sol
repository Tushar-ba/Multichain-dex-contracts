// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.19;

// import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
// import {IOFT, SendParam, MessagingFee} from "@layerzerolabs/oft-evm/contracts/interfaces/IOFT.sol";

// // Your DEX Interface
// interface IPayfundsRouter02 {
//     function factory() external view returns (address);
//     function WMATIC() external view returns (address);
//     function swapExactTokensForTokens(
//         uint amountIn,
//         uint amountOutMin,
//         address[] calldata path,
//         address to,
//         uint deadline
//     ) external returns (uint[] memory amounts);
//     function getAmountsOut(
//         uint amountIn,
//         address[] calldata path
//     ) external view returns (uint[] memory amounts);
// }

// interface IERC20 {
//     function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
//     function transfer(address recipient, uint256 amount) external returns (bool);
//     function approve(address spender, uint256 amount) external returns (bool);
//     function balanceOf(address account) external view returns (uint256);
//     function decimals() external view returns (uint8);
// }

// /**
//  * @title SimpleCrossChainRouter
//  * @notice A simplified router for cross-chain token operations using LayerZero OFT
//  * @dev This contract performs: SourceToken -> Stablecoin -> Bridge to Destination
//  */
// contract SimpleCrossChainRouter is Ownable {
//     /// @notice The local DEX router used for token swaps
//     IPayfundsRouter02 public immutable dexRouter;
    
//     /// @notice The stablecoin OFT contract used for bridging
//     IOFT public immutable stablecoinOFT;
    
//     /// @notice The stablecoin address
//     address public immutable stablecoin;

//     /// @notice Emitted when a cross-chain swap is initiated
//     event CrossChainSwapInitiated(
//         address indexed sender,
//         uint32 destinationEid,
//         address recipient,
//         address sourceToken,
//         uint256 amountIn,
//         uint256 stableAmount,
//         uint256 bridgeAmount
//     );

//     /// @notice Emitted when tokens are swapped locally
//     event LocalSwap(
//         address indexed user,
//         address tokenIn,
//         address tokenOut,
//         uint256 amountIn,
//         uint256 amountOut
//     );

//     /**
//      * @notice Initializes the SimpleCrossChainRouter
//      * @param _owner The owner of the contract
//      * @param _dexRouter The address of the PayfundsRouter02
//      * @param _stablecoinOFT The OFT contract for the stablecoin
//      */
//     constructor(
//         address _owner,
//         address _dexRouter,
//         address _stablecoinOFT
//     ) Ownable(_owner) {
//         dexRouter = IPayfundsRouter02(_dexRouter);
//         stablecoinOFT = IOFT(_stablecoinOFT);
//         stablecoin = _stablecoinOFT; // Assuming the OFT contract is also the token
//     }

//     /**
//      * @notice Performs a cross-chain swap: SourceToken -> Stablecoin -> Bridge to Destination
//      * @param _destinationEid The LayerZero endpoint ID for the destination chain
//      * @param _recipient The recipient address on the destination chain
//      * @param _sourceToken The token to swap on the source chain
//      * @param _amountIn The amount of source tokens to swap
//      * @param _minStableOut Minimum stablecoins to receive from DEX swap
//      * @param _options Additional options for the LayerZero message
//      */
//     function crossChainSwap(
//         uint32 _destinationEid,
//         address _recipient,
//         address _sourceToken,
//         uint256 _amountIn,
//         uint256 _minStableOut,
//         bytes calldata _options
//     ) external payable {
//         // 1. Take user's source tokens
//         require(
//             IERC20(_sourceToken).transferFrom(msg.sender, address(this), _amountIn),
//             "Token transfer failed"
//         );

//         // 2. Swap source token for stablecoin on the source chain
//         IERC20(_sourceToken).approve(address(dexRouter), _amountIn);

//         address[] memory path = new address[](2);
//         path[0] = _sourceToken;
//         path[1] = stablecoin;

//         uint[] memory amounts = dexRouter.swapExactTokensForTokens(
//             _amountIn,
//             _minStableOut,
//             path,
//             address(this),
//             block.timestamp + 1200 // 20 minutes deadline
//         );

//         uint256 stableAmount = amounts[amounts.length - 1];

//         // 3. Bridge stablecoins to destination chain
//         uint256 bridgeAmount = _bridgeStablecoins(
//             _destinationEid,
//             _recipient,
//             stableAmount,
//             _options
//         );

//         emit CrossChainSwapInitiated(
//             msg.sender,
//             _destinationEid,
//             _recipient,
//             _sourceToken,
//             _amountIn,
//             stableAmount,
//             bridgeAmount
//         );
//     }

//     /**
//      * @notice Bridge stablecoins directly to another chain
//      * @param _destinationEid The destination chain endpoint ID
//      * @param _recipient The recipient address on destination chain
//      * @param _amount The amount of stablecoins to bridge
//      * @param _options LayerZero options
//      */
//     function bridgeStablecoins(
//         uint32 _destinationEid,
//         address _recipient,
//         uint256 _amount,
//         bytes calldata _options
//     ) external payable {
//         // Take user's stablecoins
//         require(
//             IERC20(stablecoin).transferFrom(msg.sender, address(this), _amount),
//             "Stablecoin transfer failed"
//         );

//         // Bridge them
//         _bridgeStablecoins(_destinationEid, _recipient, _amount, _options);
//     }

//     /**
//      * @notice Internal function to bridge stablecoins using OFT
//      * @param _destinationEid The destination chain endpoint ID
//      * @param _recipient The recipient address
//      * @param _amount The amount to bridge
//      * @param _options LayerZero options
//      * @return actualAmount The actual amount bridged
//      */
//     function _bridgeStablecoins(
//         uint32 _destinationEid,
//         address _recipient,
//         uint256 _amount,
//         bytes calldata _options
//     ) internal returns (uint256 actualAmount) {
//         // Approve the OFT contract to spend stablecoins
//         IERC20(stablecoin).approve(address(stablecoinOFT), _amount);

//         // Prepare SendParam - simple bridge without compose
//         SendParam memory sendParam = SendParam({
//             dstEid: _destinationEid,
//             to: _addressToBytes32(_recipient),
//             amountLD: _amount,
//             minAmountLD: _amount, // No slippage for stablecoin bridge
//             extraOptions: _options,
//             composeMsg: "", // No compose message - simple bridge
//             oftCmd: ""
//         });

//         // Get quote for OFT sending
//         MessagingFee memory oftFee = stablecoinOFT.quoteSend(sendParam, false);
        
//         // Ensure sufficient fee provided
//         require(msg.value >= oftFee.nativeFee, "Insufficient fee for bridge");

//         // Send the stablecoins
//         stablecoinOFT.send{value: oftFee.nativeFee}(
//             sendParam,
//             oftFee,
//             payable(msg.sender) // Refund to original sender
//         );

//         return _amount;
//     }

//     /**
//      * @notice Swap tokens locally on this chain
//      * @param _tokenIn Input token address
//      * @param _tokenOut Output token address
//      * @param _amountIn Amount of input tokens
//      * @param _amountOutMin Minimum output tokens
//      * @param _recipient Recipient of output tokens
//      */
//     function swapTokens(
//         address _tokenIn,
//         address _tokenOut,
//         uint256 _amountIn,
//         uint256 _amountOutMin,
//         address _recipient
//     ) external {
//         // Take user's input tokens
//         require(
//             IERC20(_tokenIn).transferFrom(msg.sender, address(this), _amountIn),
//             "Token transfer failed"
//         );

//         // Approve DEX router
//         IERC20(_tokenIn).approve(address(dexRouter), _amountIn);

//         // Prepare swap path
//         address[] memory path = new address[](2);
//         path[0] = _tokenIn;
//         path[1] = _tokenOut;

//         // Execute swap
//         uint[] memory amounts = dexRouter.swapExactTokensForTokens(
//             _amountIn,
//             _amountOutMin,
//             path,
//             _recipient,
//             block.timestamp + 1200 // 20 minutes deadline
//         );

//         emit LocalSwap(
//             msg.sender,
//             _tokenIn,
//             _tokenOut,
//             _amountIn,
//             amounts[amounts.length - 1]
//         );
//     }

//     /**
//      * @notice Quotes the fee for bridging stablecoins
//      * @param _destinationEid The destination chain endpoint ID
//      * @param _recipient The recipient address
//      * @param _amount The amount to bridge
//      * @param _options LayerZero options
//      * @return fee The messaging fee required
//      */
//     function quoteBridgeFee(
//         uint32 _destinationEid,
//         address _recipient,
//         uint256 _amount,
//         bytes calldata _options
//     ) external view returns (MessagingFee memory fee) {
//         SendParam memory sendParam = SendParam({
//             dstEid: _destinationEid,
//             to: _addressToBytes32(_recipient),
//             amountLD: _amount,
//             minAmountLD: _amount,
//             extraOptions: _options,
//             composeMsg: "",
//             oftCmd: ""
//         });

//         return stablecoinOFT.quoteSend(sendParam, false);
//     }

//     /**
//      * @notice Estimates the output amount for a local swap
//      * @param _tokenIn Input token address
//      * @param _tokenOut Output token address  
//      * @param _amountIn Amount of input tokens
//      * @return amountOut Estimated output amount
//      */
//     function estimateSwapOutput(
//         address _tokenIn,
//         address _tokenOut,
//         uint256 _amountIn
//     ) external view returns (uint256 amountOut) {
//         address[] memory path = new address[](2);
//         path[0] = _tokenIn;
//         path[1] = _tokenOut;

//         uint[] memory amounts = dexRouter.getAmountsOut(_amountIn, path);
//         return amounts[amounts.length - 1];
//     }

//     /**
//      * @notice Convert address to bytes32
//      * @param _addr The address to convert
//      * @return The bytes32 representation
//      */
//     function _addressToBytes32(address _addr) internal pure returns (bytes32) {
//         return bytes32(uint256(uint160(_addr)));
//     }

//     /**
//      * @notice Convert bytes32 to address
//      * @param _buf The bytes32 to convert
//      * @return The address representation
//      */
//     function _bytes32ToAddress(bytes32 _buf) internal pure returns (address) {
//         return address(uint160(uint256(_buf)));
//     }

//     /**
//      * @notice Emergency withdrawal function for the owner
//      * @param _token Token to withdraw
//      * @param _to Recipient address
//      * @param _amount Amount to withdraw
//      */
//     function withdrawToken(
//         IERC20 _token,
//         address _to,
//         uint256 _amount
//     ) external onlyOwner {
//         require(_token.transfer(_to, _amount), "Transfer failed");
//     }

//     /**
//      * @notice Emergency withdrawal of native currency
//      * @param _to Recipient address
//      * @param _amount Amount to withdraw
//      */
//     function withdrawNative(address payable _to, uint256 _amount) external onlyOwner {
//         _to.transfer(_amount);
//     }

//     /**
//      * @notice Receive function for native currency
//      */
//     receive() external payable {}
// } 