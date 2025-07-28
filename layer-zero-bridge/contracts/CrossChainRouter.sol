// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

// LayerZero V2 Imports - PROPER INHERITANCE
import {OApp} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import {Origin} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import {MessagingFee} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import {OAppOptionsType3} from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OAppOptionsType3.sol";

// OpenZeppelin Imports
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// OFT imports for token bridging
import {IOFT, SendParam, MessagingReceipt} from "@layerzerolabs/oft-evm/contracts/interfaces/IOFT.sol";

// Your DEX and Token Interfaces
// Updated interface for your PayfundsRouter02
interface IPayfundsRouter02 {
    function factory() external pure returns (address);
    function WMATIC() external pure returns (address); // Note: WMATIC not WETH!
    
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
    
    function getAmountsIn(
        uint amountOut,
        address[] calldata path
    ) external view returns (uint[] memory amounts);
}

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title CrossChainRouter
 * @notice A proper LayerZero OApp for cross-chain swaps that follows standard patterns
 */
contract CrossChainRouter is OApp, OAppOptionsType3 {
    /// @notice Message type for cross-chain swaps
    uint16 public constant SWAP = 1;

    /// @notice The local DEX router used for token swaps
    IPayfundsRouter02 public immutable dexRouter;

    /// @notice The stablecoin OFT contract used for bridging
    IOFT public immutable stablecoinOFT;
    
    /// @notice The stablecoin address used as an intermediary for cross-chain swaps
    address public immutable stablecoin;

    /// @notice Pending swaps waiting for stablecoin arrival
    mapping(bytes32 => PendingSwap) public pendingSwaps;

    struct PendingSwap {
        bytes32 recipient;
        bytes32 destinationToken;
        uint256 amountOutMin;
        uint256 stableAmount;
        address refundRecipient;
        uint256 timestamp;
        bool executed;
    }

    /// @notice Events
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

    event CrossChainSwapCompleted(
        uint32 indexed sourceEid,
        bytes32 indexed recipient,
        bytes32 destinationToken,
        uint256 stableAmount,
        uint256 amountOut
    );

    /**
     * @notice Initializes the CrossChainRouter - PROPER CONSTRUCTOR
     */
    constructor(
        address _lzEndpoint,
        address _owner,
        address _dexRouter,
        address _stablecoinOFT
    ) OApp(_lzEndpoint, _owner) OAppOptionsType3() Ownable(_owner) {
        dexRouter = IPayfundsRouter02(_dexRouter);
        stablecoinOFT = IOFT(_stablecoinOFT);
        stablecoin = _stablecoinOFT;
    }

    /**
     * @notice Quotes the fee for a cross-chain swap - PROPER QUOTE FUNCTION
     */
   function quoteSwap(
    uint32 _dstEid,
    bytes32 _to,
    bytes32 _destinationToken,
    uint256 _amountOutMin,
    uint256 _stableAmount,
    bytes calldata _options,
    bool _payInLzToken
) public view returns (MessagingFee memory fee) {
    // Quote bridge fee
    uint256 minAmountAfterFee = _stableAmount * 950 / 1000;
    SendParam memory sendParam = SendParam({
        dstEid: _dstEid,
        to: getDestinationRouter(_dstEid),
        amountLD: _stableAmount,
        minAmountLD: minAmountAfterFee,
        extraOptions: _options,
        composeMsg: "",
        oftCmd: ""
    });
    
    MessagingFee memory bridgeFee = stablecoinOFT.quoteSend(sendParam, _payInLzToken);
    
    // Quote message fee
    bytes memory message = abi.encode(_to, _destinationToken, _amountOutMin, _stableAmount, msg.sender);
    bytes memory combinedOptions = combineOptions(_dstEid, SWAP, _options);
    MessagingFee memory messageFee = _quote(_dstEid, message, combinedOptions, _payInLzToken);
    
    // Return combined fee
    fee = MessagingFee({
        nativeFee: bridgeFee.nativeFee + messageFee.nativeFee,
        lzTokenFee: bridgeFee.lzTokenFee + messageFee.lzTokenFee
    });
}

    /**
     * @notice Handles incoming cross-chain messages (swap instructions)
     */
    function _lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _message,
        address,
        bytes calldata
    ) internal override {
        // Decode the swap instructions
        (
            bytes32 recipient,
            bytes32 destinationToken,
            uint256 amountOutMin,
            uint256 stableAmount,
            address refundRecipient
        ) = abi.decode(_message, (bytes32, bytes32, uint256, uint256, address));

        // Create unique swap ID
        bytes32 swapId = keccak256(abi.encodePacked(_origin.srcEid, _guid, recipient));

        // Store pending swap
        pendingSwaps[swapId] = PendingSwap({
            recipient: recipient,
            destinationToken: destinationToken,
            amountOutMin: amountOutMin,
            stableAmount: stableAmount,
            refundRecipient: refundRecipient,
            timestamp: block.timestamp,
            executed: false
        });

        // Execute the swap immediately
        _executeSwap(swapId, _origin.srcEid);
    }

    /**
     * @notice Execute a pending swap
     */
    function _executeSwap(bytes32 swapId, uint32 sourceEid) internal {
        PendingSwap storage swap = pendingSwaps[swapId];
        require(!swap.executed, "Swap already executed");
        require(swap.stableAmount > 0, "Invalid swap");

        swap.executed = true;

        uint256 stablecoinBalance = IERC20(stablecoin).balanceOf(address(this));
        
        if (stablecoinBalance < swap.stableAmount) {
            swap.executed = false; // Allow retry
            return;
        }

        try this._performSwap(swap.stableAmount, swap.amountOutMin, swap.destinationToken, swap.recipient) returns (uint256 amountOut) {
            emit CrossChainSwapCompleted(
                sourceEid,
                swap.recipient,
                swap.destinationToken,
                swap.stableAmount,
                amountOut
            );
        } catch {
            // Refund stablecoins to recipient if swap fails
            IERC20(stablecoin).transfer(bytes32ToAddress(swap.recipient), swap.stableAmount);
        }
    }

    /**
     * @notice Perform the actual DEX swap (external for try/catch)
     */
    function _performSwap(
        uint256 stableAmount,
        uint256 amountOutMin,
        bytes32 destinationToken,
        bytes32 recipient
    ) external returns (uint256 amountOut) {
        require(msg.sender == address(this), "Only self");

        IERC20(stablecoin).approve(address(dexRouter), stableAmount);

        address[] memory path = new address[](2);
        path[0] = stablecoin;
        path[1] = bytes32ToAddress(destinationToken);

        uint[] memory amounts = dexRouter.swapExactTokensForTokens(
            stableAmount,
            amountOutMin,
            path,
            bytes32ToAddress(recipient),
            block.timestamp + 1200
        );

        return amounts[amounts.length - 1];
    }

    /**
     * @notice PROPER cross-chain swap using standard LayerZero patterns
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

    // 2. Swap source token for stablecoin
    IERC20(_sourceToken).approve(address(dexRouter), _amountIn);

    address[] memory path = new address[](2);
    path[0] = _sourceToken;
    path[1] = stablecoin;

    uint[] memory amounts = dexRouter.swapExactTokensForTokens(
        _amountIn,
        0,
        path,
        address(this),
        block.timestamp + 1200
    );

    uint256 stableAmount = amounts[amounts.length - 1];
    bytes32 destinationRouter = getDestinationRouter(_destinationEid);

    // 3. Quote fees SEPARATELY for proper handling
    IERC20(stablecoin).approve(address(stablecoinOFT), stableAmount);
    
    uint256 minAmountAfterFee = stableAmount * 950 / 1000;
    SendParam memory sendParam = SendParam({
        dstEid: _destinationEid,
        to: destinationRouter,
        amountLD: stableAmount,
        minAmountLD: minAmountAfterFee,
        extraOptions: _options,
        composeMsg: "",
        oftCmd: ""
    });
    
    // Quote bridge fee
    MessagingFee memory bridgeFee = stablecoinOFT.quoteSend(sendParam, false);
    
    // Quote message fee
    bytes memory payload = abi.encode(
        _recipient,
        _destinationToken,
        _amountOutMin,
        stableAmount,
        msg.sender
    );
    
    bytes memory combinedOptions = combineOptions(_destinationEid, SWAP, _options);
    MessagingFee memory messageFee = _quote(_destinationEid, payload, combinedOptions, false);
    
    // Calculate total required fee
    uint256 totalRequiredFee = bridgeFee.nativeFee + messageFee.nativeFee;
    require(msg.value >= totalRequiredFee, "Insufficient fee provided");

    // 4. Execute OFT bridge
    stablecoinOFT.send{value: bridgeFee.nativeFee}(
        sendParam,
        bridgeFee,
        payable(address(this))
    );

    // 5. Send swap instructions
    _lzSend(
        _destinationEid,
        payload,
        combinedOptions,
        messageFee,
        payable(msg.sender)
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

    // Refund excess ETH
    if (msg.value > totalRequiredFee) {
        payable(msg.sender).transfer(msg.value - totalRequiredFee);
    }
}

    /**
     * @notice Estimates the output amount for a cross-chain swap
     */
    function estimateSwapOutput(
        address _sourceToken,
        uint256 _amountIn
    ) external view returns (uint256 sourceStableAmount) {
        address[] memory sourcePath = new address[](2);
        sourcePath[0] = _sourceToken;
        sourcePath[1] = stablecoin;

        uint[] memory sourceAmounts = dexRouter.getAmountsOut(_amountIn, sourcePath);
        sourceStableAmount = sourceAmounts[sourceAmounts.length - 1];
    }

    function getDestinationRouter(uint32 _destinationEid) internal view returns (bytes32) {
        bytes32 peer = peers[_destinationEid];
        require(peer != bytes32(0), "No peer set for destination EID");
        return peer;
    }

    // Helper functions
    function bytes32ToAddress(bytes32 _buf) internal pure returns (address) {
        return address(uint160(uint256(_buf)));
    }

    function addressToBytes32(address _addr) public pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }

    // Emergency functions
    function withdrawToken(IERC20 _token, address _to, uint256 _amount) external onlyOwner {
        _token.transfer(_to, _amount);
    }

    function withdrawNative(address payable _to, uint256 _amount) external onlyOwner {
        _to.transfer(_amount);
    }

    receive() external payable {}
}