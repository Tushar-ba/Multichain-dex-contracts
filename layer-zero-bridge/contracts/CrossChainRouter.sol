// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// LayerZero V2 Imports
import {OApp} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import {Origin} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import {MessagingFee} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import {OAppOptionsType3} from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OAppOptionsType3.sol";

// OpenZeppelin Imports
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// OFT imports for token bridging
import {IOFT, SendParam, MessagingReceipt} from "@layerzerolabs/oft-evm/contracts/interfaces/IOFT.sol";

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
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external   returns (uint amountA, uint amountB, uint liquidity);
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
 * @notice A router that enables complete cross-chain token swaps using LayerZero and PayfundsRouter
 * @dev This contract handles destination gas properly by sending gas along with LayerZero messages
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

    /// @notice Gas amount required for destination swap execution
    uint256 public constant DESTINATION_GAS_LIMIT = 500000; // Adjust based on your needs

    /// @notice Pending swaps waiting for stablecoin arrival
    mapping(bytes32 => PendingSwap) public pendingSwaps;

    struct PendingSwap {
        bytes32 recipient;
        bytes32 destinationToken;
        uint256 amountOutMin;
        uint256 stableAmount;
        address refundRecipient; // Who gets refund if swap fails
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

    event SwapInstructionsReceived(
        bytes32 indexed swapId,
        bytes32 recipient,
        bytes32 destinationToken,
        uint256 stableAmount,
        uint256 amountOutMin
    );

    event SwapFailed(
        bytes32 indexed swapId,
        bytes32 recipient,
        uint256 stableAmount,
        string reason
    );

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
    ) OApp(_lzEndpoint, _owner) OAppOptionsType3() Ownable(_owner) {
        dexRouter = IPayfundsRouter02(_dexRouter);
        stablecoinOFT = IOFT(_stablecoinOFT);
        stablecoin = _stablecoinOFT;
    }

    /**
     * @notice Handles incoming cross-chain messages (swap instructions)
     * @dev Called by the LayerZero endpoint when a message is received
     * @dev This function is paid for by the gas sent along with the message
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

        emit SwapInstructionsReceived(swapId, recipient, destinationToken, stableAmount, amountOutMin);

        // Execute the swap immediately (we have gas from the message)
        _executeSwap(swapId, _origin.srcEid);
    }

    /**
     * @notice Execute a pending swap
     * @param swapId The unique swap identifier
     * @param sourceEid The source endpoint ID
     */
    function _executeSwap(bytes32 swapId, uint32 sourceEid) internal {
        PendingSwap storage swap = pendingSwaps[swapId];
        require(!swap.executed, "Swap already executed");
        require(swap.stableAmount > 0, "Invalid swap");

        // Mark as executed first to prevent reentrancy
        swap.executed = true;

        uint256 stablecoinBalance = IERC20(stablecoin).balanceOf(address(this));
        
        if (stablecoinBalance < swap.stableAmount) {
            // Not enough stablecoins, refund will happen when stablecoins arrive
            emit SwapFailed(swapId, swap.recipient, swap.stableAmount, "Insufficient stablecoins - will retry");
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
        } catch Error(string memory reason) {
            emit SwapFailed(swapId, swap.recipient, swap.stableAmount, reason);
            
            // Refund stablecoins to recipient if swap fails
            IERC20(stablecoin).transfer(bytes32ToAddress(swap.recipient), swap.stableAmount);
        } catch {
            emit SwapFailed(swapId, swap.recipient, swap.stableAmount, "Unknown error");
            
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

        // Approve the DEX router to spend stablecoins
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

        return amounts[amounts.length - 1];
    }

    /**
     * @notice Manually execute a pending swap (in case automatic execution failed)
     * @param swapId The unique swap identifier
     */
    function executeSwap(bytes32 swapId) external {
        _executeSwap(swapId, 0);
    }

    /**
     * @notice Initiates a complete cross-chain swap
     * @param _destinationEid The LayerZero endpoint ID for the destination chain
     * @param _recipient The recipient address on the destination chain (as bytes32)
     * @param _sourceToken The token to swap on the source chain
     * @param _destinationToken The token to receive on the destination chain (as bytes32)
     * @param _amountIn The amount of source tokens to swap
     * @param _amountOutMin The minimum amount of destination tokens to receive
     * @param _options Additional options for the LayerZero message
     */
   /**
 * @notice Initiates a complete cross-chain swap - CORRECTED VERSION
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
        block.timestamp + 1200
    );

    uint256 stableAmount = amounts[amounts.length - 1];
    bytes32 destinationRouter = getDestinationRouter(_destinationEid);

    // 3. CRITICAL: Calculate both fees BEFORE executing
    
    // 3a. Quote OFT bridge fee
    uint256 minAmountAfterFee = stableAmount * 950 / 1000; // 5% slippage
    SendParam memory sendParam = SendParam({
        dstEid: _destinationEid,
        to: destinationRouter,
        amountLD: stableAmount,
        minAmountLD: minAmountAfterFee,
        extraOptions: _options,
        composeMsg: "",
        oftCmd: ""
    });
    
    MessagingFee memory bridgeFee = stablecoinOFT.quoteSend(sendParam, false);

    // 3b. Quote message fee
    bytes memory payload = abi.encode(
        _recipient,
        _destinationToken,
        _amountOutMin,
        stableAmount,
        msg.sender
    );
    bytes memory combinedOptions = combineOptions(_destinationEid, SWAP, _options);
    MessagingFee memory msgFee = _quote(_destinationEid, payload, combinedOptions, false);

    // 3c. Verify user sent enough ETH for BOTH operations
    uint256 totalRequiredFee = bridgeFee.nativeFee + msgFee.nativeFee;
    require(msg.value >= totalRequiredFee, 
    string(abi.encodePacked(
        "NotEnoughNative: Required ", 
        toString(totalRequiredFee), 
        " wei, got ", 
        toString(msg.value), 
        " wei. Bridge: ",
        toString(bridgeFee.nativeFee),
        " Message: ",
        toString(msgFee.nativeFee)
    ))
);

    // 4. Execute OFT bridge with its specific fee
    IERC20(stablecoin).approve(address(stablecoinOFT), stableAmount);
    
    stablecoinOFT.send{value: bridgeFee.nativeFee}(
        sendParam,
        bridgeFee,
        payable(address(this))
    );

    // 5. Send swap instructions with its specific fee
    _lzSend(
        _destinationEid,
        payload,
        combinedOptions,
        MessagingFee(msgFee.nativeFee, 0), // Use ONLY the message fee
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

    // 6. Refund any excess ETH
    uint256 excessFee = msg.value - totalRequiredFee;
    if (excessFee > 0) {
        payable(msg.sender).transfer(excessFee);
    }
}

// Helper function to convert uint to string for error messages
function toString(uint256 value) internal pure returns (string memory) {
    if (value == 0) {
        return "0";
    }
    uint256 temp = value;
    uint256 digits;
    while (temp != 0) {
        digits++;
        temp /= 10;
    }
    bytes memory buffer = new bytes(digits);
    while (value != 0) {
        digits -= 1;
        buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
        value /= 10;
    }
    return string(buffer);
}

    /**
     * @notice Bridge stablecoins to destination chain using OFT
     * @param _destinationEid The destination chain endpoint ID
     * @param _amount The amount of stablecoins to bridge
     * @param _options LayerZero options for the bridge transaction
     */
    function _bridgeStablecoins(
        uint32 _destinationEid,
        uint256 _amount,
        bytes calldata _options
    ) internal {
        // Approve the OFT contract to spend stablecoins
        IERC20(stablecoin).approve(address(stablecoinOFT), _amount);

        // FIXED: Allow 5% slippage for OFT fees
        uint256 minAmountAfterFee = _amount * 950 / 1000; // 5% slippage tolerance
        bytes32 destinationRouter = getDestinationRouter(_destinationEid);
        SendParam memory sendParam = SendParam({
            dstEid: _destinationEid,
            to: destinationRouter,
            amountLD: _amount,
            minAmountLD: minAmountAfterFee, // Allow slippage for OFT fees
            extraOptions: _options,
            composeMsg: "",
            oftCmd: ""
        });

        // Get OFT quote and bridge
        MessagingFee memory bridgeFee = stablecoinOFT.quoteSend(sendParam, false);
        
        stablecoinOFT.send{value: bridgeFee.nativeFee}(
            sendParam,
            bridgeFee,
            payable(address(this))
        );
    }

    /**
     * @notice Quote total fees for cross-chain swap (OFT bridge + messaging with gas)
     * @param _destinationEid The destination endpoint ID
     * @param _recipient The recipient address
     * @param _destinationToken The destination token
     * @param _amountOutMin Minimum output amount
     * @param _stableAmount Amount of stablecoins to bridge
     * @param _options LayerZero options
     * @return totalFee The total fee required
     */
   /**
 * @notice Quote total fees for cross-chain swap (OFT bridge + messaging with gas)
 * @param _destinationEid The destination endpoint ID
 * @param _recipient The recipient address
 * @param _destinationToken The destination token
 * @param _amountOutMin Minimum output amount
 * @param _stableAmount Amount of stablecoins to bridge
 * @param _options LayerZero options
 * @return totalFee The total fee required for BOTH operations
 */
function quoteSwapFee(
    uint32 _destinationEid,
    bytes32 _recipient,
    bytes32 _destinationToken,
    uint256 _amountOutMin,
    uint256 _stableAmount,
    bytes calldata _options
) external view returns (MessagingFee memory totalFee) {
    // 1. Quote OFT bridge fee (first operation)
    bytes32 destinationRouter = getDestinationRouter(_destinationEid);
    uint256 minAmountAfterFee = _stableAmount * 950 / 1000; // 5% slippage
    SendParam memory sendParam = SendParam({
        dstEid: _destinationEid,
        to: destinationRouter,
        amountLD: _stableAmount,
        minAmountLD: minAmountAfterFee,
        extraOptions: _options,
        composeMsg: "",
        oftCmd: ""
    });
    
    MessagingFee memory bridgeFee;
    try stablecoinOFT.quoteSend(sendParam, false) returns (MessagingFee memory fee) {
        bridgeFee = fee;
    } catch Error(string memory reason) {
        revert(string(abi.encodePacked("OFT quote failed: ", reason)));
    } catch (bytes memory lowLevelData) {
        // Try to decode custom errors
        if (lowLevelData.length >= 4) {
            bytes4 errorSelector = bytes4(lowLevelData);
            revert(string(abi.encodePacked("OFT quote failed with selector: ", toHexString(errorSelector))));
        }
        revert("OFT quote failed with unknown error");
    }

    // 2. Quote message fee (second operation)
    bytes memory payload = abi.encode(_recipient, _destinationToken, _amountOutMin, _stableAmount, address(0));
    bytes memory combinedOptions = combineOptions(_destinationEid, SWAP, _options);
    
    MessagingFee memory swapFee;
    try this.quote(_destinationEid, payload, combinedOptions, false) returns (MessagingFee memory fee) {
        swapFee = fee;
    } catch Error(string memory reason) {
        revert(string(abi.encodePacked("Message quote failed: ", reason)));
    } catch {
        revert("Message quote failed");
    }

    // 3. Return combined fee (both operations)
    totalFee.nativeFee = bridgeFee.nativeFee + swapFee.nativeFee;
    totalFee.lzTokenFee = bridgeFee.lzTokenFee + swapFee.lzTokenFee;
    
    // Add 5% buffer for gas fluctuations
    totalFee.nativeFee = totalFee.nativeFee * 105 / 100;
}

// Helper function for error debugging
function toHexString(bytes4 value) internal pure returns (string memory) {
    bytes memory alphabet = "0123456789abcdef";
    bytes memory str = new bytes(10);
    str[0] = '0';
    str[1] = 'x';
    for (uint i = 0; i < 4; i++) {
        str[2+i*2] = alphabet[uint(uint8(value[i] >> 4))];
        str[3+i*2] = alphabet[uint(uint8(value[i] & 0x0f))];
    }
    return string(str);
}

    /**
     * @notice Public wrapper for the internal _quote function for external access
     * @param _dstEid Destination endpoint ID
     * @param _message Message payload
     * @param _options LayerZero options
     * @param _payInLzToken Whether to pay in LZ token
     * @return fee The messaging fee
     */
    function quote(
        uint32 _dstEid,
        bytes memory _message,
        bytes memory _options,
        bool _payInLzToken
    ) external view returns (MessagingFee memory fee) {
        return _quote(_dstEid, _message, _options, _payInLzToken);
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

    /**
     * @notice Estimates the destination token output for a given stablecoin amount
     */
    function estimateDestinationOutput(
        bytes32 _destinationToken,
        uint256 _stableAmount
    ) external view returns (uint256 destTokenAmount) {
        address[] memory destPath = new address[](2);
        destPath[0] = stablecoin;
        destPath[1] = bytes32ToAddress(_destinationToken);

        uint[] memory destAmounts = dexRouter.getAmountsOut(_stableAmount, destPath);
        destTokenAmount = destAmounts[destAmounts.length - 1];
    }

    function getDestinationRouter(uint32 _destinationEid) internal view returns (bytes32) {
        // Get the peer address for this destination EID
        // The peer should be the CrossChainRouter contract on the destination chain
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