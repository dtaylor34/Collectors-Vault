import { METROS } from '../data';

export type ProximityLevel = 'local' | 'state' | 'region' | 'other';

export interface ProximityResult {
  level: ProximityLevel;
  label: string;
  color: string;
  metroLabel: string;
  stateLabel: string;
}

export function getProximity(userMetroId: string, targetMetroId: string): ProximityResult {
  const user = METROS.find(m => m.id === userMetroId);
  const target = METROS.find(m => m.id === targetMetroId);
  const metroLabel = target?.label ?? 'Unknown';
  const stateLabel = target?.state ?? '';

  if (!user || !target) {
    return { level: 'other', label: 'Unknown', color: '#FF9800', metroLabel, stateLabel };
  }

  if (userMetroId === targetMetroId) {
    return { level: 'local', label: 'Local', color: '#4CAF50', metroLabel, stateLabel };
  }
  if (user.state === target.state) {
    return { level: 'state', label: 'Same State', color: '#8BC34A', metroLabel, stateLabel };
  }
  if (user.region === target.region) {
    return { level: 'region', label: target.region, color: '#FFC107', metroLabel, stateLabel };
  }
  return { level: 'other', label: target.region, color: '#FF9800', metroLabel, stateLabel };
}

export function filterByProximity<T extends { metro?: string }>(
  items: T[],
  userMetro: string,
  filter: 'all' | 'local' | 'state' | 'region'
): T[] {
  if (filter === 'all') return items;
  return items.filter(item => {
    if (!item.metro) return false;
    const prox = getProximity(userMetro, item.metro);
    switch (filter) {
      case 'local': return prox.level === 'local';
      case 'state': return prox.level === 'local' || prox.level === 'state';
      case 'region': return prox.level !== 'other';
      default: return true;
    }
  });
}
