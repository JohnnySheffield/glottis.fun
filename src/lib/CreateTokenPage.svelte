<script>
    import { onMount } from 'svelte';
    import CreateToken from './CreateToken.svelte';

    export let wallet;

    function handleClose() {
        window.history.back();
    }
</script>

<div class="bg-gray-900 text-gray-100 p-4">
    <button 
        class="mb-6 text-indigo-400 hover:text-indigo-300 flex items-center gap-2"
        on:click={handleClose}
    >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
        Back to Tokens
    </button>

    <div class="mx-auto">
        <div class="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur rounded-xl shadow-2xl border border-gray-700/50 overflow-hidden">
            <div class="p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-900/50 to-transparent">
                <h1 class="text-2xl font-bold bg-clip-text  bg-gradient-to-r from-indigo-400 to-blue-400">
                    Create New Token
                </h1>
                <p class="text-gray-400 mt-2">Configure your token's parameters and bonding curve</p>
            </div>
            <div class="p-6">
                <CreateToken
                    {wallet}
                    onClose={handleClose}
                />
            </div>
        </div>
    </div>
</div>

<style>
    :global(body) {
        background-color: #111827;
    }
</style>
