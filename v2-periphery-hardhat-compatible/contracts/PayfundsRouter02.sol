pragma solidity =0.6.6;


import './interfaces/IPayfundsRouter02.sol';
import './libraries/PayfundsLibrary.sol';
import './libraries/SafeMath.sol';
import './libraries/TransferHelper.sol';
import './interfaces/IERC20.sol';
import './interfaces/IWMATIC.sol';
import "./interfaces/IPayfundsFactory.sol";
import "./interfaces/IPayfundsPair.sol";

contract PayfundsRouter02 is IPayfundsRouter02 {
    using SafeMath for uint;

    address public immutable override factory;
    address public immutable override WMATIC;

    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, 'PayfundsRouter: EXPIRED');
        _;
    }

    constructor(address _factory, address _WMATIC) public {
        factory = _factory;
        WMATIC = _WMATIC;
    }

    receive() external payable {
        assert(msg.sender == WMATIC); // only accept MATIC via fallback from the WMATIC contract
    }

    // **** ADD LIQUIDITY ****
    function _addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin
    ) internal virtual returns (uint amountA, uint amountB) {
        // create the pair if it doesn't exist yet
        if (IPayfundsFactory(factory).getPair(tokenA, tokenB) == address(0)) {
            IPayfundsFactory(factory).createPair(tokenA, tokenB);
        }
        (uint reserveA, uint reserveB) = PayfundsLibrary.getReserves(factory, tokenA, tokenB);
        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint amountBOptimal = PayfundsLibrary.quote(amountADesired, reserveA, reserveB);
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, 'PayfundsRouter: INSUFFICIENT_B_AMOUNT');
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint amountAOptimal = PayfundsLibrary.quote(amountBDesired, reserveB, reserveA);
                assert(amountAOptimal <= amountADesired);
                require(amountAOptimal >= amountAMin, 'PayfundsRouter: INSUFFICIENT_A_AMOUNT');
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) returns (uint amountA, uint amountB, uint liquidity) {
        (amountA, amountB) = _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);
        address pair = PayfundsLibrary.pairFor(factory, tokenA, tokenB);
        TransferHelper.safeTransferFrom(tokenA, msg.sender, pair, amountA);
        TransferHelper.safeTransferFrom(tokenB, msg.sender, pair, amountB);
        liquidity = IPayfundsPair(pair).mint(to);
    }
    function addLiquidityMATIC(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountMATICMin,
        address to,
        uint deadline
    ) external virtual override payable ensure(deadline) returns (uint amountToken, uint amountMATIC, uint liquidity) {
        (amountToken, amountMATIC) = _addLiquidity(
            token,
            WMATIC,
            amountTokenDesired,
            msg.value,
            amountTokenMin,
            amountMATICMin
        );
        address pair = PayfundsLibrary.pairFor(factory, token, WMATIC);
        TransferHelper.safeTransferFrom(token, msg.sender, pair, amountToken);
        IWMATIC(WMATIC).deposit{value: amountMATIC}();
        assert(IWMATIC(WMATIC).transfer(pair, amountMATIC));
        liquidity = IPayfundsPair(pair).mint(to);
        // refund dust eth, if any
        if (msg.value > amountMATIC) TransferHelper.safeTransferMATIC(msg.sender, msg.value - amountMATIC);
    }

    // **** REMOVE LIQUIDITY ****
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) public virtual override ensure(deadline) returns (uint amountA, uint amountB) {
        address pair = PayfundsLibrary.pairFor(factory, tokenA, tokenB);
        IPayfundsPair(pair).transferFrom(msg.sender, pair, liquidity); // send liquidity to pair
        (uint amount0, uint amount1) = IPayfundsPair(pair).burn(to);
        (address token0,) = PayfundsLibrary.sortTokens(tokenA, tokenB);
        (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);
        require(amountA >= amountAMin, 'PayfundsRouter: INSUFFICIENT_A_AMOUNT');
        require(amountB >= amountBMin, 'PayfundsRouter: INSUFFICIENT_B_AMOUNT');
    }
    function removeLiquidityMATIC(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountMATICMin,
        address to,
        uint deadline
    ) public virtual override ensure(deadline) returns (uint amountToken, uint amountMATIC) {
        (amountToken, amountMATIC) = removeLiquidity(
            token,
            WMATIC,
            liquidity,
            amountTokenMin,
            amountMATICMin,
            address(this),
            deadline
        );
        TransferHelper.safeTransfer(token, to, amountToken);
        IWMATIC(WMATIC).withdraw(amountMATIC);
        TransferHelper.safeTransferMATIC(to, amountMATIC);
    }
    function removeLiquidityWithPermit(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external virtual override returns (uint amountA, uint amountB) {
        address pair = PayfundsLibrary.pairFor(factory, tokenA, tokenB);
        uint value = approveMax ? uint(-1) : liquidity;
        IPayfundsPair(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
        (amountA, amountB) = removeLiquidity(tokenA, tokenB, liquidity, amountAMin, amountBMin, to, deadline);
    }
    function removeLiquidityMATICWithPermit(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountMATICMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external virtual override returns (uint amountToken, uint amountMATIC) {
        address pair = PayfundsLibrary.pairFor(factory, token, WMATIC);
        uint value = approveMax ? uint(-1) : liquidity;
        IPayfundsPair(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
        (amountToken, amountMATIC) = removeLiquidityMATIC(token, liquidity, amountTokenMin, amountMATICMin, to, deadline);
    }

    // **** SWAP ****
    // requires the initial amount to have already been sent to the first pair
    function _swap(uint[] memory amounts, address[] memory path, address _to) internal virtual {
        for (uint i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = PayfundsLibrary.sortTokens(input, output);
            uint amountOut = amounts[i + 1];
            (uint amount0Out, uint amount1Out) = input == token0 ? (uint(0), amountOut) : (amountOut, uint(0));
            address to = i < path.length - 2 ? PayfundsLibrary.pairFor(factory, output, path[i + 2]) : _to;
            IPayfundsPair(PayfundsLibrary.pairFor(factory, input, output)).swap(
                amount0Out, amount1Out, to, new bytes(0)
            );
        }
    }
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) returns (uint[] memory amounts) {
        amounts = PayfundsLibrary.getAmountsOut(factory, amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, 'PayfundsRouter: INSUFFICIENT_OUTPUT_AMOUNT');
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, PayfundsLibrary.pairFor(factory, path[0], path[1]), amounts[0]
        );
        _swap(amounts, path, to);
    }
    

    // **** LIBRARY FUNCTIONS ****
    function quote(uint amountA, uint reserveA, uint reserveB) public pure virtual override returns (uint amountB) {
        return PayfundsLibrary.quote(amountA, reserveA, reserveB);
    }

    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut)
        public
        pure
        virtual
        override
        returns (uint amountOut)
    {
        return PayfundsLibrary.getAmountOut(amountIn, reserveIn, reserveOut);
    }

    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut)
        public
        pure
        virtual
        override
        returns (uint amountIn)
    {
        return PayfundsLibrary.getAmountIn(amountOut, reserveIn, reserveOut);
    }

    function getAmountsOut(uint amountIn, address[] memory path)
        public
        view
        virtual
        override
        returns (uint[] memory amounts)
    {
        return PayfundsLibrary.getAmountsOut(factory, amountIn, path);
    }

    function getAmountsIn(uint amountOut, address[] memory path)
        public
        view
        virtual
        override
        returns (uint[] memory amounts)
    {
        return PayfundsLibrary.getAmountsIn(factory, amountOut, path);
    }
}
