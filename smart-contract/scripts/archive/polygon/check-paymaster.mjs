import { ethers } from "ethers";
import { readFileSync } from "fs";

const provider = new ethers.JsonRpcProvider("https://polygon.drpc.org");

// The AETH owner is an ERC-4337 smart contract at 0x8A3ad49656Bd07981C9CFc7aD826a808847c3452
// It has 81M AETH but 0 MATIC
// We need to find a paymaster that accepts AETH for gas

// Let's check if the smart wallet can execute a deploy via ERC-4337 with a token paymaster
// The key is: can we find a paymaster that accepts AETH?

// First, let's understand the smart wallet better
const OWNER = "0x8A3ad49656Bd07981C9CFc7aD826a808847c3452";
const IMPL = "0x44c1d82ef1dc2961aeb825b3ca16e8b9e65396d1";

async function main() {
    // Check the implementation for execute function signature
    const implCode = await provider.getCode(IMPL);
    
    // Try to find the function selectors in the bytecode
    const selectors = {
        "execute(address,uint256,bytes)": "0x31c6c4cf",
        "executeBatch": "0xe0245bb3", 
        "validateUserOp": "0x1fad948c",
        "entryPoint": "0x570e1a36",
    };
    
    for (const [name, selector] of Object.entries(selectors)) {
        if (implCode.includes(selector.slice(2))) {
            console.log("Found:", name, selector);
        }
    }

    // Check if there's a token paymaster that accepts AETH
    // Pimlico has a token paymaster - let's check if AETH is supported
    const PIMLICO_API = "https://api.pimlico.io/v2/137/rpc?apikey=your-api-key";
    
    // Actually, let's try a different approach: use Pimlico's token paymaster
    // First check what tokens they support
    console.log("\nTrying Pimlico token paymaster...");
    
    try {
        const response = await fetch("https://api.pimlico.io/v1/137/tokens", {
            headers: { "Content-Type": "application/json" }
        });
        const tokens = await response.json();
        const aeth = tokens.find(t => t.address.toLowerCase() === "0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e".toLowerCase());
        if (aeth) {
            console.log("AETH is supported by Pimlico token paymaster!", aeth);
        } else {
            console.log("AETH not in Pimlico supported tokens list");
            // Check first few tokens
            console.log("Sample tokens:", tokens.slice(0, 5).map(t => t.symbol).join(", "));
        }
    } catch (e) {
        console.log("Pimlico API error:", e.message);
    }
}

main().catch(console.error);
