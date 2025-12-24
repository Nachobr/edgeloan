// SPDX-License-Identifier: MIT
// MockToken.sol - USDC-like ERC20 token with 6 decimals and mint function
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor() ERC20("Mock USDC", "mUSDC") {
        _mint(msg.sender, 1000000 * 10**6); // Mint 1M tokens to deployer (6 decimals)
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}