import React, {createContext, useContext, useState, ReactNode} from 'react';
import {ethers} from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {CONTRACTS, WALLETCONNECT_PROJECT_ID} from '@config/contracts';
// See global.d.ts for module declaration of '@walletconnect/react-native-compat'
// @ts-ignore
import {Web3Modal} from '@walletconnect/react-native-compat';
import {Platform} from 'react-native';

interface Web3ContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchNetwork: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType>({
  provider: null,
  signer: null,
  address: null,
  chainId: null,
  isConnected: false,
  isConnecting: false,
  connect: async () => {},
  disconnect: async () => {},
  switchNetwork: async () => {},
});

export const useWeb3 = () => useContext(Web3Context);

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({children}) => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // WalletConnect v2 integration
  // Removed unused wcSession
  const [wcProvider, setWcProvider] = useState<any>(null);

  // Web3Modal config
  const web3ModalConfig = {
    projectId: WALLETCONNECT_PROJECT_ID,
    providerMetadata: {
      name: 'Aetheron Mobile',
      description: 'Aetheron Platform Mobile Wallet',
      url: 'https://mastatrill.github.io/aetheron-platform',
      icons: ['https://mastatrill.github.io/aetheron-platform/logo192.png'],
      redirect: {
        native: Platform.OS === 'ios' ? 'aetheron://' : 'aetheron://',
        universal: 'https://mastatrill.github.io/aetheron-platform',
      },
    },
    chains: ['eip155:137'],
  };

  // Handle WalletConnect session proposal
  const handleSessionProposal = async () => {
    // Approve all requests for now (customize as needed)
    return {
      accounts: [address],
      chainId: CONTRACTS.NETWORK.CHAIN_ID,
    };
  };

  // Connect with WalletConnect
  const connect = async () => {
    try {
      setIsConnecting(true);
      // Use Web3Modal to connect
      const modal = new Web3Modal(web3ModalConfig);
      const modalProvider = await modal.connect();
      setWcProvider(modalProvider);
      setProvider(new ethers.BrowserProvider(modalProvider));
      const modalSigner = await new ethers.BrowserProvider(modalProvider).getSigner();
      setSigner(modalSigner);
      const userAddress = await modalSigner.getAddress();
      setAddress(userAddress);
      setChainId(CONTRACTS.NETWORK.CHAIN_ID);
      setIsConnected(true);
      await AsyncStorage.setItem('walletAddress', userAddress);
      // Listen for session proposals
      modalProvider.on('session_proposal', handleSessionProposal);
    } catch (error) {
      console.error('WalletConnect connection failed:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect WalletConnect
  const disconnect = async () => {
    try {
      if (wcProvider && wcProvider.disconnect) {
        await wcProvider.disconnect();
      }
      setProvider(null);
      setSigner(null);
      setAddress(null);
      setChainId(null);
      setIsConnected(false);
      setWcProvider(null);
      await AsyncStorage.removeItem('walletAddress');
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  // Switch network (Polygon)
  const switchNetwork = async () => {
    try {
      if (wcProvider && wcProvider.request) {
        await wcProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{chainId: '0x89'}],
        });
      }
    } catch (error) {
      console.error('Network switch failed:', error);
      throw error;
    }
  };

  const value: Web3ContextType = {
    provider,
    signer,
    address,
    chainId,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    switchNetwork,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};
