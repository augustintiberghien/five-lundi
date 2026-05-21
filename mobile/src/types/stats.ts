export type PlayerStats = {
  name: string;
  played: number;
  wins: number;
  form: 'En feu 🔥' | 'Invincible 🛡️' | 'En forme 📈' | 'En galère 😤' | 'Maudit ☠️';
  // Known recent results from s9/s8 session data — will be full from Supabase
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

// Form derived from overall win rate (proxy — real form = last 5 games from Supabase)
function form(played: number, wins: number): PlayerStats['form'] {
  if (played < 3) return 'En forme 📈';
  const wr = wins / played;
  if (wr >= 0.75) return 'Invincible 🛡️';
  if (wr >= 0.60) return 'En feu 🔥';
  if (wr >= 0.40) return 'En forme 📈';
  if (wr >= 0.25) return 'En galère 😤';
  return 'Maudit ☠️';
}

// Real data extracted from index.html → PLAYER_STATS
// recentResults populated from s9 (most recent) and s8 session compo data
export const PLAYER_STATS: PlayerStats[] = [
  { name: 'Michael',  played: 9, wins: 6, form: form(9,6),  recentResults: ['W','L'] },
  { name: 'Jack',     played: 5, wins: 4, form: form(5,4),  recentResults: ['L']     },
  { name: 'Ibrahima', played: 7, wins: 4, form: form(7,4),  recentResults: ['L']     },
  { name: 'Rémi',     played: 5, wins: 3, form: form(5,3),  recentResults: ['L','W'] },
  { name: 'Dylan',    played: 5, wins: 3, form: form(5,3),  recentResults: ['L','W'] },
  { name: 'Théo',     played: 4, wins: 3, form: form(4,3),  recentResults: ['W']     },
  { name: 'Gugu',     played: 7, wins: 3, form: form(7,3),  recentResults: []        },
  { name: 'Hugo',     played: 7, wins: 3, form: form(7,3),  recentResults: ['W','L'] },
  { name: 'Spy',      played: 7, wins: 3, form: form(7,3),  recentResults: []        },
  { name: 'Flo',      played: 3, wins: 1, form: form(3,1),  recentResults: ['L','W'] },
  { name: 'Edouard',  played: 5, wins: 2, form: form(5,2),  recentResults: ['L','W'] },
  { name: 'Khalid',   played: 7, wins: 2, form: form(7,2),  recentResults: ['W','L'] },
  { name: 'Alex',     played: 3, wins: 1, form: form(3,1),  recentResults: []        },
  { name: 'Cyril',    played: 3, wins: 1, form: form(3,1),  recentResults: []        },
  { name: 'Johann',   played: 3, wins: 1, form: form(3,1),  recentResults: []        },
  { name: 'Tim',      played: 3, wins: 1, form: form(3,1),  recentResults: []        },
  { name: 'Henri',    played: 2, wins: 2, form: form(2,2),  recentResults: ['W','L'] },
  { name: 'LM',       played: 2, wins: 1, form: form(2,1),  recentResults: ['W']     },
  { name: 'Marc',     played: 1, wins: 1, form: form(1,1),  recentResults: []        },
  { name: 'Quentin',  played: 1, wins: 0, form: form(1,0),  recentResults: []        },
  { name: 'Raphaël',  played: 1, wins: 0, form: form(1,0),  recentResults: []        },
];

// Real data extracted from index.html → PAIR_STATS
export const PAIR_STATS: PairStats[] = [
  { p1: 'Alex',     p2: 'Dylan',    together: 2, wins: 1 },
  { p1: 'Alex',     p2: 'Edouard',  together: 1, wins: 0 },
  { p1: 'Alex',     p2: 'Hugo',     together: 2, wins: 1 },
  { p1: 'Alex',     p2: 'Johann',   together: 1, wins: 0 },
  { p1: 'Alex',     p2: 'Khalid',   together: 2, wins: 0 },
  { p1: 'Alex',     p2: 'Michael',  together: 1, wins: 1 },
  { p1: 'Alex',     p2: 'Rémi',     together: 2, wins: 1 },
  { p1: 'Alex',     p2: 'Théo',     together: 1, wins: 0 },
  { p1: 'Cyril',    p2: 'Dylan',    together: 1, wins: 0 },
  { p1: 'Cyril',    p2: 'Gugu',     together: 2, wins: 0 },
  { p1: 'Cyril',    p2: 'Hugo',     together: 1, wins: 0 },
  { p1: 'Cyril',    p2: 'Jack',     together: 1, wins: 1 },
  { p1: 'Cyril',    p2: 'Khalid',   together: 1, wins: 0 },
  { p1: 'Cyril',    p2: 'Michael',  together: 2, wins: 1 },
  { p1: 'Cyril',    p2: 'Rémi',     together: 1, wins: 1 },
  { p1: 'Cyril',    p2: 'Spy',      together: 3, wins: 1 },
  { p1: 'Dylan',    p2: 'Edouard',  together: 1, wins: 0 },
  { p1: 'Dylan',    p2: 'Gugu',     together: 3, wins: 2 },
  { p1: 'Dylan',    p2: 'Henri',    together: 1, wins: 1 },
  { p1: 'Dylan',    p2: 'Hugo',     together: 1, wins: 1 },
  { p1: 'Dylan',    p2: 'Ibrahima', together: 1, wins: 1 },
  { p1: 'Dylan',    p2: 'Johann',   together: 1, wins: 0 },
  { p1: 'Dylan',    p2: 'Khalid',   together: 2, wins: 0 },
  { p1: 'Dylan',    p2: 'Michael',  together: 2, wins: 2 },
  { p1: 'Dylan',    p2: 'Rémi',     together: 1, wins: 1 },
  { p1: 'Dylan',    p2: 'Spy',      together: 3, wins: 2 },
  { p1: 'Dylan',    p2: 'Théo',     together: 1, wins: 1 },
  { p1: 'Edouard',  p2: 'Flo',      together: 1, wins: 1 },
  { p1: 'Edouard',  p2: 'Gugu',     together: 2, wins: 0 },
  { p1: 'Edouard',  p2: 'Henri',    together: 1, wins: 1 },
  { p1: 'Edouard',  p2: 'Hugo',     together: 1, wins: 1 },
  { p1: 'Edouard',  p2: 'Ibrahima', together: 2, wins: 1 },
  { p1: 'Edouard',  p2: 'Jack',     together: 2, wins: 1 },
  { p1: 'Edouard',  p2: 'Johann',   together: 2, wins: 1 },
  { p1: 'Edouard',  p2: 'Khalid',   together: 1, wins: 0 },
  { p1: 'Edouard',  p2: 'Michael',  together: 3, wins: 2 },
  { p1: 'Edouard',  p2: 'Quentin',  together: 1, wins: 0 },
  { p1: 'Edouard',  p2: 'Spy',      together: 2, wins: 0 },
  { p1: 'Flo',      p2: 'Henri',    together: 1, wins: 1 },
  { p1: 'Flo',      p2: 'Hugo',     together: 1, wins: 0 },
  { p1: 'Flo',      p2: 'Ibrahima', together: 1, wins: 0 },
  { p1: 'Flo',      p2: 'Jack',     together: 1, wins: 1 },
  { p1: 'Flo',      p2: 'Johann',   together: 1, wins: 0 },
  { p1: 'Flo',      p2: 'Khalid',   together: 1, wins: 0 },
  { p1: 'Flo',      p2: 'Michael',  together: 2, wins: 1 },
  { p1: 'Flo',      p2: 'Raphaël',  together: 1, wins: 0 },
  { p1: 'Flo',      p2: 'Rémi',     together: 1, wins: 0 },
  { p1: 'Flo',      p2: 'Tim',      together: 1, wins: 0 },
  { p1: 'Gugu',     p2: 'Henri',    together: 1, wins: 1 },
  { p1: 'Gugu',     p2: 'Hugo',     together: 2, wins: 1 },
  { p1: 'Gugu',     p2: 'Ibrahima', together: 2, wins: 1 },
  { p1: 'Gugu',     p2: 'Jack',     together: 2, wins: 1 },
  { p1: 'Gugu',     p2: 'Khalid',   together: 1, wins: 0 },
  { p1: 'Gugu',     p2: 'Michael',  together: 4, wins: 2 },
  { p1: 'Gugu',     p2: 'Quentin',  together: 1, wins: 0 },
  { p1: 'Gugu',     p2: 'Spy',      together: 6, wins: 2 },
  { p1: 'Gugu',     p2: 'Théo',     together: 2, wins: 2 },
  { p1: 'Henri',    p2: 'Jack',     together: 1, wins: 1 },
  { p1: 'Henri',    p2: 'Michael',  together: 2, wins: 2 },
  { p1: 'Henri',    p2: 'Spy',      together: 1, wins: 1 },
  { p1: 'Hugo',     p2: 'Ibrahima', together: 2, wins: 1 },
  { p1: 'Hugo',     p2: 'Jack',     together: 1, wins: 1 },
  { p1: 'Hugo',     p2: 'Johann',   together: 2, wins: 1 },
  { p1: 'Hugo',     p2: 'Khalid',   together: 2, wins: 0 },
  { p1: 'Hugo',     p2: 'LM',       together: 1, wins: 0 },
  { p1: 'Hugo',     p2: 'Michael',  together: 5, wins: 3 },
  { p1: 'Hugo',     p2: 'Rémi',     together: 3, wins: 1 },
  { p1: 'Hugo',     p2: 'Spy',      together: 1, wins: 0 },
  { p1: 'Hugo',     p2: 'Théo',     together: 2, wins: 1 },
  { p1: 'Hugo',     p2: 'Tim',      together: 1, wins: 0 },
  { p1: 'Ibrahima', p2: 'Jack',     together: 2, wins: 1 },
  { p1: 'Ibrahima', p2: 'Johann',   together: 1, wins: 1 },
  { p1: 'Ibrahima', p2: 'Khalid',   together: 4, wins: 2 },
  { p1: 'Ibrahima', p2: 'LM',       together: 2, wins: 1 },
  { p1: 'Ibrahima', p2: 'Marc',     together: 1, wins: 1 },
  { p1: 'Ibrahima', p2: 'Michael',  together: 1, wins: 1 },
  { p1: 'Ibrahima', p2: 'Raphaël',  together: 1, wins: 0 },
  { p1: 'Ibrahima', p2: 'Rémi',     together: 1, wins: 1 },
  { p1: 'Ibrahima', p2: 'Spy',      together: 2, wins: 1 },
  { p1: 'Ibrahima', p2: 'Théo',     together: 2, wins: 2 },
  { p1: 'Ibrahima', p2: 'Tim',      together: 3, wins: 1 },
  { p1: 'Jack',     p2: 'Khalid',   together: 1, wins: 1 },
  { p1: 'Jack',     p2: 'LM',       together: 1, wins: 1 },
  { p1: 'Jack',     p2: 'Michael',  together: 3, wins: 3 },
  { p1: 'Jack',     p2: 'Rémi',     together: 1, wins: 1 },
  { p1: 'Jack',     p2: 'Spy',      together: 2, wins: 1 },
  { p1: 'Jack',     p2: 'Théo',     together: 1, wins: 1 },
  { p1: 'Jack',     p2: 'Tim',      together: 1, wins: 1 },
  { p1: 'Johann',   p2: 'Khalid',   together: 1, wins: 0 },
  { p1: 'Johann',   p2: 'Michael',  together: 2, wins: 1 },
  { p1: 'Johann',   p2: 'Rémi',     together: 1, wins: 0 },
  { p1: 'Khalid',   p2: 'LM',       together: 2, wins: 1 },
  { p1: 'Khalid',   p2: 'Marc',     together: 1, wins: 1 },
  { p1: 'Khalid',   p2: 'Raphaël',  together: 1, wins: 0 },
  { p1: 'Khalid',   p2: 'Rémi',     together: 2, wins: 1 },
  { p1: 'Khalid',   p2: 'Spy',      together: 1, wins: 0 },
  { p1: 'Khalid',   p2: 'Théo',     together: 2, wins: 1 },
  { p1: 'Khalid',   p2: 'Tim',      together: 3, wins: 1 },
  { p1: 'LM',       p2: 'Tim',      together: 2, wins: 1 },
  { p1: 'Marc',     p2: 'Rémi',     together: 1, wins: 1 },
  { p1: 'Marc',     p2: 'Théo',     together: 1, wins: 1 },
  { p1: 'Michael',  p2: 'Quentin',  together: 1, wins: 0 },
  { p1: 'Michael',  p2: 'Rémi',     together: 3, wins: 2 },
  { p1: 'Michael',  p2: 'Spy',      together: 4, wins: 2 },
  { p1: 'Michael',  p2: 'Théo',     together: 1, wins: 1 },
  { p1: 'Quentin',  p2: 'Spy',      together: 1, wins: 0 },
  { p1: 'Raphaël',  p2: 'Tim',      together: 1, wins: 0 },
  { p1: 'Rémi',     p2: 'Spy',      together: 1, wins: 1 },
  { p1: 'Rémi',     p2: 'Théo',     together: 2, wins: 1 },
  { p1: 'Spy',      p2: 'Théo',     together: 1, wins: 1 },
];

const MIN_GAMES = 3;

export function rankPlayers(players: PlayerStats[], method: RankMethod): RankedPlayer[] {
  const maxPlayed = Math.max(...players.map(p => p.played));

  return players
    .filter(p => p.played >= MIN_GAMES)
    .map(p => {
      const wr = p.wins / p.played;
      let score: number;

      switch (method) {
        case 'winrate':
          score = wr;
          break;
        case 'regularite':
          score = (p.played / maxPlayed) * 0.4 + wr * 0.6;
          break;
        case 'equilibre':
          score = (p.wins + 3 * 0.5) / (p.played + 3);
          break;
        case 'stabilite':
          score = wr * Math.sqrt(p.played);
          break;
      }

      return { ...p, score };
    })
    .sort((a, b) => b.score - a.score);
}

export const RANK_METHOD_LABELS: Record<RankMethod, string> = {
  winrate:    'Winrate',
  regularite: 'Régularité',
  equilibre:  'Équilibre',
  stabilite:  'Stabilité',
};

export const FORM_COLOR: Record<PlayerStats['form'], string> = {
  'En feu 🔥':      '#FF9800',
  'Invincible 🛡️':  '#FFD600',
  'En forme 📈':    '#64B5F6',
  'En galère 😤':   '#9E9E9E',
  'Maudit ☠️':     '#F44336',
};
