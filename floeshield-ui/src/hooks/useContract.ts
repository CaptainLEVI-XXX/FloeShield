import { useState, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import type { Signer } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/contract';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const BASE_SEPOLIA_CHAIN_ID = 84532;

export const useContract = () => {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [account, setAccount] = useState<string>('');
  const [chainId, setChainId] = useState<number>(0);

  useEffect(() => {
    if (signer && CONTRACT_ADDRESS) {
      const contractInstance = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setContract(contractInstance);
    }
  }, [signer]);

  const switchToBaseSepolia = async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x14a34' }], // 84532 in hex
      });
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x14a34',
              chainName: 'Base Sepolia',
              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://sepolia.base.org'],
              blockExplorerUrls: ['https://sepolia.basescan.org'],
            }],
          });
        } catch (addError) {
          console.error('Error adding Base Sepolia:', addError);
        }
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const browserProvider = new BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send('eth_requestAccounts', []);
        const network = await browserProvider.getNetwork();
        const signerInstance = await browserProvider.getSigner();

        setProvider(browserProvider);
        setSigner(signerInstance);
        setAccount(accounts[0]);
        setChainId(Number(network.chainId));

        // Auto-switch to Base Sepolia if on wrong network
        if (Number(network.chainId) !== BASE_SEPOLIA_CHAIN_ID) {
          await switchToBaseSepolia();
        }

        window.ethereum.on('accountsChanged', (newAccounts: string[]) => {
          setAccount(newAccounts[0] || '');
        });

        window.ethereum.on('chainChanged', () => {
          window.location.reload();
        });

        return accounts[0];
      } catch (error) {
        console.error('Error connecting wallet:', error);
        throw error;
      }
    } else {
      throw new Error('MetaMask is not installed');
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setContract(null);
    setAccount('');
    setChainId(0);
  };

  return {
    provider,
    signer,
    contract,
    account,
    chainId,
    connectWallet,
    disconnectWallet,
    isConnected: !!account,
  };
};