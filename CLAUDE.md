# Five Lundi — Contexte projet

## Repo & branches
- Repo : `augustintiberghien/five-lundi`
- Branche de travail : `claude/setup-html-project-wSe4F`
- **Push direct vers `main` impossible** (403) → toujours passer par : commit → push sur la branche → PR via MCP → merge via MCP → rebase sync

## Commande type pour chaque changement
```bash
git add index.html
git commit -m "description"
git push -u origin claude/setup-html-project-wSe4F
# puis mcp__github__create_pull_request + mcp__github__merge_pull_request (squash)
# puis git fetch origin main && git rebase origin/main && git push origin claude/setup-html-project-wSe4F --force-with-lease
```

## Stack
- **App** : single-file HTML (`index.html`, ~20MB) — tout est dedans : CSS, JS, photos joueurs en base64
- **Backend votes MVP** : Supabase
- **Hébergement** : GitHub Pages via le repo
- **Pas de build, pas de bundler** — édition directe du fichier HTML via scripts Python (fichier trop grand pour les outils Read/Edit)

## Architecture du fichier index.html
- `SESSIONS` array (newest first : s9 → s1) — chaque session a `id`, `date`, `score`, `scoreWinner`, `current`, `bench`, `nameA`, `nameB`, `players`
- `PLAYER_STATS` — stats agrégées par joueur (played, wins)
- `PAIR_STATS` — stats par duo (p1, p2, together, wins)
- `ARTICLES` — articles L'Équipe par session id
- `RANK_METHODS` + `_rankMethod` — 4 méthodes de classement (Winrate / Régularité / Équilibre / Stabilité)

## Conventions sessions
- `current: true` → session affichée par défaut au chargement (une seule à la fois)
- `nameA` = Blanche ⚪ (team-a, GK y:8), `nameB` = Bleue 🔵 (team-b, GK y:92)
- Positions de référence (s8/s9) :
  - Blanche : GK(50,8), DL(12,24), DR(88,24), ML(35,38), MR(65,38)
  - Bleue   : GK(50,92), DL(12,76), DR(88,76), ML(35,62), MR(65,62)
- `bench` : ordre de remplacement, visible jusqu'à 21h30 Paris le soir du match

## Règle : mise à jour automatique après un score

Quand l'utilisateur donne le score d'un match (ex : "s9 : 12-5 Blanche"), effectuer **dans cet ordre** :

1. **SESSIONS** — mettre à jour `score` et `scoreWinner` de la session concernée (`'A'` si Blanche gagne, `'B'` si Bleue gagne)
2. **PLAYER_STATS** — incrémenter `played` (+1) et `wins` (+1 si gagné) pour chaque joueur présent dans `s.players`
3. **PAIR_STATS** — pour chaque paire de la même équipe dans `s.players`, incrémenter `together` (+1) et `wins` (+1 si gagné)

**NE PAS TOUCHER** :
- Le tableau `players` (compositions d'équipes) de la session — il est déjà validé
- `PLAYER_NOTES` (notes de base et sm) — jamais modifié sur un score
- Les notes ajustées et statuts (Maudit / En galère / En feu / Invincible / En forme) sont **calculés dynamiquement** depuis `SESSIONS` via `_getPlayerForm()`, ils se mettent à jour automatiquement une fois `scoreWinner` renseigné

Mettre à jour la table Sessions dans CLAUDE.md après chaque score.

## Vote MVP
- Ouverture : 22h30 Paris le soir du match
- Clôture : 10 votes atteints OU 22h30 le lendemain
- Timezone : toujours via `toLocaleString('en-US', {timeZone:'Europe/Paris'})`

## Passage à la session suivante
- **3 heures après la clôture du vote**, passer `current: true` à la session suivante (et `current: false` sur la session active)
- Clôture = 10 votes atteints OU 22h30 le lendemain → donc au plus tard à **01h30** (nuit du lendemain au surlendemain)
- Opération manuelle : mettre à jour `current` dans SESSIONS dans index.html, puis commit/push/PR/merge

## Sessions existantes
| ID | Date | Score | current |
|----|------|-------|---------|
| s10 | 25 mai 2026 | — vs — | ✅ |
| s9 | 18 mai 2026 | 12 – 7 (A) | |
| s8 | 11 mai 2026 | 3 – 4 (B) | |
| s7 | 4 mai 2026 | 8 – 12 (B) | |
| s6 | 27 avril 2026 | 9 – 13 (B) | |
| s5 | 20 avril 2026 | 16 – 10 (A) | |
| s4 | 13 avril 2026 | 10 – 8 (A) | |
| s3 | 6 avril 2026 | 14 – 10 (A) | |
| s2 | 30 mars 2026 | 12 – 7 (A) | |
| s1 | 23 mars 2026 | 8 – 16 (B) | |

## Projet parallèle en cours
Application mobile (React Native) iOS + Android pour généraliser le concept à toutes les équipes de five.
- Modèle : freemium (pubs) + abonnement équipe (~5-10€/mois)
- Killer feature : articles L'Équipe auto-générés, vote MVP, stats avancées
- Prochaine étape : doc de vision (nom, positionnement, 5 features core)
- Rythme : ~30 min/jour

## Joueurs actifs (s9 — 18 mai 2026)
Blanche ⚪ : Michael (GK), Henri, LM, Khalid, Hugo
Bleue 🔵 : Rémi (GK), Edouard, Flo, Ibrahima, Dylan
Banc : Jack, Tim, Théo
