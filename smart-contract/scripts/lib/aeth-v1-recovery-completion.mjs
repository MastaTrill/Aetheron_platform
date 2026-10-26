import { Interface, getAddress, id, zeroPadValue } from "ethers";

export const WITHDRAW_UNSOLD_SELECTOR = "0xc8bdbfb6";
export const TRANSFER_TOPIC = id("Transfer(address,address,uint256)");
const TX_HASH_PATTERN = /^0x[0-9a-fA-F]{64}$/;

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

/**
 * Validates the ledger's recoveryCompleted record shape and returns normalized values.
 */
export function parseRecoveryCompleted(record, owner) {
  requireCondition(record && typeof record === "object", "recoveryCompleted must be an object");
  requireCondition(TX_HASH_PATTERN.test(record.txHash || ""), "recoveryCompleted.txHash must be a 32-byte hex hash");
  requireCondition(Number.isInteger(record.blockNumber) && record.blockNumber > 0, "recoveryCompleted.blockNumber must be a positive integer");
  requireCondition(typeof record.completedAt === "string" && !Number.isNaN(Date.parse(record.completedAt)), "recoveryCompleted.completedAt must be an ISO timestamp");
  requireCondition(/^[0-9]+$/.test(record.amountTokens || ""), "recoveryCompleted.amountTokens must be a whole-token decimal string");
  requireCondition(record.method === "withdrawUnsoldTokens()", "recoveryCompleted.method must be withdrawUnsoldTokens()");
  const recipient = getAddress(record.recipient);
  requireCondition(recipient === owner, "recoveryCompleted.recipient must be the deployment owner");
  const amountWei = BigInt(record.amountTokens) * 10n ** 18n;
  requireCondition(amountWei > 0n, "recoveryCompleted.amountTokens must be positive");
  return { txHash: record.txHash.toLowerCase(), blockNumber: record.blockNumber, completedAt: record.completedAt, amountWei, recipient };
}

/**
 * Pure check of on-chain evidence for an already-completed recovery. Throws on any mismatch.
 * tx/receipt are ethers TransactionResponse/TransactionReceipt-like objects (or plain mocks).
 */
export function evaluateCompletedRecovery({ completed, tx, receipt, presaleAddress, tokenAddress, owner, presaleBalance, ownerBalance }) {
  requireCondition(tx, `Recovery tx ${completed.txHash} not found on Base`);
  requireCondition(receipt, `Recovery tx receipt ${completed.txHash} not found on Base`);
  requireCondition(String(tx.hash).toLowerCase() === completed.txHash, "Recovery tx hash mismatch");
  requireCondition(Number(receipt.status) === 1, `Recovery tx ${completed.txHash} did not succeed (status ${receipt.status})`);
  requireCondition(Number(receipt.blockNumber) === completed.blockNumber, `Recovery tx block mismatch: ledger ${completed.blockNumber}, chain ${receipt.blockNumber}`);
  requireCondition(tx.to && getAddress(tx.to) === presaleAddress, "Recovery tx does not target the replacement presale");
  requireCondition(getAddress(tx.from) === owner, "Recovery tx was not sent by the deployment owner");
  const data = String(tx.data || tx.input || "").toLowerCase();
  requireCondition(data === WITHDRAW_UNSOLD_SELECTOR, `Recovery tx calldata is not withdrawUnsoldTokens() (${data.slice(0, 10)})`);

  const fromTopic = zeroPadValue(presaleAddress, 32).toLowerCase();
  const toTopic = zeroPadValue(owner, 32).toLowerCase();
  const tokenTransfers = (receipt.logs || []).filter((log) =>
    getAddress(log.address) === tokenAddress && String(log.topics?.[0]).toLowerCase() === TRANSFER_TOPIC);
  const matching = tokenTransfers.filter((log) =>
    String(log.topics[1]).toLowerCase() === fromTopic &&
    String(log.topics[2]).toLowerCase() === toTopic &&
    BigInt(log.data) === completed.amountWei);
  requireCondition(matching.length === 1, `Recovery tx must emit exactly one V1 Transfer of ${completed.amountWei} from presale to owner (found ${matching.length})`);
  requireCondition(tokenTransfers.length === 1, `Recovery tx emitted unexpected extra V1 Transfer logs (${tokenTransfers.length})`);

  requireCondition(presaleBalance === 0n, `Replacement presale V1 balance must be 0 after completed recovery, found ${presaleBalance}`);
  requireCondition(ownerBalance >= completed.amountWei, `Owner V1 balance ${ownerBalance} is below recovered amount ${completed.amountWei}`);
  return { transferLogIndex: Number(matching[0].index ?? matching[0].logIndex), txUrl: `https://basescan.org/tx/${completed.txHash}` };
}

export const ERC20_TRANSFER_IFACE = new Interface(["event Transfer(address indexed from, address indexed to, uint256 value)"]);
