import { writable, derived } from 'svelte/store';

export const account = writable(null);
export const provider = writable(null);
export const signer = writable(null);

// Derived store to track connection status
export const isWalletConnected = derived(
    [account, signer],
    ([$account, $signer]) => Boolean($account && $signer)
);

export const isProviderReady = derived(
    [provider],
    ([$provider]) => Boolean($provider)
);

// Store for connection errors
export const connectionError = writable(null);
