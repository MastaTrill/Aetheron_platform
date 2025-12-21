// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Aetheron Token (AETH)
 * @dev ERC20 token for the Aetheron Platform - Revolutionary Blockchain & Space Exploration Ecosystem
 */
contract Aetheron is ERC20, Ownable, ReentrancyGuard {
    // Treasury wallets
    address public teamWallet;
    address public marketingWallet;
    address public stakingPool;
    
    // Token distribution
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant LIQUIDITY_POOL = TOTAL_SUPPLY * 50 / 100; // 50%
    uint256 public constant TEAM_ALLOCATION = TOTAL_SUPPLY * 20 / 100; // 20%
    uint256 public constant MARKETING_ALLOCATION = TOTAL_SUPPLY * 15 / 100; // 15%
    uint256 public constant STAKING_REWARDS = TOTAL_SUPPLY * 15 / 100; // 15%
    
    // Tax configuration
    uint256 public buyTaxRate = 3; // 3%
    uint256 public sellTaxRate = 5; // 5%
    uint256 public constant MAX_TAX = 10; // Maximum 10% tax
    
    // Tax distribution
    uint256 public teamTaxShare = 40; // 40% of tax
    uint256 public marketingTaxShare = 30; // 30% of tax
    uint256 public stakingTaxShare = 30; // 30% of tax
    
    // Trading control
    bool public tradingEnabled = false;
    mapping(address => bool) public isExcludedFromTax;
    mapping(address => bool) public isBlacklisted;
    
    // Events
    event TradingEnabled(uint256 timestamp);
    event TaxRatesUpdated(uint256 buyTax, uint256 sellTax);
    event WalletsUpdated(address team, address marketing, address staking);
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
        
        // Exclude core addresses from tax
        isExcludedFromTax[msg.sender] = true;
        isExcludedFromTax[address(this)] = true;
        isExcludedFromTax[teamWallet] = true;
        isExcludedFromTax[marketingWallet] = true;
        isExcludedFromTax[stakingPool] = true;
        
        // Mint initial supply
        _mint(msg.sender, LIQUIDITY_POOL);
        _mint(teamWallet, TEAM_ALLOCATION);
        _mint(marketingWallet, MARKETING_ALLOCATION);
        _mint(stakingPool, STAKING_REWARDS);
    }
    
    /**
     * @dev Enable trading (can only be called once)
     */
    function enableTrading() external onlyOwner {
        require(!tradingEnabled, "Trading already enabled");
        tradingEnabled = true;
        emit TradingEnabled(block.timestamp);
    }
    
    /**
     * @dev Update tax rates
     */
    function updateTaxRates(uint256 _buyTax, uint256 _sellTax) external onlyOwner {
        require(_buyTax <= MAX_TAX, "Buy tax too high");
        require(_sellTax <= MAX_TAX, "Sell tax too high");
        buyTaxRate = _buyTax;
        sellTaxRate = _sellTax;
        emit TaxRatesUpdated(_buyTax, _sellTax);
    }
    
    /**
     * @dev Update treasury wallets
     */
    function updateWallets(
        address _teamWallet,
        address _marketingWallet,
        address _stakingPool
    ) external onlyOwner {
        require(_teamWallet != address(0), "Invalid team wallet");
        require(_marketingWallet != address(0), "Invalid marketing wallet");
        require(_stakingPool != address(0), "Invalid staking pool");
        
        teamWallet = _teamWallet;
        marketingWallet = _marketingWallet;
        stakingPool = _stakingPool;
        
        emit WalletsUpdated(_teamWallet, _marketingWallet, _stakingPool);
    }
    
    /**
     * @dev Exclude/include address from tax
     */
    function setExcludedFromTax(address account, bool excluded) external onlyOwner {
        isExcludedFromTax[account] = excluded;
    }
    
    /**
     * @dev Blacklist/unblacklist address
     */
    function setBlacklisted(address account, bool blacklisted) external onlyOwner {
        isBlacklisted[account] = blacklisted;
    }
    
    /**
     * @dev Override transfer to include tax logic
     */
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        require(!isBlacklisted[from] && !isBlacklisted[to], "Blacklisted address");
        require(tradingEnabled || isExcludedFromTax[from] || isExcludedFromTax[to], "Trading not enabled");
        
        if (isExcludedFromTax[from] || isExcludedFromTax[to] || amount == 0) {
            super._transfer(from, to, amount);
            return;
        }
        
        uint256 taxAmount = 0;
        
        // Calculate tax (simplified - in production, detect buy/sell via DEX pair)
        if (from != address(this) && to != address(this)) {
            taxAmount = (amount * sellTaxRate) / 100;
        }
        
        if (taxAmount > 0) {
            uint256 teamTax = (taxAmount * teamTaxShare) / 100;
            uint256 marketingTax = (taxAmount * marketingTaxShare) / 100;
            uint256 stakingTax = taxAmount - teamTax - marketingTax;
            
            super._transfer(from, teamWallet, teamTax);
            super._transfer(from, marketingWallet, marketingTax);
            super._transfer(from, stakingPool, stakingTax);
            
            emit TaxCollected(taxAmount, from);
        }
        
        super._transfer(from, to, amount - taxAmount);
    }
    
    /**
     * @dev Withdraw stuck tokens (emergency function)
     */
    function rescueTokens(address token, uint256 amount) external onlyOwner nonReentrant {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).transfer(owner(), amount);
        }
    }
    
    /**
     * @dev Receive ETH
     */
    receive() external payable {}
}
