import { ethers } from "ethers";
import { readFileSync } from "fs";

// Final approach: Use the Stakely faucet API directly
// They have an endpoint we can call

const DEPLOYER = "0xF941B28F3B4188c473a4C8C78845ebab58654BA6";

async function main() {
    // Try the Stakely faucet API
    const response = await fetch("https://stakely.io/api/faucet/polygon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            address: DEPLOYER,
            captcha: "test",
        }),
    });
    
    const result = await response.json();
    console.log("Faucet response:", JSON.stringify(result, null, 2));
}

main().catch(console.error);
