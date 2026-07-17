// aetheron-blockchain.js
// Aetheron Blockchain - Core Implementation with PoS Consensus

const crypto = require('crypto');

class Transaction {
  constructor(
    sender,
    receiver,
    amount,
    signature = null,
    timestamp = Date.now(),
  ) {
    this.sender = sender;
    this.receiver = receiver;
    this.amount = amount;
    this.signature = signature;
    this.timestamp = timestamp;
  }

  async calculateHash() {
    const data = this.sender + this.receiver + this.amount + this.timestamp;
    return await SHA256(data);
  }

  async sign(privateKey) {
    const transactionHash = await this.calculateHash();
    this.signature = await signData(transactionHash, privateKey);
  }

  async verify() {
    if (!this.signature || !this.sender) return false;
    const transactionHash = await this.calculateHash();
    return await verifySignature(this.signature, transactionHash, this.sender);
  }

  static createCoinbase(to, amount) {
    return new Transaction("COINBASE", to, amount, "COINBASE_SIGNATURE");
  }
}

class Block {
  constructor(
    timestamp,
    transactions,
    previousHash = "",
    validator = null,
    blockNumber = 0,
  ) {
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.hash = null;
    this.nonce = 0;
    this.validator = validator;
    this.blockNumber = blockNumber;
    this.size = 0;
  }

  async calculateHash() {
    const data =
      this.timestamp +
      this.previousHash +
      JSON.stringify(this.transactions) +
      this.nonce +
      this.validator +
      this.blockNumber;
    return await SHA256(data);
  }

  async mine(difficulty = 2) {
    const target = "0".repeat(difficulty);
    while (!this.hash || !this.hash.startsWith(target)) {
      this.nonce++;
      this.hash = await this.calculateHash();
    }
    this.size = JSON.stringify(this).length;
  }

  async validate(stake) {
    if (!this.hash.startsWith("00") || stake <= 0) return false;
    for (const tx of this.transactions) {
      if (tx.sender !== "COINBASE" && !(await tx.verify())) return false;
    }
    return true;
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.pendingTransactions = [];
    this.validators = {};
    this.validatorHistory = {};
    this.minStake = 100;
    this.blockReward = 10;
    this.slashPercentage = 0.05;
    this.difficulty = 2;
    this.maxTransactionsPerBlock = 100;
  }

  createGenesisBlock() {
    const genesis = new Block(Date.now(), [], "0", "GENESIS", 0);
    genesis.hash = "0000genesis0aetheron0blockchain0initialized";
    return genesis;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  async addTransaction(transaction) {
    if (
      !transaction.sender ||
      !transaction.receiver ||
      transaction.amount <= 0
    ) {
      throw new Error("Invalid transaction");
    }
    if (transaction.sender !== "COINBASE" && !(await transaction.verify())) {
      throw new Error("Invalid transaction signature");
    }

    if (this.pendingTransactions.length >= this.maxTransactionsPerBlock) {
      await this.createBlock();
    }

    this.pendingTransactions.push(transaction);
    return this.pendingTransactions.length;
  }

  registerValidator(address, stake) {
    if (stake < this.minStake) {
      throw new Error(`Minimum stake is ${this.minStake}`);
    }
    this.validators[address] = {
      stake,
      lastBlock: 0,
      uptime: 100,
      totalValidated: 0,
      slashed: 0,
    };
    this.validatorHistory[address] = [];
    console.log(
      `Validator ${address.substring(0, 10)}... registered with ${stake} AETH`,
    );
  }

  selectValidator() {
    const entries = Object.entries(this.validators);
    if (entries.length === 0) throw new Error("No validators");

    const totalStake = entries.reduce((sum, [, v]) => sum + v.stake, 0);
    const weighted = [];

    entries.forEach(([addr, { stake }]) => {
      const weight = Math.ceil((stake / totalStake) * 1000);
      for (let i = 0; i < weight; i++) weighted.push(addr);
    });

    return weighted[Math.floor(Math.random() * weighted.length)];
  }

  async createBlock() {
    if (Object.keys(this.validators).length === 0) {
      throw new Error("No validators registered");
    }

    const validator = this.selectValidator();
    const prevHash = this.getLatestBlock().hash;
    const blockNumber = this.chain.length;

    const block = new Block(
      Date.now(),
      [...this.pendingTransactions],
      prevHash,
      validator,
      blockNumber,
    );

    await block.mine(this.difficulty);

    if (!(await block.validate(this.validators[validator].stake))) {
      this.slashValidator(validator, blockNumber);
      throw new Error("Block validation failed - validator slashed");
    }

    this.chain.push(block);

    this.validators[validator].stake += this.blockReward;
    this.validators[validator].lastBlock = blockNumber;
    this.validators[validator].totalValidated++;

    this.validatorHistory[validator].push({
      blockNumber,
      hash: block.hash,
      txCount: block.transactions.length,
      reward: this.blockReward,
      timestamp: Date.now(),
    });

    this.pendingTransactions = [];

    console.log(
      `Block #${blockNumber} created by ${validator.substring(0, 10)}...`,
    );
    return block;
  }

  slashValidator(address, blockNumber) {
    if (!this.validators[address]) return;

    this.validators[address].stake *= 1 - this.slashPercentage;
    this.validators[address].slashed++;

    this.validatorHistory[address].push({
      blockNumber,
      slashed: true,
      slashAmount: this.validators[address].stake * this.slashPercentage,
    });

    console.log(`⚠️ Validator ${address.substring(0, 10)}... slashed!`);

    if (this.validators[address].stake < this.minStake) {
      delete this.validators[address];
      console.log(`Validator removed - stake below minimum`);
    }
  }

  async isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      const recalculatedHash = await current.calculateHash();
      if (current.hash !== recalculatedHash) return false;
      if (current.previousHash !== previous.hash) return false;

      for (const tx of current.transactions) {
        if (tx.sender !== "COINBASE" && !(await tx.verify())) return false;
      }
    }
    return true;
  }

  getBalance(address) {
    let balance = 0;

    this.chain.forEach((block) => {
      block.transactions.forEach((tx) => {
        if (tx.receiver === address) balance += tx.amount;
        if (tx.sender === address) balance -= tx.amount;
      });
    });

    return balance;
  }

  getTransactionHistory(address) {
    const history = [];

    this.chain.forEach((block) => {
      block.transactions.forEach((tx) => {
        if (tx.sender === address || tx.receiver === address) {
          history.push({
            ...tx,
            blockNumber: block.blockNumber,
            hash: block.hash,
          });
        }
      });
    });

    return history;
  }

  getStats() {
    return {
      chainLength: this.chain.length,
      totalTransactions: this.chain.reduce(
        (sum, b) => sum + b.transactions.length,
        0,
      ),
      validators: Object.keys(this.validators).length,
      totalStaked: Object.values(this.validators).reduce(
        (sum, v) => sum + v.stake,
        0,
      ),
      pendingTx: this.pendingTransactions.length,
      isValid: "Unknown (run isChainValid)",
    };
  }
}

async function generateKeyPair() {
  return { privateKey: "mock_private_key", publicKey: "mock_public_key" };
}

async function signData(data, privateKeyJwk) {
  return "valid_sig";
}

async function verifySignature(signatureHex, data, publicKeyJwk) {
  return signatureHex === "valid_sig";
}

async function SHA256(message) {
  return crypto.createHash('sha256').update(message).digest('hex');
}

module.exports = { Blockchain, Transaction, Block, generateKeyPair, signData, verifySignature, SHA256 };
