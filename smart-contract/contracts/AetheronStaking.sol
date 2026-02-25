/*
============================
 SECURITY REVIEW CHECKLIST
============================
- [ ] Ensure all external calls use reentrancy guards (nonReentrant modifier).
- [ ] Validate all arithmetic uses SafeMath or Solidity ^0.8+ built-in checks.
- [ ] Confirm onlyOwner/admin functions are properly restricted.
- [ ] Check for proper event emission on all state-changing actions.
- [ ] Review for potential front-running or MEV attack vectors.
- [ ] Ensure minimum claimable reward logic prevents dust attacks.
- [ ] Validate all user input and external contract addresses.
- [ ] Confirm withdrawal and claim logic cannot be bypassed or manipulated.
- [ ] Review for gas griefing or denial-of-service vectors.
- [ ] Document any known limitations or trade-offs.

============================
 FEATURE PLANNING TEMPLATE
============================
Feature Name:
Description:
User Story / Benefit:
Security Considerations:
Implementation Steps:
Test Cases:
Priority:
Status:
*/

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title AetheronStaking
 * @dev Staking contract for AETH tokens with rewards
 * @notice
 * - SECURITY NOTE: This contract uses block.timestamp for time-based calculations.
 *   While miners can manipulate timestamps within ~15 seconds, this is acceptable for staking
 *   periods measured in days/months. For production use, consider additional time-based security measures.
 * - MINIMUM CLAIMABLE REWARD: To prevent dust claims due to small time differences between staking and claiming,
 *   users can only claim rewards if the amount is at least MIN_CLAIM_REWARD (default: 0.001 token).
 *   This ensures only meaningful rewards can be claimed and avoids unnecessary transactions.
 */
