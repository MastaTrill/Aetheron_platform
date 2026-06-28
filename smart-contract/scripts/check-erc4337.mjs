import { ethers } from "ethers";

// Try to use Stackup's free ERC-4337 bundler on Polygon
// The AETH owner (0x8A3ad496...) is an ERC-4337 smart contract
// We can try to send a UserOperation through a free bundler

const provider = new ethers.JsonRpcProvider("https://polygon.drpc.org");
const OWNER = "0x8A3ad49656Bd07981C9CFc7aD826a808847c3452";
const DEPLOYER = "0xF941B28F3B4188c473a4C8C78845ebab58654BA6";
const AETH = "0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e";

// EntryPoint v0.7 on Polygon
const ENTRY_POINT = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

async function main() {
    // Check if the smart wallet has any native balance
    const balance = await provider.getBalance(OWNER);
    console.log("Owner MATIC:", ethers.formatEther(balance));

    // Check the smart wallet nonce
    try {
        const nonce = await provider.getStorage(OWNER, 0);
        console.log("Storage slot 0 (possible nonce):", nonce);
    } catch (e) {}

    // Check recent transactions from this wallet
    const count = await provider.getTransactionCount(OWNER);
    console.log("Transaction count:", count);

    // Check if it's an ERC-4337 account by looking at the implementation
    const code = await provider.getCode(OWNER);
    console.log("Is contract:", code.length > 2);
    console.log("Code:", code);

    // Try calling validateUserOp or similar
    const entryAbi = [
        "function getNonce(address, uint192) view returns (uint256)",
        "function balanceOf(address) view returns (uint256)",
    ];
    const entry = new ethers.Contract(ENTRY_POINT, entryAbi, provider);
    
    try {
        const nonce = await entry.getNonce(OWNER, 0);
        console.log("ERC-4337 nonce:", nonce.toString());
    } catch (e) {
        console.log("Not an ERC-4337 account or wrong entry point:", e.message.slice(0, 80));
    }

    try {
        const deposit = await entry.balanceOf(OWNER);
        console.log("EntryPoint deposit:", ethers.formatEther(deposit));
    } catch (e) {
        console.log("No EntryPoint deposit");
    }
}

main().catch(console.error);
