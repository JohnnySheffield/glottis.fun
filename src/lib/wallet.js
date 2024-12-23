// src/lib/wallet.js
import { ethers } from 'ethers';
import { account, provider, signer } from '../stores/web3Store';

const UNICHAN_SEPOLIA_CHAIN_ID = '1301'; // decimal format for addEthereumChain
const UNICHAN_SEPOLIA_CHAIN_ID_HEX = '0x' + Number(UNICHAN_SEPOLIA_CHAIN_ID).toString(16); // hex format for switchEthereumChain

export const UNICHAN_SEPOLIA_CONFIG = {
    chainId: UNICHAN_SEPOLIA_CHAIN_ID,
    chainName: 'Unichain Sepolia',
    nativeCurrency: {
        name: 'Sepolia ETH',
        symbol: 'ETH',
        decimals: 18
    },
    rpcUrls: ['https://sepolia.unichain.org'],
    blockExplorerUrls: ['https://unichain-sepolia.blockscout.com/']
};

async function addUnichanSepoliaNetwork() {
    try {
        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [UNICHAN_SEPOLIA_CONFIG]
        });
    } catch (error) {
        if (error.code === 4001) {
            throw new Error('User rejected network addition');
        }
        throw error;
    }
}

async function switchToUnichanSepolia() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: UNICHAN_SEPOLIA_CHAIN_ID_HEX }]
        });
    } catch (error) {
        if (error.code === 4902) { // Chain not added
            await addUnichanSepoliaNetwork();
            await switchToUnichanSepolia();
        } else if (error.code === 4001) {
            throw new Error('User rejected network switch');
        } else {
            throw error;
        }
    }
}

export async function connectWallet() {
    if (!window.ethereum) {
        throw new Error('No Web3 provider detected. Please install MetaMask.');
    }

    try {
        // First ensure we're on the correct network
        await switchToUnichanSepolia();

        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const userAccount = accounts[0];
        
        // Create Web3 provider and signer
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        const userSigner = web3Provider.getSigner();

        // Update stores
        provider.set(web3Provider);
        signer.set(userSigner);
        account.set(userAccount);

        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                // User disconnected
                provider.set(null);
                signer.set(null);
                account.set(null);
            } else {
                account.set(accounts[0]);
                signer.set(web3Provider.getSigner());
            }
        });

        // Listen for chain changes
        window.ethereum.on('chainChanged', async (_chainId) => {
            if (_chainId !== UNICHAN_SEPOLIA_CHAIN_ID_HEX) {
                // If changed to wrong network, switch back to Unichan Sepolia
                try {
                    await switchToUnichanSepolia();
                } catch (error) {
                    console.error('Failed to switch back to Unichan Sepolia:', error);
                    provider.set(null);
                    signer.set(null);
                    account.set(null);
                }
            }
            // Reload the page to refresh all states
            window.location.reload();
        });

        return {
            provider: web3Provider,
            signer: userSigner,
            account: userAccount
        };
    } catch (error) {
        console.error('Error connecting wallet:', error);
        throw error;
    }
}

export function isWalletConnected() {
    return window.ethereum && window.ethereum.selectedAddress;
}
