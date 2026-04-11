// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AetxSubscription is ERC20, Ownable {
    struct Tier {
        uint256 pricePerMonth;
        string name;
        bool active;
    }

    bool public paused;
    mapping(address => uint256) public subscriptionEnds;
    mapping(address => uint8) public userTier;
    mapping(uint8 => Tier) public tiers;
    uint8 public constant FREE_TIER = 0;

    event SubscriptionPurchased(
        address indexed user,
        uint8 tier,
        uint256 amount,
        uint256 duration
    );
    event TierUpdated(uint8 indexed tierId, string name, uint256 price);
    event AccessGranted(address indexed user, uint8 tier, uint256 expires);
    event PausedSet(bool isPaused);

    constructor() ERC20("AETX Subscription", "AETXSUB") {
        paused = false;
        _transferOwnership(msg.sender);
        tiers[0] = Tier(0, "Free", true);
        tiers[1] = Tier(0.001 ether, "Basic", true);
        tiers[2] = Tier(0.005 ether, "Pro", true);
        tiers[3] = Tier(0.01 ether, "Enterprise", true);
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    function subscribe(uint8 tierId, uint256 durationMonths) external payable whenNotPaused {
        require(tiers[tierId].active, "Tier not active");
        require(durationMonths > 0 && durationMonths <= 12, "Invalid duration");

        uint256 price = tiers[tierId].pricePerMonth * durationMonths;
        require(msg.value >= price, "Insufficient payment");

        uint256 newEnd = block.timestamp + (durationMonths * 30 days);
        if (subscriptionEnds[msg.sender] > block.timestamp) {
            subscriptionEnds[msg.sender] += durationMonths * 30 days;
        } else {
            subscriptionEnds[msg.sender] = newEnd;
        }
        userTier[msg.sender] = tierId;

        emit SubscriptionPurchased(msg.sender, tierId, msg.value, durationMonths);
        emit AccessGranted(msg.sender, tierId, subscriptionEnds[msg.sender]);

        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }
    }

    function hasAccess(address user) external view returns (bool) {
        return subscriptionEnds[user] > block.timestamp && userTier[user] > 0;
    }

    function getSubscriptionStatus(address user) external view returns (uint8 tier, uint256 expires) {
        return (userTier[user], subscriptionEnds[user]);
    }

    function setTier(uint8 tierId, string memory name, uint256 pricePerMonth, bool active) external onlyOwner {
        require(tierId > 0 && tierId <= 10, "Invalid tier");
        tiers[tierId] = Tier(pricePerMonth, name, active);
        emit TierUpdated(tierId, name, pricePerMonth);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit PausedSet(_paused);
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}