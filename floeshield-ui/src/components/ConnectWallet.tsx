import { Wallet, LogOut } from 'lucide-react';
import './ConnectWallet.css';

interface ConnectWalletProps {
  account: string;
  onConnect: () => Promise<void>;
  onDisconnect: () => void;
  isConnecting: boolean;
}

export const ConnectWallet = ({ account, onConnect, onDisconnect, isConnecting }: ConnectWalletProps) => {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (account) {
    return (
      <div className="wallet-connected">
        <div className="wallet-info">
          <div className="wallet-indicator"></div>
          <span className="wallet-address">{formatAddress(account)}</span>
        </div>
        <button onClick={onDisconnect} className="btn-disconnect" title="Disconnect">
          <LogOut size={18} />
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={onConnect} 
      className="btn-connect"
      disabled={isConnecting}
    >
      <Wallet size={20} />
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
};