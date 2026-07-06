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
    const sourceCode = readFileSync("./flattened/AetheronPresaleV2.sol", "utf8");
    const constructorArgs = "00000000000000000000000074203c9b1fc36e08114bc57fc473df179840942800000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000010f0cf064dd5920000000000000000000000000000000000000000000000000070efc4d0e326fb40000000000000000000000000000000000000000000000000000016345785d8a000000000000000000000000000000000000000000000000003635c9adc5dea00000000000000000000000000000000000000000000000000000000000006a3868c4000000000000000000000000000000000000000000000000000000006a6d36ff000000000000000000000000f941b28f3b4188c473a4c8c78845ebab58654ba6";

    console.log("Submitting AetheronPresaleV2 for verification on Polygonscan Amoy...");
    const result = await post("https://api.etherscan.io/v2/api?chainid=80002", {
        module: "contract",
        action: "verifysourcecode",
        contractaddress: "0x8eB1171E720f5ae30086D154277777Aa65340cf7",
        sourceCode,
        codeformat: "solidity-single-file",
        contractname: "AetheronPresaleV2",
        compilerversion: "v0.8.20+commit.a1b79de6",
        optimizationUsed: 1,
        runs: 200,
        constructorArguements: constructorArgs,
        licenseType: 3,
    });
    console.log(JSON.stringify(result, null, 2));

    if (result.status === "1") {
        console.log("\nVerification submitted! GUID:", result.result);
        console.log("Check status at: https://amoy.polygonscan.com/address/0x8eB1171E720f5ae30086D154277777Aa65340cf7");
    }
}

main().catch(console.error);
