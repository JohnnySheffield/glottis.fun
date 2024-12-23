<script>
    import { ethers } from 'ethers';
    import { fetchTokens } from './events';
    import { onMount, onDestroy } from 'svelte';
    import { 
        getCurrentPrice, 
        getTokenProgress, 
        formatPrice, 
        shortenAddress, 
        drawBezierCurve,
        getTokenStatus,
        TOKEN_ABI,
        GLOTTIS_MINT_ADDRESS,
        GLOTTIS_MINT_ABI
    } from './utils/token';
    import { unpackMetadata, isValidMetadata } from './utils/metadata';
    import { provider, signer, account, isWalletConnected } from '../stores/web3Store';

    let currentProvider;
    let currentSigner;
    let currentAccount;
    let isWalletConnectedValue = false;

    function handleImageError(event) {
        if (event && event.target && event.target instanceof HTMLImageElement) {
            event.target.style.display = 'none';
        }
    }

    // Subscribe to store changes
    provider.subscribe(value => currentProvider = value);
    signer.subscribe(value => currentSigner = value);
    account.subscribe(value => currentAccount = value);
    isWalletConnected.subscribe(value => isWalletConnectedValue = value);
    
    let tokens = [];
    let tokensLoaded = false;
    let dataRefreshInterval;

    function handleTokenClick(token) {
        window.history.pushState({}, '', `/token/${token.address}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
    }

    function handleCreateClick() {
        window.history.pushState({}, '', '/create');
        window.dispatchEvent(new PopStateEvent('popstate'));
    }

    async function refreshTokens() {
        if (!currentProvider) return;
        const fetchedTokens = await fetchTokens(currentProvider);
        tokens = await Promise.all(fetchedTokens.map(async (token) => {
            const glottisMint = new ethers.Contract(GLOTTIS_MINT_ADDRESS, GLOTTIS_MINT_ABI, currentProvider);
            const progress = await getTokenProgress(currentProvider, token.address);
            const currentPrice = getCurrentPrice(token.pricePoints, progress);
            const tokenContract = new ethers.Contract(token.address, TOKEN_ABI, currentProvider);
            
            // Fetch metadata
            const tokenMetadata = await glottisMint.readTokenMetadata(token.address);
            const metadata = tokenMetadata ? ethers.utils.toUtf8String(tokenMetadata) : '';
            const unpackedMetadata = metadata ? unpackMetadata(metadata) : null;
            
            return {
                ...token,
                progress,
                currentPrice,
                totalSupply: await tokenContract.totalSupply(),
                metadata: unpackedMetadata
            };
        }));
    }

    async function refreshData() {
        if (currentProvider && tokensLoaded) {
            await refreshTokens();
        }
    }

    onMount(async () => {
        if (currentProvider) {
            await refreshTokens();
            tokensLoaded = true;
            dataRefreshInterval = setInterval(refreshData, 5000);
        }
    });

    onDestroy(() => {
        if (dataRefreshInterval) {
            clearInterval(dataRefreshInterval);
        }
    });
</script>

<div class="min-h-screen bg-gray-900 text-gray-100 p-4">
    <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-indigo-400">Discovered Tokens</h2>
        {#if isWalletConnectedValue}
            <button
                class="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded transition-colors"
                on:click={handleCreateClick}
            >
                Create Token
            </button>
        {/if}
    </div>
    
    <div class="overflow-x-auto">
        <table class="w-full text-xs font-mono">
            <thead>
                <tr class="bg-gray-800">
                    <th class="p-1 text-left">Token</th>
                    <th class="p-1 text-left">Price Curve</th>
                    <th class="p-1 text-left">Address</th>
                    <th class="p-1 text-right">Current Price</th>
                    <th class="p-1 text-right">Current Supply</th>
                    <th class="p-1 text-right">Max Supply</th>
                    <th class="p-1 text-right">Block</th>
                </tr>
            </thead>
            <tbody>
                {#each tokens as token}
                    {@const status = getTokenStatus(token.progress)}
                    <tr 
                        class="border-t border-gray-700 hover:bg-gray-800 cursor-pointer"
                        on:click={() => handleTokenClick(token)}
                    >
                        <td class="p-1">
                            <div class="flex items-center gap-3">
                                {#if token.metadata?.logoUrl}
                                    <img 
                                        src={token.metadata.logoUrl} 
                                        alt="{token.name} logo" 
                                        class="w-8 h-8 rounded-full bg-gray-800 border border-gray-700/50"
                                        on:error={handleImageError}
                                    />
                                {/if}
                                <div>
                                    <div class="font-bold">{token.name}</div>
                                    <div class="text-gray-400">{token.symbol}</div>
                                </div>
                            </div>
                            <div class="space-y-1 mt-1">
                                <div class="flex items-center gap-1.5">
                                    <div class={`w-2 h-2 rounded-full ${status.dotColor}`}></div>
                                    <span class={status.textColor}>
                                        {status.text}
                                    </span>
                                </div>
                                <div class="text-xs text-gray-400">
                                    Progress: {status.progress}
                                </div>
                            </div>
                        </td>
                        <td class="p-1">
                            {#if tokensLoaded && token.progress && Number(ethers.utils.formatUnits(token.progress, 18)) < 1}
                                <canvas 
                                    class="bg-gray-700/50 rounded"
                                    use:drawBezierCurve={{
                                        pricePoints: token.pricePoints,
                                        progress: token.progress,
                                        width: 200,
                                        height: 40
                                    }}
                                    width="200"
                                    height="40"
                                ></canvas>
                            {:else}
                                <div class="bg-gray-700/50 rounded w-[200px] h-[40px] flex items-center justify-center text-gray-400">
                                    {#if Number(ethers.utils.formatUnits(token.progress || 0, 18)) >= 1}
                                        Bonding curve complete
                                    {:else}
                                        No active curve
                                    {/if}
                                </div>
                            {/if}
                        </td>
                        <td class="p-1 font-mono text-xs text-gray-400">
                            {shortenAddress(token.address)}
                        </td>
                        <td class="p-1 text-right text-gray-400">
                            {formatPrice(token.currentPrice)}/{token.symbol}
                        </td>
                        <td class="p-1 text-right text-gray-400">
                            {ethers.utils.formatEther(token.totalSupply)}
                        </td>
                        <td class="p-1 text-right text-gray-400">
                            {ethers.utils.formatEther(token.maxSupply)}
                        </td>
                        <td class="p-1 text-right text-gray-400">
                            {token.blockNumber}
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>

<style>
    table {
        border-collapse: collapse;
    }
    
    th {
        position: sticky;
        top: 0;
        z-index: 10;
    }
</style>
