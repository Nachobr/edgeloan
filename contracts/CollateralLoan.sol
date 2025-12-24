// SPDX-License-Identifier: MIT
// CollateralLoan.sol - ETH-collateralized loan system with manual oracle
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CollateralLoan is Ownable {
    // Constants
    uint256 public constant LTV = 50; // 50% LTV
    uint256 public constant LIQUIDATION_THRESHOLD = 150; // 1.5 health factor
    uint256 public constant LIQUIDATION_DISCOUNT = 10; // 10% discount for liquidators

    // State variables
    uint256 public ethPrice; // ETH price in USD (6 decimals to match USDC)
    IERC20 public token; // MockToken (USDC)
    address public feeRecipient;

    // User data
    struct UserData {
        uint256 collateral; // ETH amount (18 decimals)
        uint256 debt; // Token amount (6 decimals)
    }

    mapping(address => UserData) public userData;

    // Events
    event DepositAndBorrow(address indexed user, uint256 ethAmount, uint256 borrowAmount);
    event Repay(address indexed user, uint256 ethReturned, uint256 debtRepaid);
    event Liquidate(address indexed user, address indexed liquidator, uint256 ethSeized, uint256 debtCovered);
    event TakeProfit(address indexed user, uint256 profitAmount);
    event OracleUpdate(uint256 newPrice);

    constructor(address _token, address _feeRecipient)
        Ownable(msg.sender)
    {
        token = IERC20(_token);
        feeRecipient = _feeRecipient;
        ethPrice = 2000 * 1e6; // Initial price: $2000 ETH (6 decimals)
    }

    // Admin functions
    function setOraclePrice(uint256 price) external onlyOwner {
        ethPrice = price;
        emit OracleUpdate(price);
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
    }

    // Core functions
    function depositAndBorrow(uint256 borrowAmount) external payable {
        require(msg.value > 0, "Must send ETH");
        require(borrowAmount > 0, "Borrow amount must be > 0");

        uint256 requiredCollateral = (borrowAmount * 1e18) / (ethPrice * LTV / 100);
        require(msg.value >= requiredCollateral, "Insufficient collateral");

        // Transfer tokens to user
        token.transfer(msg.sender, borrowAmount);

        // Update user data
        userData[msg.sender].collateral += msg.value;
        userData[msg.sender].debt += borrowAmount;

        emit DepositAndBorrow(msg.sender, msg.value, borrowAmount);
    }

    function repay() external {
        UserData storage user = userData[msg.sender];
        require(user.debt > 0, "No debt to repay");

        // User must approve tokens first
        uint256 debt = user.debt;
        token.transferFrom(msg.sender, address(this), debt);

        // Return collateral (minus any fees in a real implementation)
        uint256 ethToReturn = user.collateral;
        user.collateral = 0;
        user.debt = 0;

        (bool success, ) = payable(msg.sender).call{value: ethToReturn}("");
        require(success, "Transfer failed");

        emit Repay(msg.sender, ethToReturn, debt);
    }

    function liquidate(address user) external {
        UserData storage target = userData[user];
        require(target.debt > 0, "No debt to liquidate");
        require(getHealthFactor(user) < LIQUIDATION_THRESHOLD, "Not liquidatable");

        uint256 debt = target.debt;
        uint256 collateral = target.collateral;

        // Burn debt (simplified for MVP)
        target.debt = 0;
        target.collateral = 0;

        // Transfer collateral to liquidator with discount
        uint256 ethToTransfer = (collateral * (100 - LIQUIDATION_DISCOUNT)) / 100;
        (bool success, ) = payable(msg.sender).call{value: ethToTransfer}("");
        require(success, "Transfer failed");

        // Remaining goes to fee recipient (protocol)
        if (collateral > ethToTransfer) {
            uint256 remaining = collateral - ethToTransfer;
            (success, ) = payable(feeRecipient).call{value: remaining}("");
            require(success, "Transfer failed");
        }

        emit Liquidate(user, msg.sender, collateral, debt);
    }

    function takeProfit(address user) external {
        UserData storage target = userData[user];
        require(target.debt > 0, "No active loan");
        require(getHealthFactor(user) > 200, "Price hasn't doubled"); // 2.0 HF threshold

        uint256 debt = target.debt;
        uint256 collateral = target.collateral;
        uint256 ethToSell = (debt * 1e18) / ethPrice;

        require(collateral >= ethToSell, "Not enough collateral");

        // Repay debt (in a real implementation, we would transfer tokens)
        target.debt = 0;

        // Calculate profit (remaining collateral after repaying debt)
        uint256 profit = collateral - ethToSell;
        target.collateral = 0;

        // Transfer profit to user
        (bool success, ) = payable(user).call{value: profit}("");
        require(success, "Transfer failed");

        emit TakeProfit(user, profit);
    }

    // View functions
    function getHealthFactor(address user) public view returns (uint256) {
        UserData memory target = userData[user];
        if (target.debt == 0) return type(uint256).max;

        uint256 collateralValue = (target.collateral * ethPrice) / 1e18; // Convert to USD value (6 decimals)
        return (collateralValue * 100) / target.debt; // Health factor (e.g., 200 = 2.0)
    }

    function getMaxBorrow(address user) public view returns (uint256) {
        uint256 collateralValue = (userData[user].collateral * ethPrice) / 1e18;
        return (collateralValue * LTV) / 100;
    }

    function getLiquidationPrice(address user) public view returns (uint256) {
        UserData memory target = userData[user];
        if (target.debt == 0) return type(uint256).max;

        return (target.debt * LIQUIDATION_THRESHOLD * 1e18) / (target.collateral * 100);
    }

    // Fallback to receive ETH
    receive() external payable {}
}