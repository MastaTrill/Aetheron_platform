// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract AetheronPresale is Ownable, ReentrancyGuard {
    IERC20 public token;
    uint256 public rate; // How many tokens per 1 MATIC
    uint256 public weiRaised;
    uint256 public maxTokensForSale;
    uint256 public maxWeiRaised;
    uint256 public tokensSold;
    bool public isPresaleActive;

    event TokensPurchased(
        address indexed purchaser,
        uint256 value,
        uint256 amount
    );
    event PresaleStateChanged(bool isActive);
    event RateChanged(uint256 newRate);

    constructor(address _token, uint256 _rate, uint256 _maxTokensForSale, uint256 _maxWeiRaised) {
        token = IERC20(_token);
        rate = _rate;
        maxTokensForSale = _maxTokensForSale;
        maxWeiRaised = _maxWeiRaised;
        isPresaleActive = true;
    }

    // Fallback function to buy tokens
    receive() external payable {
        buyTokens();
    }

    function buyTokens() public payable nonReentrant {
        require(isPresaleActive, "Presale is not active");
        require(msg.value > 0, "Wei amount is 0");

        // Calculate token amount to be created
        uint256 tokens = msg.value * rate;

        require(weiRaised + msg.value <= maxWeiRaised, "Presale hard cap reached");
        require(tokensSold + tokens <= maxTokensForSale, "Presale token cap reached");

        require(
            token.balanceOf(address(this)) >= tokens,
            "Not enough tokens in contract for this trade"
        );

        weiRaised += msg.value;
        tokensSold += tokens;

        // Transfer tokens to the user
        token.transfer(msg.sender, tokens);

        emit TokensPurchased(msg.sender, msg.value, tokens);
    }

    function setPresaleStatus(bool _status) external onlyOwner {
        isPresaleActive = _status;
        emit PresaleStateChanged(_status);
    }

    function setRate(uint256 _rate) external onlyOwner {
        rate = _rate;
        emit RateChanged(_rate);
    }

    function setCaps(uint256 _maxTokensForSale, uint256 _maxWeiRaised) external onlyOwner {
        maxTokensForSale = _maxTokensForSale;
        maxWeiRaised = _maxWeiRaised;
    }

    // Withdraw valid tokens (AETH) remaining in the contract
    function withdrawTokens(uint256 amount) external onlyOwner {
        require(
            token.balanceOf(address(this)) >= amount,
            "Insufficient balance"
        );
        token.transfer(owner(), amount);
    }

    // Withdraw MATIC raised
    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Transfer failed.");
    }
}
