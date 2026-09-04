// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Aetheron V2 (AETH)
/// @notice Base-ready fixed-supply AETH with deterministic AMM taxation and a one-way launch gate.
/// @dev AMM pairs are never implicitly fee-exempt. Before launch, only the owner, this contract,
///      or an explicitly authorized transfer agent can originate transfers. After launch, every
///      AMM buy/sell is taxed at the same fixed rate, including owner-originated trades.
contract AetheronV2 is ERC20, Ownable {
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10 ** 18;
    uint256 public constant LIQUIDITY_ALLOCATION = TOTAL_SUPPLY * 50 / 100;
    uint256 public constant TEAM_ALLOCATION = TOTAL_SUPPLY * 20 / 100;
    uint256 public constant MARKETING_ALLOCATION = TOTAL_SUPPLY * 15 / 100;
    uint256 public constant STAKING_ALLOCATION = TOTAL_SUPPLY * 15 / 100;

    uint256 public constant buyTaxRate = 3;
    uint256 public constant sellTaxRate = 5;

    address public teamWallet;
    address public marketingWallet;
    address public stakingPool;

    bool public tradingEnabled;

    mapping(address => bool) public isAutomatedMarketMakerPair;
    mapping(address => bool) public preLaunchTransferAgent;

    event TradingEnabled(uint256 timestamp);
    event AutomatedMarketMakerPairUpdated(address indexed pair, bool enabled);
    event PreLaunchTransferAgentUpdated(address indexed account, bool enabled);
    event TaxWalletsUpdated(address indexed team, address indexed marketing, address indexed staking);
    event TaxCollected(address indexed from, address indexed to, uint256 amount, uint256 rate);

    constructor(
        address _teamWallet,
        address _marketingWallet,
        address _stakingPool
    ) ERC20("Aetheron", "AETH") {
        require(
            _teamWallet != address(0) &&
            _marketingWallet != address(0) &&
            _stakingPool != address(0),
            "Invalid tax wallet"
        );

        teamWallet = _teamWallet;
        marketingWallet = _marketingWallet;
        stakingPool = _stakingPool;

        _mint(msg.sender, LIQUIDITY_ALLOCATION);
        _mint(_teamWallet, TEAM_ALLOCATION);
        _mint(_marketingWallet, MARKETING_ALLOCATION);
        _mint(_stakingPool, STAKING_ALLOCATION);
    }

    /// @notice Permanently opens public transfers and AMM trading.
    function enableTrading() external onlyOwner {
        require(!tradingEnabled, "Trading already enabled");
        tradingEnabled = true;
        emit TradingEnabled(block.timestamp);
    }

    /// @notice Marks or unmarks a Base AMM pool used for buy/sell tax detection.
    function setAutomatedMarketMakerPair(address pair, bool enabled) external onlyOwner {
        require(pair != address(0), "Invalid AMM pair");
        require(pair != owner(), "Owner cannot be AMM pair");
        require(pair != address(this), "Token cannot be AMM pair");

        if (enabled) {
            require(!preLaunchTransferAgent[pair], "Transfer agent cannot be AMM pair");
            require(
                pair != teamWallet && pair != marketingWallet && pair != stakingPool,
                "Tax wallet cannot be AMM pair"
            );
        }

        isAutomatedMarketMakerPair[pair] = enabled;
        emit AutomatedMarketMakerPairUpdated(pair, enabled);
    }

    /// @notice Allows a presale/distributor to send tokens before public trading is enabled.
    /// @dev This authority has no fee exemption after launch.
    function setPreLaunchTransferAgent(address account, bool enabled) external onlyOwner {
        require(account != address(0), "Invalid transfer agent");
        if (enabled) {
            require(!isAutomatedMarketMakerPair[account], "AMM pair cannot be transfer agent");
        }
        preLaunchTransferAgent[account] = enabled;
        emit PreLaunchTransferAgentUpdated(account, enabled);
    }

    /// @notice Rotates the three tax destinations.
    function updateTaxWallets(
        address newTeamWallet,
        address newMarketingWallet,
        address newStakingPool
    ) external onlyOwner {
        require(
            newTeamWallet != address(0) &&
            newMarketingWallet != address(0) &&
            newStakingPool != address(0),
            "Invalid tax wallet"
        );
        require(
            !isAutomatedMarketMakerPair[newTeamWallet] &&
            !isAutomatedMarketMakerPair[newMarketingWallet] &&
            !isAutomatedMarketMakerPair[newStakingPool],
            "AMM pair cannot be tax wallet"
        );

        teamWallet = newTeamWallet;
        marketingWallet = newMarketingWallet;
        stakingPool = newStakingPool;

        emit TaxWalletsUpdated(newTeamWallet, newMarketingWallet, newStakingPool);
    }

    function _transfer(address from, address to, uint256 amount) internal override {
        if (!tradingEnabled) {
            require(_canTransferBeforeLaunch(from, to), "Trading not enabled");
            super._transfer(from, to, amount);
            return;
        }

        bool isBuy = isAutomatedMarketMakerPair[from];
        bool isSell = isAutomatedMarketMakerPair[to];

        if (amount == 0 || (!isBuy && !isSell)) {
            super._transfer(from, to, amount);
            return;
        }

        uint256 rate = isSell ? sellTaxRate : buyTaxRate;
        uint256 taxAmount = amount * rate / 100;

        if (taxAmount == 0) {
            super._transfer(from, to, amount);
            return;
        }

        uint256 teamTax = taxAmount * 40 / 100;
        uint256 marketingTax = taxAmount * 30 / 100;
        uint256 stakingTax = taxAmount - teamTax - marketingTax;

        super._transfer(from, teamWallet, teamTax);
        super._transfer(from, marketingWallet, marketingTax);
        super._transfer(from, stakingPool, stakingTax);
        super._transfer(from, to, amount - taxAmount);

        emit TaxCollected(from, to, taxAmount, rate);
    }

    function _canTransferBeforeLaunch(address from, address to) private view returns (bool) {
        return
            from == owner() ||
            to == owner() ||
            from == address(this) ||
            to == address(this) ||
            preLaunchTransferAgent[from];
    }
}
