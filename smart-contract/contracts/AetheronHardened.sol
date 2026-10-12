// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title AetheronHardened (AETH)
 * @notice Fixed-supply token. Liquidity 85% / Marketing 15%.
 *         Team wallet and staking allocation removed.
 *         Delayed config updates, liquidity lock, delayed renounce.
 *         Blacklist removed. Ownable2Step.
 */
contract AetheronHardened is ERC20, Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public marketingWallet;

    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18;
    uint256 public constant LIQUIDITY_ALLOCATION = TOTAL_SUPPLY * 85 / 100;
    uint256 public constant MARKETING_ALLOCATION = TOTAL_SUPPLY * 15 / 100;

    uint256 public buyTaxRate = 3;
    uint256 public sellTaxRate = 5;
    uint256 public constant MAX_TAX = 10;
    uint256 public constant MAX_TAX_CHANGE = 2;
    uint256 public constant CONFIG_DELAY = 24 hours;

    bool public tradingEnabled;
    mapping(address => bool) public isExcludedFromTax;

    address public quickswapRouter;
    address public liquidityPool;

    // Liquidity lock
    address public lockedLpToken;
    uint256 public lpUnlockTime;
    bool public lpLocked;

    // Delayed renounce
    uint256 public renounceEffectiveAt;

    // Pending configuration
    struct PendingTax {
        uint256 buyTax;
        uint256 sellTax;
        uint256 effectiveAt;
    }
    PendingTax public pendingTax;

    struct PendingAddress {
        address value;
        uint256 effectiveAt;
    }
    PendingAddress public pendingRouter;
    PendingAddress public pendingPool;
    PendingAddress public pendingMarketing;

    event TradingEnabled(uint256 timestamp);
    event TaxRatesUpdated(uint256 buyTax, uint256 sellTax);
    event TaxUpdateScheduled(uint256 buyTax, uint256 sellTax, uint256 effectiveAt);
    event MarketingWalletUpdated(address indexed marketing);
    event WalletUpdateScheduled(string kind, address value, uint256 effectiveAt);
    event LiquidityPoolUpdated(address indexed pool);
    event QuickSwapRouterUpdated(address indexed router);
    event ConfigApplied(string kind);
    event TaxCollected(uint256 amount, address indexed from);
    event LiquidityLocked(address indexed lpToken, uint256 amount, uint256 unlockTime);
    event LiquidityUnlocked(address indexed lpToken, uint256 amount);
    event RenounceScheduled(uint256 effectiveAt);
    event OwnershipRenounced(address indexed previousOwner);

    constructor(address _marketingWallet) ERC20("Aetheron", "AETH") Ownable(msg.sender) {
        require(_marketingWallet != address(0), "Invalid marketing wallet");

        marketingWallet = _marketingWallet;

        isExcludedFromTax[msg.sender] = true;
        isExcludedFromTax[address(this)] = true;
        isExcludedFromTax[marketingWallet] = true;

        _mint(msg.sender, LIQUIDITY_ALLOCATION);
        _mint(marketingWallet, MARKETING_ALLOCATION);
    }

    function enableTrading() external onlyOwner {
        require(!tradingEnabled, "Trading already enabled");
        tradingEnabled = true;
        emit TradingEnabled(block.timestamp);
    }

    // --- Liquidity lock ---

    function lockLiquidity(address lpToken, uint256 amount, uint256 lockDuration) external onlyOwner nonReentrant {
        require(lpToken != address(0), "Invalid LP token");
        require(amount > 0, "Zero amount");
        require(lockDuration >= 30 days, "Minimum 30-day lock");
        require(!lpLocked, "Already locked");

        IERC20(lpToken).safeTransferFrom(msg.sender, address(this), amount);
        lockedLpToken = lpToken;
        lpUnlockTime = block.timestamp + lockDuration;
        lpLocked = true;

        emit LiquidityLocked(lpToken, amount, lpUnlockTime);
    }

    function unlockLiquidity() external nonReentrant {
        require(lpLocked, "Not locked");
        require(block.timestamp >= lpUnlockTime, "Still locked");

        uint256 balance = IERC20(lockedLpToken).balanceOf(address(this));
        address lp = lockedLpToken;

        lpLocked = false;
        lockedLpToken = address(0);
        lpUnlockTime = 0;

        IERC20(lp).safeTransfer(owner(), balance);
        emit LiquidityUnlocked(lp, balance);
    }

    // --- Delayed renounce ---

    function scheduleRenounce() external onlyOwner {
        require(renounceEffectiveAt == 0, "Already scheduled");
        renounceEffectiveAt = block.timestamp + CONFIG_DELAY;
        emit RenounceScheduled(renounceEffectiveAt);
    }

    function finalizeRenounce() external {
        require(renounceEffectiveAt != 0 && block.timestamp >= renounceEffectiveAt, "Not ready");
        address previous = owner();
        renounceEffectiveAt = 0;
        _transferOwnership(address(0));
        emit OwnershipRenounced(previous);
    }

    // --- Delayed configuration ---

    function scheduleTaxUpdate(uint256 newBuy, uint256 newSell) external onlyOwner {
        require(newBuy <= MAX_TAX && newSell <= MAX_TAX, "Tax too high");
        require(
            _absDiff(newBuy, buyTaxRate) <= MAX_TAX_CHANGE &&
            _absDiff(newSell, sellTaxRate) <= MAX_TAX_CHANGE,
            "Change exceeds max"
        );
        pendingTax = PendingTax(newBuy, newSell, block.timestamp + CONFIG_DELAY);
        emit TaxUpdateScheduled(newBuy, newSell, pendingTax.effectiveAt);
    }

    function applyTaxUpdate() external {
        require(pendingTax.effectiveAt != 0 && block.timestamp >= pendingTax.effectiveAt, "Not ready");
        buyTaxRate = pendingTax.buyTax;
        sellTaxRate = pendingTax.sellTax;
        delete pendingTax;
        emit TaxRatesUpdated(buyTaxRate, sellTaxRate);
        emit ConfigApplied("tax");
    }

    function scheduleRouterUpdate(address _router) external onlyOwner {
        require(_router != address(0), "Invalid router");
        pendingRouter = PendingAddress(_router, block.timestamp + CONFIG_DELAY);
        emit WalletUpdateScheduled("router", _router, pendingRouter.effectiveAt);
    }

    function applyRouterUpdate() external {
        require(pendingRouter.effectiveAt != 0 && block.timestamp >= pendingRouter.effectiveAt, "Not ready");
        if (quickswapRouter != address(0)) isExcludedFromTax[quickswapRouter] = false;
        quickswapRouter = pendingRouter.value;
        isExcludedFromTax[quickswapRouter] = true;
        delete pendingRouter;
        emit QuickSwapRouterUpdated(quickswapRouter);
        emit ConfigApplied("router");
    }

    function schedulePoolUpdate(address _pool) external onlyOwner {
        require(_pool != address(0), "Invalid pool");
        pendingPool = PendingAddress(_pool, block.timestamp + CONFIG_DELAY);
        emit WalletUpdateScheduled("pool", _pool, pendingPool.effectiveAt);
    }

    function applyPoolUpdate() external {
        require(pendingPool.effectiveAt != 0 && block.timestamp >= pendingPool.effectiveAt, "Not ready");
        if (liquidityPool != address(0)) isExcludedFromTax[liquidityPool] = false;
        liquidityPool = pendingPool.value;
        isExcludedFromTax[liquidityPool] = true;
        delete pendingPool;
        emit LiquidityPoolUpdated(liquidityPool);
        emit ConfigApplied("pool");
    }

    function scheduleMarketingUpdate(address newMarketing) external onlyOwner {
        require(newMarketing != address(0), "Invalid marketing wallet");
        pendingMarketing = PendingAddress(newMarketing, block.timestamp + CONFIG_DELAY);
        emit WalletUpdateScheduled("marketing", newMarketing, pendingMarketing.effectiveAt);
    }

    function applyMarketingUpdate() external {
        require(pendingMarketing.effectiveAt != 0 && block.timestamp >= pendingMarketing.effectiveAt, "Not ready");
        isExcludedFromTax[marketingWallet] = false;
        marketingWallet = pendingMarketing.value;
        isExcludedFromTax[marketingWallet] = true;
        delete pendingMarketing;
        emit MarketingWalletUpdated(marketingWallet);
        emit ConfigApplied("marketing");
    }

    function setExcludedFromTax(address account, bool excluded) external onlyOwner {
        isExcludedFromTax[account] = excluded;
    }

    function _transfer(address from, address to, uint256 amount) internal virtual override {
        require(tradingEnabled || isExcludedFromTax[from] || isExcludedFromTax[to], "Trading not enabled");

        if (isExcludedFromTax[from] || isExcludedFromTax[to] || amount == 0) {
            super._transfer(from, to, amount);
            return;
        }

        bool isSell = (to == quickswapRouter || to == liquidityPool);
        bool isBuy = (from == quickswapRouter || from == liquidityPool);

        uint256 taxAmount = 0;
        if (isSell) {
            taxAmount = (amount * sellTaxRate) / 100;
        } else if (isBuy) {
            taxAmount = (amount * buyTaxRate) / 100;
        }

        if (taxAmount > 0) {
            super._transfer(from, marketingWallet, taxAmount);
            emit TaxCollected(taxAmount, from);
        }

        super._transfer(from, to, amount - taxAmount);
    }

    function rescueTokens(address token, uint256 amount) external onlyOwner nonReentrant {
        require(token != lockedLpToken || !lpLocked, "Cannot rescue locked LP");
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            require(IERC20(token).transfer(owner(), amount), "Transfer failed");
        }
    }

    function _absDiff(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a - b : b - a;
    }

    receive() external payable {}
}
