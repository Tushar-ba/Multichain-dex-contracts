// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// LayerZero V2 Imports
import {OApp} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import {Origin} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import {MessagingFee} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import {CrossChainOptionsType3} from "./CrossChainOptionsType3.sol";

// OFT imports for composition
import {IOFT, SendParam, MessagingReceipt} from "@layerzerolabs/oft-evm/contracts/interfaces/IOFT.sol";
import {OFTComposeMsgCodec} from "@layerzerolabs/oft-evm/contracts/libs/OFTComposeMsgCodec.sol";

// Your DEX and Token Interfaces
interface IPayfundsRouter02 {
    function factory() external view returns (address);
    function WMATIC() external view returns (address);
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    function getAmountsOut(
        uint amountIn,
        address[] calldata path
    ) external view returns (uint[] memory amounts);
}

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function decimals() external view returns (uint8);
}

/**
 * @title CrossChainRouter
 * @notice A router that enables cross-chain token swaps using LayerZero Compose functionality
 * @dev This contract receives stablecoins via OFT and performs swaps using lzCompose
 */
contract CrossChainRouter is OApp, CrossChainOptionsType3 {
    /// @notice The local DEX router used for token swaps
    IPayfundsRouter02 public immutable dexRouter;
    
    /// @notice The stablecoin OFT contract used for bridging
    IOFT public immutable stablecoinOFT;
    
    /// @notice The stablecoin address
    address public immutable stablecoin;

    /// @notice Emitted when a cross-chain swap is initiated
    event CrossChainSwapInitiated(
        address indexed sender,
        uint32 destinationEid,
        bytes32 recipient,
        address sourceToken,
        bytes32 destinationToken,
        uint256 amountIn,
        uint256 stableAmount,
        uint256 amountOutMin
    );

    /// @notice Emitted when a cross-chain swap is completed
    event CrossChainSwapCompleted(
        bytes32 indexed recipient,
        bytes32 destinationToken,
        uint256 stableAmount,
        uint256 amountOut
    );

    /// @notice Error when compose message is invalid
    error InvalidComposeMsg();

    /**
     * @notice Initializes the CrossChainRouter
     * @param _lzEndpoint The LayerZero endpoint address
     * @param _owner The owner of the contract
     * @param _dexRouter The address of the PayfundsRouter02
     * @param _stablecoinOFT The OFT contract for the stablecoin
     */
    constructor(
        address _lzEndpoint,
        address _owner,
        address _dexRouter,
        address _stablecoinOFT
    ) OApp(_lzEndpoint, _owner) CrossChainOptionsType3(_owner) {
        dexRouter = IPayfundsRouter02(_dexRouter);
        stablecoinOFT = IOFT(_stablecoinOFT);
        stablecoin = _stablecoinOFT; // Assuming the OFT contract is also the token
    }

    /**
     * @notice Internal function required by OApp to handle LayerZero messages
     * @dev This implementation doesn't handle regular messages, only compose messages
     */
    function _lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) internal override {
        // This router only handles compose messages, not regular lzReceive messages
        // Regular OFT transfers with compose will trigger lzCompose instead
        revert("CrossChainRouter: Only compose messages supported");
    }

    /**
     * @notice Handles LayerZero compose messages (called after OFT transfer)
     * @param _from The source address (OFT contract)
     * @param _guid The global unique identifier
     * @param _message The compose message containing swap instructions
     * @param _executor The executor address
     * @param _extraData Additional data
     */
    function lzCompose(
        address _from,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) external payable {
        // Ensure the message is from our trusted OFT contract
        require(_from == address(stablecoinOFT), "Unauthorized compose caller");

        // Extract the amount transferred using OFTComposeMsgCodec
        uint256 stableAmount = OFTComposeMsgCodec.amountLD(_message);
        
        // Extract our custom compose message using OFTComposeMsgCodec
        bytes memory composeMsg = OFTComposeMsgCodec.composeMsg(_message);
        
        // Decode our swap instructions from the compose message
        (
            bytes32 recipient,
            bytes32 destinationToken,
            uint256 amountOutMin
        ) = abi.decode(composeMsg, (bytes32, bytes32, uint256));

        // Ensure we have the expected stablecoins
        uint256 stablecoinBalance = IERC20(stablecoin).balanceOf(address(this));
        require(stablecoinBalance >= stableAmount, "Insufficient stablecoins received");

        // Approve the DEX router to spend the stablecoins
        IERC20(stablecoin).approve(address(dexRouter), stableAmount);

        // Perform the swap on the destination chain
        address[] memory path = new address[](2);
        path[0] = stablecoin;
        path[1] = bytes32ToAddress(destinationToken);

        // Execute the swap
        uint[] memory amounts = dexRouter.swapExactTokensForTokens(
            stableAmount,
            amountOutMin,
            path,
            bytes32ToAddress(recipient),
            block.timestamp + 1200 // 20 minutes deadline
        );

        emit CrossChainSwapCompleted(
            recipient,
            destinationToken,
            stableAmount,
            amounts[amounts.length - 1]
        );
    }

    /**
     * @notice Initiates a cross-chain swap using LayerZero Compose
     * @param _destinationEid The LayerZero endpoint ID for the destination chain
     * @param _recipient The recipient address on the destination chain (as bytes32)
     * @param _sourceToken The token to swap on the source chain
     * @param _destinationToken The token to receive on the destination chain (as bytes32)
     * @param _amountIn The amount of source tokens to swap
     * @param _amountOutMin The minimum amount of destination tokens to receive
     * @param _options Additional options for the LayerZero message
     */
    function crossChainSwap(
        uint32 _destinationEid,
        bytes32 _recipient,
        address _sourceToken,
        bytes32 _destinationToken,
        uint256 _amountIn,
        uint256 _amountOutMin,
        bytes calldata _options
    ) external payable {
        // 1. Take user's source tokens
        require(
            IERC20(_sourceToken).transferFrom(msg.sender, address(this), _amountIn),
            "Token transfer failed"
        );

        // 2. Swap source token for stablecoin on the source chain
        IERC20(_sourceToken).approve(address(dexRouter), _amountIn);

        address[] memory path = new address[](2);
        path[0] = _sourceToken;
        path[1] = stablecoin;

        uint[] memory amounts = dexRouter.swapExactTokensForTokens(
            _amountIn,
            0, // No minimum for the intermediate swap
            path,
            address(this),
            block.timestamp + 1200 // 20 minutes deadline
        );

        uint256 stableAmount = amounts[amounts.length - 1];

        // 3. Prepare compose message with swap instructions
        bytes memory composeMsg = abi.encode(
            _recipient,
            _destinationToken,
            _amountOutMin
        );

        // 4. Send stablecoins with compose message using OFT
        _sendWithCompose(
            _destinationEid,
            stableAmount,
            composeMsg,
            _options
        );

        emit CrossChainSwapInitiated(
            msg.sender,
            _destinationEid,
            _recipient,
            _sourceToken,
            _destinationToken,
            _amountIn,
            stableAmount,
            _amountOutMin
        );
    }

    /**
     * @notice Sends stablecoins with compose message using OFT
     * @param _destinationEid The destination chain endpoint ID
     * @param _amount The amount of stablecoins to send
     * @param _composeMsg The compose message with swap instructions
     * @param _options LayerZero options
     */
    function _sendWithCompose(
        uint32 _destinationEid,
        uint256 _amount,
        bytes memory _composeMsg,
        bytes calldata _options
    ) internal {
        // Approve the OFT contract to spend stablecoins
        IERC20(stablecoin).approve(address(stablecoinOFT), _amount);

        // Prepare SendParam with compose message
        SendParam memory sendParam = SendParam({
            dstEid: _destinationEid,
            to: addressToBytes32(address(this)), // Send to this contract on destination
            amountLD: _amount,
            minAmountLD: _amount, // No slippage for stablecoin bridge
            extraOptions: _options,
            composeMsg: _composeMsg, // This triggers lzCompose on destination
            oftCmd: ""
        });

        // Get quote for OFT sending with compose
        MessagingFee memory oftFee = stablecoinOFT.quoteSend(sendParam, false);
        
        // Ensure sufficient fee provided
        require(msg.value >= oftFee.nativeFee, "Insufficient fee for OFT send");

        // Send the stablecoins with compose message
        stablecoinOFT.send{value: oftFee.nativeFee}(
            sendParam,
            oftFee,
            payable(msg.sender) // Refund to original sender
        );
    }

    /**
     * @notice Quotes the fee for a cross-chain swap using compose
     * @param _destinationEid The LayerZero endpoint ID for the destination chain
     * @param _recipient The recipient address on the destination chain (as bytes32)
     * @param _destinationToken The token to receive on the destination chain (as bytes32)
     * @param _amountOutMin The minimum amount of destination tokens to receive
     * @param _stableAmount The amount of stablecoins to send
     * @param _options Additional options for the LayerZero message
     * @return fee The messaging fee required for the cross-chain swap
     */
    function quoteSwapFee(
        uint32 _destinationEid,
        bytes32 _recipient,
        bytes32 _destinationToken,
        uint256 _amountOutMin,
        uint256 _stableAmount,
        bytes calldata _options
    ) external view returns (MessagingFee memory fee) {
        // Prepare compose message
        bytes memory composeMsg = abi.encode(
            _recipient,
            _destinationToken,
            _amountOutMin
        );

        // Prepare SendParam
        SendParam memory sendParam = SendParam({
            dstEid: _destinationEid,
            to: addressToBytes32(address(this)),
            amountLD: _stableAmount,
            minAmountLD: _stableAmount,
            extraOptions: _options,
            composeMsg: composeMsg,
            oftCmd: ""
        });

        // Return OFT quote (includes compose execution)
        return stablecoinOFT.quoteSend(sendParam, false);
    }

    /**
     * @notice Estimates the output amount for a cross-chain swap
     * @param _sourceToken The token to swap on the source chain
     * @param _amountIn The amount of source tokens to swap
     * @return sourceStableAmount The estimated amount of stablecoin after source swap
     */
    function estimateSwapOutput(
        address _sourceToken,
        uint256 _amountIn
    ) external view returns (uint256 sourceStableAmount) {
        // Estimate source chain swap: sourceToken -> stablecoin
        address[] memory sourcePath = new address[](2);
        sourcePath[0] = _sourceToken;
        sourcePath[1] = stablecoin;

        uint[] memory sourceAmounts = dexRouter.getAmountsOut(_amountIn, sourcePath);
        sourceStableAmount = sourceAmounts[sourceAmounts.length - 1];
    }

    /**
     * @notice Helper function to convert bytes32 to an address
     * @param _buf The bytes32 value to convert
     * @return The converted address
     */
    function bytes32ToAddress(bytes32 _buf) internal pure returns (address) {
        return address(uint160(uint256(_buf)));
    }

    /**
     * @notice Helper function to convert an address to bytes32
     * @param _addr The address to convert
     * @return The converted bytes32 value
     */
    function addressToBytes32(address _addr) public pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }

    /**
     * @notice Allows the owner to withdraw any tokens from this contract
     * @param _token The token to withdraw
     * @param _to The recipient address
     * @param _amount The amount to withdraw
     */
    function withdrawToken(
        IERC20 _token,
        address _to,
        uint256 _amount
    ) external {
        require(msg.sender == owner(), "Only owner");
        require(_token.transfer(_to, _amount), "Transfer failed");
    }

    /**
     * @notice Allows the owner to withdraw native currency from this contract
     * @param _to The recipient address
     * @param _amount The amount to withdraw
     */
    function withdrawNative(address payable _to, uint256 _amount) external {
        require(msg.sender == owner(), "Only owner");
        _to.transfer(_amount);
    }

    /**
     * @notice Fallback function to receive native currency
     */
    receive() external payable {}
}