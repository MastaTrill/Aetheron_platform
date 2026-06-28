import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("https://polygon.drpc.org");
const OWNER = "0x8A3ad49656Bd07981C9CFc7aD826a808847c3452";
const IMPL = "0x44c1d82ef1dc2961aeb825b3ca16e8b9e65396d1";

async function main() {
    // Get the implementation contract's interface
    // Try to decode what functions it has
    const code = await provider.getCode(IMPL);
    console.log("Implementation code length:", code.length);

    // Try common ERC-4337 account functions
    const testCalls = [
        { name: "entryPoint", sig: "function entryPoint() view returns (address)" },
        { name: "nonce", sig: "function nonce() view returns (uint256)" },
        { name: "owner", sig: "function owner() view returns (address)" },
        { name: "execute", sig: "function execute(address, uint256, bytes) external" },
        { name: "executeBatch", sig: "function executeBatch(address[], uint256[], bytes[]) external" },
        { name: "validateUserOp", sig: "function validateUserOp((address,uint256,bytes,bytes,uint256,uint256,uint256,uint256,uint256,bytes,bytes), bytes32, uint256) external returns (uint256)" },
    ];

    for (const { name, sig } of testCalls) {
        try {
            const iface = new ethers.Interface([sig]);
            const data = iface.encodeFunctionData(sig.split("(")[0], sig.includes("validateUserOp") ? [
                [ethers.ZeroAddress, 0, "0x", "0x", 0, 0, 0, 0, 0, "0x", "0x"],
                ethers.ZeroHash,
                0
            ] : []);
            const result = await provider.call({ to: OWNER, data });
            if (result && result !== "0x") {
                console.log(name + ":", result.slice(0, 100));
            }
        } catch (e) {
            // silent
        }
    }

    // Check storage slots for common patterns
    for (let i = 0; i < 10; i++) {
        const slot = await provider.getStorage(OWNER, i);
        if (slot !== "0x" + "0".repeat(64)) {
            console.log("Slot", i, ":", slot);
        }
    }

    // Also check implementation storage
    for (let i = 0; i < 5; i++) {
        const slot = await provider.getStorage(IMPL, i);
        if (slot !== "0x" + "0".repeat(64)) {
            console.log("Impl slot", i, ":", slot);
        }
    }
}

main().catch(console.error);
