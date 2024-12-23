<script>
    import { ethers } from 'ethers';
    import { findMinPrice, findMaxPrice, calculateTotalEth } from '../utils/token';

    export let token;

    $: minPrice = findMinPrice(token.pricePoints);
    $: maxPrice = findMaxPrice(token.pricePoints);
    $: totalEthRequired = calculateTotalEth(token.pricePoints, token.maxSupply);
</script>

<div class="bg-gray-800/50 backdrop-blur rounded-lg shadow-xl p-6 border border-gray-700">
    <h2 class="text-xl font-semibold text-indigo-300 mb-4">Price Information</h2>
    <div class="grid grid-cols-3 gap-4">
        <!-- Min Price -->
        <div class="bg-gray-900/70 rounded-lg p-3">
            <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">Min Price</div>
            <div class="text-2xl font-bold text-green-400">
                {(minPrice * 1e-9).toFixed(9)} ETH
            </div>
            <div class="text-xs text-gray-500 mt-1">
                Lowest price point on the curve
            </div>
        </div>

        <!-- Max Price -->
        <div class="bg-gray-900/70 rounded-lg p-3">
            <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">Max Price</div>
            <div class="text-2xl font-bold text-red-400">
                {(maxPrice * 1e-9).toFixed(9)} ETH
            </div>
            <div class="text-xs text-gray-500 mt-1">
                Highest price point on the curve
            </div>
        </div>

        <!-- Total ETH Required -->
        <div class="bg-gray-900/70 rounded-lg p-3">
            <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">Total ETH Required</div>
            <div class="text-2xl font-bold text-indigo-400">
                {totalEthRequired} ETH
            </div>
            <div class="text-xs text-gray-500 mt-1">
                Amount needed to buy the entire sale supply
            </div>
        </div>
    </div>
</div>
