export const TRUST_LEVELS = [
  { level: 0, name: 'Anonymous', color: '#555555', icon: '👤', desc: 'Vault ID only', requirements: 'Account created' },
  { level: 1, name: 'Verified', color: '#2196F3', icon: '✓', desc: 'Email verified, metro visible', requirements: 'Verify email + set metro' },
  { level: 2, name: 'Trusted', color: '#4CAF50', icon: '★', desc: '5+ completed transactions', requirements: '5+ sales/purchases, 0 disputes' },
  { level: 3, name: 'Connected', color: '#FFD600', icon: '🤝', desc: 'Mutually connected', requirements: 'Mutual connection accepted' },
] as const;

export function getTrustLevel(level: number) {
  return TRUST_LEVELS[Math.min(level, 3)] ?? TRUST_LEVELS[0];
}

export function canSeeMemberSince(viewerTrust: number, targetTrust: number): boolean {
  return targetTrust >= 2;
}

export function canSeeMetro(targetTrust: number): boolean {
  return targetTrust >= 1;
}

export function canSeeTransactionCount(targetTrust: number): boolean {
  return targetTrust >= 2;
}

export function canShareRealName(connectionStatus: 'none' | 'pending' | 'accepted'): boolean {
  return connectionStatus === 'accepted';
}

export function calculateTrustLevel(user: {
  emailVerified: boolean;
  metroId: string | null;
  transactionCount: number;
  hasDisputes: boolean;
}): number {
  if (!user.emailVerified) return 0;
  if (!user.metroId) return 0;
  if (user.transactionCount >= 5 && !user.hasDisputes) return 2;
  return 1;
}
