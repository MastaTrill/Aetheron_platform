import { readFileSync } from "fs";
import https from "https";

const API_KEY = "QZDGDX7UQAWBPWEK592P5KBBU7UX8ZWENJ";

function post(urlStr, params) {
    return new Promise((resolve, reject) => {
        const body = new URLSearchParams({ apikey: API_KEY, ...params }).toString();
        const url = new URL(urlStr);
        const req = https.request({
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Content-Length": Buffer.byteLength(body),
            },
        }, (res) => {
            let data = "";
            res.on("data", (chunk) => data += chunk);
            res.on("end", () => {
                try { resolve(JSON.parse(data)); } catch { resolve(data); }
            });
        });
        req.on("error", reject);
        req.write(body);
        req.end();
    });
}

async function main() {
    const sourceCode = readFileSync("./flattened/MockAETH.sol", "utf8");

    console.log("Submitting MockAETH for verification on Polygonscan Amoy...");
    const result = await post("https://api.etherscan.io/v2/api?chainid=80002", {
        module: "contract",
        action: "verifysourcecode",
        contractaddress: "0x74203C9B1fC36e08114Bc57fc473df1798409428",
        sourceCode,
        codeformat: "solidity-single-file",
        contractname: "MockAETH",
        compilerversion: "v0.8.20+commit.a1b79de6",
        optimizationUsed: 1,
        runs: 200,
        licenseType: 3,
    });
    console.log(JSON.stringify(result, null, 2));

    if (result.status === "1") {
        console.log("\nVerification submitted! GUID:", result.result);
        console.log("Check status at: https://amoy.polygonscan.com/address/0x74203C9B1fC36e08114Bc57fc473df1798409428");
    }
}

main().catch(console.error);
