<script>
    import { onMount } from 'svelte';
    import { ethers } from 'ethers';
    import TokenActions from './TokenActions.svelte';
    import TokenHeader from './components/TokenHeader.svelte';
    import BondingCurve from './components/BondingCurve.svelte';
    import TradeHistory from './components/TradeHistory.svelte';
    import PriceInfo from './components/PriceInfo.svelte';
    import { fetchTradeHistory } from './events.js';
    import { 
        GLOTTIS_MINT_ADDRESS, 
        GLOTTIS_MINT_ABI,
        TOKEN_ABI, 
        ERC20_ABI, 
        EVENT_INTERFACE, 
        EVENT_SIGNATURE,
        getTokenProgress,
        getCurrentStep,
        getStepSize,
        getAvailableInStep
    } from './utils/token';

    export let provider;
    export let wallet;
    export let tokenAddress;

    let token = null;
    let tokenBalance = '';
    let glottisMintContract;
    let currentStep = 0;
    let availableInStep = ethers.BigNumber.from(0);
    let stepSize = ethers.BigNumber.from(0);
    let trades = [];
    let collectedETH = ethers.BigNumber.from(0);
    let networkInfo = null;
    let currentBlock = null;

    async function loadToken() {
        try {
            // Get network and block information
            networkInfo = await provider.getNetwork();
            currentBlock = await provider.getBlockNumber();

            const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);
            const glottisMint = new ethers.Contract(GLOTTIS_MINT_ADDRESS, GLOTTIS_MINT_ABI, provider);

            // Fetch contract details in parallel
            const [name, symbol, totalSupply, maxSupply, ethCollected, packedPrices, tokenMetadata] = await Promise.all([
                tokenContract.name(),
                tokenContract.symbol(),
                tokenContract.totalSupply(),
                tokenContract.maxSupply(),
                glottisMint.collectedETH(tokenAddress),
                glottisMint.pointsMap(tokenAddress),  // Fetch packed prices directly from the contract
                glottisMint.readTokenMetadata(tokenAddress)  // Fetch token metadata
            ]);

            // Convert metadata bytes to string
            const metadata = tokenMetadata ? ethers.utils.toUtf8String(tokenMetadata) : '';

            collectedETH = ethCollected;
            const progress = await getTokenProgress(provider, tokenAddress);

            // Calculate step information
            currentStep = getCurrentStep(totalSupply, maxSupply).toNumber();
            stepSize = getStepSize(maxSupply);
            availableInStep = getAvailableInStep(totalSupply, maxSupply);

            // Unpack price points directly from the packed data obtained from the contract
            const pricePoints = [
                ethers.BigNumber.from(packedPrices).and(ethers.BigNumber.from('0xFFFFFFFFFFFFFFFF')).toNumber(),
                ethers.BigNumber.from(packedPrices).shr(64).and(ethers.BigNumber.from('0xFFFFFFFFFFFFFFFF')).toNumber(),
                ethers.BigNumber.from(packedPrices).shr(128).and(ethers.BigNumber.from('0xFFFFFFFFFFFFFFFF')).toNumber(),
                ethers.BigNumber.from(packedPrices).shr(192).toNumber()
            ];

            token = {
                address: tokenAddress,
                name,
                symbol,
                totalSupply,
                maxSupply,
                progress,
                pricePoints,
                metadata
            };

            console.log(token);

            // Get token balance
            if (wallet) {
                const balance = await tokenContract.balanceOf(await wallet.getAddress());
                tokenBalance = balance;
            }

            // Initialize glottisMint contract with provider for read-only operations
            glottisMintContract = new ethers.Contract(GLOTTIS_MINT_ADDRESS, GLOTTIS_MINT_ABI, provider);
            
            // If wallet is connected, use it as signer for write operations
            if (wallet) {
                glottisMintContract = glottisMintContract.connect(wallet);
            }

            // Load trade history
            trades = await fetchTradeHistory(provider, tokenAddress);

        } catch (error) {
            console.error('Error loading token:', error);
        }
    }

    onMount(loadToken);

    function handleClose() {
        window.history.back();
    }
</script>

<div class="min-h-screen bg-gray-900 p-4">
    <button 
        class="mb-6  hover:text-indigo-300 flex items-center gap-2"
        on:click={handleClose}
    >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
        Back to Tokens
    </button>

    {#if token}
        <div class="max-w-7xl mx-auto space-y-6">
            <!-- Token Header -->
            <TokenHeader {token} {currentStep} {availableInStep} {collectedETH} {networkInfo} {currentBlock} metadata={token.metadata} />

            <!-- Price Information -->
            <PriceInfo {token} />

            <!-- Combined Bonding Curve and Trade History Section -->
            <div class="bg-gray-800/50 backdrop-blur rounded-lg shadow-xl p-6 border border-gray-700">
                <div class="flex gap-6">
                    <BondingCurve {token} {currentStep} {availableInStep} />
                    <TradeHistory {trades} {token} />
                </div>
            </div>

            <!-- Trading Actions -->
            <div class="bg-gray-800/50 backdrop-blur rounded-lg shadow-xl p-6 border border-gray-700">
                <h2 class="text-xl font-semibold mb-4">Trading Actions</h2>
                <TokenActions
                    {token}
                    {wallet}
                    {glottisMintContract}
                    glottisMintAddress={GLOTTIS_MINT_ADDRESS}
                    {tokenBalance}
                    onClose={handleClose}
                />
            </div>
        </div>
    {:else}
        <div class="text-center py-12">
            <div class="animate-spin inline-block w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full mb-4"></div>
            <div class="text-gray-400">Loading token details...</div>
        </div>
    {/if}
</div>

<style>
    :global(body) {
        background-color: #111827;
    }
</style>
