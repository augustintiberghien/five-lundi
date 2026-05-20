import Anthropic from '@anthropic-ai/sdk';
import { getLocales } from 'expo-localization';

export type PlayerForm = 'En feu 🔥' | 'Invincible 🛡️' | 'Maudit ☠️' | 'En galère 😤' | 'En forme 📈' | null;

export type PlayerStat = {
  name: string;
  team: 'A' | 'B';
  form: PlayerForm;
  /** consecutive wins in a row */
  winStreak?: number;
  /** consecutive losses in a row */
  loseStreak?: number;
  /** total appearances */
  totalGames?: number;
  /** is this player's first-ever game */
  isDebut?: boolean;
};

export type PairStat = {
  p1: string;
  p2: string;
  together: number;
  wins: number;
};

export type BenchPlayer = {
  name: string;
  /** number of times on bench without playing */
  benchStreak?: number;
};

export type ArticleContext = {
  sessionDate: string;        // "25 mai 2026"
  nameA: string;              // "Blanche ⚪"
  nameB: string;              // "Bleue 🔵"
  scoreA: number;
  scoreB: number;
  /** 'A' | 'B' | 'draw' */
  winner: 'A' | 'B' | 'draw';
  mvp: string;
  mvpVoteComments?: string[]; // raw comments from vote
  coachComment?: string;
  playersA: PlayerStat[];
  playersB: PlayerStat[];
  bench?: BenchPlayer[];
  notablePairs?: PairStat[];  // pairs with interesting stats
};

const ARTICLE_SECTIONS = `
Structure de l'article (respecte exactement ces 7 sections) :

1. **Titre** — accrocheur, style manchette L'Équipe, 8-12 mots max
2. **Chapô** — 2-3 phrases d'intro punchy qui résument le match
3. **Le match** — narration du déroulé (3-4 paragraphes), tensions dramatiques, tournants
4. **L'homme du match** — portrait du MVP en 2-3 phrases, chiffres clés fictifs cohérents
5. **La stat du soir** — une statistique surprenante ou amusante en 1-2 phrases
6. **La parole au coach** — citation fictive mais plausible du coach (entre guillemets)
7. **La note de la rédaction** — note sur 10 pour le match (format "X/10") + une phrase d'explication

Ton : L'Équipe sérieux mais avec une pointe d'humour et de drama. Vocabulaire footballistique, métaphores sportives, quelques formules grandiloquentes. Garde une cohérence avec les stats et formes des joueurs fournis.
`;

function buildPrompt(ctx: ArticleContext): string {
  const winnerName = ctx.winner === 'A' ? ctx.nameA : ctx.winner === 'B' ? ctx.nameB : 'Match nul';
  const scoreLine = `${ctx.nameA} ${ctx.scoreA} – ${ctx.scoreB} ${ctx.nameB}`;

  const formatPlayer = (p: PlayerStat) => {
    const extras: string[] = [];
    if (p.form) extras.push(p.form);
    if (p.isDebut) extras.push('DEBUT');
    if (p.winStreak && p.winStreak >= 3) extras.push(`${p.winStreak} victoires consécutives`);
    if (p.loseStreak && p.loseStreak >= 3) extras.push(`${p.loseStreak} défaites consécutives`);
    return `  - ${p.name}${extras.length ? ` [${extras.join(', ')}]` : ''}`;
  };

  const teamALines = ctx.playersA.map(formatPlayer).join('\n');
  const teamBLines = ctx.playersB.map(formatPlayer).join('\n');

  const benchLines = ctx.bench?.length
    ? `Banc : ${ctx.bench.map(b => b.name + (b.benchStreak && b.benchStreak >= 2 ? ` (${b.benchStreak}e banc consécutif)` : '')).join(', ')}`
    : '';

  const notablePairsLines = ctx.notablePairs?.length
    ? `Paires notables :\n${ctx.notablePairs.map(p => `  - ${p.p1} & ${p.p2} : ${p.wins}/${p.together} victoires ensemble`).join('\n')}`
    : '';

  const voteLines = ctx.mvpVoteComments?.length
    ? `Commentaires du vote MVP :\n${ctx.mvpVoteComments.map(c => `  - "${c}"`).join('\n')}`
    : '';

  const coachLine = ctx.coachComment ? `Commentaire du coach : "${ctx.coachComment}"` : '';

  return `Date : ${ctx.sessionDate}
Score : ${scoreLine}
Vainqueur : ${winnerName}
MVP : ${ctx.mvp}

${ctx.nameA} (équipe A) :
${teamALines}

${ctx.nameB} (équipe B) :
${teamBLines}

${benchLines}
${notablePairsLines}
${voteLines}
${coachLine}`.trim();
}

function detectLanguage(): string {
  const locales = getLocales();
  const lang = locales[0]?.languageCode ?? 'fr';
  if (lang === 'fr') return 'français';
  if (lang === 'es') return 'español';
  if (lang === 'de') return 'Deutsch';
  if (lang === 'pt') return 'português';
  if (lang === 'it') return 'italiano';
  return 'English';
}

/**
 * Generates a match article in L'Équipe style.
 * Returns the full article text via streaming; calls onChunk for each token
 * and returns the final complete string.
 */
export async function generateMatchArticle(
  ctx: ArticleContext,
  onChunk: (text: string) => void,
  apiKey: string,
): Promise<string> {
  const client = new Anthropic({ apiKey });
  const language = detectLanguage();

  const systemPrompt = `Tu es un journaliste sportif de L'Équipe, spécialisé dans le football amateur. Tu écris des articles dramatiques, élégants et légèrement humoristiques sur des matchs de five-a-side. Écris toujours en ${language}.

${ARTICLE_SECTIONS}`;

  const userPrompt = `Écris l'article de match pour la session suivante :

${buildPrompt(ctx)}`;

  let fullText = '';

  const stream = client.messages.stream({
    model: 'claude-opus-4-7',
    max_tokens: 1200,
    thinking: { type: 'adaptive' },
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userPrompt }],
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      fullText += event.delta.text;
      onChunk(event.delta.text);
    }
  }

  return fullText;
}
