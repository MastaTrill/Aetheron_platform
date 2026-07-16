import { ethers } from "ethers";
import https from "https";
import dotenv from "dotenv";
dotenv.config();

const provider = new ethers.JsonRpcProvider("https://polygon.drpc.org");
const _LP_PAIR = "0xd57c5E33ebDC1b565F99d06809debbf86142705D";

const API_KEY = process.env.POLYGONSCAN_API_KEY || process.env.ETHERSCAN_API_KEY;
const url = `https://api.etherscan.io/v2/api?chainid=137&module=account&action=tokentx&contractaddress=0xd57c5E33ebDC1b565F99d06809debbf86142705D&apikey=${API_KEY}&sort=asc`;

https.get(url, async (res) => {
    let data = "";
    res.on("data", c => data += c);
    res.on("end", async () => {
        const r = JSON.parse(data);
        console.log("LP Token transfers:", r.result.length, "\n");

        for (const tx of r.result) {
            console.log("Block:", tx.blockNumber);
            console.log("  From:", tx.from);
            console.log("  To:", tx.to);
            console.log("  Value:", (Number(tx.value) / 1e18).toFixed(4), "LP");

            // Check if 'to' is a contract
            const code = await provider.getCode(tx.to);
            console.log("  To is contract:", code.length > 2);
            console.log("");
        }
    });
}).on("error", e => console.error(e));
