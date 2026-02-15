// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AetheronGovernance
 * @dev On-chain governance system for Aetheron Platform
 * Features: Proposal creation with deposits, voting, delegation, and automatic execution
 */
contract AetheronGovernance is Ownable, ReentrancyGuard {
    IERC20 public aethToken;

    uint256 public proposalCount;
    uint256 public constant PROPOSAL_DEPOSIT = 10000 * 10 ** 18; // 10,000 AETH
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant EXECUTION_DELAY = 2 days;
    uint256 public constant QUORUM_PERCENTAGE = 20; // 20% of total supply

    enum ProposalState {
        Pending,
        Active,
        Defeated,
        Succeeded,
        Executed,
        Canceled
    }
    enum VoteType {
        Against,
        For,
        Abstain
    }

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        bool canceled;
        uint256 deposit;
        bytes executionData; // For automatic execution
    }

    struct Receipt {
        bool hasVoted;
        VoteType vote;
        uint256 votes;
    }

    // Proposal ID => Proposal
    mapping(uint256 => Proposal) public proposals;

    // Proposal ID => Voter address => Receipt
    mapping(uint256 => mapping(address => Receipt)) public receipts;

    // Delegator => Delegate
    mapping(address => address) public delegates;

    // Delegate => Voting power delegated to them
    mapping(address => uint256) public delegatedVotingPower;

    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        uint256 startTime,
        uint256 endTime
    );

    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        VoteType vote,
        uint256 votes
    );

    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);
    event DelegateChanged(address indexed delegator, address indexed delegate);

    constructor(address _aethToken) Ownable(msg.sender) {
        require(_aethToken != address(0), "Invalid token address");
        aethToken = IERC20(_aethToken);
    }

    /**
     * @dev Create a new proposal
     * Requires PROPOSAL_DEPOSIT to prevent spam
     */
    function createProposal(
        string memory title,
        string memory description,
        bytes memory executionData
    ) external nonReentrant returns (uint256) {
        require(bytes(title).length > 0, "Title required");
        require(bytes(description).length > 0, "Description required");

        // Transfer deposit from proposer
        require(
            aethToken.transferFrom(msg.sender, address(this), PROPOSAL_DEPOSIT),
            "Deposit transfer failed"
        );

        proposalCount++;
        uint256 proposalId = proposalCount;

        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.title = title;
        proposal.description = description;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + VOTING_PERIOD;
        proposal.deposit = PROPOSAL_DEPOSIT;
        proposal.executionData = executionData;

        emit ProposalCreated(
            proposalId,
            msg.sender,
            title,
            proposal.startTime,
            proposal.endTime
        );

        return proposalId;
    }

    /**
     * @dev Cast a vote on a proposal
     */
    function castVote(uint256 proposalId, VoteType vote) external {
        return _castVote(msg.sender, proposalId, vote);
    }

    /**
     * @dev Internal vote casting function
     */
    function _castVote(
        address voter,
        uint256 proposalId,
        VoteType vote
    ) internal {
        require(
            state(proposalId) == ProposalState.Active,
            "Proposal not active"
        );

        Receipt storage receipt = receipts[proposalId][voter];
        require(!receipt.hasVoted, "Already voted");

        uint256 votes = getVotingPower(voter);
        require(votes > 0, "No voting power");

        Proposal storage proposal = proposals[proposalId];

        if (vote == VoteType.Against) {
            proposal.againstVotes += votes;
        } else if (vote == VoteType.For) {
            proposal.forVotes += votes;
        } else {
            proposal.abstainVotes += votes;
        }

        receipt.hasVoted = true;
        receipt.vote = vote;
        receipt.votes = votes;

        emit VoteCast(voter, proposalId, vote, votes);
    }

    /**
     * @dev Delegate voting power to another address
     */
    function delegate(address delegatee) external {
        require(delegatee != address(0), "Invalid delegate");
        require(delegatee != msg.sender, "Cannot self-delegate");

        address currentDelegate = delegates[msg.sender];

        // Remove voting power from old delegate
        if (currentDelegate != address(0)) {
            uint256 oldPower = getOwnVotingPower(msg.sender);
            delegatedVotingPower[currentDelegate] -= oldPower;
        }

        // Add voting power to new delegate
        delegates[msg.sender] = delegatee;
        uint256 newPower = getOwnVotingPower(msg.sender);
        delegatedVotingPower[delegatee] += newPower;

        emit DelegateChanged(msg.sender, delegatee);
    }

    /**
     * @dev Execute a successful proposal
     */
    function execute(uint256 proposalId) external nonReentrant {
        require(
            state(proposalId) == ProposalState.Succeeded,
            "Proposal not succeeded"
        );

        Proposal storage proposal = proposals[proposalId];
        proposal.executed = true;

        // Return deposit to proposer
        require(
            aethToken.transfer(proposal.proposer, proposal.deposit),
            "Deposit return failed"
        );

        // Execute proposal logic (if any)
        if (proposal.executionData.length > 0) {
            // This would call specific functions based on executionData
            // For security, only allow whitelisted function calls
            // Implementation depends on your specific governance needs
        }

        emit ProposalExecuted(proposalId);
    }

    /**
     * @dev Cancel a proposal (only proposer or owner)
     */
    function cancel(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(
            msg.sender == proposal.proposer || msg.sender == owner(),
            "Not authorized"
        );
        require(!proposal.executed, "Already executed");

        proposal.canceled = true;

        // Return deposit
        require(
            aethToken.transfer(proposal.proposer, proposal.deposit),
            "Deposit return failed"
        );

        emit ProposalCanceled(proposalId);
    }

    /**
     * @dev Get current state of a proposal
     */
    function state(uint256 proposalId) public view returns (ProposalState) {
        Proposal storage proposal = proposals[proposalId];

        if (proposal.canceled) {
            return ProposalState.Canceled;
        }

        if (proposal.executed) {
            return ProposalState.Executed;
        }

        if (block.timestamp < proposal.startTime) {
            return ProposalState.Pending;
        }

        if (block.timestamp <= proposal.endTime) {
            return ProposalState.Active;
        }

        // Check if quorum reached
        uint256 totalVotes = proposal.forVotes +
            proposal.againstVotes +
            proposal.abstainVotes;
        uint256 quorum = (aethToken.totalSupply() * QUORUM_PERCENTAGE) / 100;

        if (totalVotes < quorum) {
            return ProposalState.Defeated;
        }

        if (proposal.forVotes > proposal.againstVotes) {
            return ProposalState.Succeeded;
        }

        return ProposalState.Defeated;
    }

    /**
     * @dev Get voting power of an address (balance + delegated power)
     */
    function getVotingPower(address account) public view returns (uint256) {
        // Check if delegated to someone else
        if (delegates[account] != address(0)) {
            return 0; // Delegated their power away
        }

        return getOwnVotingPower(account) + delegatedVotingPower[account];
    }

    /**
     * @dev Get own voting power (just balance, no delegations)
     */
    function getOwnVotingPower(address account) public view returns (uint256) {
        return aethToken.balanceOf(account);
    }

    /**
     * @dev Get proposal details
     */
    function getProposal(
        uint256 proposalId
    )
        external
        view
        returns (
            address proposer,
            string memory title,
            string memory description,
            uint256 forVotes,
            uint256 againstVotes,
            uint256 abstainVotes,
            uint256 startTime,
            uint256 endTime,
            ProposalState currentState
        )
    {
        Proposal storage proposal = proposals[proposalId];
        proposer = proposal.proposer;
        title = proposal.title;
        description = proposal.description;
        forVotes = proposal.forVotes;
        againstVotes = proposal.againstVotes;
        abstainVotes = proposal.abstainVotes;
        startTime = proposal.startTime;
        endTime = proposal.endTime;
        currentState = state(proposalId);
    }

    /**
     * @dev Check if an address has voted
     */

    function hasVotedForProposal(
        uint256 proposalId,
        address voter
    ) external view returns (bool) {
        return receipts[proposalId][voter].hasVoted;
    }

    /**
     * @dev Get vote receipt for a voter
     */
    function getReceipt(
        uint256 proposalId,
        address voter
    ) external view returns (bool hasVoted, VoteType vote, uint256 votes) {
        Receipt storage receipt = receipts[proposalId][voter];
        return (receipt.hasVoted, receipt.vote, receipt.votes);
    }
}
