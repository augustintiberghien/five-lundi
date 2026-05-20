export type ScoreWinner = 'A' | 'B' | '';

export type RegistrationStatus = 'confirmed' | 'bench' | 'absent' | 'none';

export type SessionPlayer = { name: string; team: 'A' | 'B' };

export type Session = {
  id: string;
  date: string;           // "25 mai 2026"
  dateISO: string;        // "2026-05-25" for sorting/comparison
  score: string;
  scoreWinner: ScoreWinner;
  nameA: string;
  nameB: string;
  inscriptionsOpen: boolean;
  maxPlayers: number;
  confirmedCount: number;
  benchCount: number;
  time?: string;                       // override group default, e.g. "21:30"
  location?: string;                   // override group default
  mvp?: string;
  voteOpen?: boolean;
  article?: string;
  players?: SessionPlayer[];           // qui a joué
  compo?: Record<string, string>;      // posId → playerName
};

export const GROUP_CONFIG = {
  name: 'Five du Lundi',
  defaultTime: '21:30',
  defaultLocation: '',                 // à configurer par le coach
};

export type UserRegistration = {
  status: RegistrationStatus;
  benchPosition?: number; // 1-based, only when status === 'bench'
};

// Mock: registrations for the current user
export const MOCK_USER_REGISTRATIONS: Record<string, UserRegistration> = {
  s10: { status: 'confirmed' },
  s9:  { status: 'confirmed' },
  s8:  { status: 'bench', benchPosition: 2 },
  s7:  { status: 'absent' },
};

const FR_MONTHS: Record<string, string> = {
  'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
  'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
  'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12',
};

export function dateToISO(date: string): string {
  const [day, month, year] = date.split(' ');
  return `${year}-${FR_MONTHS[month] ?? '01'}-${day.padStart(2, '0')}`;
}

// Mirrored from HTML SESSIONS (without player photos)
export const SESSIONS: Session[] = [
  {
    id: 's10', date: '25 mai 2026', dateISO: '2026-05-25',
    score: '— vs —', scoreWinner: '',
    nameA: 'Blanche ⚪', nameB: 'Bleue 🔵',
    inscriptionsOpen: true, maxPlayers: 10, confirmedCount: 7, benchCount: 1,
  },
  {
    id: 's9', date: '18 mai 2026', dateISO: '2026-05-18',
    score: '12 – 7', scoreWinner: 'A',
    nameA: 'Blanche ⚪', nameB: 'Bleue 🔵',
    inscriptionsOpen: false, maxPlayers: 10, confirmedCount: 10, benchCount: 3,
    mvp: 'Jack', voteOpen: false,
    players: [
      { name: 'Michael',  team: 'A' }, { name: 'Henri',    team: 'A' },
      { name: 'LM',       team: 'A' }, { name: 'Khalid',   team: 'A' },
      { name: 'Hugo',     team: 'A' }, { name: 'Rémi',     team: 'B' },
      { name: 'Edouard',  team: 'B' }, { name: 'Flo',      team: 'B' },
      { name: 'Ibrahima', team: 'B' }, { name: 'Dylan',    team: 'B' },
    ],
    compo: {
      A_GK: 'Michael', A_DL: 'Henri',   A_DR: 'LM',
      A_ML: 'Khalid',  A_MR: 'Hugo',
      B_GK: 'Rémi',    B_DL: 'Edouard', B_DR: 'Flo',
      B_ML: 'Ibrahima',B_MR: 'Dylan',
    },
    article: `**AVALANCHE BLANCHE**\n\nLe cinq du lundi a vécu lundi soir l'un de ses matchs les plus dominateurs de la saison. Blanche 12, Bleue 7 : un écart qui reflète parfaitement la maîtrise collective de l'équipe au maillot immaculé.\n\n**Le match**\n\nDès les premières secondes, Blanche imposait son tempo avec une agressivité rarement vue sur ce terrain synthétique. Bleue résistait, grappillait, tentait ses contre-attaques habituelles — mais la muraille blanche tenait bon. La première mi-temps s'achevait sur un avantage confortable. La seconde période ne fit que confirmer la domination, chaque situation défensive désamorcée avec calme, chaque transition offensive transformée en danger réel.\n\n**L'homme du match**\n\nJack. Omniprésent des deux côtés du terrain, il a dicté le rythme, coupé les lignes de passe adverses et déclenché plusieurs actions décisives. Le vote ne souffrit d'aucune contestation.\n\n**La stat du soir**\n\nBlanche n'a accordé que 7 buts sur l'ensemble de la rencontre. À ce rythme défensif, l'équipe blanche postule sérieusement au titre de meilleure arrière-garde de la saison.\n\n**La parole au coach**\n\n"On a été sérieux du début à la fin. C'est exactement ce qu'on avait préparé."\n\n**La note de la rédaction**\n\n8/10 — Un match propre, dominé de bout en bout. Il manquait juste un peu de drama.`,
  },
  {
    id: 's8', date: '11 mai 2026', dateISO: '2026-05-11',
    score: '3 – 4', scoreWinner: 'B',
    nameA: 'Blanche ⚪', nameB: 'Bleue 🔵',
    inscriptionsOpen: false, maxPlayers: 10, confirmedCount: 10, benchCount: 2,
    mvp: 'Rémi', voteOpen: false,
    players: [
      { name: 'Michael',  team: 'A' }, { name: 'Henri',   team: 'A' },
      { name: 'Jack',     team: 'A' }, { name: 'Khalid',  team: 'A' },
      { name: 'Hugo',     team: 'A' }, { name: 'Rémi',    team: 'B' },
      { name: 'Edouard',  team: 'B' }, { name: 'Théo',   team: 'B' },
      { name: 'Flo',      team: 'B' }, { name: 'Dylan',   team: 'B' },
    ],
    compo: {
      A_GK: 'Michael', A_DL: 'Henri',  A_DR: 'Jack',
      A_ML: 'Khalid',  A_MR: 'Hugo',
      B_GK: 'Rémi',   B_DL: 'Edouard', B_DR: 'Théo',
      B_ML: 'Flo',    B_MR: 'Dylan',
    },
  },
  {
    id: 's7', date: '4 mai 2026', dateISO: '2026-05-04',
    score: '8 – 12', scoreWinner: 'B',
    nameA: 'Blanche ⚪', nameB: 'Bleue 🔵',
    inscriptionsOpen: false, maxPlayers: 10, confirmedCount: 10, benchCount: 2,
    mvp: 'Théo',
  },
  {
    id: 's6', date: '27 avril 2026', dateISO: '2026-04-27',
    score: '9 – 13', scoreWinner: 'B',
    nameA: 'Blanche ⚪', nameB: 'Bleue 🔵',
    inscriptionsOpen: false, maxPlayers: 10, confirmedCount: 10, benchCount: 3,
  },
];

export function isPast(session: Session): boolean {
  return session.scoreWinner !== '' || session.score !== '— vs —';
}

export function isToday(session: Session): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return session.dateISO === today;
}
