// src/lib/events.js
import { ethers } from 'ethers';

const GLOTTIS_MINT_ADDRESS = '0x543916e128A59abBc191Aa1dB2889A58f4732489';
const EVENT_INTERFACE = [
    "event TokenCreated(address indexed tokenAddress, string name, string symbol, uint256 maxSupply, uint64[4] pricePoints)",
    "event TokensPurchased(address indexed token, address indexed minter, uint256 amount, uint256 ethSpent)",
    "event TokensSold(address indexed token, address indexed minter, uint256 amount, uint256 ethSpent)"
];
const EVENT_SIGNATURE = ethers.utils.id('TokenCreated(address,string,string,uint256,uint64[4])');
const PURCHASE_EVENT_SIGNATURE = ethers.utils.id('TokensPurchased(address,address,uint256,uint256)');
const SELL_EVENT_SIGNATURE = ethers.utils.id('TokensSold(address,address,uint256,uint256)');

export async function fetchTokens(provider) {
    const CHUNK_SIZE = 10000;
    const STORAGE_KEY = 'discoveredTokens';
    const startBlock = 7868796;
    
    // Try to load cached tokens
    const cachedTokens = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    let lastProcessedBlock = parseInt(localStorage.getItem('lastProcessedBlock') || startBlock);
    
    // Get current block
    const currentBlock = await provider.getBlockNumber();
    
    // If we're already up to date, return cached tokens
    if (lastProcessedBlock >= currentBlock) {
        return cachedTokens;
    }

    const tokens = [...cachedTokens]; // Start with cached tokens
    const iface = new ethers.utils.Interface(EVENT_INTERFACE);

    try {
        // Process blocks in chunks
        for (let fromBlock = lastProcessedBlock; fromBlock < currentBlock; fromBlock += CHUNK_SIZE) {
            const toBlock = Math.min(fromBlock + CHUNK_SIZE - 1, currentBlock);
            
            const filter = {
                address: GLOTTIS_MINT_ADDRESS,
                topics: [EVENT_SIGNATURE],
                fromBlock,
                toBlock
            };

            const logs = await provider.getLogs(filter);
            
            for (const log of logs) {
                const decodedLog = iface.parseLog(log);
                
                tokens.push({
                    address: decodedLog.args.tokenAddress,
                    name: decodedLog.args.name,
                    symbol: decodedLog.args.symbol,
                    maxSupply: decodedLog.args.maxSupply.toString(),
                    pricePoints: decodedLog.args.pricePoints.map(p => p.toString()),
                    pricePoints2: decodedLog.args.pricePoints.map(p => ethers.BigNumber.from(p)),
                    salt: decodedLog.args.salt,
                    blockNumber: log.blockNumber
                });
            }

            // Update last processed block in storage
            localStorage.setItem('lastProcessedBlock', toBlock.toString());
            // Update tokens in storage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
        }
    } catch (error) {
        console.error('Error fetching logs:', error);
    }
    
    return tokens;
}
export async function fetchTradeHistory(provider, tokenAddress) {
    const CHUNK_SIZE = 10000;
    const STORAGE_KEY = `tradeHistory_${tokenAddress}`;
    const LAST_BLOCK_KEY = `lastProcessedBlock_${tokenAddress}`;
    const startBlock = 7868796;

    // Try to load cached trades
    const cachedTrades = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    let lastProcessedBlock = parseInt(localStorage.getItem(LAST_BLOCK_KEY) || startBlock);

    // Get current block
    const currentBlock = await provider.getBlockNumber();

    // If we're already up to date, return cached trades
    if (lastProcessedBlock >= currentBlock) {
        return cachedTrades;
    }

    // Get the token creator (this doesn't need to be chunked as it's a single call)
    const glottisMintContract = new ethers.Contract(GLOTTIS_MINT_ADDRESS, [
        "function readTokenCreator(address token) public view returns (address)"
    ], provider);
    
    let creator;
    try {
        creator = await glottisMintContract.readTokenCreator(tokenAddress);
    } catch (error) {
        console.error('Error fetching token creator:', error);
        creator = ethers.constants.AddressZero;
    }

    const trades = [...cachedTrades]; // Start with cached trades
    const iface = new ethers.utils.Interface(EVENT_INTERFACE);

    try {
        // Process blocks in chunks
        for (let fromBlock = lastProcessedBlock; fromBlock < currentBlock; fromBlock += CHUNK_SIZE) {
            const toBlock = Math.min(fromBlock + CHUNK_SIZE - 1, currentBlock);
            
            const filter = {
                address: GLOTTIS_MINT_ADDRESS,
                topics: [
                    [PURCHASE_EVENT_SIGNATURE, SELL_EVENT_SIGNATURE],
                    ethers.utils.hexZeroPad(tokenAddress, 32)
                ],
                fromBlock,
                toBlock
            };

            const logs = await provider.getLogs(filter);
            
            // Process logs in chunks to avoid too many simultaneous getBlock requests
            for (const log of logs) {
                const decodedLog = iface.parseLog(log);
                const timestamp = (await provider.getBlock(log.blockNumber)).timestamp;
                const isCreator = decodedLog.args.minter.toLowerCase() === creator.toLowerCase();
                
                trades.push({
                    type: log.topics[0] === PURCHASE_EVENT_SIGNATURE ? 'purchase' : 'sell',
                    minter: decodedLog.args.minter,
                    amount: decodedLog.args.amount,
                    ethSpent: decodedLog.args.ethSpent,
                    blockNumber: log.blockNumber,
                    timestamp: timestamp,
                    isCreator: isCreator
                });
            }

            // Sort trades by block number in descending order
            trades.sort((a, b) => b.blockNumber - a.blockNumber);

            // Update last processed block in storage
            localStorage.setItem(LAST_BLOCK_KEY, toBlock.toString());
            // Update trades in storage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
        }
    } catch (error) {
        console.error('Error fetching trade history:', error);
    }
    
    return trades;
}

