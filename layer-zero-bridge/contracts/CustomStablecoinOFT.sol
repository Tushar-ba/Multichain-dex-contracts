// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {OFT} from "@layerzerolabs/oft-evm/contracts/OFT.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CustomStablecoinOFT
 * @notice A simple stablecoin that can be bridged across chains using LayerZero OFT
 * @dev This is a basic implementation for testnet/development purposes
 */
contract CustomStablecoinOFT is OFT {
    /// @notice Total supply cap (optional)
    uint256 public maxSupply;

    /// @notice Minting role
    mapping(address => bool) public minters;

    /// @notice Events
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);

    /// @notice Modifiers
    modifier onlyMinter() {
        require(minters[msg.sender] || msg.sender == owner(), "Not authorized to mint");
        _;
    }

    /**
     * @notice Constructor
     * @param _name The name of the stablecoin
     * @param _symbol The symbol of the stablecoin
     * @param _lzEndpoint The LayerZero endpoint address
     * @param _owner The owner address
     */
    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _owner
    ) OFT(_name, _symbol, _lzEndpoint, _owner) Ownable(_owner) {
        maxSupply = 0; // Unlimited supply
        
        // Add owner as initial minter
        minters[_owner] = true;
        emit MinterAdded(_owner);
    }

    /**
     * @notice Add a minter
     * @param _minter The address to add as minter
     */
    function addMinter(address _minter) external onlyOwner {
        minters[_minter] = true;
        emit MinterAdded(_minter);
    }

    /**
     * @notice Remove a minter
     * @param _minter The address to remove as minter
     */
    function removeMinter(address _minter) external onlyOwner {
        minters[_minter] = false;
        emit MinterRemoved(_minter);
    }

    /**
     * @notice Mint new stablecoins
     * @param _to The recipient address
     * @param _amount The amount to mint
     */
    function mint(address _to, uint256 _amount) external onlyMinter {
        require(_to != address(0), "Cannot mint to zero address");
        
        // Check max supply if set
        if (maxSupply > 0) {
            require(totalSupply() + _amount <= maxSupply, "Would exceed max supply");
        }

        _mint(_to, _amount);
        emit Mint(_to, _amount);
    }

    /**
     * @notice Burn stablecoins
     * @param _amount The amount to burn
     */
    function burn(uint256 _amount) external {
        _burn(msg.sender, _amount);
        emit Burn(msg.sender, _amount);
    }

    /**
     * @notice Burn stablecoins from another address (requires allowance)
     * @param _from The address to burn from
     * @param _amount The amount to burn
     */
    function burnFrom(address _from, uint256 _amount) external {
        uint256 currentAllowance = allowance(_from, msg.sender);
        require(currentAllowance >= _amount, "Burn amount exceeds allowance");
        
        _approve(_from, msg.sender, currentAllowance - _amount);
        _burn(_from, _amount);
        emit Burn(_from, _amount);
    }

    /**
     * @notice Update max supply (only owner)
     * @param _newMaxSupply New maximum supply (0 for unlimited)
     */
    function updateMaxSupply(uint256 _newMaxSupply) external onlyOwner {
        require(_newMaxSupply == 0 || _newMaxSupply >= totalSupply(), "New max supply too low");
        maxSupply = _newMaxSupply;
    }
}