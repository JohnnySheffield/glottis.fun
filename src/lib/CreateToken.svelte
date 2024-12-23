<script>
    import { onMount } from 'svelte';
    import { ethers } from 'ethers';
    
    function handleImageError(event) {
        if (event && event.target && event.target instanceof HTMLImageElement) {
            event.target.style.display = 'none';
        }
    }

    function handleImageLoad(event) {
        if (event && event.target && event.target instanceof HTMLImageElement) {
            event.target.style.display = 'block';
        }
    }
    import { 
        GLOTTIS_MINT_ADDRESS, 
        GLOTTIS_MINT_ABI,
        drawBezierCurve,
        formatPrice,
        getProtocolFee,
        getCreatorFee,
        getCallerFee,
        getBurnFee
    } from './utils/token';
    import { packMetadata } from './utils/metadata';
    
    export let wallet;
    export let onClose;

    let name = '';
    let symbol = '';
    let logoURL = '';
    let url0 = '';
    let url1 = '';
    let url2 = '';
    let saleSupply = 1;
    let pricePoints = [1000, 10, 1000, 1100];
    let salt = '';
    let predictedAddress = '';
    let isDeployed = false;

    async function updatePredictedAddress() {
        if (!salt.trim() || !glottisMintContract) return;
        try {
            const saltBytes32 = ethers.utils.formatBytes32String(salt);
            const result = await glottisMintContract.predictTokenAddress(saltBytes32);
            predictedAddress = result.predictedAddress;
            isDeployed = result.isDeployed;
        } catch (error) {
            console.error('Error predicting address:', error);
        }
    }

    function toWei(tokens) {
        return ethers.utils.parseUnits(tokens.toString(), 18);
    }
    let metadata = '';
    let isLoading = false;
    let canvas;

    let glottisMintContract;
    let protocolFee = '0.0015';
    let creatorFee = '0.0010';
    let callerFee = '0.0010';
    let burnFee = '0.0035';

    $: minPrice = findMinPrice(pricePoints);
    $: maxPrice = findMaxPrice(pricePoints);
    $: totalEthRequired = calculateTotalEth(pricePoints, saleSupply);

    onMount(async () => {
        if (wallet) {
            glottisMintContract = new ethers.Contract(GLOTTIS_MINT_ADDRESS, GLOTTIS_MINT_ABI, wallet);
            // Fetch fees from contract
            protocolFee = await getProtocolFee(glottisMintContract);
            creatorFee = await getCreatorFee(glottisMintContract);
            callerFee = await getCallerFee(glottisMintContract);
            burnFee = await getBurnFee(glottisMintContract);
        }
    });

    $: if (canvas && pricePoints) {
        drawBezierCurve(canvas, {
            pricePoints,
            progress: ethers.BigNumber.from(0),
            width: 400,
            height: 300
        });
    }

    function findMinPrice(points) {
        let minPrice = Infinity;
        for (let t = 0; t <= 1; t += 0.01) {
            const oneMinusT = 1 - t;
            const t2 = t * t;
            const t3 = t2 * t;
            const oneMinusT2 = oneMinusT * oneMinusT;
            const oneMinusT3 = oneMinusT2 * oneMinusT;

            const term1 = oneMinusT3 * points[0];
            const term2 = 3 * oneMinusT2 * t * points[1];
            const term3 = 3 * oneMinusT * t2 * points[2];
            const term4 = t3 * points[3];

            const price = term1 + term2 + term3 + term4;
            minPrice = Math.min(minPrice, price);
        }
        return minPrice;
    }

    function findMaxPrice(points) {
        let maxPrice = -Infinity;
        for (let t = 0; t <= 1; t += 0.01) {
            const oneMinusT = 1 - t;
            const t2 = t * t;
            const t3 = t2 * t;
            const oneMinusT2 = oneMinusT * oneMinusT;
            const oneMinusT3 = oneMinusT2 * oneMinusT;

            const term1 = oneMinusT3 * points[0];
            const term2 = 3 * oneMinusT2 * t * points[1];
            const term3 = 3 * oneMinusT * t2 * points[2];
            const term4 = t3 * points[3];

            const price = term1 + term2 + term3 + term4;
            maxPrice = Math.max(maxPrice, price);
        }
        return maxPrice;
    }

    function calculateTotalEth(points, tokens) {
        const STEPS = 100;
        const supply = Number(toWei(tokens).toString()) / 1e18;
        const stepSize = (supply/2) / STEPS;
        let totalEth = 0;

        for (let i = 0; i < STEPS; i++) {
            const t = i / STEPS;
            const oneMinusT = 1 - t;
            const t2 = t * t;
            const t3 = t2 * t;
            const oneMinusT2 = oneMinusT * oneMinusT;
            const oneMinusT3 = oneMinusT2 * oneMinusT;

            const term1 = oneMinusT3 * points[0];
            const term2 = 3 * oneMinusT2 * t * points[1];
            const term3 = 3 * oneMinusT * t2 * points[2];
            const term4 = t3 * points[3];

            const priceInWei = term1 + term2 + term3 + term4;
            totalEth += (priceInWei * 1e-18) * stepSize;
        }

        return totalEth.toFixed(4);
    }

    async function createToken() {
        if (!name || !symbol || saleSupply < 1 || pricePoints.some(p => p < 1) || !metadata.trim() || !salt.trim()) {
            alert('Please fill in all fields correctly. Sale supply must be at least 1 token, price points must be at least 1 (pricepoint of value 1wei == 1gwei in eth), metadata and salt are required.');
            return;
        }

        try {
            isLoading = true;
            const saltBytes32 = ethers.utils.formatBytes32String(salt);
            const pricePointsBN = pricePoints.map(p => ethers.BigNumber.from(p));
            
            // Pack metadata with logo and URLs
            const packedMetadata = packMetadata({
                description: metadata,
                logoUrl: logoURL,
                social: {
                    link1: url0,
                    link2: url1,
                    link3: url2
                }
            });
            
            const tx = await glottisMintContract.createToken(
                name,
                symbol,
                toWei(saleSupply),
                pricePointsBN,
                saltBytes32,
                ethers.utils.toUtf8Bytes(packedMetadata),
                { gasLimit: 4000000 }
            );
            
            await tx.wait();
            onClose();
        } catch (error) {
            console.error('Create token error:', error);
            alert('Failed to create token: ' + error.message);
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="bg-gray-900 text-gray-100">
    <div class="max-w-7xl mx-auto p-8">
        <!-- Preview Section -->
        <div class="bg-gradient-to-br from-gray-900/90 to-gray-800/50 backdrop-blur rounded-xl shadow-2xl border border-gray-700/50 overflow-hidden mb-24">
        <!-- Top Section with Name and Progress -->
        <div class="p-4 bg-gradient-to-r from-gray-900/50 to-transparent border-b border-gray-700/50">
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-3">
                    {#if logoURL}
                        <img 
                            src={logoURL} 
                            alt="Token logo preview" 
                            class="w-10 h-10 rounded-full bg-gray-800 border border-gray-700/50"
                            on:error={handleImageError}
                            on:load={handleImageLoad}
                            style="display: none"
                        />
                    {/if}
                    <input 
                        type="text" 
                        bind:value={name}
                        class="text-3xl font-extrabold bg-transparent text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded px-2"
                        placeholder="Token Name"
                    />
                    <input 
                        type="text" 
                        bind:value={symbol}
                        class="px-2 py-1 bg-gray-800/80 rounded-md text-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        placeholder="SYMBOL"
                    />
                </div>
                <div class="flex items-center gap-2">
                    <div class="text-xs text-gray-400 font-mono bg-gray-900/70 px-2 py-1 rounded-md">
                        {#if predictedAddress}
                            <span class={isDeployed ? "text-red-400" : "text-green-400"}>
                                {isDeployed ? "Already Deployed: " : "Preview Address: "}
                            </span>
                            {predictedAddress}
                        {:else}
                            Preview Address: 0x...
                        {/if}
                    </div>
                    <div class="bg-green-900/20 text-green-400 px-3 py-1 rounded-lg text-sm font-bold border border-green-500/20">
                        Progress: 0%
                    </div>
                </div>
            </div>
            
            <div class="mt-4 space-y-2">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-gray-400">Salt:</span>
                    <input 
                        type="text" 
                        bind:value={salt}
                        on:input={updatePredictedAddress}
                        class="bg-transparent text-purple-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded px-2 flex-grow"
                        placeholder="Enter salt value (required)"
                    />
                </div>
                <textarea 
                    bind:value={metadata}
                    class="w-full bg-transparent text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded px-2"
                    placeholder="Token description"
                    rows="2"
                ></textarea>
                
                <div class="flex gap-3">
                    <div class="flex items-center gap-2">
                        <span class="text-gray-400">Logo URL:</span>
                        <input 
                            type="text" 
                            bind:value={logoURL}
                            class="bg-transparent text-orange-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded px-2"
                            placeholder="Token Logo URL"
                        />
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-gray-400">Link 1:</span>
                        <input 
                            type="text" 
                            bind:value={url0}
                            class="bg-transparent text-blue-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded px-2"
                            placeholder="Social or website URL"
                        />
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-gray-400">Link 2:</span>
                        <input 
                            type="text" 
                            bind:value={url1}
                            class="bg-transparent text-indigo-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded px-2"
                            placeholder="Social or website URL"
                        />
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-gray-400">Link 3:</span>
                        <input 
                            type="text" 
                            bind:value={url2}
                            class="bg-transparent text-green-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded px-2"
                            placeholder="Social or website URL"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 gap-px bg-gray-700/20 p-px">
            <!-- Max Supply -->
            <div class="bg-gradient-to-br from-gray-900/95 to-gray-800/95 p-4 relative group">
                <div class="text-sm text-indigo-300 uppercase tracking-wider mb-2 font-medium">Maximum Supply</div>
                <div class="flex items-baseline gap-2">
                    <input 
                        type="number" 
                        bind:value={saleSupply}
                        class="text-2xl font-bold bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded px-2 w-[300px]"
                        min="1"
                        step="1"
                    />
                    <span class="text-lg text-gray-400 font-medium">{symbol || 'TOKEN'}</span>
                </div>
            </div>

        </div>

        <!-- Price Points Grid -->
        <div class="grid grid-cols-4 gap-px bg-gray-700/20 p-px mt-px">
            {#each pricePoints as point, i}
                <div class="bg-gray-900/95 p-3 relative group">
                    <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">
                        {#if i === 0}
                            Start Price
                        {:else if i === 3}
                            End Price
                        {:else}
                            Control Point {i}
                        {/if}
                    </div>
                    <div class="flex items-baseline gap-1">
                        <input 
                            type="number" 
                            bind:value={pricePoints[i]}
                            class="text-2xl font-bold bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded px-2 w-full"
                            min="1"
                            step="1"
                        />
                        <span class="text-gray-500 font-medium">gwei</span>
                    </div>
                    {#if i === 0}
                    <div class="text-xs text-gray-400 mt-1">
                        ≈ {(pricePoints[i] * 1e-9).toFixed(9)} ETH per token
                    </div>
                        {:else if i === 3}
                        <div class="text-xs text-gray-400 mt-1">
                            ≈ {(pricePoints[i] * 1e-9).toFixed(9)} ETH per token
                        </div>
                        {/if}
                    
                </div>
            {/each}
        </div>

        <!-- Bonding Curve Preview -->
        <div class="p-4 border-t border-gray-700/50">
            <canvas 
                class="bg-gray-900/50 rounded-lg w-full mb-4"
                bind:this={canvas}
                width="400"
                height="300"
            ></canvas>

            <div class="grid grid-cols-2 gap-4">
                <!-- Price Information -->
                <div class="bg-gray-900/70 rounded-lg p-3">
                    <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">Price Range</div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <div class="text-xs text-gray-400">Min Price</div>
                            <div class="text-lg font-bold text-green-400">
                                {(minPrice * 1e-9).toFixed(9)} ETH
                            </div>
                        </div>
                        <div>
                            <div class="text-xs text-gray-400">Max Price</div>
                            <div class="text-lg font-bold text-red-400">
                                {(maxPrice * 1e-9).toFixed(9)} ETH
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Total ETH Required -->
                <div class="bg-gray-900/70 rounded-lg p-3">
                    <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">Total ETH Required</div>
                    <div class="text-2xl font-bold text-indigo-400">
                        {totalEthRequired} ETH
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                        Amount needed to mint the entire sale supply
                    </div>
                </div>
            </div>
        </div>

        <!-- Supply Progress Bar -->
        <div class="bg-gray-900/80 px-4 py-3 border-t border-gray-700/50">
            <div class="flex justify-between items-center text-sm mb-2">
                <span class="text-gray-400">Current Supply</span>
                <span class="text-gray-400">
                    0 <span class="text-gray-600">/ {saleSupply}</span>
                </span>
            </div>
            <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500 w-0"></div>
            </div>
        </div>
        </div>
    </div>

    <!-- Create Button -->
    <div class="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-gray-900 via-gray-900 to-transparent">
        <div class="max-w-7xl mx-auto">
            <button 
                on:click={createToken}
                class="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                disabled={isLoading}
            >
                {#if isLoading}
                    <div class="flex items-center justify-center gap-2">
                        <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Token...
                    </div>
                {:else}
                    Create Token
                {/if}
            </button>
        </div>
    </div>
</div>
