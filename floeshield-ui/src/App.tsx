import { useState } from 'react';
import { Shield, Github } from 'lucide-react';
import { useContract } from './hooks/useContract';
import { ConnectWallet } from './components/ConnectWallet';
import { CreateIntent } from './components/CreateIntent';
import { IntentExplorer } from './components/IntentExplorer';
import './App.css';

type Tab = 'create' | 'explore';

function App() {
  const { contract, account, connectWallet, disconnectWallet, isConnected } = useContract();
  const [activeTab, setActiveTab] = useState<Tab>('create');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connectWallet();
    } catch (error) {
      console.error('Connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <a href="https://github.com/yourusername/floeshield" target="_blank" rel="noopener noreferrer" 
               style={{ color: 'var(--text-secondary)', transition: 'color 0.3s' }}
               onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
               onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
              <Github size={24} />
            </a>
          </div>
          <ConnectWallet
            account={account}
            onConnect={handleConnect}
            onDisconnect={disconnectWallet}
            isConnecting={isConnecting}
          />
        </header>

        <div className="hero-section">
          <div className="shield-icon">
            <Shield />
          </div>
          <h1 className="hero-title">FloeShield</h1>
          <p className="hero-subtitle">
            Privacy-Preserving Intent Registry • Prove compliance without revealing terms
          </p>
        </div>

        {isConnected && (
          <>
            <div className="stats-bar">
              <div className="stat-card">
                <span className="stat-value">100%</span>
                <span className="stat-label">Privacy Protected</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">0</span>
                <span className="stat-label">Front-Running Risk</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">∞</span>
                <span className="stat-label">MEV Protection</span>
              </div>
            </div>

            <div className="tab-navigation">
              <button
                className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
                onClick={() => setActiveTab('create')}
              >
                Create Intent
              </button>
              <button
                className={`tab-button ${activeTab === 'explore' ? 'active' : ''}`}
                onClick={() => setActiveTab('explore')}
              >
                Explore Intents
              </button>
            </div>

            <div className="content-section">
              {activeTab === 'create' && <CreateIntent contract={contract} account={account} />}
              {activeTab === 'explore' && <IntentExplorer contract={contract} account={account} />}
            </div>
          </>
        )}

        {!isConnected && (
          <div className="wallet-prompt">
            <Shield className="wallet-prompt-icon" size={64} />
            <h3>Connect Your Wallet</h3>
            <p>Connect your wallet to start creating privacy-preserving intents</p>
            <ConnectWallet
              account={account}
              onConnect={handleConnect}
              onDisconnect={disconnectWallet}
              isConnecting={isConnecting}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;