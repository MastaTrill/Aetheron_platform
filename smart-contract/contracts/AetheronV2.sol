// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

/// @title Aetheron V2 (AETH)
/// @notice Base-ready fixed-supply standard ERC20 with a one-way public trading gate.
/// @dev Before launch, only the owner, this contract, or an explicitly authorized transfer agent
///      can originate transfers. After launch, transfers use unmodified ERC20 semantics so AETH
///      remains compatible with standard wallets, routers, aggregators, and liquidity pools.
contract AetheronV2 is ERC20, Ownable2Step {
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10 ** 18;
    uint256 public constant LIQUIDITY_ALLOCATION = TOTAL_SUPPLY * 50 / 100;
    uint256 public constant TEAM_ALLOCATION = TOTAL_SUPPLY * 20 / 100;
    uint256 public constant MARKETING_ALLOCATION = TOTAL_SUPPLY * 15 / 100;
    uint256 public constant STAKING_ALLOCATION = TOTAL_SUPPLY * 15 / 100;

    address public immutable teamWallet;
    address public immutable marketingWallet;
    address public immutable stakingPool;

    bool public tradingEnabled;
    mapping(address => bool) public preLaunchTransferAgent;

    event TradingEnabled(uint256 timestamp);
    event PreLaunchTransferAgentUpdated(address indexed account, bool enabled);

    constructor(
        address _teamWallet,
        address _marketingWallet,
        address _stakingPool
    ) ERC20("Aetheron", "AETH") {
        require(
            _teamWallet != address(0) &&
            _marketingWallet != address(0) &&
            _stakingPool != address(0),
            "Invalid allocation wallet"
        );

        teamWallet = _teamWallet;
        marketingWallet = _marketingWallet;
        stakingPool = _stakingPool;

        _mint(msg.sender, LIQUIDITY_ALLOCATION);
        _mint(_teamWallet, TEAM_ALLOCATION);
        _mint(_marketingWallet, MARKETING_ALLOCATION);
        _mint(_stakingPool, STAKING_ALLOCATION);
    }

    /// @notice Permanently opens unrestricted ERC20 transfers and public trading.
    function enableTrading() external onlyOwner {
        require(!tradingEnabled, "Trading already enabled");
        tradingEnabled = true;
        emit TradingEnabled(block.timestamp);
    }

    /// @notice Allows a presale or migration distributor to send tokens before public trading opens.
    function setPreLaunchTransferAgent(address account, bool enabled) external onlyOwner {
        require(account != address(0), "Invalid transfer agent");
        preLaunchTransferAgent[account] = enabled;
        emit PreLaunchTransferAgentUpdated(account, enabled);
    }

    function _transfer(address from, address to, uint256 amount) internal override {
        if (!tradingEnabled) {
            require(_canTransferBeforeLaunch(from, to), "Trading not enabled");
        }
        super._transfer(from, to, amount);
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
