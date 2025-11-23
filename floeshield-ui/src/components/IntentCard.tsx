import { useState, useEffect } from 'react';
import { Shield, Clock, TrendingUp, Eye, Trash2, CheckCircle, Link } from 'lucide-react';
import { ethers } from 'ethers';
import { getIntent } from '../utils/storage';
import { COLLATERAL_OPTIONS } from '../utils/contract';
import './IntentCard.css';

interface IntentCardProps {
  intentId: string;
  contract: any;
  account: string;
  onUpdate: () => void;
}

export const IntentCard = ({ intentId, contract, account, onUpdate }: IntentCardProps) => {
  const [intent, setIntent] = useState<any>(null);
  const [revealedData, setRevealedData] = useState<any>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [showMatches, setShowMatches] = useState(false);
  const [compatibleIntents, setCompatibleIntents] = useState<string[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  const loadIntent = async () => {
    try {
      const intentData = await contract.intents(intentId);
      console.log('Raw intent data:', intentData);
      
      const parsedIntent = {
        user: intentData[0],
        commitment: intentData[1],
        minLtvBps: intentData[2],
        maxLtvBps: intentData[3],
        maxRateBps: intentData[4],
        acceptedCollateral: [] as string[],
        expiry: intentData[5],
        createdAt: intentData[6],
        nonce: intentData[7],
        active: intentData[8],
        revealed: intentData[9],
      };
      
      const storedIntent = getIntent(intentId);
      if (storedIntent?.revealedIntent?.preferredCollateral) {
        parsedIntent.acceptedCollateral = [storedIntent.revealedIntent.preferredCollateral];
      }
      
      console.log('Parsed intent:', parsedIntent);
      setIntent(parsedIntent);

      // If revealed, fetch the revealed data
      if (parsedIntent.revealed) {
        try {
          const revealed = await contract.revealedIntents(intentId);
          console.log('Revealed intent data:', revealed);
          const parsedRevealed = {
            exactAmount: revealed[0],
            exactLtvBps: revealed[1],
            exactRateBps: revealed[2],
            preferredCollateral: revealed[3],
            salt: revealed[4],
            additionalData: revealed[5],
          };
          setRevealedData(parsedRevealed);
        } catch (error) {
          console.error('Error loading revealed data:', error);
        }
      }
    } catch (error) {
      console.error('Error loading intent:', error);
    }
  };

  const loadCompatibleIntents = async () => {
    if (!contract || !intentId) return;
    
    setIsLoadingMatches(true);
    try {
      const matches = await contract.getCompatibleIntents(intentId);
      console.log('Compatible intents:', matches);
      setCompatibleIntents(matches);
    } catch (error) {
      console.error('Error loading compatible intents:', error);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  useEffect(() => {
    if (contract && intentId) {
      loadIntent();
    }
  }, [intentId, contract]);

  const handleReveal = async () => {
    const storedIntent = getIntent(intentId);
    if (!storedIntent) {
      alert('Revealed intent data not found in local storage!');
      return;
    }

    setIsRevealing(true);
    try {
      const tx = await contract.revealIntent(intentId, storedIntent.revealedIntent);
      await tx.wait();
      alert('Intent revealed successfully! 🎉');
      await loadIntent();
      onUpdate();
    } catch (error: any) {
      console.error('Error revealing intent:', error);
      
      // Better error handling
      if (error.code === 'ACTION_REJECTED') {
        alert('Transaction was rejected');
      } else {
        alert(`Error: ${error.message || 'Failed to reveal intent'}`);
      }
    } finally {
      setIsRevealing(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirm('Are you sure you want to revoke this intent?')) return;

    setIsRevoking(true);
    try {
      const tx = await contract.revokeIntent(intentId);
      await tx.wait();
      alert('Intent revoked successfully!');
      await loadIntent();
      onUpdate();
    } catch (error: any) {
      console.error('Error revoking intent:', error);
      
      // Better error handling
      if (error.code === 'ACTION_REJECTED') {
        alert('Transaction was rejected');
      } else {
        alert(`Error: ${error.message || 'Failed to revoke intent'}`);
      }
    } finally {
      setIsRevoking(false);
    }
  };

  const handleFindMatches = async () => {
    if (showMatches) {
      setShowMatches(false);
    } else {
      await loadCompatibleIntents();
      setShowMatches(true);
    }
  };

  if (!intent) {
    return (
      <div className="intent-card loading">
        <div className="loading-shimmer"></div>
      </div>
    );
  }

  const isExpired = Number(intent.expiry) * 1000 < Date.now();
  
  // Properly check ownership by comparing hashed addresses
  const hashedAccount = ethers.keccak256(ethers.getBytes(account));
  const isOwner = hashedAccount.toLowerCase() === intent.user.toLowerCase();
  
  console.log('Ownership check:', {
    account,
    hashedAccount,
    intentUser: intent.user,
    isOwner
  });

  const canReveal = isOwner && intent.active && !intent.revealed && !isExpired;
  const canRevoke = isOwner && intent.active; // Can revoke even after revealing
  const canMatch = intent.active && !isExpired;

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  const getCollateralName = (address: string) => {
    const collateral = COLLATERAL_OPTIONS.find(c => c.address.toLowerCase() === address.toLowerCase());
    return collateral?.symbol || address.slice(0, 6);
  };

  return (
    <div className={`intent-card ${!intent.active ? 'inactive' : ''} ${isExpired ? 'expired' : ''}`}>
      <div className="card-header">
        <div className="card-status">
          {intent.revealed ? (
            <span className="status-badge revealed">
              <Eye size={14} />
              Revealed
            </span>
          ) : (
            <span className="status-badge shielded">
              <Shield size={14} />
              Shielded
            </span>
          )}
          {!intent.active && (
            <span className="status-badge revoked">
              <Trash2 size={14} />
              Revoked
            </span>
          )}
          {isExpired && (
            <span className="status-badge expired">
              <Clock size={14} />
              Expired
            </span>
          )}
        </div>
        {isOwner && (
          <span className="owner-badge">Your Intent</span>
        )}
      </div>

      <div className="card-body">
        <div className="intent-id">
          <span className="label">Intent ID:</span>
          <code className="hash">{intentId.slice(0, 10)}...{intentId.slice(-8)}</code>
        </div>

        <div className="intent-details">
          <div className="detail-row">
            <TrendingUp size={16} className="detail-icon" />
            <div>
              <span className="detail-label">LTV Range</span>
              <span className="detail-value">{Number(intent.minLtvBps) / 100}% - {Number(intent.maxLtvBps) / 100}%</span>
            </div>
          </div>

          <div className="detail-row">
            <TrendingUp size={16} className="detail-icon" />
            <div>
              <span className="detail-label">Max Rate</span>
              <span className="detail-value">{Number(intent.maxRateBps) / 100}%</span>
            </div>
          </div>

          <div className="detail-row">
            <Clock size={16} className="detail-icon" />
            <div>
              <span className="detail-label">Expires</span>
              <span className="detail-value">{formatDate(intent.expiry)}</span>
            </div>
          </div>

          {intent.acceptedCollateral && intent.acceptedCollateral.length > 0 && (
            <div className="detail-row">
              <Shield size={16} className="detail-icon" />
              <div>
                <span className="detail-label">Collateral</span>
                <div className="collateral-badges">
                  {intent.acceptedCollateral.map((addr: string, i: number) => (
                    <span key={i} className="collateral-badge">{getCollateralName(addr)}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {intent.revealed && revealedData && (
          <div className="revealed-section">
            <div className="revealed-header">
              <CheckCircle size={18} />
              <strong>Revealed Details</strong>
            </div>
            <div className="revealed-data">
              <div className="revealed-item">
                <span>Exact Amount:</span>
                <strong>{ethers.formatEther(revealedData.exactAmount)} ETH</strong>
              </div>
              <div className="revealed-item">
                <span>Exact LTV:</span>
                <strong>{Number(revealedData.exactLtvBps) / 100}%</strong>
              </div>
              <div className="revealed-item">
                <span>Exact Rate:</span>
                <strong>{Number(revealedData.exactRateBps) / 100}%</strong>
              </div>
              <div className="revealed-item">
                <span>Collateral:</span>
                <strong>{getCollateralName(revealedData.preferredCollateral)}</strong>
              </div>
            </div>
          </div>
        )}

        {showMatches && (
          <div className="matches-section">
            <div className="matches-header">
              <Link size={18} />
              <strong>Compatible Intents</strong>
            </div>
            {isLoadingMatches ? (
              <p className="matches-loading">Loading matches...</p>
            ) : compatibleIntents.length === 0 ? (
              <p className="matches-empty">No compatible intents found</p>
            ) : (
              <div className="matches-list">
                {compatibleIntents.map((matchId: string, i: number) => (
                  <div key={i} className="match-item">
                    <Link size={14} />
                    <code>{matchId.slice(0, 10)}...{matchId.slice(-8)}</code>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {(canMatch || canReveal || canRevoke) && (
        <div className="card-actions">
          {canMatch && (
            <button
              onClick={handleFindMatches}
              className="btn-action match"
              disabled={isLoadingMatches}
            >
              <Link size={16} />
              {showMatches ? 'Hide Matches' : 'Find Matches'}
            </button>
          )}
          {canReveal && (
            <button
              onClick={handleReveal}
              className="btn-action reveal"
              disabled={isRevealing}
            >
              <Eye size={16} />
              {isRevealing ? 'Revealing...' : 'Reveal'}
            </button>
          )}
          {canRevoke && (
            <button
              onClick={handleRevoke}
              className="btn-action revoke"
              disabled={isRevoking}
            >
              <Trash2 size={16} />
              {isRevoking ? 'Revoking...' : 'Revoke'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};