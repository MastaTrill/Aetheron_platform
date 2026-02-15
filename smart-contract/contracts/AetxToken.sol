// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Aetx Token (AETX)
 * @dev ERC20 token for the Aetheron Platform
 */
contract AetxToken is ERC20, Ownable {
    constructor(address initialOwner) ERC20("Aetx Token", "AETX") Ownable(initialOwner) {
        _mint(initialOwner, 1_000_000_000 * 10**18);
    }
}
