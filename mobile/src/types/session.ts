export type ScoreWinner = 'A' | 'B' | '';

export type RegistrationStatus = 'confirmed' | 'bench' | 'absent' | 'none';

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
  mvp?: string;
  voteOpen?: boolean;
  article?: string;
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
    mvp: 'Michael', voteOpen: false,
    article: `**UNE BLANCHE ÉCLATANTE**\n\nLe cinq du lundi a vécu lundi soir l'un de ses matchs les plus irréels depuis des semaines. Blanche 12, Bleue 7 : un écart qui ne raconte qu'une partie de la vérité.\n\n**Le match**\n\nDès les premières secondes, Blanche imposait son tempo avec une agressivité rarement vue sur ce terrain synthétique. Bleue résistait, grappillait, tentait ses contre-attaques habituelles — mais la muraille blanche tenait bon. La première mi-temps s'achevait sur un avantage confortable pour l'équipe au maillot immaculé. La seconde période ne fit que confirmer la domination, avec un Michael impérial dans les cages et une ligne défensive qui aurait rendu jaloux Guardiola lui-même.\n\n**L'homme du match**\n\nMichael. Le gardien au calme olympien a multiplié les arrêts décisifs, notamment un double arrêt à la 23e qui a brisé les derniers espoirs bleus. Élu MVP à l'unanimité, il accepta le titre avec la modestie de ceux qui savent.\n\n**La stat du soir**\n\nBlanche a encaissé seulement 7 buts sur les 5 dernières rencontres. À ce rythme, l'équipe blanche postule au Ballon d'Or collectif.\n\n**La parole au coach**\n\n"On a été sérieux du début à la fin. C'est exactement ce qu'on avait préparé."\n\n**La note de la rédaction**\n\n8/10 — Un match propre, dominé, presque trop facile. Il manquait juste un peu de drama.`,
  },
  {
    id: 's8', date: '11 mai 2026', dateISO: '2026-05-11',
    score: '3 – 4', scoreWinner: 'B',
    nameA: 'Blanche ⚪', nameB: 'Bleue 🔵',
    inscriptionsOpen: false, maxPlayers: 10, confirmedCount: 10, benchCount: 2,
    mvp: 'Rémi',
  },
  {
    id: 's7', date: '4 mai 2026', dateISO: '2026-05-04',
    score: '8 – 12', scoreWinner: 'B',
    nameA: 'Blanche ⚪', nameB: 'Bleue 🔵',
    inscriptionsOpen: false, maxPlayers: 10, confirmedCount: 10, benchCount: 2,
    mvp: 'Dylan',
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
