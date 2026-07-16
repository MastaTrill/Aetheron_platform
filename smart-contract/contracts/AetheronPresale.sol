// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title AetheronPresaleV2
/// @notice Hardened presale: contributor funds are escrowed in the contract
///         and cannot be withdrawn by the owner unless the softcap is met.
///         If the softcap is missed (or the owner cancels), contributors
///         pull their own refunds - no one but the contributor can move
///         their MATIC. Tokens are claimed (not auto-sent) only after the
///         raise is finalized, so there's no scenario where someone holds
///         both a refund AND the tokens.
///
/// Deploy this, fund it with the tokens to be sold, then transfer
/// ownership to the multisig before going live if desired.
contract AetheronPresaleV2 is Ownable, ReentrancyGuard {
    IERC20 public immutable token;
    address public treasury;

    uint256 public rate; // tokens (18 decimals) per 1 MATIC
    uint256 public softCap; // wei - minimum raise for the sale to succeed
    uint256 public hardCap; // wei - absolute maximum raise
    uint256 public minContribution; // wei - per-tx floor, blocks dust spam
    uint256 public maxContribution; // wei - per-wallet ceiling

    uint256 public startTime;
    uint256 public endTime;

    uint256 public weiRaised;
    uint256 public tokensReserved; // sum of tokens owed across all contributors

    bool public finalized;
    bool public cancelled;

    mapping(address => uint256) public contributions; // wei contributed
    mapping(address => uint256) public tokensOwed; // tokens earned, unclaimed
    mapping(address => bool) public refunded;

    event TokensPurchased(address indexed buyer, uint256 weiAmount, uint256 tokenAmount);
    event Finalized(uint256 totalWeiRaised, uint256 totalTokensSold);
    event Cancelled();
    event RefundClaimed(address indexed contributor, uint256 weiAmount);
    event TokensClaimed(address indexed contributor, uint256 tokenAmount);
    event FundsWithdrawn(address indexed to, uint256 weiAmount);
    event UnsoldTokensWithdrawn(address indexed to, uint256 tokenAmount);

    modifier onlyWhileOpen() {
        require(block.timestamp >= startTime, "Presale has not started");
        require(block.timestamp <= endTime, "Presale has ended");
        require(!cancelled, "Presale was cancelled");
        require(!finalized, "Presale already finalized");
        _;
    }

    constructor(
        address _token,
        uint256 _rate,
        uint256 _softCap,
        uint256 _hardCap,
        uint256 _minContribution,
        uint256 _maxContribution,
        uint256 _startTime,
        uint256 _endTime,
        address _treasury
    ) {
        require(_token != address(0), "Token address cannot be zero");
        require(_rate > 0, "Rate must be > 0");
        require(_softCap > 0 && _softCap <= _hardCap, "Invalid caps");
        require(_minContribution > 0 && _minContribution <= _maxContribution, "Invalid contribution limits");
        require(_startTime >= block.timestamp, "Start time in the past");
        require(_endTime > _startTime, "End time must be after start time");
        require(_treasury != address(0), "Treasury address cannot be zero");

        token = IERC20(_token);
        rate = _rate;
        softCap = _softCap;
        hardCap = _hardCap;
        minContribution = _minContribution;
        maxContribution = _maxContribution;
        startTime = _startTime;
        endTime = _endTime;
        treasury = _treasury;
    }

    // --- Buying ---

    receive() external payable {
        buyTokens();
    }

    function buyTokens() public payable nonReentrant onlyWhileOpen {
        require(msg.value >= minContribution, "Below minimum contribution");
        require(contributions[msg.sender] + msg.value <= maxContribution, "Exceeds per-wallet cap");
        require(weiRaised + msg.value <= hardCap, "Hard cap reached");

        uint256 tokens = msg.value * rate;
        require(
            token.balanceOf(address(this)) >= tokensReserved + tokens,
            "Not enough tokens left in contract for this purchase"
        );

        weiRaised += msg.value;
        contributions[msg.sender] += msg.value;
        tokensOwed[msg.sender] += tokens;
        tokensReserved += tokens;

        emit TokensPurchased(msg.sender, msg.value, tokens);
    }

    // --- After the sale: success path ---

    /// @notice Locks in success and unlocks fund withdrawal + token claims.
    /// Can only be called once softcap is met, and only after the sale window
    /// closes (or hardcap is hit).
    function finalize() external onlyOwner nonReentrant {
        require(!finalized, "Already finalized");
        require(!cancelled, "Presale was cancelled");
        require(weiRaised >= softCap, "Softcap not met - cancel and refund instead");
        require(block.timestamp > endTime || weiRaised >= hardCap, "Sale window still open");

        finalized = true;
        emit Finalized(weiRaised, tokensReserved);
    }

    /// @notice Contributors pull their purchased tokens after a successful finalize().
    function claimTokens() external nonReentrant {
        require(finalized, "Presale not finalized");
        uint256 amount = tokensOwed[msg.sender];
        require(amount > 0, "No tokens to claim");

        tokensOwed[msg.sender] = 0;
        tokensReserved -= amount;
        require(token.transfer(msg.sender, amount), "Token transfer failed");

        emit TokensClaimed(msg.sender, amount);
    }

    /// @notice Owner withdraws raised MATIC to treasury - only reachable post-finalize.
    function withdrawFunds() external onlyOwner nonReentrant {
        require(finalized, "Presale not finalized");
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = payable(treasury).call{value: balance}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(treasury, balance);
    }

    /// @notice Owner reclaims unsold tokens after finalize or when refunds are available.
    function withdrawUnsoldTokens() external onlyOwner nonReentrant {
        require(finalized || refundsAvailable(), "Presale not finalized or refundable");
        uint256 balance = token.balanceOf(address(this));
        uint256 unsold = balance - tokensReserved;
        require(unsold > 0, "Nothing unsold to withdraw");

        require(token.transfer(owner(), unsold), "Token transfer failed");
        emit UnsoldTokensWithdrawn(owner(), unsold);
    }

    // --- Failure path ---

    /// @notice Owner can cancel before finalize. Only opens refunds - never gives
    /// the owner access to contributor funds.
    function cancel() external onlyOwner {
        require(!finalized, "Already finalized, cannot cancel");
        require(!cancelled, "Already cancelled");
        cancelled = true;
        emit Cancelled();
    }

    /// @notice Anyone can trigger refund mode once the sale window has closed
    /// without hitting softcap - no owner action required.
    function refundsAvailable() public view returns (bool) {
        if (finalized) return false;
        if (cancelled) return true;
        return block.timestamp > endTime && weiRaised < softCap;
    }

    function claimRefund() external nonReentrant {
        require(refundsAvailable(), "Refunds not available");
        require(!refunded[msg.sender], "Already refunded");

        uint256 amount = contributions[msg.sender];
        require(amount > 0, "Nothing to refund");

        refunded[msg.sender] = true;
        contributions[msg.sender] = 0;
        tokensReserved -= tokensOwed[msg.sender];
        tokensOwed[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Refund transfer failed");

        emit RefundClaimed(msg.sender, amount);
    }

    // --- Admin: parameters can only change before any contribution comes in ---

    function updateRate(uint256 _rate) external onlyOwner {
        require(weiRaised == 0, "Cannot change rate after sale has started receiving funds");
        require(_rate > 0, "Rate must be > 0");
        rate = _rate;
    }

    function updateCaps(uint256 _softCap, uint256 _hardCap) external onlyOwner {
        require(weiRaised == 0, "Cannot change caps after sale has started receiving funds");
        require(_softCap > 0 && _softCap <= _hardCap, "Invalid caps");
        softCap = _softCap;
        hardCap = _hardCap;
    }

    function updateContributionLimits(uint256 _min, uint256 _max) external onlyOwner {
        require(weiRaised == 0, "Cannot change limits after sale has started receiving funds");
        require(_min > 0 && _min <= _max, "Invalid contribution limits");
        minContribution = _min;
        maxContribution = _max;
    }

    function updateSchedule(uint256 _startTime, uint256 _endTime) external onlyOwner {
        require(weiRaised == 0, "Cannot reschedule after sale has started receiving funds");
        require(_startTime >= block.timestamp, "Start time in the past");
        require(_endTime > _startTime, "End time must be after start time");
        startTime = _startTime;
        endTime = _endTime;
    }

    // --- View helpers ---

    function timeRemaining() external view returns (uint256) {
        if (block.timestamp >= endTime) return 0;
        return endTime - block.timestamp;
    }

    function softCapReached() external view returns (bool) {
        return weiRaised >= softCap;
    }
}
