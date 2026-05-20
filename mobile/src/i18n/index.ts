import { getLocales } from 'expo-localization';

const fr = {
  // Tabs
  tabs: { home: 'Accueil', calendar: 'Calendrier', stats: 'Stats' },

  // Home screen
  home: {
    nextMatch: 'PROCHAIN MATCH',
    voteInProgress: 'VOTE EN COURS',
    lastEdition: 'DERNIÈRE ÉDITION',
    notVotedYet: "Tu n'as pas encore voté",
    readArticle: "Lire l'article →",
    registered: '5 derniers',
  },

  // Stats screen
  stats: {
    classement: 'Classement',
    joueurs: 'Joueurs',
    paires: 'Paires',
    palmares: 'Palmarès',
    rankWinrate: 'Winrate',
    rankRegularite: 'Régularité',
    rankEquilibre: 'Équilibre',
    rankStabilite: 'Stabilité',
    rankWinrateDesc: 'Taux de victoires brut (min. 3 matchs)',
    rankRegulariteDesc: 'Présence × performance — récompense ceux qui viennent ET gagnent',
    rankEquilibreDesc: 'Winrate lissé — plus fiable avec peu de matchs',
    rankStabiliteDesc: 'Winrate × ancienneté — confiance qui monte avec les matchs',
    pairesNote: 'Paires classées par taux de victoires ensemble (min. 3 matchs ensemble)',
    hallOfFame: '🏆 Hall of Fame',
  },

  // Player stats labels
  player: {
    played: 'Matchs',
    wins: 'Victoires',
    winrate: 'Winrate',
    streak: 'Série',
    recentForm: 'FORME RÉCENTE',
    bestPairs: 'MEILLEURES PAIRES',
    mvpHistory: 'PALMARÈS MVP',
    noMvp: 'Pas encore de MVP',
    noRecentData: 'Données complètes disponibles après connexion Supabase',
    together: 'ensemble',
  },

  // Session card / detail
  session: {
    inscriptionsOpen: 'Inscriptions ouvertes',
    inscriptionsSoon: 'Inscriptions bientôt',
    confirmed: '✓ Confirmé',
    bench: '🪑 Banc',
    absent: '❌ Désinscrit',
    notRegistered: 'Non inscrit',
    join: 'Rejoindre',
    leave: 'Se désinscrire',
    rejoin: 'Rejoindre',
    voteMvp: '⚡ Voter MVP',
    seeLineup: '⚽ Voir la compo',
    shareArticle: "Partager l'article ↗",
    articlePending: 'Article en cours de génération…',
    articlePendingSub: 'Disponible après la clôture du vote MVP',
    mvp: '🏆 MVP',
    voteClosed: 'Vote clos à 10 voix ou demain à 22h30',
    voteTitle: 'Vote MVP',
    voteQuestion: "Qui mérite le ballon d'or ce soir ?",
    voteConfirmBtn: (name: string) => `Voter pour ${name} ⚡`,
    voteSelectPrompt: 'Sélectionne un joueur',
    votedTitle: 'Vote enregistré',
    votedSub: 'Le MVP sera révélé après 10 votes\nou demain à 22h30.',
    back: 'Retour',
  },

  // Form badges
  form: {
    'En feu 🔥': 'En feu 🔥',
    'Invincible 🛡️': 'Invincible 🛡️',
    'En forme 📈': 'En forme 📈',
    'En galère 😤': 'En galère 😤',
    'Maudit ☠️': 'Maudit ☠️',
  },
};

const en: typeof fr = {
  tabs: { home: 'Home', calendar: 'Calendar', stats: 'Stats' },

  home: {
    nextMatch: 'NEXT MATCH',
    voteInProgress: 'VOTE IN PROGRESS',
    lastEdition: 'LATEST ARTICLE',
    notVotedYet: "You haven't voted yet",
    readArticle: 'Read article →',
    registered: 'Last 5',
  },

  stats: {
    classement: 'Rankings',
    joueurs: 'Players',
    paires: 'Pairs',
    palmares: 'Hall of Fame',
    rankWinrate: 'Win Rate',
    rankRegularite: 'Consistency',
    rankEquilibre: 'Balance',
    rankStabilite: 'Stability',
    rankWinrateDesc: 'Raw win percentage (min. 3 games)',
    rankRegulariteDesc: 'Attendance × performance — rewards showing up AND winning',
    rankEquilibreDesc: 'Smoothed win rate — more reliable with fewer games',
    rankStabiliteDesc: 'Win rate × seniority — confidence grows with games played',
    pairesNote: 'Pairs ranked by win rate together (min. 3 games together)',
    hallOfFame: '🏆 Hall of Fame',
  },

  player: {
    played: 'Games',
    wins: 'Wins',
    winrate: 'Win Rate',
    streak: 'Streak',
    recentForm: 'RECENT FORM',
    bestPairs: 'BEST PAIRS',
    mvpHistory: 'MVP HISTORY',
    noMvp: 'No MVP yet',
    noRecentData: 'Full data available once Supabase is connected',
    together: 'together',
  },

  session: {
    inscriptionsOpen: 'Open',
    inscriptionsSoon: 'Coming soon',
    confirmed: '✓ Confirmed',
    bench: '🪑 Bench',
    absent: '❌ Withdrawn',
    notRegistered: 'Not registered',
    join: 'Join',
    leave: 'Leave',
    rejoin: 'Rejoin',
    voteMvp: '⚡ Vote MVP',
    seeLineup: '⚽ See lineup',
    shareArticle: 'Share article ↗',
    articlePending: 'Article being generated…',
    articlePendingSub: 'Available after the MVP vote closes',
    mvp: '🏆 MVP',
    voteClosed: 'Vote closes at 10 votes or tomorrow at 10:30 PM',
    voteTitle: 'MVP Vote',
    voteQuestion: "Who deserves tonight's golden ball?",
    voteConfirmBtn: (name: string) => `Vote for ${name} ⚡`,
    voteSelectPrompt: 'Select a player',
    votedTitle: 'Vote recorded',
    votedSub: 'The MVP will be revealed after 10 votes\nor tomorrow at 10:30 PM.',
    back: 'Back',
  },

  form: {
    'En feu 🔥': 'On fire 🔥',
    'Invincible 🛡️': 'Invincible 🛡️',
    'En forme 📈': 'In form 📈',
    'En galère 😤': 'Struggling 😤',
    'Maudit ☠️': 'Cursed ☠️',
  },
};

type Translations = typeof fr;

function detectLocale(): 'fr' | 'en' {
  const lang = getLocales()[0]?.languageCode ?? 'fr';
  return lang === 'fr' ? 'fr' : 'en';
}

export function useT(): Translations {
  return detectLocale() === 'fr' ? fr : en;
}
