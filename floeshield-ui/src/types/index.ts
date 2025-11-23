export interface IntentBounds {
  minLtvBps: bigint;
  maxLtvBps: bigint;
  maxRateBps: bigint;
  acceptedCollateral: string[];
}

export interface ShieldedIntent {
  user: string;
  commitment: string;
  minLtvBps: bigint;
  maxLtvBps: bigint;
  maxRateBps: bigint;
  acceptedCollateral: string[];
  expiry: bigint;
  createdAt: bigint;
  nonce: bigint;
  active: boolean;
  revealed: boolean;
}

export interface RevealedIntent {
  exactAmount: bigint;
  exactLtvBps: bigint;
  exactRateBps: bigint;
  preferredCollateral: string;
  salt: string;
  additionalData: string;
}

export interface StoredIntent {
  intentId: string;
  revealedIntent: RevealedIntent;
  timestamp: number;
}