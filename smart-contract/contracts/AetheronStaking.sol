// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AetheronStaking
 * @dev Staking contract for AETH tokens with rewards
 */
contract AetheronStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    IERC20 public immutable aetheronToken;
    
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
    
    // State variables
    mapping(uint256 => Pool) public pools;
    mapping(address => Stake[]) public userStakes;
    uint256 public poolCount;
    uint256 public totalStaked;
    uint256 public rewardBalance;
    
    // Events
    event PoolCreated(uint256 indexed poolId, uint256 lockDuration, uint256 rewardRate);
    event Staked(address indexed user, uint256 indexed poolId, uint256 amount);
    event Unstaked(address indexed user, uint256 indexed stakeId, uint256 amount);
    event RewardClaimed(address indexed user, uint256 indexed stakeId, uint256 reward);
    event RewardDeposited(uint256 amount);
    
    constructor(address _aetheronToken) Ownable(msg.sender) {
        require(_aetheronToken != address(0), "Invalid token address");
        aetheronToken = IERC20(_aetheronToken);
        
        // Create default pools
        _createPool(30 days, 500); // 30 days, 5% APY
        _createPool(90 days, 1200); // 90 days, 12% APY
        _createPool(180 days, 2500); // 180 days, 25% APY
    }
    
    /**
     * @dev Create a new staking pool
     */
    function createPool(uint256 _lockDuration, uint256 _rewardRate) external onlyOwner {
        _createPool(_lockDuration, _rewardRate);
    }
    
    function _createPool(uint256 _lockDuration, uint256 _rewardRate) internal {
        require(_rewardRate <= 10000, "Reward rate too high"); // Max 100% APY
        
        pools[poolCount] = Pool({
            lockDuration: _lockDuration,
            rewardRate: _rewardRate,
            totalStaked: 0,
            isActive: true
        });
        
        emit PoolCreated(poolCount, _lockDuration, _rewardRate);
        poolCount++;
    }
    
    /**
     * @dev Update pool status
     */
    function updatePoolStatus(uint256 _poolId, bool _isActive) external onlyOwner {
        require(_poolId < poolCount, "Invalid pool");
        pools[_poolId].isActive = _isActive;
    }
    
    /**
     * @dev Stake tokens in a pool
     */
    function stake(uint256 _poolId, uint256 _amount) external nonReentrant {
        require(_poolId < poolCount, "Invalid pool");
        require(pools[_poolId].isActive, "Pool not active");
        require(_amount > 0, "Cannot stake 0");
        
        Pool storage pool = pools[_poolId];
        
        // Transfer tokens from user
        aetheronToken.safeTransferFrom(msg.sender, address(this), _amount);
        
        // Create stake record
        userStakes[msg.sender].push(Stake({
            amount: _amount,
            startTime: block.timestamp,
            lastClaimTime: block.timestamp,
            poolId: _poolId
        }));
        
        // Update totals
        pool.totalStaked += _amount;
        totalStaked += _amount;
        
        emit Staked(msg.sender, _poolId, _amount);
    }
    
    /**
     * @dev Calculate pending rewards for a stake
     */
    function calculateReward(address _user, uint256 _stakeId) public view returns (uint256) {
        require(_stakeId < userStakes[_user].length, "Invalid stake");
        
        Stake memory userStake = userStakes[_user][_stakeId];
        Pool memory pool = pools[userStake.poolId];
        
        uint256 stakingDuration = block.timestamp - userStake.lastClaimTime;
        uint256 reward = (userStake.amount * pool.rewardRate * stakingDuration) / (365 days * 10000);
        
        return reward;
    }
    
    /**
     * @dev Claim rewards for a stake
     */
    function claimRewards(uint256 _stakeId) external nonReentrant {
        require(_stakeId < userStakes[msg.sender].length, "Invalid stake");
        
        uint256 reward = calculateReward(msg.sender, _stakeId);
        require(reward > 0, "No rewards available");
        require(reward <= rewardBalance, "Insufficient reward balance");
        
        // Update last claim time
        userStakes[msg.sender][_stakeId].lastClaimTime = block.timestamp;
        rewardBalance -= reward;
        
        // Transfer reward
        aetheronToken.safeTransfer(msg.sender, reward);
        
        emit RewardClaimed(msg.sender, _stakeId, reward);
    }
    
    /**
     * @dev Unstake tokens
     */
    function unstake(uint256 _stakeId) external nonReentrant {
        require(_stakeId < userStakes[msg.sender].length, "Invalid stake");
        
        Stake memory userStake = userStakes[msg.sender][_stakeId];
        Pool storage pool = pools[userStake.poolId];
        
        require(block.timestamp >= userStake.startTime + pool.lockDuration, "Stake still locked");
        
        uint256 amount = userStake.amount;
        
        // Claim any pending rewards
        uint256 reward = calculateReward(msg.sender, _stakeId);
        if (reward > 0 && reward <= rewardBalance) {
            rewardBalance -= reward;
            amount += reward;
            emit RewardClaimed(msg.sender, _stakeId, reward);
        }
        
        // Update totals
        pool.totalStaked -= userStake.amount;
        totalStaked -= userStake.amount;
        
        // Remove stake (move last stake to this position)
        uint256 lastIndex = userStakes[msg.sender].length - 1;
        if (_stakeId != lastIndex) {
            userStakes[msg.sender][_stakeId] = userStakes[msg.sender][lastIndex];
        }
        userStakes[msg.sender].pop();
        
        // Transfer tokens back
        aetheronToken.safeTransfer(msg.sender, amount);
        
        emit Unstaked(msg.sender, _stakeId, amount);
    }
    
    /**
     * @dev Deposit rewards into the contract
     */
    function depositRewards(uint256 _amount) external onlyOwner {
        require(_amount > 0, "Cannot deposit 0");
        aetheronToken.safeTransferFrom(msg.sender, address(this), _amount);
        rewardBalance += _amount;
        emit RewardDeposited(_amount);
    }
    
    /**
     * @dev Get user stakes count
     */
    function getUserStakesCount(address _user) external view returns (uint256) {
        return userStakes[_user].length;
    }
    
    /**
     * @dev Get user stake details
     */
    function getUserStake(address _user, uint256 _stakeId) external view returns (
        uint256 amount,
        uint256 startTime,
        uint256 lastClaimTime,
        uint256 poolId,
        uint256 pendingReward,
        uint256 unlockTime
    ) {
        require(_stakeId < userStakes[_user].length, "Invalid stake");
        
        Stake memory userStake = userStakes[_user][_stakeId];
        Pool memory pool = pools[userStake.poolId];
        
        return (
            userStake.amount,
            userStake.startTime,
            userStake.lastClaimTime,
            userStake.poolId,
            calculateReward(_user, _stakeId),
            userStake.startTime + pool.lockDuration
        );
    }
    
    /**
     * @dev Emergency withdraw (owner only)
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        if (_token == address(0)) {
            payable(owner()).transfer(_amount);
        } else {
            IERC20(_token).safeTransfer(owner(), _amount);
        }
    }
}
