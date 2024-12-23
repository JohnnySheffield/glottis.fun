<script context="module">
    import { ethers } from 'ethers';
    import { provider } from './stores/web3Store';
    import { UNICHAN_SEPOLIA_CONFIG } from './lib/wallet';

    // Initialize read-only provider immediately when module loads
    const readOnlyProvider = new ethers.providers.JsonRpcProvider(UNICHAN_SEPOLIA_CONFIG.rpcUrls[0]);
    provider.set(readOnlyProvider);
</script>

<script>
    import { onMount, onDestroy } from 'svelte';
    import { connectWallet, isWalletConnected as checkWalletConnected } from './lib/wallet';
    import { account, signer, isWalletConnected, isProviderReady, connectionError } from './stores/web3Store';
    import { hasAcknowledgedTestnet } from './stores/alertStore';
    import TokenPage from './lib/TokenPage.svelte';
    import TokenDetails from './lib/TokenDetails.svelte';
    import CreateTokenPage from './lib/CreateTokenPage.svelte';

    let currentPath = '';
    let currentBlock = '';
    let network = UNICHAN_SEPOLIA_CONFIG.chainName;
    let tokenAddress = '';
    let isCreateRoute = false;
    let connecting = false;
    let error = '';
    let balance = '';

    $: walletAddress = $account ? 
        $account.slice(0, 6) + '...' + $account.slice(-4) : 
        'Connect Wallet';

    async function updateBalance() {
        if ($provider && $account) {
            const balanceWei = await $provider.getBalance($account);
            balance = ethers.utils.formatEther(balanceWei);
        }
    }

    // Set up block listener when provider changes
    let blockListener;
    $: if ($provider) {
        // Clean up old listener if it exists
        if (blockListener) {
            $provider.off('block', blockListener);
        }

        // Create new listener
        blockListener = (blockNumber) => {
            console.log('New block:', blockNumber);
            currentBlock = blockNumber.toString();
        };
        
        // Get initial block number
        $provider.getBlockNumber().then(blockNumber => {
            currentBlock = blockNumber.toString();
        });
        
        // Set up block listener
        $provider.on('block', blockListener);
    }

    async function handleConnect() {
        if (connecting) return;
        
        try {
            connecting = true;
            error = '';
            await connectWallet();
            await updateBalance();
        } catch (err) {
            error = err.message;
            console.error('Connection error:', err);
        } finally {
            connecting = false;
        }
    }

    function handleNavigation() {
        currentPath = window.location.pathname;
        
        if (currentPath === '/create') {
            isCreateRoute = true;
            tokenAddress = '';
        } else {
            isCreateRoute = false;
            const match = currentPath.match(/^\/token\/([^/]+)/);
            tokenAddress = match ? match[1] : '';
        }
    }

    onMount(() => {
        handleNavigation();
        window.addEventListener('popstate', handleNavigation);

        // Check if wallet is already connected
        if (checkWalletConnected()) {
            handleConnect();
        }

        return () => {
            window.removeEventListener('popstate', handleNavigation);
            if ($provider) {
                $provider.removeAllListeners();
            }
        };
    });

    // Update balance when account changes
    $: if ($account) {
        updateBalance();
    }

    // Clean up block listener on component destroy
    onDestroy(() => {
        if ($provider && blockListener) {
            $provider.off('block', blockListener);
        }
    });
</script>

