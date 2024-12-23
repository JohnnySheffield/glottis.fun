<script>
    import { ethers } from 'ethers';
    import { shortenAddress } from '../utils/token';

    export let trades;
    export let token;

    function formatDate(timestamp) {
        const date = new Date(Number(timestamp) * 1000);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        
        // If less than 24 hours ago, show relative time
        if (diffMs < 24 * 60 * 60 * 1000) {
            const hours = Math.floor(diffMs / (60 * 60 * 1000));
            const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
            if (hours > 0) {
                return `${hours}h ${minutes}m ago`;
            }
            return `${minutes}m ago`;
        }
        
        // Otherwise show date and time
        return date.toLocaleString(undefined, {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
</script>

<div class="w-1/3 border-l border-gray-700/50 pl-6">
    <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-400">
            Recent Activity
        </h2>
        <div class="text-sm text-gray-500">Last 24h</div>
    </div>
    
    <div class="space-y-2 max-h-[585px] overflow-y-auto pr-2 custom-scrollbar">
        {#if trades.length > 0}
            {#each trades as trade}
                <div class="group bg-gray-900/70 hover:bg-gray-900/90 rounded-lg border border-gray-800/50 hover:border-gray-700/50 transition-colors duration-150">
                    <!-- Top Section -->
                    <div class="p-3">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center gap-2">
                                {#if trade.type === 'purchase'}
                                    <div class="flex items-center gap-1.5 text-green-400 font-medium">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                        </svg>
                                        <span>Mint</span>
                                    </div>
                                {:else}
                                    <div class="flex items-center gap-1.5 text-red-400 font-medium">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                        </svg>
                                        <span>Burn</span>
                                    </div>
                                {/if}
                                
                                {#if trade.isCreator}
                                    <span class="px-1.5 py-0.5 rounded-full text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                        Creator
                                    </span>
                                {/if}
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-xs text-gray-500">{formatDate(trade.timestamp)}</span>
                            </div>
                        </div>
                        
                        <!-- Trade Details -->
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <a 
                                    href="https://unichain-sepolia.blockscout.com/address/{trade.minter}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded font-mono text-gray-400 hover:text-gray-300 transition-colors"
                                >
                                    {shortenAddress(trade.minter)}
                                </a>
                            </div>
                            <div class="text-right">
                                <div class="font-bold text-white">
                                    {Number(ethers.utils.formatEther(trade.amount)).toFixed(2)} {token.symbol}
                                </div>
                                <div class="text-sm text-gray-400">
                                    {Number(ethers.utils.formatEther(trade.ethSpent)).toFixed(4)} ETH
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
        {:else}
            <div class="text-center py-8 text-gray-400 bg-gray-900/50 rounded-lg border border-gray-800/50">
                <div class="mb-2">No mints/burns yet</div>
                <div class="text-sm text-gray-500">Be the first to Mint!</div>
            </div>
        {/if}
    </div>
</div>

<style>
    .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: rgba(79, 70, 229, 0.3) transparent;
    }
    
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: rgba(79, 70, 229, 0.3);
        border-radius: 3px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: rgba(79, 70, 229, 0.5);
    }
</style>
