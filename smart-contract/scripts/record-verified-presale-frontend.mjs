import fs from "node:fs";
import { ethers } from "ethers";

const deploymentUrl = new URL("../deployments/presale-base.json", import.meta.url);
const frontendUrl = new URL("../../presale-config.js", import.meta.url);

const deployment = JSON.parse(fs.readFileSync(deploymentUrl, "utf8"));
const tokenAddress = deployment.contracts?.Aetheron?.address;
const presaleAddress = deployment.contracts?.Presale?.address;
const parameters = deployment.parameters || {};

if (!ethers.isAddress(tokenAddress || "")) throw new Error("Verified deployment token address is missing");
if (!ethers.isAddress(presaleAddress || "")) throw new Error("Verified replacement presale address is missing");
if (deployment.verification?.verified !== true) throw new Error("BaseScan verification is not recorded as successful");
if (!deployment.verifiedState || deployment.verifiedState.token?.toLowerCase() !== tokenAddress.toLowerCase()) {
  throw new Error("Verified on-chain token state is missing or inconsistent");
}

const fundedTokenUnits = BigInt(parameters.fundedTokenUnits || "0");
if (fundedTokenUnits <= 0n) throw new Error("Verified replacement inventory is missing");

const minContribution = Number(ethers.formatEther(BigInt(parameters.minContributionWei)));
const maxContribution = Number(ethers.formatEther(BigInt(parameters.maxContributionWei)));
const maxPresaleTokens = Math.floor(Number(ethers.formatUnits(fundedTokenUnits, 18)));

const config = `window.AETHERON_PRESALE_CONFIG = {
  aethTokenAddress: "${tokenAddress}",
  presaleContractAddress: "",
  replacementPresaleContractAddress: "${presaleAddress}",
  invalidPresaleContractAddress: "0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C",
  status: "verified-disabled-awaiting-owner-smoke-test",
  statusMessage: "Replacement Base presale is deployed, funded, and BaseScan-verified. Public purchases remain disabled pending the owner smoke test and launch authorization.",
  maxPresaleTokens: ${maxPresaleTokens},
  network: "base",
  chainId: 8453,
  nativeSymbol: "ETH",
  minContribution: ${minContribution},
  maxContribution: ${maxContribution}
};
`;

fs.writeFileSync(frontendUrl, config);
deployment.status = "deployed-verified-awaiting-owner-smoke-purchase";
deployment.launchable = false;
deployment.frontend = {
  replacementAddressPublished: true,
  publicPurchaseAddressEnabled: false,
  status: "verified-disabled-awaiting-owner-smoke-test",
  updatedAt: new Date().toISOString()
};
fs.writeFileSync(deploymentUrl, JSON.stringify(deployment, null, 2) + "\n");

console.log(JSON.stringify({
  tokenAddress,
  replacementPresaleAddress: presaleAddress,
  replacementAddressPublished: true,
  publicPurchaseAddressEnabled: false,
  status: deployment.frontend.status
}, null, 2));
