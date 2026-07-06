// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

contract AetheronVendor is Ownable, ReentrancyGuard {
  using SafeERC20 for IERC20;

  IERC20 public aethToken;
  uint256 public tokensPerPol = 10000; // 1 POL = 10,000 AETH

  event BuyTokens(address buyer, uint256 amountOfPol, uint256 amountOfTokens);
  event SellTokens(address seller, uint256 amountOfTokens, uint256 amountOfPol);
  event TokensPerPolUpdated(uint256 newRate);

  constructor(address _aethTokenAddress) {
    require(_aethTokenAddress != address(0), 'Invalid token address');
    aethToken = IERC20(_aethTokenAddress);
  }

  /**
   * @dev Users buy AETH by sending POL to this function
   */
  function buyTokens() public payable nonReentrant {
    require(msg.value > 0, 'Send POL to buy tokens');

    uint256 amountToBuy = msg.value * tokensPerPol;
    uint256 vendorBalance = aethToken.balanceOf(address(this));
    require(vendorBalance >= amountToBuy, 'Vendor has insufficient AETH tokens');

    aethToken.safeTransfer(msg.sender, amountToBuy);

    emit BuyTokens(msg.sender, msg.value, amountToBuy);
  }

  /**
   * @dev Users sell AETH back to the contract for POL
   */
  function sellTokens(uint256 tokenAmountToSell) public nonReentrant {
    require(tokenAmountToSell > 0, 'Specify an amount of tokens greater than zero');

    uint256 polToReturn = tokenAmountToSell / tokensPerPol;
    require(polToReturn > 0, 'Token amount too small to convert');
    require(address(this).balance >= polToReturn, 'Vendor has insufficient POL for buyback');

    uint256 userAllowance = aethToken.allowance(msg.sender, address(this));
    require(userAllowance >= tokenAmountToSell, 'Check the token allowance');

    aethToken.safeTransferFrom(msg.sender, address(this), tokenAmountToSell);

    (bool polSent, ) = msg.sender.call{ value: polToReturn }('');
    require(polSent, 'Failed to send POL back to user');

    emit SellTokens(msg.sender, tokenAmountToSell, polToReturn);
  }

  /**
   * @dev Owner can withdraw POL collected from sales
   */
  function withdrawPol() public onlyOwner {
    uint256 ownerAmount = address(this).balance;
    (bool sent, ) = msg.sender.call{ value: ownerAmount }('');
    require(sent, 'Failed to send POL');
  }

  /**
   * @dev Owner can withdraw unsold tokens
   */
  function withdrawTokens() public onlyOwner {
    uint256 tokenAmount = aethToken.balanceOf(address(this));
    aethToken.safeTransfer(msg.sender, tokenAmount);
  }

  function setTokensPerPol(uint256 newRate) external onlyOwner {
    require(newRate > 0, 'Rate must be greater than zero');
    tokensPerPol = newRate;
    emit TokensPerPolUpdated(newRate);
  }

  // Allow contract to receive POL
  receive() external payable {
    buyTokens();
  }
}
