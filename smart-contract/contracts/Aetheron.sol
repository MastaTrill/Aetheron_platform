// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Aetheron Token (AETH)
 * @dev ERC20 token for the Aetheron Platform
 * @notice Liquidity pool addresses are excluded from tax to enable trading
 */
contract Aetheron is ERC20, Ownable, ReentrancyGuard {
    address public teamWallet;
    address public marketingWallet;
    address public stakingPool;

    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18;
    uint256 public constant LIQUIDITY_ALLOCATION = TOTAL_SUPPLY * 50 / 100;
    uint256 public constant TEAM_ALLOCATION = TOTAL_SUPPLY * 20 / 100;
    uint256 public constant MARKETING_ALLOCATION = TOTAL_SUPPLY * 15 / 100;
    uint256 public constant STAKING_ALLOCATION = TOTAL_SUPPLY * 15 / 100;

    uint256 public buyTaxRate = 3;
    uint256 public sellTaxRate = 5;
    uint256 public constant MAX_TAX = 10;

    bool public tradingEnabled;
    mapping(address => bool) public isExcludedFromTax;
    mapping(address => bool) public isBlacklisted;

    // Known DEX router/pool addresses for tax detection
    address public quickswapRouter;
    address public liquidityPool;

    event TradingEnabled(uint256 timestamp);
    event TaxRatesUpdated(uint256 buyTax, uint256 sellTax);
    event WalletsUpdated(address indexed team, address indexed marketing, address indexed staking);
    event LiquidityPoolUpdated(address indexed pool);
    event QuickSwapRouterUpdated(address indexed router);
    event TaxCollected(uint256 amount, address indexed from);

    constructor(
        address _teamWallet,
        address _marketingWallet,
        address _stakingPool
    ) ERC20("Aetheron", "AETH") {
        require(_teamWallet != address(0), "Invalid team wallet");
        require(_marketingWallet != address(0), "Invalid marketing wallet");
        require(_stakingPool != address(0), "Invalid staking pool");

        teamWallet = _teamWallet;
        marketingWallet = _marketingWallet;
        stakingPool = _stakingPool;

        isExcludedFromTax[msg.sender] = true;
        isExcludedFromTax[address(this)] = true;
        isExcludedFromTax[teamWallet] = true;
        isExcludedFromTax[marketingWallet] = true;
        isExcludedFromTax[stakingPool] = true;

        _mint(msg.sender, LIQUIDITY_ALLOCATION);
        _mint(teamWallet, TEAM_ALLOCATION);
        _mint(marketingWallet, MARKETING_ALLOCATION);
        _mint(stakingPool, STAKING_ALLOCATION);
    }

    function enableTrading() external onlyOwner {
        require(!tradingEnabled, "Trading already enabled");
        tradingEnabled = true;
        emit TradingEnabled(block.timestamp);
    }

    function setQuickSwapRouter(address _router) external onlyOwner {
        require(_router != address(0), "Invalid router");
        quickswapRouter = _router;
        isExcludedFromTax[_router] = true;
        emit QuickSwapRouterUpdated(_router);
    }

    function setLiquidityPool(address _pool) external onlyOwner {
        require(_pool != address(0), "Invalid pool");
        liquidityPool = _pool;
        isExcludedFromTax[_pool] = true;
        emit LiquidityPoolUpdated(_pool);
    }

    function updateTaxRates(uint256 buyTax, uint256 sellTax) external onlyOwner {
        require(buyTax <= MAX_TAX, "Buy tax too high");
        require(sellTax <= MAX_TAX, "Sell tax too high");
        buyTaxRate = buyTax;
        sellTaxRate = sellTax;
        emit TaxRatesUpdated(buyTax, sellTax);
    }

    function updateWallets(
        address newTeamWallet,
        address newMarketingWallet,
        address newStakingPool
    ) external onlyOwner {
        require(newTeamWallet != address(0), "Invalid team wallet");
        require(newMarketingWallet != address(0), "Invalid marketing wallet");
        require(newStakingPool != address(0), "Invalid staking pool");
        teamWallet = newTeamWallet;
        marketingWallet = newMarketingWallet;
        stakingPool = newStakingPool;
        emit WalletsUpdated(newTeamWallet, newMarketingWallet, newStakingPool);
    }

    function setExcludedFromTax(address account, bool excluded) external onlyOwner {
        isExcludedFromTax[account] = excluded;
    }

    function setBlacklisted(address account, bool blacklisted) external onlyOwner {
        isBlacklisted[account] = blacklisted;
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        require(!isBlacklisted[from] && !isBlacklisted[to], "Blacklisted");
        require(tradingEnabled || isExcludedFromTax[from] || isExcludedFromTax[to], "Trading not enabled");

        // No tax for excluded addresses or internal transfers
        if (isExcludedFromTax[from] || isExcludedFromTax[to] || amount == 0) {
            super._transfer(from, to, amount);
            return;
        }

        // Detect DEX interaction: if sender or recipient is the known router/pool
        bool isSell = (to == quickswapRouter || to == liquidityPool);
        bool isBuy = (from == quickswapRouter || from == liquidityPool);

        uint256 taxAmount = 0;
        if (isSell) {
            taxAmount = (amount * sellTaxRate) / 100;
        } else if (isBuy) {
            taxAmount = (amount * buyTaxRate) / 100;
        }

        if (taxAmount > 0) {
            uint256 teamTax = (taxAmount * 40) / 100;
            uint256 marketingTax = (taxAmount * 30) / 100;
            uint256 stakingTax = taxAmount - teamTax - marketingTax;

            super._transfer(from, teamWallet, teamTax);
            super._transfer(from, marketingWallet, marketingTax);
            super._transfer(from, stakingPool, stakingTax);
            emit TaxCollected(taxAmount, from);
        }

        super._transfer(from, to, amount - taxAmount);
    }

    function rescueTokens(address token, uint256 amount) external onlyOwner nonReentrant {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            require(IERC20(token).transfer(owner(), amount), "Transfer failed");
        }
    }

    receive() external payable {}
}
