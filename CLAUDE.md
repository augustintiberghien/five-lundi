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
- `SESSIONS` array (newest first : s11 → s1) — chaque session a `id`, `date`, `score`, `scoreWinner`, `current`, `bench`, `nameA`, `nameB`, `players`
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

## Règle : composition figée à 21h30

La composition (tableau `players`) est **figée définitivement à 21h30** le soir du match, quand tous les joueurs ont confirmé. Elle ne doit **jamais** être recalculée ou modifiée après cette heure, même si les notes ajustées évoluent.

**⚠️ INTERDIT** : regénérer `_genBalancedTeams` après 21h30, ou modifier `players` après que le score est connu. Si une composition semble incorrecte, demander confirmation à l'utilisateur avant tout changement.

### Compo partagée (table Supabase `slot_sessions`) — depuis juin 2026

Dès **10 inscrits** sur un créneau, le front génère la compo (`_genBalancedTeams`) et la **publie dans la table Supabase `slot_sessions`** (`syncSharedTeams` dans index.html) : tous les visiteurs voient la même compo. À **chaque changement des 10 titulaires** (désistement via `doUnregister`, nouvel inscrit), le front **ré-équilibre entièrement** et republie pour tout le monde (option B : meilleur mix à chaque mouvement, pas d'échange minimal). Migration : `supabase/migrations/20260610_slot_sessions.sql`. Les anciens caches locaux `ins_teams_v2_*` sont supprimés (purgés au boot).

### Contrainte exceptionnelle `together` (par créneau)

Un créneau peut porter `together:['Samy','Gugu','Quentin']` dans `INSCRIPTION_SLOTS` : l'algo (`_genBalancedTeams`) ne considère alors que les splits où ces joueurs sont **dans la même équipe** et choisit le meilleur ratio parmi eux. La contrainte suit tous les recalculs (absences, désistements, banc) ; si un membre du groupe manque au roster, elle ne porte que sur les présents. **⚠️ Posée sur `ins_jul_06` (match du 6 juillet) — à retirer après. Reste aussi sur l'ancien `ins_jun_15` fermé (sans effet).**

### Promotion du créneau en session (le geste du lock) — automatisée

Concrètement, « figer à 21h30 » = **promouvoir le créneau d'inscription en entrée `SESSIONS`** avec des `players` explicites. C'est ce qui rend la compo **immunisée contre les notes ajustées** (une entrée `SESSIONS` n'est jamais recalculée). Le `_dateKey` de `buildTabs()` fait alors primer la session sur le créneau → 1 seul onglet par date.

**Automatique depuis juin 2026** : le workflow `lock-session.yml` (cron lundi 21h30→22h30 Paris toutes les 5-10 min, script `.github/scripts/lock_session.py`) calcule les **titulaires effectifs** (inscrits − absents de la feuille de match + banc), prend la compo `slot_sessions` si elle correspond, sinon **régénère avec l'algo du site** (fonctions extraites de index.html, exécutées via node, contrainte `together` comprise), insère l'entrée `SESSIONS` en tête (id `sN` suivant, `current:true`, banc = inscrits hors compo non absents), passe le créneau en `open:false` et push sur main (commit préfixé « Auto : »). Après le lock, `syncSharedTeams` **refuse toute écriture** (`_slotLocked`). Penser à mettre à jour la table Sessions ci-dessous après coup.

**⚠️ Audit du 7 juillet 2026** : le trigger `schedule` de GitHub Actions a montré un retard systématique d'environ 1h30-1h40 (exécution réelle vers 23h10-23h12 Paris au lieu de ~21h35 visé, les 29 juin et 6 juillet). Le 6 juillet, ce retard a mené à un fallback manuel (compo tapée de mémoire dans le chat) qui a raté un remplacement de dernière minute, 2 minutes avant que le run automatique (correct, lui) ne se déclenche enfin. Mitigation appliquée : le cron a été multiplié (21h30→22h30 Paris, ~5-10 min d'écart, idempotent) pour réduire la fenêtre de retard. **Si malgré ça 21h30 passe sans session verrouillée : ne jamais retaper la compo de mémoire** — déclencher le workflow "Lock session du lundi 21h30" manuellement (`workflow_dispatch`, déjà activé) pour qu'il recroise en direct `registrations`+`presences`, seule source fiable des remplacements.

Secours manuel en dernier recours (le workflow_dispatch lui-même échoue) : console → `exportSessionEntry()` → coller l'entrée en tête de `SESSIONS`. Cas tournoi (4 équipes, ex. 22 juin) non géré par le workflow ni l'outil → promotion manuelle.

**Règle couleur : la couleur annoncée avant 21h30 fait foi.** `teamA=true` → Blanche ⚪, `teamA=false` → Bleue 🔵. La régénération du lock attribue `teamA`/`teamB` arbitrairement (ordre d'énumération `C(10,5)`) et pouvait donc **inverser la couleur** d'une équipe par rapport à ce qui était affiché avant le lock. Depuis juin 2026, `lock_session.py` **réancre les couleurs** sur la compo `slot_sessions` annoncée (échange des moitiés si l'orientation est inversée). Le lock ne doit jamais inverser une couleur déjà annoncée.

Avant de mettre à jour un score, **toujours demander** : "Quelle est la composition exacte des deux équipes ?" si elle n'a pas été confirmée explicitement dans la conversation.

## Règle : mise à jour automatique après un score

Quand l'utilisateur donne le score d'un match (ex : "s9 : 12-5 Blanche"), effectuer **dans cet ordre** :

1. **SESSIONS** — mettre à jour `score` et `scoreWinner` de la session concernée (`'A'` si Blanche gagne, `'B'` si Bleue gagne)
2. **PLAYER_STATS** — incrémenter `played` (+1) et `wins` (+1 si gagné) pour chaque joueur présent dans `s.players`, **en lisant la composition depuis le screenshot ou la confirmation explicite de l'utilisateur**, pas depuis le HTML (qui peut être désynchronisé)
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
- **Résumé MVP** : le code d'appel direct à l'API Anthropic a été supprimé (juin 2026 — il partait sans clé et ne marchait pas). Le résumé/article est rédigé par Claude **au débrief après chaque match** et poussé manuellement dans le HTML (`ARTICLES`). À la clôture du vote, le site affiche les commentaires bruts des votants.

## Passage à la session suivante
- **3 heures après la clôture du vote**, passer `current: true` à la session suivante (et `current: false` sur la session active)
- Clôture = 10 votes atteints OU 22h30 le lendemain → donc au plus tard à **01h30** (nuit du lendemain au surlendemain)
- Opération manuelle : mettre à jour `current` dans SESSIONS dans index.html, puis commit/push/PR/merge

## Sessions existantes
| ID | Date | Score | current |
|----|------|-------|---------|
| s16 | 20 juillet 2026 | 14 – 8 (A) | |
| s15 | 6 juillet 2026 | 11 – 8 (A) | |
| s14 | 29 juin 2026 | 8 – 9 (B) | |
| s13 | 15 juin 2026 | 7 – 10 (B) | |
| s12 | 8 juin 2026 | 10 – 11 (B) | |
| s11 | 1 juin 2026 | 8 – 6 (A) | |
| s10 | 25 mai 2026 | 8 – 7 (A) | |
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

## Mobile — Todo backlog

### Coach / gestion sessions
- [ ] **Suppression de session** — bouton dans CoachScreen/SessionDetail (annulation centre ou pas assez d'inscrits), avec confirmation

### Profil joueur
- [ ] **Photo de profil** — récupération auto via Google OAuth si connexion Gmail, sinon upload depuis la galerie
- [ ] **Bio** — champ libre sur le profil
- [ ] **Onboarding première connexion** — wizard : position naturelle sur le terrain (GK / DEF / MIL / ATT), + 1 force principale et 1 faiblesse principale parmi les 6 critères de notation

### Notation & équilibrage
- [ ] **Notation coach** — interface pour noter tous les joueurs sur 20 selon les 6 critères (endurance, vitesse, technique, vision, physique, leadership ou équivalents) ; la position naturelle est remplie par le joueur lui-même
- [ ] **Delta force/faiblesse** — système +1/−1 : comparaison auto-déclaratif joueur vs évaluation coach, affiché sur le profil
- [ ] **Équilibrage automatique des équipes** — reprendre la logique du HTML (notes + critères + positions) pour générer la compo équilibrée directement dans l'app

### Infra
- [ ] **Authentification** — connexion Google OAuth (+ email/password fallback)
- [ ] **Supabase** — tout automatiser : sessions, inscriptions, votes MVP, stats, articles, profils, photos
- [x] **Notifications push** — relances ciblées, ex. : joueur titulaire dans 3 jours sans statut → push "Tu joues lundi ? Confirme ta présence"

## Joueurs actifs (s16 — 20 juillet 2026)
Blanche ⚪ : Khalid (GK), Jack, Spy, Gugu, Dylan
Bleue 🔵 : Ibrahima (GK), Samy, Johann, Théo, Thomas D
Blanche l'emporte 14-8.

**⚠️ Audit du 20 juillet 2026** : le lock auto a tourné à l'heure (20h49 UTC / 22h49 Paris, dans la fenêtre étendue) mais a figé une mauvaise répartition des couleurs (Gugu/Théo et Dylan/Thomas D inversés par rapport à la compo décidée avant match). Cause : des absences de dernière minute (Alex, Cyril, Henri, Hugo, Landry, Raphaël, Tim) déclarées sur la feuille de match ont changé les 10 titulaires effectifs, mais **marquer un joueur absent ne redéclenche pas `syncSharedTeams`** (seuls `doUnregister`/nouvel inscrit le font) — la compo publiée dans `slot_sessions` est donc restée périmée. Au lock, `lock_session.py` a détecté le désaccord ("compo publiée absente ou périmée") et est tombé dans le repli : régénération complète par `_genBalancedTeams`, qui reshuffle tout le monde (option B, pas d'échange minimal) au lieu de ne remplacer que les absents. Corrigé manuellement dans `SESSIONS` (s16) + `PLAYER_STATS`/`PAIR_STATS` recalculés sur la bonne compo. **Piste d'amélioration non implémentée** : faire aussi déclencher `syncSharedTeams` sur un changement de statut absent/présent (pas seulement inscription/désistement), pour que la compo publiée reste toujours à jour avant le lock.
