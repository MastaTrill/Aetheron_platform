import { Contract, JsonRpcProvider, formatEther, formatUnits } from 'ethers';
const PRESALE='0xe0A3B6368312dFd3E7E76202e673f895f8235A3d';
const TOKEN='0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e';
const CHAIN_ID=8453;
const RPC_URLS=['https://mainnet.base.org','https://base.drpc.org'];
const PRESALE_ABI=['function token() view returns (address)','function rate() view returns (uint256)','function weiRaised() view returns (uint256)','function tokensReserved() view returns (uint256)','function hardCap() view returns (uint256)','function minContribution() view returns (uint256)','function maxContribution() view returns (uint256)','function startTime() view returns (uint256)','function endTime() view returns (uint256)','function finalized() view returns (bool)','function cancelled() view returns (bool)'];
const TOKEN_ABI=['function balanceOf(address) view returns (uint256)','function decimals() view returns (uint8)'];
async function readHealth(rpcUrl){
 const provider=new JsonRpcProvider(rpcUrl,CHAIN_ID,{staticNetwork:true,batchMaxCount:3,batchStallTime:10});
 const network=await provider.getNetwork();
 const presale=new Contract(PRESALE,PRESALE_ABI,provider);
 const token=new Contract(TOKEN,TOKEN_ABI,provider);
 const [tokenAddress,rate,weiRaised,tokensReserved,hardCap,minContribution,maxContribution,startTime,endTime,finalized,cancelled,inventory,decimals,blockNumber]=await Promise.all([presale.token(),presale.rate(),presale.weiRaised(),presale.tokensReserved(),presale.hardCap(),presale.minContribution(),presale.maxContribution(),presale.startTime(),presale.endTime(),presale.finalized(),presale.cancelled(),token.balanceOf(PRESALE),token.decimals(),provider.getBlockNumber()]);
 const now=BigInt(Math.floor(Date.now()/1000));
 const checks={chainIsBase:Number(network.chainId)===CHAIN_ID,tokenMatches:tokenAddress.toLowerCase()===TOKEN.toLowerCase(),rateMatches:rate===1000000n,minimumMatches:minContribution===300000000000000n,maximumMatches:maxContribution===33333333000000000000n,inventoryCoversReservations:inventory>=tokensReserved,saleWindowOpen:now>=startTime&&now<=endTime,notFinalized:!finalized,notCancelled:!cancelled,hardCapAvailable:weiRaised<hardCap};
 return {ok:Object.values(checks).every(Boolean),checkedAt:new Date().toISOString(),blockNumber,network:{name:'Base Mainnet',chainId:Number(network.chainId)},contracts:{presale:PRESALE,token:TOKEN},terms:{rate:rate.toString(),minContributionEth:formatEther(minContribution),maxContributionEth:formatEther(maxContribution),hardCapEth:formatEther(hardCap)},state:{weiRaisedEth:formatEther(weiRaised),tokensReserved:formatUnits(tokensReserved,decimals),tokenInventory:formatUnits(inventory,decimals),startTime:new Date(Number(startTime)*1000).toISOString(),endTime:new Date(Number(endTime)*1000).toISOString(),finalized,cancelled},checks};
}
export default async function handler(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false,error:'Method not allowed'});}
 res.setHeader('Cache-Control','no-store, max-age=0');
 const failures=[];
 for(const rpcUrl of RPC_URLS){try{const health=await readHealth(rpcUrl);return res.status(health.ok?200:503).json(health);}catch(error){failures.push(error instanceof Error?error.message:String(error));}}
 return res.status(503).json({ok:false,checkedAt:new Date().toISOString(),error:'Unable to verify Base presale state',failures});
}
