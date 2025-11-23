import { useState } from 'react';
import { Shield, Clock, TrendingUp, DollarSign, Loader } from 'lucide-react';
import { ethers } from 'ethers';
import { PROTOCOL_LIMITS, COLLATERAL_OPTIONS } from '../utils/contract';
import { saveIntent } from '../utils/storage';
import './CreateIntent.css';

interface CreateIntentProps {
  contract: any;
  account: string;
}

export const CreateIntent = ({ contract }: CreateIntentProps) => {
  const [formData, setFormData] = useState({
    amount: '',
    ltvMin: '50',
    ltvMax: '80',
    rate: '15',
    duration: '30',
    selectedCollateral: [COLLATERAL_OPTIONS[0].address],
  });
  const [isCreating, setIsCreating] = useState(false);
  const [txHash, setTxHash] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) return;

    setIsCreating(true);
    setTxHash('');

    try {
      // Generate random salt
      const salt = ethers.randomBytes(32);
      const saltHex = ethers.hexlify(salt);

      // Prepare revealed intent data
      const revealedIntent = {
        exactAmount: ethers.parseEther(formData.amount),
        exactLtvBps: BigInt(parseFloat(formData.ltvMax) * 100),
        exactRateBps: BigInt(parseFloat(formData.rate) * 100),
        preferredCollateral: formData.selectedCollateral[0],
        salt: saltHex,
        additionalData: '0x',
      };

      // Create commitment using solidityPackedKeccak256 to match abi.encodePacked
      const commitment = ethers.solidityPackedKeccak256(
        ['uint256', 'uint256', 'uint256', 'address', 'bytes32', 'bytes'],
        [
          revealedIntent.exactAmount,
          revealedIntent.exactLtvBps,
          revealedIntent.exactRateBps,
          revealedIntent.preferredCollateral,
          revealedIntent.salt,
          revealedIntent.additionalData,
        ]
      );

      // Prepare bounds
      const bounds = {
        minLtvBps: BigInt(parseFloat(formData.ltvMin) * 100),
        maxLtvBps: BigInt(parseFloat(formData.ltvMax) * 100),
        maxRateBps: BigInt(parseFloat(formData.rate) * 100),
        acceptedCollateral: formData.selectedCollateral,
      };

      const expiry = Math.floor(Date.now() / 1000) + parseInt(formData.duration) * 24 * 60 * 60;
      const nonce = BigInt(Math.floor(Math.random() * 1000000));

      // Register intent
      const tx = await contract.registerShieldedIntent(commitment, bounds, expiry, nonce);
      setTxHash(tx.hash);

      const receipt = await tx.wait();
      
      // Get intentId from event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed && parsed.name === 'IntentRegistered';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = contract.interface.parseLog(event);
        const intentId = parsed.args.intentId;
        
        // Save to localStorage
        saveIntent(intentId, revealedIntent);
        
        alert('Intent created successfully! 🎉');
        
        // Reset form
        setFormData({
          amount: '',
          ltvMin: '50',
          ltvMax: '80',
          rate: '15',
          duration: '30',
          selectedCollateral: [COLLATERAL_OPTIONS[0].address],
        });
      }
    } catch (error: any) {
      console.error('Error creating intent:', error);
      alert(`Error: ${error.message || 'Failed to create intent'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCollateralToggle = (address: string) => {
    setFormData(prev => ({
      ...prev,
      selectedCollateral: prev.selectedCollateral.includes(address)
        ? prev.selectedCollateral.filter(a => a !== address)
        : [...prev.selectedCollateral, address]
    }));
  };

  return (
    <div className="create-intent-container">
      <div className="create-intent-header">
        <Shield className="header-icon" />
        <div>
          <h2>Create Shielded Intent</h2>
          <p>Your exact terms stay private until you reveal them</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="intent-form">
        <div className="form-grid">
          <div className="form-group">
            <label>
              <DollarSign size={18} />
              Loan Amount (ETH)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="1.0"
              required
            />
            <span className="field-hint">How much you want to borrow</span>
          </div>

          <div className="form-group">
            <label>
              <TrendingUp size={18} />
              LTV Range (%)
            </label>
            <div className="range-inputs">
              <input
                type="number"
                step="1"
                min={PROTOCOL_LIMITS.MIN_LTV / 100}
                max={formData.ltvMax}
                value={formData.ltvMin}
                onChange={(e) => setFormData({ ...formData, ltvMin: e.target.value })}
                placeholder="Min"
                required
              />
              <span className="range-separator">to</span>
              <input
                type="number"
                step="1"
                min={formData.ltvMin}
                max={PROTOCOL_LIMITS.MAX_LTV / 100}
                value={formData.ltvMax}
                onChange={(e) => setFormData({ ...formData, ltvMax: e.target.value })}
                placeholder="Max"
                required
              />
            </div>
            <span className="field-hint">Your acceptable LTV bounds (min: {PROTOCOL_LIMITS.MIN_LTV / 100}%, max: {PROTOCOL_LIMITS.MAX_LTV / 100}%)</span>
          </div>

          <div className="form-group">
            <label>
              <TrendingUp size={18} />
              Max Interest Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max={PROTOCOL_LIMITS.MAX_RATE / 100}
              value={formData.rate}
              onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
              placeholder="15"
              required
            />
            <span className="field-hint">Maximum rate you'll accept (max: {PROTOCOL_LIMITS.MAX_RATE / 100}%)</span>
          </div>

          <div className="form-group">
            <label>
              <Clock size={18} />
              Duration (days)
            </label>
            <input
              type="number"
              step="1"
              min="1"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="30"
              required
            />
            <span className="field-hint">How long the intent stays active</span>
          </div>
        </div>

        <div className="form-group">
          <label>Accepted Collateral</label>
          <div className="collateral-grid">
            {COLLATERAL_OPTIONS.map((collateral) => (
              <button
                key={collateral.address}
                type="button"
                className={`collateral-option ${
                  formData.selectedCollateral.includes(collateral.address) ? 'selected' : ''
                }`}
                onClick={() => handleCollateralToggle(collateral.address)}
              >
                <div className="collateral-icon">{collateral.symbol[0]}</div>
                <span>{collateral.symbol}</span>
              </button>
            ))}
          </div>
          <span className="field-hint">Select which assets you'll accept as collateral</span>
        </div>

        <div className="privacy-notice">
          <Shield size={20} />
          <div>
            <strong>Privacy Protected</strong>
            <p>Only your bounds (LTV range, max rate) will be visible on-chain. Your exact amount, rate, and LTV stay hidden until you reveal them.</p>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={isCreating || !contract}
        >
          {isCreating ? (
            <>
              <Loader className="spin" size={20} />
              Creating Intent...
            </>
          ) : (
            <>
              <Shield size={20} />
              Create Shielded Intent
            </>
          )}
        </button>

        {txHash && (
          <div className="tx-success">
            ✅ Transaction submitted! Hash: {txHash.slice(0, 10)}...
          </div>
        )}
      </form>
    </div>
  );
};