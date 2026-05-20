export type PlayerStats = {
  name: string;
  played: number;
  wins: number;
  form: 'En feu 🔥' | 'Invincible 🛡️' | 'En forme 📈' | 'En galère 😤' | 'Maudit ☠️';
  recentResults: ('W' | 'L')[];
};

export type PairStats = {
  p1: string;
  p2: string;
  together: number;
  wins: number;
};

export type RankMethod = 'winrate' | 'regularite' | 'equilibre' | 'stabilite';

export type RankedPlayer = PlayerStats & { score: number };

export const PLAYER_STATS: PlayerStats[] = [
  { name: 'Michael',  played: 9, wins: 6, form: 'En feu 🔥',      recentResults: ['W','W','L','W','W'] },
  { name: 'Hugo',     played: 9, wins: 6, form: 'En feu 🔥',      recentResults: ['W','W','L','W','W'] },
  { name: 'LM',       played: 7, wins: 5, form: 'En feu 🔥',      recentResults: ['W','W','W','L','W'] },
  { name: 'Henri',    played: 8, wins: 5, form: 'En forme 📈',     recentResults: ['W','L','W','W','L'] },
  { name: 'Khalid',   played: 9, wins: 5, form: 'En forme 📈',     recentResults: ['W','L','L','W','W'] },
  { name: 'Théo',     played: 4, wins: 3, form: 'En feu 🔥',      recentResults: ['W','W','L','W']    },
  { name: 'Flo',      played: 8, wins: 5, form: 'En forme 📈',     recentResults: ['L','W','W','L','W'] },
  { name: 'Rémi',     played: 9, wins: 5, form: 'En galère 😤',    recentResults: ['L','W','W','L','W'] },
  { name: 'Dylan',    played: 9, wins: 5, form: 'En galère 😤',    recentResults: ['L','L','W','W','W'] },
  { name: 'Jack',     played: 5, wins: 3, form: 'En forme 📈',     recentResults: ['W','L','W','L','W'] },
  { name: 'Edouard',  played: 8, wins: 4, form: 'En galère 😤',    recentResults: ['L','W','L','W','L'] },
  { name: 'Ibrahima', played: 7, wins: 3, form: 'Maudit ☠️',      recentResults: ['L','L','W','L','W'] },
  { name: 'Tim',      played: 3, wins: 1, form: 'Maudit ☠️',      recentResults: ['L','L','W']        },
];

export const PAIR_STATS: PairStats[] = [
  { p1: 'Michael',  p2: 'Hugo',    together: 8, wins: 6 },
  { p1: 'LM',       p2: 'Khalid',  together: 6, wins: 5 },
  { p1: 'Michael',  p2: 'Henri',   together: 7, wins: 5 },
  { p1: 'Hugo',     p2: 'Khalid',  together: 8, wins: 5 },
  { p1: 'Rémi',     p2: 'Dylan',   together: 8, wins: 5 },
  { p1: 'Flo',      p2: 'Edouard', together: 7, wins: 4 },
  { p1: 'Rémi',     p2: 'Flo',     together: 7, wins: 4 },
  { p1: 'Henri',    p2: 'LM',      together: 5, wins: 4 },
  { p1: 'Dylan',    p2: 'Edouard', together: 6, wins: 3 },
  { p1: 'Ibrahima', p2: 'Rémi',    together: 5, wins: 2 },
];

const MIN_GAMES = 3;

export function rankPlayers(players: PlayerStats[], method: RankMethod): RankedPlayer[] {
  const maxPlayed = Math.max(...players.map(p => p.played));

  const scored = players
    .filter(p => p.played >= MIN_GAMES)
    .map(p => {
      const wr = p.wins / p.played;
      let score: number;

      switch (method) {
        case 'winrate':
          // Pure win rate
          score = wr;
          break;
        case 'regularite':
          // Rewards showing up AND winning: attendance × performance
          score = (p.played / maxPlayed) * 0.4 + wr * 0.6;
          break;
        case 'equilibre':
          // Bayesian: pulls toward 50% for few games, more reliable with more games
          score = (p.wins + 3 * 0.5) / (p.played + 3);
          break;
        case 'stabilite':
          // Elo-like confidence: higher with more games at same rate
          score = wr * Math.sqrt(p.played);
          break;
      }

      return { ...p, score };
    });

  return scored.sort((a, b) => b.score - a.score);
}

export const RANK_METHOD_LABELS: Record<RankMethod, string> = {
  winrate:    'Winrate',
  regularite: 'Régularité',
  equilibre:  'Équilibre',
  stabilite:  'Stabilité',
};

export const FORM_COLOR: Record<PlayerStats['form'], string> = {
  'En feu 🔥':      '#FF9800',
  'Invincible 🛡️':  '#4CAF50',
  'En forme 📈':    '#64B5F6',
  'En galère 😤':   '#9E9E9E',
  'Maudit ☠️':     '#F44336',
};
