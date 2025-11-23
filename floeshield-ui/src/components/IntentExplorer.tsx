import { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, Shield } from 'lucide-react';
import { IntentCard } from './IntentCard';
import './IntentExplorer.css';

interface IntentExplorerProps {
  contract: any;
  account: string;
}

export const IntentExplorer = ({ contract, account }: IntentExplorerProps) => {
  const [userIntents, setUserIntents] = useState<string[]>([]);
  const [allIntents, setAllIntents] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'my' | 'active'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const loadIntents = async () => {
    if (!contract || !account) {
      console.log('Contract or account not available:', { contract: !!contract, account });
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Loading intents for account:', account);
      
      // Load user intents
      const userIntentIds = await contract.getUserIntents(account);
      console.log('Loaded user intents:', userIntentIds);
      setUserIntents(userIntentIds);

      // Load ALL intents from the contract's allIntents array
      try {
        // Since Solidity doesn't provide .length for public arrays,
        // we need to query until we get an error
        const allIntentIds: string[] = [];
        let index = 0;
        
        while (true) {
          try {
            const intentId = await contract.allIntents(index);
            allIntentIds.push(intentId);
            index++;
          } catch (err) {
            // When we get an error, we've reached the end of the array
            break;
          }
        }
        
        console.log('Loaded all intents from array:', allIntentIds);
        setAllIntents(allIntentIds);
      } catch (arrayError) {
        console.error('Error loading allIntents array, falling back to user intents:', arrayError);
        // Fallback: if array reading fails, just show user intents
        setAllIntents(userIntentIds);
      }
    } catch (err: any) {
      console.error('Error loading intents:', err);
      setError(err.message || 'Failed to load intents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (contract && account) {
      loadIntents();
    }
  }, [contract, account]);

  const getFilteredIntents = () => {
    let intents = filter === 'my' ? userIntents : allIntents;
    
    if (searchTerm) {
      intents = intents.filter(id => 
        id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return intents;
  };

  const filteredIntents = getFilteredIntents();

  return (
    <div className="intent-explorer">
      <div className="explorer-header">
        <div>
          <h2>Intent Explorer</h2>
          <p>Browse and manage shielded intents</p>
        </div>
        <button onClick={loadIntents} className="btn-refresh" disabled={isLoading}>
          <RefreshCw size={18} className={isLoading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="explorer-controls">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by Intent ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <Filter size={16} />
            All Intents ({allIntents.length})
          </button>
          <button
            className={`filter-btn ${filter === 'my' ? 'active' : ''}`}
            onClick={() => setFilter('my')}
          >
            <Filter size={16} />
            My Intents ({userIntents.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
        </div>
      )}

      <div className="intents-grid">
        {isLoading ? (
          <div className="loading-state">
            <RefreshCw size={32} className="spin" />
            <p>Loading intents...</p>
          </div>
        ) : filteredIntents.length === 0 ? (
          <div className="empty-state">
            <Shield size={48} />
            <h3>No intents found</h3>
            <p>
              {filter === 'my' 
                ? 'You haven\'t created any intents yet. Create your first shielded intent!'
                : 'No intents have been created yet. Be the first to create one!'}
            </p>
          </div>
        ) : (
          filteredIntents.map((intentId) => (
            <IntentCard
              key={intentId}
              intentId={intentId}
              contract={contract}
              account={account}
              onUpdate={loadIntents}
            />
          ))
        )}
      </div>
    </div>
  );
};