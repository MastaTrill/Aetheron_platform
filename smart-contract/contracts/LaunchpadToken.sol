// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LaunchpadToken
 * @dev Minimal ERC20 used by the backend launchpad flow.
 */
contract LaunchpadToken is ERC20, Ownable {
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply_,
        address initialRecipient_,
        address initialOwner_
    ) ERC20(name_, symbol_) {
        require(initialRecipient_ != address(0), "Invalid recipient");
        require(initialOwner_ != address(0), "Invalid owner");

        _mint(initialRecipient_, initialSupply_);

        if (initialOwner_ != _msgSender()) {
            transferOwnership(initialOwner_);
        }
    }
}