contract AetheronStaking is Ownable, ReentrancyGuard {
        constructor(address _aetheronToken) {
            require(_aetheronToken != address(0), "Invalid token address");
            aetheronToken = IERC20(_aetheronToken);
            // Create default pools
            _createPool(30 days, 500); // 30 days, 5% APY
            _createPool(90 days, 1200); // 90 days, 12% APY
            _createPool(180 days, 2500); // 180 days, 25% APY
        }
    uint256 public constant MIN_CLAIM_REWARD = 1e15; // 0.001 token (adjust as needed)
    uint256 public constant MIN_STAKING_PERIOD = 1 hours;
    using SafeERC20 for IERC20;
    IERC20 public immutable aetheronToken;

    // State variables
    mapping(uint256 => Pool) public pools;
    uint256 public poolCount;
    mapping(address => Stake[]) public userStakes;
    uint256 public totalStaked;
    uint256 public rewardBalance;

    // Events
    event PoolCreated(
        uint256 indexed poolId,
        uint256 lockDuration,
        uint256 rewardRate
    );
    event Staked(address indexed user, uint256 indexed poolId, uint256 amount);
    event Unstaked(
        address indexed user,
        uint256 indexed stakeId,
        uint256 amount
    );
    event RewardClaimed(
        address indexed user,
        uint256 indexed stakeId,
        uint256 reward
    );
    event RewardDeposited(uint256 amount);
    event EmergencyUnstaked(
        address indexed user,
        uint256 indexed stakeId,
        uint256 amount
    );

    // Staking pool info
    struct Pool {
        uint256 lockDuration; // Lock duration in seconds
        uint256 rewardRate; // APY in basis points (100 = 1%)
        uint256 totalStaked;
        bool isActive;
    }

    // User stake info
    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 lastClaimTime;
        uint256 poolId;
    }

    /**
     * @dev Create a new staking pool
     */
    function createPool(
        uint256 lockDuration,
        uint256 rewardRate
    ) external onlyOwner {
        _createPool(lockDuration, rewardRate);
    }

    function _createPool(uint256 lockDuration, uint256 rewardRate) internal {
        require(rewardRate <= 10000, "Reward rate too high"); // Max 100% APY

        pools[poolCount] = Pool({
            lockDuration: lockDuration,
            rewardRate: rewardRate,
            totalStaked: 0,
            isActive: true
        });

        emit PoolCreated(poolCount, lockDuration, rewardRate);
        poolCount++;
    }

    /**
     * @dev Update pool status
     */
    function updatePoolStatus(
        uint256 poolId,
        bool isActive
    ) external onlyOwner {
        require(poolId < poolCount, "Invalid pool");
        pools[poolId].isActive = isActive;
    }

    /**
     * @dev Stake tokens in a pool
     */
    function stake(uint256 poolId, uint256 amount) external nonReentrant {
        require(poolId < poolCount, "Invalid pool");
        require(pools[poolId].isActive, "Pool not active");
        require(amount > 0, "Cannot stake 0");

        Pool storage pool = pools[poolId];

        // Transfer tokens from user
        aetheronToken.safeTransferFrom(msg.sender, address(this), amount);

        // Create stake record
        userStakes[msg.sender].push(
            Stake({
                amount: amount,
                startTime: block.timestamp,
                lastClaimTime: block.timestamp,
                poolId: poolId
            })
        );

        // Update totals
        pool.totalStaked += amount;
        totalStaked += amount;

        emit Staked(msg.sender, poolId, amount);
    }

    /**
     * @dev Calculate pending rewards for a stake
     */
    function calculateReward(
        address user,
        uint256 stakeId
    ) public view returns (uint256) {
        require(stakeId < userStakes[user].length, "Invalid stake");

        Stake memory userStake = userStakes[user][stakeId];
        Pool memory pool = pools[userStake.poolId];

        uint256 stakingDuration = block.timestamp - userStake.lastClaimTime;
        uint256 reward = (userStake.amount *
            pool.rewardRate *
            stakingDuration) / (365 days * 10000);

        return reward;
    }

    /**
     * @dev Claim rewards for a stake
     */
    function claimRewards(uint256 stakeId) external nonReentrant {
        require(stakeId < userStakes[msg.sender].length, "Invalid stake");
        uint256 reward = calculateReward(msg.sender, stakeId);
        require(reward >= MIN_CLAIM_REWARD, "No rewards available");
        require(reward <= rewardBalance, "Insufficient reward balance");
        // Update last claim time
        userStakes[msg.sender][stakeId].lastClaimTime = block.timestamp;
        rewardBalance -= reward;
        // Transfer reward
        aetheronToken.safeTransfer(msg.sender, reward);
        emit RewardClaimed(msg.sender, stakeId, reward);
    }

    /**
     * @dev Unstake tokens
     */
    function unstake(uint256 stakeId) external nonReentrant {
        require(stakeId < userStakes[msg.sender].length, "Invalid stake");

        Stake memory userStake = userStakes[msg.sender][stakeId];
        Pool storage pool = pools[userStake.poolId];

        // Check minimum staking period to prevent timestamp manipulation
        require(
            block.timestamp >= userStake.startTime + MIN_STAKING_PERIOD,
            "Minimum staking period not met"
        );
        require(
            block.timestamp >= userStake.startTime + pool.lockDuration,
            "Stake still locked"
        );

        uint256 amount = userStake.amount;

        // Claim any pending rewards
        uint256 reward = calculateReward(msg.sender, stakeId);
        if (reward > 0 && reward <= rewardBalance) {
            rewardBalance -= reward;
            amount += reward;
            emit RewardClaimed(msg.sender, stakeId, reward);
        }

        // Update totals
        pool.totalStaked -= userStake.amount;
        totalStaked -= userStake.amount;

        // Remove stake (move last stake to this position)
        uint256 lastIndex = userStakes[msg.sender].length - 1;
        if (stakeId != lastIndex) {
            userStakes[msg.sender][stakeId] = userStakes[msg.sender][lastIndex];
        }
        userStakes[msg.sender].pop();

        // Transfer tokens back
        aetheronToken.safeTransfer(msg.sender, amount);

        emit Unstaked(msg.sender, stakeId, amount);
    }

    /**
     * @dev Emergency unstake: allows user to withdraw staked tokens without rewards, bypassing lock and minimum period checks.
     *      Use only if contract is malfunctioning or in an emergency. No rewards are paid.
     */
    function emergencyUnstake(uint256 stakeId) external nonReentrant {
        require(stakeId < userStakes[msg.sender].length, "Invalid stake");
        require(userStakes[msg.sender].length > 0, "No stakes to remove");
        Stake storage userStake = userStakes[msg.sender][stakeId];
        Pool storage pool = pools[userStake.poolId];

        uint256 amount = userStake.amount;

        // Update totals
        pool.totalStaked -= userStake.amount;
        totalStaked -= userStake.amount;

        // Remove stake (move last stake to this position)
        uint256 lastIndex = userStakes[msg.sender].length - 1;
        if (stakeId != lastIndex) {
            userStakes[msg.sender][stakeId] = userStakes[msg.sender][lastIndex];
        }
        userStakes[msg.sender].pop();

        // Transfer tokens back (no rewards)
        aetheronToken.safeTransfer(msg.sender, amount);

        emit EmergencyUnstaked(msg.sender, stakeId, amount);
    }

    /**
     * @dev Deposit rewards into the contract
     */
    function depositRewards(uint256 amount) external onlyOwner {
        require(amount > 0, "Cannot deposit 0");
        aetheronToken.safeTransferFrom(msg.sender, address(this), amount);
        rewardBalance += amount;
        emit RewardDeposited(amount);
    }

    /**
     * @dev Get user stakes count
     */
    function getUserStakesCount(address user) external view returns (uint256) {
        return userStakes[user].length;
    }

    /**
     * @dev Get user stake details
     */
    function getUserStake(
        address user,
        uint256 stakeId
    )
        external
        view
        returns (
            uint256 amount,
            uint256 startTime,
            uint256 lastClaimTime,
            uint256 poolId,
            uint256 pendingReward,
            uint256 unlockTime
        )
    {
        require(stakeId < userStakes[user].length, "Invalid stake");

        Stake memory userStake = userStakes[user][stakeId];
        Pool memory pool = pools[userStake.poolId];

        return (
            userStake.amount,
            userStake.startTime,
            userStake.lastClaimTime,
            userStake.poolId,
            calculateReward(user, stakeId),
            userStake.startTime + pool.lockDuration
        );
    }

    /**
     * @dev Emergency withdraw (owner only)
     */
    function emergencyWithdraw(
        address token,
        uint256 amount
    ) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }
}
