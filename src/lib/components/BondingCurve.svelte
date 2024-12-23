<script>
    import { ethers } from 'ethers';
    import { getCurrentPrice, formatPrice, drawBezierCurve } from '../utils/token';

    export let token;
    export let currentStep;
    export let availableInStep;
</script>

<div class="w-2/3">
    <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold bg-clip-text  bg-gradient-to-r from-indigo-400 to-blue-400">
            Bonding Curve
        </h2>
        <div class="flex items-center gap-2 bg-gray-900/70 px-3 py-1.5 rounded-lg">
            <span class="text-sm text-gray-400">Fixed Price for Step {currentStep + 1}:</span>
            <span class="text-sm font-bold text-indigo-400">
                {(getCurrentPrice(token.pricePoints, token.progress))} wei
            </span>
        </div>
    </div>

    {#if token.pricePoints}
        <div class="relative">
            <canvas 
                class="w-full bg-gray-900/50 rounded-lg mb-4"
                use:drawBezierCurve={{
                    pricePoints: token.pricePoints,
                    progress: token.progress,
                    width: 800,
                    height: 400
                }}
                width="800"
                height="400"
            ></canvas>
            
            <div class="absolute opacity-50 top-2 right-2 bg-gray-900/90 backdrop-blur rounded-lg p-3 border border-gray-700/50">
                <div class="text-sm font-medium mb-2 text-indigo-400">Price Points (ETH)</div>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    {#each token.pricePoints as price, i}
                        <div class="flex items-center gap-2">
                            <div class="w-2 h-2 rounded-full bg-indigo-500"></div>
                            <span class="text-gray-400">P{i + 1}:</span>
                            <span class="font-medium text-white">{formatPrice(ethers.BigNumber.from(price).mul(ethers.BigNumber.from(10).pow(9)))}</span>
                        </div>
                    {/each}
                </div>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-4 mt-4 bg-gray-900/50 rounded-lg p-4 border border-gray-800">
            <div>
                <h3 class="font-medium text-indigo-400 mb-2 text-sm uppercase tracking-wider">How It Works</h3>
                <p class="text-gray-400 text-sm leading-relaxed">
                    The bonding curve is divided into 100 steps, with each step having a fixed price. 
                    The current step ({currentStep + 1}) has {ethers.utils.formatEther(availableInStep)} {token.symbol} 
                    available for purchase at {formatPrice(getCurrentPrice(token.pricePoints, token.progress))}. 
                    Once all tokens in the current step are sold, the price moves to the next step.
                </p>
            </div>
            <div class="border-l border-gray-800 pl-4">
                <h3 class="font-medium text-indigo-400 mb-2 text-sm uppercase tracking-wider">Current Status</h3>
                <div class="space-y-2">
                    <div class="flex justify-between items-center bg-gray-900/70 px-3 py-2 rounded-md">
                        <span class="text-gray-400 text-sm">Current Step:</span>
                        <span class="font-bold text-indigo-400">
                            Step {currentStep + 1}/100
                        </span>
                    </div>
                    <div class="flex justify-between items-center bg-gray-900/70 px-3 py-2 rounded-md">
                        <span class="text-gray-400 text-sm">Available:</span>
                        <span class="font-bold text-yellow-400">
                            {ethers.utils.formatEther(availableInStep)} {token.symbol}
                        </span>
                    </div>
                    <div class="flex justify-between items-center bg-gray-900/70 px-3 py-2 rounded-md">
                        <span class="text-gray-400 text-sm">Fixed Price:</span>
                        <span class="font-bold text-green-400">
                            {formatPrice(getCurrentPrice(token.pricePoints, token.progress))}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>
