import { Criterion, PlayerRatings, RatingsStore, defaultRatings } from '../store/usePlayerRatings';
import { Position } from '../store/useOnboarding';

function avgStrength(r: PlayerRatings): number {
  const keys: Criterion[] = ['endurance', 'vitesse', 'technique', 'vision', 'physique', 'leadership'];
  return keys.reduce((s, k) => s + r[k], 0) / keys.length;
}

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length === k) return [arr.slice()];
  if (arr.length < k) return [];
  const [head, ...tail] = arr;
  return [
    ...combinations(tail, k - 1).map(c => [head, ...c]),
    ...combinations(tail, k),
  ];
}

export function balanceTeams(
  players: string[],
  ratings: RatingsStore,
  positions: Record<string, Position>,
): { teamA: string[]; teamB: string[] } {
  const n = players.length;
  if (n < 2) return { teamA: players, teamB: [] };
  const sizeA = Math.floor(n / 2);

  const strength: Record<string, number> = {};
  for (const p of players) strength[p] = avgStrength(ratings[p] ?? defaultRatings());

  const byStrength = [...players].sort((a, b) => strength[b] - strength[a]);
  const top2 = new Set(byStrength.slice(0, 2));

  const anyPositionKnown = players.some(p => positions[p]);

  let best: { teamA: string[]; teamB: string[] } = {
    teamA: players.slice(0, sizeA),
    teamB: players.slice(sizeA),
  };
  let bestScore = Infinity;

  for (const teamA of combinations(players, sizeA)) {
    const setA = new Set(teamA);
    const teamB = players.filter(p => !setA.has(p));

    const sumA = teamA.reduce((s, p) => s + strength[p], 0);
    const sumB = teamB.reduce((s, p) => s + strength[p], 0);
    const diff = Math.abs(sumA - sumB);

    let penalty = 0;
    if ([...top2].every(p => setA.has(p))) penalty += 5;
    if ([...top2].every(p => !setA.has(p))) penalty += 5;

    if (anyPositionKnown) {
      if (!teamA.some(p => positions[p] === 'GK')) penalty += 2;
      if (!teamB.some(p => positions[p] === 'GK')) penalty += 2;
    }

    const score = diff * 10 + penalty;
    if (score < bestScore) {
      bestScore = score;
      best = { teamA, teamB };
    }
  }

  return best;
}

export function teamStrength(players: string[], ratings: RatingsStore): number {
  return players.reduce((s, p) => s + avgStrength(ratings[p] ?? defaultRatings()), 0);
}
