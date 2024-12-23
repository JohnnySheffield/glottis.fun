<script>
    import { ethers } from 'ethers';
    import { getCurrentPrice, formatPrice } from '../utils/token';
    import { unpackMetadata, isValidMetadata } from '../utils/metadata';

    export let token;
    export let currentStep;
    export let availableInStep;
    export let collectedETH;
    export let networkInfo;
    export let currentBlock;
    export let metadata = '';

    $: unpackedMetadata = metadata ? unpackMetadata(metadata) : null;
    $: isValidMeta = unpackedMetadata && isValidMetadata(unpackedMetadata);

    function handleImageError(event) {
        event.target.style.display = 'none';
    }
</script>

<div class="bg-gradient-to-br from-gray-900/90 to-gray-800/50 backdrop-blur rounded-xl shadow-2xl border border-gray-700/50 overflow-hidden">
    <!-- Top Section with Name and Progress -->
    <div class="p-4 bg-gradient-to-r from-gray-900/50 to-transparent border-b border-gray-700/50">
        <div class="flex justify-between items-center">
            <div class="flex items-center gap-3">
                {#if isValidMeta && unpackedMetadata.logoUrl}
                    <img 
                        src={unpackedMetadata.logoUrl} 
                        alt="{token.name} logo" 
                        class="w-10 h-10 rounded-full bg-gray-800 border border-gray-700/50"
                        on:error={handleImageError}
                    />
                {/if}
                <h1 class="text-3xl font-extrabold bg-clip-text text-gray-200 bg-gradient-to-r from-indigo-400 to-blue-400">
                    {token.name}
                </h1>
                <span class="px-2 py-1 bg-gray-800/80 rounded-md text-gray-400 text-sm font-medium">
                    {token.symbol}
                </span>
            </div>
            <div class="flex items-center gap-2">
                <a 
                    href="https://unichain-sepolia.blockscout.com/address/{token.address}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-xs text-gray-400 hover:text-gray-300 font-mono bg-gray-900/70 hover:bg-gray-900 px-2 py-1 rounded-md flex items-center gap-2 transition-colors"
                >
                    <span>{token.address}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                </a>
                <div class="bg-green-900/20 text-green-400 px-3 py-1 rounded-lg text-sm font-bold border border-green-500/20">
                    Progress: {#if token.progress}
                        {ethers.utils.formatUnits(token.progress, 16)}%
                    {:else}
                        0%
                    {/if}
                </div>
            </div>
        </div>
        
        {#if isValidMeta}
            <div class="mt-4 space-y-2">
                {#if unpackedMetadata.description}
                    <p class="text-gray-300 text-sm">{unpackedMetadata.description}</p>
                {/if}
                
                {#if unpackedMetadata.social}
                    <div class="flex gap-3">
                        {#if unpackedMetadata.social.link1}
                            <a href={unpackedMetadata.social.link1} target="_blank" rel="noopener noreferrer" 
                               class="text-blue-400 hover:text-blue-300 text-sm">
                                Link 1
                            </a>
                        {/if}
                        {#if unpackedMetadata.social.link2}
                            <a href={unpackedMetadata.social.link2} target="_blank" rel="noopener noreferrer"
                               class="text-indigo-400 hover:text-indigo-300 text-sm">
                                Link 2
                            </a>
                        {/if}
                        {#if unpackedMetadata.social.link3}
                            <a href={unpackedMetadata.social.link3} target="_blank" rel="noopener noreferrer"
                               class="text-green-400 hover:text-green-300 text-sm">
                                Link 3
                            </a>
                        {/if}
                    </div>
                {/if}
            </div>
        {/if}
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-5 gap-px bg-gray-700/20 p-px">
        <!-- Max Supply -->
        <div class="bg-gradient-to-br from-gray-900/95 to-gray-800/95 p-4 relative group">
            <div class="text-sm text-indigo-300 uppercase tracking-wider mb-2 font-medium">Maximum Supply</div>
            <div class="flex items-baseline gap-2">
                <span class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-400">
                    {Number(ethers.utils.formatUnits(token.maxSupply, 18)).toLocaleString()}
                </span>
                <span class="text-lg text-gray-400 font-medium">{token.symbol}</span>
            </div>
            <div class="absolute inset-0 bg-indigo-400/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>

        <!-- Current Step -->
        <div class="bg-gray-900/95 p-3 relative group">
            <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">Current Step</div>
            <div class="flex items-baseline gap-1">
                <span class="text-2xl font-bold text-rose-400">{currentStep + 1}</span>
                <span class="text-gray-500 font-medium">/100</span>
            </div>
            <div class="absolute inset-0 bg-rose-400/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>

        <!-- Current Price -->
        <div class="bg-gray-900/95 p-3 relative group">
            <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">Current Price</div>
            <div class="flex items-baseline gap-1">
                <span class="text-2xl font-bold text-green-400">
                    {formatPrice(getCurrentPrice(token.pricePoints, token.progress))}
                </span>
                <span class="text-gray-500 font-medium">/{token.symbol}</span>
            </div>
            <div class="absolute inset-0 bg-green-400/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>

        <!-- Available in Step -->
        <div class="bg-gray-900/95 p-3 relative group">
            <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">Available</div>
            <div class="flex items-baseline gap-1">
                <span class="text-2xl font-bold text-amber-400">
                    {Number(ethers.utils.formatEther(availableInStep)).toFixed(8)}
                </span>
                <span class="text-gray-500 font-medium">{token.symbol}</span>
            </div>
            <div class="absolute inset-0 bg-amber-400/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>

        <!-- Collected ETH -->
        <div class="bg-gray-900/95 p-3 relative group">
            <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">Collected</div>
            <div class="flex items-baseline gap-1">
                <span class="text-2xl font-bold text-purple-400">
                    {Number(ethers.utils.formatEther(collectedETH)).toFixed(12)}
                </span>
                <span class="text-gray-500 font-medium">ETH</span>
            </div>
            <div class="absolute inset-0 bg-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
    </div>

    <!-- Supply Progress Bar -->
    <div class="bg-gray-900/80 px-4 py-3 border-t border-gray-700/50">
        <div class="flex justify-between items-center text-sm mb-2">
            <span class="text-gray-400">Current Supply</span>
            <span class="text-gray-400">
                {Number(ethers.utils.formatUnits(token.totalSupply || "0", 18)).toLocaleString()} 
                <span class="text-gray-600">/ {Number(ethers.utils.formatUnits(token.maxSupply, 18)).toLocaleString()}</span>
            </span>
        </div>
        <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
                class="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500"
                style="width: {token.totalSupply ? (Number(ethers.utils.formatUnits(token.totalSupply, 18)) / Number(ethers.utils.formatUnits(token.maxSupply, 18)) * 100) : 0}%"
            ></div>
        </div>
    </div>
</div>

<style>
    .bg-gradient-to-br {
        background-image: linear-gradient(to bottom right, var(--tw-gradient-from), var(--tw-gradient-to));
    }
</style>
