// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract AetheronStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant MIN_CLAIM_REWARD = 1e15;
    uint256 public constant MIN_STAKING_PERIOD = 1 hours;

    IERC20 public immutable aetheronToken;

    mapping(uint256 => Pool) public pools;
    uint256 public poolCount;
    mapping(address => Stake[]) public userStakes;
    uint256 public totalStaked;
    uint256 public rewardBalance;

    event PoolCreated(uint256 indexed poolId, uint256 lockDuration, uint256 rewardRate);
    event Staked(address indexed user, uint256 indexed poolId, uint256 amount);
    event Unstaked(address indexed user, uint256 indexed stakeId, uint256 amount);
    event RewardClaimed(address indexed user, uint256 indexed stakeId, uint256 reward);
    event RewardDeposited(uint256 amount);
    event EmergencyUnstaked(address indexed user, uint256 indexed stakeId, uint256 amount);

    struct Pool {
        uint256 lockDuration;
        uint256 rewardRate;
        uint256 totalStaked;
        bool isActive;
    }

    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 lastClaimTime;
        uint256 poolId;
    }

    constructor(address _aetheronToken) {
        require(_aetheronToken != address(0), "Invalid token address");
        aetheronToken = IERC20(_aetheronToken);
        _createPool(30 days, 500);
        _createPool(90 days, 1200);
        _createPool(180 days, 2500);
    }

    function createPool(uint256 lockDuration, uint256 rewardRate) external onlyOwner {
        _createPool(lockDuration, rewardRate);
    }

    function _createPool(uint256 lockDuration, uint256 rewardRate) internal {
        require(rewardRate <= 10000, "Reward rate too high");
        pools[poolCount] = Pool({
            lockDuration: lockDuration,
            rewardRate: rewardRate,
            totalStaked: 0,
            isActive: true
        });
        emit PoolCreated(poolCount, lockDuration, rewardRate);
        poolCount++;
    }

    function updatePoolStatus(uint256 poolId, bool isActive) external onlyOwner {
        require(poolId < poolCount, "Invalid pool");
        pools[poolId].isActive = isActive;
    }

    function stake(uint256 poolId, uint256 amount) external nonReentrant {
        require(poolId < poolCount, "Invalid pool");
        require(pools[poolId].isActive, "Pool not active");
        require(amount > 0, "Cannot stake 0");

        Pool storage pool = pools[poolId];
        uint256 balanceBefore = aetheronToken.balanceOf(address(this));

        // Effects are committed before the token callback. Any failed transfer or
        // unsupported fee-on-transfer behavior reverts the entire transaction.
        userStakes[msg.sender].push(
            Stake({
                amount: amount,
                startTime: block.timestamp,
                lastClaimTime: block.timestamp,
                poolId: poolId
            })
        );
        pool.totalStaked += amount;
        totalStaked += amount;

        aetheronToken.safeTransferFrom(msg.sender, address(this), amount);
        require(
            aetheronToken.balanceOf(address(this)) - balanceBefore == amount,
            "Unsupported fee-on-transfer token"
        );

        emit Staked(msg.sender, poolId, amount);
    }

    function calculateReward(address user, uint256 stakeId) public view returns (uint256) {
        require(stakeId < userStakes[user].length, "Invalid stake");
        Stake memory userStake = userStakes[user][stakeId];
        Pool memory pool = pools[userStake.poolId];
        uint256 stakingDuration = block.timestamp - userStake.lastClaimTime;
        return (userStake.amount * pool.rewardRate * stakingDuration) / (365 days * 10000);
    }

    function claimRewards(uint256 stakeId) external nonReentrant {
        require(stakeId < userStakes[msg.sender].length, "Invalid stake");
        uint256 reward = calculateReward(msg.sender, stakeId);
        require(reward >= MIN_CLAIM_REWARD, "No rewards available");
        require(reward <= rewardBalance, "Insufficient reward balance");

        userStakes[msg.sender][stakeId].lastClaimTime = block.timestamp;
        rewardBalance -= reward;
        aetheronToken.safeTransfer(msg.sender, reward);
        emit RewardClaimed(msg.sender, stakeId, reward);
    }

    function unstake(uint256 stakeId) external nonReentrant {
        require(stakeId < userStakes[msg.sender].length, "Invalid stake");

        Stake memory userStake = userStakes[msg.sender][stakeId];
        Pool storage pool = pools[userStake.poolId];
        require(
            block.timestamp >= userStake.startTime + MIN_STAKING_PERIOD,
            "Minimum staking period not met"
        );
        require(
            block.timestamp >= userStake.startTime + pool.lockDuration,
            "Stake still locked"
        );

        uint256 amount = userStake.amount;
        uint256 reward = calculateReward(msg.sender, stakeId);
        if (reward > 0 && reward <= rewardBalance) {
            rewardBalance -= reward;
            amount += reward;
            emit RewardClaimed(msg.sender, stakeId, reward);
        }

        pool.totalStaked -= userStake.amount;
        totalStaked -= userStake.amount;
        _removeStake(msg.sender, stakeId);

        aetheronToken.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, stakeId, amount);
    }

    function emergencyUnstake(uint256 stakeId) external nonReentrant {
        require(stakeId < userStakes[msg.sender].length, "Invalid stake");

        Stake memory userStake = userStakes[msg.sender][stakeId];
        Pool storage pool = pools[userStake.poolId];
        pool.totalStaked -= userStake.amount;
        totalStaked -= userStake.amount;
        _removeStake(msg.sender, stakeId);

        aetheronToken.safeTransfer(msg.sender, userStake.amount);
        emit EmergencyUnstaked(msg.sender, stakeId, userStake.amount);
    }

    function _removeStake(address user, uint256 stakeId) internal {
        uint256 lastIndex = userStakes[user].length - 1;
        if (stakeId != lastIndex) {
            userStakes[user][stakeId] = userStakes[user][lastIndex];
        }
        userStakes[user].pop();
    }

    function depositRewards(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Cannot deposit 0");
        uint256 balanceBefore = aetheronToken.balanceOf(address(this));
        aetheronToken.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = aetheronToken.balanceOf(address(this)) - balanceBefore;
        require(received == amount, "Unsupported fee-on-transfer token");
        rewardBalance += received;
        emit RewardDeposited(received);
    }

    function getUserStakesCount(address user) external view returns (uint256) {
        return userStakes[user].length;
    }

    function getUserStake(address user, uint256 stakeId)
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

    function emergencyWithdraw(address token, uint256 amount) external onlyOwner nonReentrant {
        if (token == address(0)) {
            (bool sent, ) = payable(owner()).call{value: amount}("");
            require(sent, "ETH withdrawal failed");
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }
}