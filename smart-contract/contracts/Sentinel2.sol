// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Sentinel2
 * @notice Sovereign Baseline throughput and health beacon for Aetheron L3.
 */
contract Sentinel2 {
    uint256 public constant TARGET_TPS = 10_000;

    address public steward;
    uint256 public heartbeat;
    string public baselineName;

    event HeartbeatUpdated(uint256 timestamp);
    event BaselineNameUpdated(string baselineName);
    event StewardTransferred(address indexed previousSteward, address indexed newSteward);

    error OnlySteward();
    error ZeroAddressSteward();

    modifier onlySteward() {
        if (msg.sender != steward) revert OnlySteward();
        _;
    }

    constructor(string memory name_) {
        steward = msg.sender;
        baselineName = name_;
        heartbeat = block.timestamp;
    }

    function updateHeartbeat() external onlySteward {
        heartbeat = block.timestamp;
        emit HeartbeatUpdated(heartbeat);
    }

    function setBaselineName(string calldata name_) external onlySteward {
        baselineName = name_;
        emit BaselineNameUpdated(name_);
    }

    function transferSteward(address newSteward) external onlySteward {
        if (newSteward == address(0)) revert ZeroAddressSteward();

        address oldSteward = steward;
        steward = newSteward;

        emit StewardTransferred(oldSteward, newSteward);
    }
}
