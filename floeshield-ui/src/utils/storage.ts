import type { StoredIntent } from '../types';

const STORAGE_KEY = 'floeshield_intents';

// Helper to convert BigInt to string for storage
const serializeBigInt = (obj: any): any => {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
};

// Helper to convert string back to BigInt when loading
const deserializeBigInt = (obj: any): any => {
  if (obj.revealedIntent) {
    obj.revealedIntent.exactAmount = BigInt(obj.revealedIntent.exactAmount);
    obj.revealedIntent.exactLtvBps = BigInt(obj.revealedIntent.exactLtvBps);
    obj.revealedIntent.exactRateBps = BigInt(obj.revealedIntent.exactRateBps);
  }
  return obj;
};

export const saveIntent = (intentId: string, revealedIntent: any): void => {
  const intents = getStoredIntents();
  const newIntent: StoredIntent = {
    intentId,
    revealedIntent: serializeBigInt(revealedIntent),
    timestamp: Date.now(),
  };
  intents.push(newIntent);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(intents));
};

export const getStoredIntents = (): StoredIntent[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  
  const intents = JSON.parse(stored);
  return intents.map((intent: StoredIntent) => deserializeBigInt(intent));
};

export const getIntent = (intentId: string): StoredIntent | undefined => {
  const intents = getStoredIntents();
  return intents.find(i => i.intentId === intentId);
};

export const deleteIntent = (intentId: string): void => {
  const intents = getStoredIntents();
  const filtered = intents.filter(i => i.intentId !== intentId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};