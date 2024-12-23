<script>
    import { ethers } from 'ethers';
    import { isWalletConnected } from '../stores/web3Store';
    import { 
        ERC20_ABI, 
        getCurrentStep, 
        getStepSize, 
        getAvailableInStep,
        getProtocolFee,
        getCreatorFee,
        getCallerFee,
        getBurnFee
    } from './utils/token';

    export let token;
    export let wallet;
    export let glottisMintContract;
    export let glottisMintAddress;
    export let onClose;
    export let tokenBalance = '0';

    let ethAmount = '';      // Amount of ETH to spend (mint)
    let tokenAmount = '';    // Amount of tokens to burn
    let minTokensOut = '';   // Minimum tokens to receive
    let minEthOut = '';      // Minimum ETH to receive
    let isLoading = false;
    let activeTab = 'mint';

    // Fee states
    let protocolFee = '0.0015';
    let creatorFee = '0.0010';
    let callerFee = '0.0010';
    let burnFee = '0.0035';

    $: currentStep = token ? getCurrentStep(token.totalSupply, token.maxSupply).toNumber() : 0;
    $: stepSize = token ? getStepSize(token.maxSupply) : ethers.BigNumber.from(0);
    $: availableInStep = token ? getAvailableInStep(token.totalSupply, token.maxSupply) : ethers.BigNumber.from(0);

    // Fetch fees on mount
    async function fetchFees() {
        if (glottisMintContract) {
            protocolFee = await getProtocolFee(glottisMintContract);
            creatorFee = await getCreatorFee(glottisMintContract);
            callerFee = await getCallerFee(glottisMintContract);
            burnFee = await getBurnFee(glottisMintContract);
        }
    }

    // Call fetchFees when component mounts
    import { onMount } from 'svelte';
    onMount(fetchFees);

    async function mintTokens() {
        try {
            isLoading = true;
            const valueInWei = ethers.BigNumber.from(ethAmount);
            const minTokensOutWei = ethers.BigNumber.from(minTokensOut);

            // Validate against available tokens in step
            if (minTokensOutWei.gt(availableInStep)) {
                throw new Error(`Maximum available in current step is ${ethers.utils.formatEther(availableInStep)} tokens`);
            }
            
            const tx = await glottisMintContract.mint(
                token.address,
                minTokensOutWei,
                {
                    value: valueInWei,
                    //gasPrice: ethers.utils.parseUnits('30', 'gwei'),
                    //gasLimit: 2000000
                }
            );
            await tx.wait();
            console.log(tx);
            //onClose();
        } catch (error) {
            console.error('Mint error:', error);
            alert('Failed to mint tokens: ' + error.message);
        } finally {
            isLoading = false;
        }
    }

    async function burnTokens() {
        try {
            isLoading = true;
            const tokenContract = new ethers.Contract(token.address, ERC20_ABI, wallet);

            const contractBalance = await wallet.provider.getBalance(glottisMintAddress);
            console.log(contractBalance);
            
            const tokenAmountWei = ethers.BigNumber.from(tokenAmount);
            const minEthOutWei = ethers.BigNumber.from(minEthOut);

            // Validate against available tokens in step
            const currentSupply = token.totalSupply;
            const stepStartSupply = currentSupply.div(stepSize).mul(stepSize);
          
            console.log(tokenAmountWei, minEthOutWei);
            
            const approveTx = await tokenContract.approve(
                glottisMintAddress, 
                tokenAmountWei,
                {
                    //gasPrice: ethers.utils.parseUnits('30', 'gwei'),
                    //gasLimit: 4000000
                }
            );
            await approveTx.wait();

            const tx = await glottisMintContract.burn(
                token.address, 
                tokenAmountWei,
                minEthOutWei,
                {
                    //gasPrice: ethers.utils.parseUnits('30', 'gwei'),
                    //gasLimit: 4000000
                }
            );
            await tx.wait();

            console.log(tx);
            //onClose();
        } catch (error) {
            console.error('Burn error:', error);
            alert('Failed to burn tokens: ' + error.message);
        } finally {
            isLoading = false;
        }
    }

    async function deployUniswap() {
        try {
            isLoading = true;
            const tx = await glottisMintContract.createUniswapMarket(token.address,
                {
                    //gasPrice: ethers.utils.parseUnits('30', 'gwei'),
                    //gasLimit: 4000000
                });
            await tx.wait();
            //onClose();
        } catch (error) {
            console.error('Deploy error:', error);
            alert('Failed to deploy Uniswap market: ' + error.message);
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="space-y-6">
    {#if $isWalletConnected}
        <div class="border-b border-gray-700">
            <nav class="flex gap-4">
            <button
                class="px-4 py-2 font-medium {activeTab === 'mint' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}"
                on:click={() => activeTab = 'mint'}
            >
                Mint
            </button>
            <button
                class="px-4 py-2 font-medium {activeTab === 'burn' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}"
                on:click={() => activeTab = 'burn'}
            >
                Burn
            </button>
            <button
                class="px-4 py-2 font-medium {activeTab === 'deploy' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}"
                on:click={() => activeTab = 'deploy'}
            >
                Deploy Market
            </button>
        </nav>
        </div>

        <div class="space-y-6">

        {#if activeTab === 'mint'}
            <div class="space-y-4">
                <!-- Mint Fee Info -->
                <div class="bg-gray-800 rounded-lg p-4 text-sm">
                    <h3 class="font-medium text-indigo-400 mb-2">Fee Information</h3>
                    <div class="text-green-400">No fees for minting tokens!</div>
                    <div class="mt-2 text-xs text-gray-400">
                        Contract: 
                        <a 
                            href="https://unichain-sepolia.blockscout.com/address/{glottisMintAddress}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="font-mono hover:text-gray-300 transition-colors"
                        >
                            {glottisMintAddress}
                        </a>
                    </div>
                </div>

                <div>
                    <label 
                        for="ethAmount"
                        class="block text-sm mb-2 text-gray-300"
                    >
                        ETH Amount
                    </label>
                    <input 
                        id="ethAmount"
                        type="text" 
                        bind:value={ethAmount}
                        class="bg-gray-700 text-white rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="0"
                    />
                    <p class="text-sm text-gray-400 mt-1">Amount of ETH (in wei) you want to spend</p>
                </div>
                <div>
                    <label 
                        for="minTokensOut"
                        class="block text-sm mb-2 text-gray-300"
                    >
                        Minimum Tokens to Receive
                    </label>
                    <input 
                        id="minTokensOut"
                        type="text" 
                        bind:value={minTokensOut}
                        class="bg-gray-700 text-white rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="0"
                    />
                    <p class="text-sm text-gray-400 mt-1">
                        Minimum amount of tokens (in wei) you'll accept. Cannot exceed {ethers.utils.formatEther(availableInStep)} tokens.
                    </p>
                </div>
                <button 
                    on:click={mintTokens}
                    class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading || !wallet}
                >
                    {#if !wallet}
                        Connect Wallet to Mint
                    {:else if isLoading}
                        Processing...
                    {:else}
                        Mint Tokens
                    {/if}
                </button>
            </div>
        {:else if activeTab === 'burn'}
            <div class="space-y-4">
                <!-- Burn Fee Info -->
                <div class="bg-gray-800 rounded-lg p-4 text-sm">
                    <h3 class="font-medium text-indigo-400 mb-2">Fee Information</h3>
                    <div class="grid grid-cols-1 gap-2">
                        <div>
                            <span class="text-gray-400">Burn Fee:</span>
                            <span class="text-white ml-2">{(Number(burnFee) * 100).toFixed(2)}%</span>
                            <div class="text-xs text-gray-500 mt-1">This fee is deducted from the ETH value and sent to the protocol wallet</div>
                        </div>
                    </div>
                </div>

                <div>
                    <label 
                        for="tokenAmount"
                        class="block text-sm mb-2 text-gray-300"
                    >
                        Tokens to Burn
                    </label>
                    <input 
                        id="tokenAmount"
                        type="text" 
                        bind:value={tokenAmount}
                        class="bg-gray-700 text-white rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="0"
                    />
                    <p class="text-sm text-gray-400 mt-1">
                        Amount of tokens (in wei) you want to burn. Limited by current step availability.
                    </p>
                </div>
                <div>
                    <label 
                        for="minEthOut"
                        class="block text-sm mb-2 text-gray-300"
                    >
                        Minimum ETH to Receive
                    </label>
                    <input 
                        id="minEthOut"
                        type="text" 
                        bind:value={minEthOut}
                        class="bg-gray-700 text-white rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="0"
                    />
                    <p class="text-sm text-gray-400 mt-1">Minimum amount of ETH (in wei) you'll accept</p>
                </div>
                {#if tokenBalance}
                    <p class="text-sm text-gray-400">Your balance: {tokenBalance} wei tokens</p>
                {/if}
                <button 
                    on:click={burnTokens}
                    class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading || !wallet}
                >
                    {#if !wallet}
                        Connect Wallet to Burn
                    {:else if isLoading}
                        Processing...
                    {:else}
                        Burn Tokens
                    {/if}
                </button>
            </div>
        {:else if activeTab === 'deploy'}
            <div class="space-y-4">
                <!-- Deploy Fee Info -->
                <div class="bg-gray-800 rounded-lg p-4 text-sm">
                    <h3 class="font-medium text-indigo-400 mb-2">Uniswap Deployment Fees</h3>
                    <div class="grid grid-cols-1 gap-2">
                        <div>
                            <span class="text-gray-400">Protocol Fee:</span>
                            <span class="text-white ml-2">{(Number(protocolFee) * 100).toFixed(2)}%</span>
                        </div>
                        <div>
                            <span class="text-gray-400">Creator Fee:</span>
                            <span class="text-white ml-2">{(Number(creatorFee) * 100).toFixed(2)}%</span>
                        </div>
                        <div>
                            <span class="text-gray-400">Caller Fee:</span>
                            <span class="text-white ml-2">{(Number(callerFee) * 100).toFixed(2)}%</span>
                        </div>
                        <div class="text-xs text-gray-500 mt-1">
                            Total fees ({((Number(protocolFee) + Number(creatorFee) + Number(callerFee)) * 100).toFixed(2)}%) are split between protocol, creator, and caller
                        </div>
                    </div>
                </div>

                <p class="text-sm text-gray-300">
                    Deploy a new Uniswap V2 market for this token. This will create a new trading pair with ETH.
                    This can only be done after all tokens in the bonding curve have been sold.
                </p>
                <button 
                    on:click={deployUniswap}
                    class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading || !wallet}
                >
                    {#if !wallet}
                        Connect Wallet to Deploy
                    {:else if isLoading}
                        Deploying...
                    {:else}
                        Deploy Uniswap Market
                    {/if}
                </button>
            </div>
        {/if}
        </div>
    {:else}
        <div class="text-center py-8 bg-gray-800 rounded-lg">
            <h3 class="text-xl font-medium mb-2">Connect Wallet to Trade</h3>
            <p class="text-gray-400">You need to connect your wallet to mint or burn tokens</p>
        </div>
    {/if}
</div>
