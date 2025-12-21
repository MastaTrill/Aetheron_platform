// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracs/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Aetheron is ERC20, Ownable {
    address public teamWallet = 0x76A83f91dC64FC4F29CEf6635f9a36477ECA6784; // Your EVM team/treasury wallet
    address public marketingWallet = 0x8a3ad49656bd07981c9cfc7ad826a808847c3452; // Your secondary EVM wallet (e.g., marketing or dev)
    address public solanaTreasury = 0x5fryQ4UPbZWKix8J3jtQhNTDXtSsoX24vyDQ8gQbFqki; // Note: This is Solana - can't use directly in Ethereum contract; for off-chain reference or cross-chain bridging

    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // Example: 1 billion tokens

    constructor() ERC20("Aetheron", "AETH") {
        // Mint initial supply to owner (your main deployer wallet - change if needed)
        _mint(msg.sender, TOTAL_SUPPLY * 50 / 100); // 50% to liquidity/presale pool or owner

        // Allocate to team wallet (e.g., 20%)
        _mint(teamWallet, TOTAL_SUPPLY * 20 / 100);

        // Allocate to marketing/community wallet (e.g., 15%)
        _mint(marketingWallet, TOTAL_SUPPLY * 15 / 100);

        // Remaining 15% could be for staking rewards, airdrops, etc. (mint later or to a separate pool)
    }

    // Example: Function to renounce ownership after setup (optional, for decentralization)
    function renounceOwnership() public override onlyOwner {
        super.renounceOwnership();
    }

    // Add any other features like tax, burn, or anti-bot if needed
}