<svelte:head>
    <style>
        body {
            margin: 0;
            font-family: 'JetBrains Mono', 'Fira Mono', 'IBM Plex Mono', 'Roboto Mono', 'SF Mono', Consolas, 'Courier New', monospace;
            -webkit-font-smoothing: none;
            font-size: 12px;
            letter-spacing: -0.5px;
            background-color: #111827;
            position: relative;
            color: rgba(255, 255, 255, 0.95);
            text-shadow: 
                0.02em 0 0 rgba(255, 0, 0, 0.55),
                -0.03em 0 0 rgba(0, 255, 0, 0.55),
                0 0 3px rgba(0, 0, 255, 0.55);
        }

        /* Enhanced scanlines effect */
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                90deg,
                rgba(40, 80, 0, 0.09),
                rgba(40, 50, 0, 0.13),
                rgba(40, 50, 0, 0.13),
                rgba(40, 50, 0, 0.13),
                rgba(40, 80, 0, 0.13)
            );
            pointer-events: none;
            z-index: 1;
            mix-blend-mode: screen;
        }

        /* Scanlines */
        body::after {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: repeating-linear-gradient(
                0deg,
                rgba(0, 0, 0, 0.15) 0px,
                rgba(0, 0, 0, 0.15) 1px,
                transparent 1px,
                transparent 2px
            );
            pointer-events: none;
            z-index: 2;
            opacity: 0.5;
            animation: scanline 10s linear infinite;
        }

        @keyframes scanline {
            0% {
                transform: translateY(0);
            }
            100% {
                transform: translateY(60px);
            }
        }
    </style>
</svelte:head>

{#if !$hasAcknowledgedTestnet}
    <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div class="bg-gray-900 border border-gray-700 p-8 rounded-lg max-w-lg w-full mx-4 relative overflow-hidden">
            <div class="relative z-10">
                <h2 class="text-xl mb-4 font-bold text-red-500">⚠️ Testnet Project Warning</h2>
                <p class="mb-6">
                    This project is currently running on testnet and is in early development. 
                    Features may be buggy or incomplete. Use at your own risk. 
                    Check sources at <a href=">https://github.com/JohnnySheffield/glottis.contracts">glottis.contracts repo</a>
                    and <a href="https://github.com/JohnnySheffield/glottis.fun">glottis.fun repo</a>
                </p>
                <button 
                    on:click={() => hasAcknowledgedTestnet.set(true)}
                    class="w-full px-4 py-2 bg-red-900/50 hover:bg-red-800/50 rounded-lg transition-colors border border-red-700"
                >
                    I Understand, Continue
                </button>
            </div>
            <div class="absolute inset-0 opacity-50">
                <div class="absolute inset-0 bg-gradient-to-br from-red-900/20 to-transparent"></div>
            </div>
        </div>
    </div>
{/if}

<div class="min-h-screen">
    <header class="p-4 border-b border-gray-800">
        <div class="flex justify-between items-center max-w-7xl mx-auto">
            <a href="/" class="text-xl font-bold">Glottis</a>
            {#if $provider}
                
                    <p>Network: {network}</p>
                    <p>Latest Block: {currentBlock || 'Loading...'}</p>
                    {#if $account}
                        <p>Address: {walletAddress}</p>
                        <p>Balance: {balance} ETH</p>
                    {/if}
                
            {/if}
            <button
                on:click={handleConnect}
                class="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                disabled={connecting}
            >
                {#if connecting}
                    Connecting...
                {:else}
                    {walletAddress}
                {/if}
            </button>
        </div>
    </header>

    {#if error}
        <div class="max-w-7xl mx-auto mt-4 p-4 bg-red-900/50 text-red-200 rounded-lg">
            {error}
        </div>
    {/if}

    <main class="max-w-7xl mx-auto p-4">
        {#if $isProviderReady}
            {#if isCreateRoute}
                {#if $isWalletConnected}
                    <CreateTokenPage wallet={$signer} />
                {:else}
                    <div class="text-center py-12">
                        <h2 class="text-xl mb-4">Connect Wallet to Create Token</h2>
                        <p class="mb-4">You need to connect your wallet to create new tokens</p>
                    </div>
                {/if}
            {:else if tokenAddress}
                <TokenDetails provider={$provider} wallet={$signer} {tokenAddress} />
            {:else}
                <TokenPage provider={$provider} wallet={$signer} />
            {/if}
        {:else}
            <div class="text-center py-12">
                <h2 class="text-xl mb-4">Loading Glottis</h2>
                <p class="mb-4">Initializing connection to network...</p>
            </div>
        {/if}
    </main>
</div>
