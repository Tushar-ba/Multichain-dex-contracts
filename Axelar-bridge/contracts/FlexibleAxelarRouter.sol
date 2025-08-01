// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {AxelarExecutableWithToken} from "@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutableWithToken.sol";
import {IAxelarGatewayWithToken} from "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGatewayWithToken.sol";
import {IAxelarGasService} from "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IPayfundsRouter02 {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function getAmountsOut(uint amountIn, address[] calldata path)
        external view returns (uint[] memory amounts);
        
    function getAmountsIn(uint amountOut, address[] calldata path)
        external view returns (uint[] memory amounts);
}

/**
 * @title FlexibleAxelarRouter
 * @notice Cross-chain DEX router using Axelar Network
 * @dev Flow: Token A (Chain A) -> Stable Coin -> Bridge -> Stable Coin (Chain B) -> Token B
 */
contract FlexibleAxelarRouter is AxelarExecutableWithToken, Ownable, ReentrancyGuard {
    IAxelarGasService public immutable gasService;
    IPayfundsRouter02 public immutable dexRouter;
    
    // The token we use for bridging (our custom stable coin)
    address public bridgeToken;
    string public bridgeTokenSymbol;
    
    // Remote router addresses for each chain
    mapping(string => string) public remoteRouters;
    
    // Slippage protection (in basis points, e.g., 300 = 3%)
    uint256 public defaultSlippage = 300;
    uint256 public constant MAX_SLIPPAGE = 1000; // 10%
    
    struct SwapData {
        address recipient;
        address destinationToken;
        uint256 minAmountOut;
        uint256 deadline;
    }
    
    struct CrossChainSwapParams {
        string destinationChain;
        address sourceToken;
        address destinationToken;
        uint256 amount;
        uint256 minDestAmount;
        address recipient;
        uint256 deadline;
    }
    
    event CrossChainSwapInitiated(
        string indexed destinationChain,
        address indexed sender,
        address indexed recipient,
        address sourceToken,
        uint256 sourceAmount,
        uint256 bridgeAmount
    );
    
    event CrossChainSwapCompleted(
        string indexed sourceChain,
        address indexed recipient,
        address destinationToken,
        uint256 amountOut
    );
    
    event BridgeTokenUpdated(address indexed oldToken, address indexed newToken, string symbol);
    event SlippageUpdated(uint256 oldSlippage, uint256 newSlippage);
    event EmergencyWithdraw(address indexed token, uint256 amount);
    
    error InvalidAmount();
    error InvalidSlippage();
    error SwapFailed();
    error InsufficientGasFee();
    error RemoteRouterNotSet();
    error DeadlineExpired();
    
    constructor(
        address _gateway,
        address _gasService,
        address _dexRouter,
        address _bridgeToken,
        string memory _bridgeTokenSymbol
    ) AxelarExecutableWithToken(_gateway) Ownable(msg.sender) {
        if (_gateway == address(0) || _gasService == address(0) || 
            _dexRouter == address(0) || _bridgeToken == address(0)) {
            revert InvalidAddress();
        }
        
        gasService = IAxelarGasService(_gasService);
        dexRouter = IPayfundsRouter02(_dexRouter);
        bridgeToken = _bridgeToken;
        bridgeTokenSymbol = _bridgeTokenSymbol;
    }
    
    /**
     * @notice Update bridge token configuration
     * @param _token New bridge token address
     * @param _symbol New bridge token symbol
     */
    function setBridgeToken(address _token, string memory _symbol) external onlyOwner {
        if (_token == address(0)) revert InvalidAddress();
        
        address oldToken = bridgeToken;
        bridgeToken = _token;
        bridgeTokenSymbol = _symbol;
        
        emit BridgeTokenUpdated(oldToken, _token, _symbol);
    }
    
    /**
     * @notice Set remote router address for a destination chain
     * @param chain Destination chain name
     * @param router Remote router address (as string)
     */
    function setRemoteRouter(string calldata chain, string calldata router) external onlyOwner {
        remoteRouters[chain] = router;
    }
    
    /**
     * @notice Update default slippage tolerance
     * @param _slippage New slippage in basis points
     */
    function setDefaultSlippage(uint256 _slippage) external onlyOwner {
        if (_slippage > MAX_SLIPPAGE) revert InvalidSlippage();
        
        uint256 oldSlippage = defaultSlippage;
        defaultSlippage = _slippage;
        
        emit SlippageUpdated(oldSlippage, _slippage);
    }
    
    /**
     * @notice Execute cross-chain swap
     * @param params Cross-chain swap parameters
     */
    function crossChainSwap(CrossChainSwapParams calldata params) 
        external 
        payable 
        nonReentrant 
    {
        // Validation
        if (params.amount == 0 || params.minDestAmount == 0) revert InvalidAmount();
        if (params.sourceToken == address(0) || params.destinationToken == address(0)) revert InvalidAddress();
        if (params.recipient == address(0)) revert InvalidAddress();
        if (block.timestamp > params.deadline) revert DeadlineExpired();
        if (bytes(remoteRouters[params.destinationChain]).length == 0) revert RemoteRouterNotSet();
        
        // Step 1: Transfer source tokens from user
        IERC20(params.sourceToken).transferFrom(msg.sender, address(this), params.amount);
        
        // Step 2: Swap to bridge token if needed
        uint256 bridgeAmount = params.amount;
        if (params.sourceToken != bridgeToken) {
            bridgeAmount = _swapToBridgeToken(params.sourceToken, params.amount);
        }
        
        // Step 3: Prepare cross-chain message
        bytes memory payload = abi.encode(SwapData({
            recipient: params.recipient,
            destinationToken: params.destinationToken,
            minAmountOut: params.minDestAmount,
            deadline: params.deadline
        }));
        
        // Step 4: Approve gateway to spend bridge tokens
        IERC20(bridgeToken).approve(gatewayAddress, bridgeAmount);
        
        // Step 5: Pay for cross-chain gas
        gasService.payNativeGasForContractCallWithToken{value: msg.value}(
            address(this),
            params.destinationChain,
            remoteRouters[params.destinationChain],
            payload,
            bridgeTokenSymbol,
            bridgeAmount,
            msg.sender
        );
        
        // Step 6: Execute cross-chain call
        gatewayWithToken().callContractWithToken(
            params.destinationChain,
            remoteRouters[params.destinationChain],
            payload,
            bridgeTokenSymbol,
            bridgeAmount
        );
        
        emit CrossChainSwapInitiated(
            params.destinationChain,
            msg.sender,
            params.recipient,
            params.sourceToken,
            params.amount,
            bridgeAmount
        );
    }
    
    /**
     * @notice Internal function to swap source token to bridge token
     * @param sourceToken Token to swap from
     * @param amount Amount to swap
     * @return bridgeAmount Amount of bridge tokens received
     */
    function _swapToBridgeToken(address sourceToken, uint256 amount) 
        internal 
        returns (uint256 bridgeAmount) 
    {
        // Approve DEX router
        IERC20(sourceToken).approve(address(dexRouter), amount);
        
        // Create swap path
        address[] memory path = new address[](2);
        path[0] = sourceToken;
        path[1] = bridgeToken;
        
        // Get expected output with slippage
        uint256[] memory expectedAmounts = dexRouter.getAmountsOut(amount, path);
        uint256 minAmountOut = expectedAmounts[1] * (10000 - defaultSlippage) / 10000;
        
        // Execute swap
        uint256[] memory amounts = dexRouter.swapExactTokensForTokens(
            amount,
            minAmountOut,
            path,
            address(this),
            block.timestamp + 300
        );
        
        bridgeAmount = amounts[1];
        
        if (bridgeAmount == 0) revert SwapFailed();
    }
    
    /**
     * @notice Handle incoming cross-chain messages with tokens
     * @param commandId The command ID from Axelar
     * @param sourceChain Source chain name
     * @param sourceAddress Source contract address
     * @param payload Encoded swap data
     * @param tokenSymbol Symbol of received token
     * @param amount Amount of tokens received
     */
    /**
     * @notice Required implementation from AxelarExecutable for regular messages
     * @dev This contract only handles token messages, so this reverts
     */
    function _execute(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal override {
        revert("Use executeWithToken instead");
    }

    function _executeWithToken(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload,
        string calldata tokenSymbol,
        uint256 amount
    ) internal override {
        SwapData memory swapData = abi.decode(payload, (SwapData));
        
        // Get the received token address
        address tokenReceived = gatewayWithToken().tokenAddresses(tokenSymbol);
        
        // Check deadline
        if (block.timestamp > swapData.deadline) {
            // Send bridge token directly if deadline expired
            IERC20(tokenReceived).transfer(swapData.recipient, amount);
            return;
        }
        
        if (swapData.destinationToken == tokenReceived) {
            // No swap needed - direct transfer
            IERC20(tokenReceived).transfer(swapData.recipient, amount);
            emit CrossChainSwapCompleted(sourceChain, swapData.recipient, swapData.destinationToken, amount);
        } else {
            // Swap bridge token to destination token
            uint256 amountOut = _swapFromBridgeToken(
                tokenReceived,
                swapData.destinationToken,
                amount,
                swapData.minAmountOut,
                swapData.recipient
            );
            
            emit CrossChainSwapCompleted(sourceChain, swapData.recipient, swapData.destinationToken, amountOut);
        }
    }
    
    /**
     * @notice Internal function to swap from bridge token to destination token
     * @param bridgeTokenReceived Bridge token received from Axelar
     * @param destinationToken Target token to swap to
     * @param amount Amount of bridge tokens to swap
     * @param minAmountOut Minimum amount of destination tokens expected
     * @param recipient Address to receive destination tokens
     * @return amountOut Actual amount of destination tokens received
     */
    function _swapFromBridgeToken(
        address bridgeTokenReceived,
        address destinationToken,
        uint256 amount,
        uint256 minAmountOut,
        address recipient
    ) internal returns (uint256 amountOut) {
        // Approve DEX router
        IERC20(bridgeTokenReceived).approve(address(dexRouter), amount);
        
        // Create swap path
        address[] memory path = new address[](2);
        path[0] = bridgeTokenReceived;
        path[1] = destinationToken;
        
        try dexRouter.swapExactTokensForTokens(
            amount,
            minAmountOut,
            path,
            recipient,
            block.timestamp + 300
        ) returns (uint256[] memory amounts) {
            amountOut = amounts[1];
        } catch {
            // If swap fails, send bridge token instead
            IERC20(bridgeTokenReceived).transfer(recipient, amount);
            amountOut = amount;
        }
    }
    
    /**
     * @notice Get quote for cross-chain swap
     * @param sourceToken Source token address
     * @param destinationToken Destination token address  
     * @param amount Amount of source tokens
     * @return bridgeAmount Amount of bridge tokens after first swap
     * @return estimatedOutput Estimated destination tokens (without cross-chain fees)
     */
    function getSwapQuote(
        address sourceToken,
        address destinationToken,
        uint256 amount
    ) external view returns (uint256 bridgeAmount, uint256 estimatedOutput) {
        // Quote for source -> bridge token
        if (sourceToken == bridgeToken) {
            bridgeAmount = amount;
        } else {
            address[] memory pathToBridge = new address[](2);
            pathToBridge[0] = sourceToken;
            pathToBridge[1] = bridgeToken;
            
            uint256[] memory amountsToBridge = dexRouter.getAmountsOut(amount, pathToBridge);
            bridgeAmount = amountsToBridge[1];
        }
        
        // Quote for bridge token -> destination token
        if (destinationToken == bridgeToken) {
            estimatedOutput = bridgeAmount;
        } else {
            address[] memory pathFromBridge = new address[](2);
            pathFromBridge[0] = bridgeToken;
            pathFromBridge[1] = destinationToken;
            
            uint256[] memory amountsFromBridge = dexRouter.getAmountsOut(bridgeAmount, pathFromBridge);
            estimatedOutput = amountsFromBridge[1];
        }
    }
    
    /**
     * @notice Estimate gas fee for cross-chain transaction
     * @param destinationChain Target chain name
     * @return Estimated gas fee in native tokens
     */
    function estimateGasFee(string calldata destinationChain) 
        external 
        view 
        returns (uint256) 
    {
        // This is a simplified estimate - in production, query Axelar's actual gas prices
        return 0.001 ether; // Base estimate
    }
    
    /**
     * @notice Emergency function to withdraw stuck tokens
     * @param token Token address to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).transfer(owner(), amount);
        }
        
        emit EmergencyWithdraw(token, amount);
    }
    
    /**
     * @notice Check if a chain is supported
     * @param chain Chain name to check
     * @return Whether the chain has a configured remote router
     */
    function isChainSupported(string calldata chain) external view returns (bool) {
        return bytes(remoteRouters[chain]).length > 0;
    }
    
    receive() external payable {
        // Allow receiving native tokens for gas fees
    }
}