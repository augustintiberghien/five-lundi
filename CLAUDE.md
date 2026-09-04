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
- `RECAP_*` + `renderRecap()` / `showRecap()` — section « Récap 25-26 » (bilan de saison, cf. plus bas)

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

### ⚠️ Libellés de créneau : jamais de date lue au découpage par espaces

`INSCRIPTION_SLOTS[].label` peut porter un préfixe et un suffixe
(`'Lundi 31 août 2026 · Reprise 🔥'`, `'Lundi 22 juin 2026 (21h30)'`,
`'Lundi 1ᵉʳ juin 2026'`). Toute lecture de date doit passer par
`_matchDayFromLabel()` (regex `jour + mois + année`, exposants et décorations
tolérés), jamais par un `split(' ')` attendant exactement 3 mots.

Constaté le 24 août 2026 : `isPresenceVisible` / `isPresenceLocked` découpaient
par espaces, donc `ins_aug_31` passait pour illisible → **feuille de match
masquée et créneau considéré comme verrouillé** alors que la compo était publiée.
Personne ne pouvait confirmer sa présence sur la reprise. `isBenchVisible` et
`exportSessionEntry` avaient le même défaut.

Reconstaté le 31 août 2026 sur `_dateKey` (dans `buildTabs`), qui était passée à
travers la correction du 24 août. Elle dédupliquait `SESSIONS` et les créneaux par
**normalisation de chaîne** (minuscules, `lundi` retiré, parenthèses ôtées) — ce qui
ne retire pas un suffixe : la clé du créneau valait `31 août 2026 · reprise 🔥`
quand celle de la session promue valait `31 août 2026`. Les deux entrées
survivaient à la déduplication et **le 31 août apparaissait deux fois dans la barre
d'onglets**. Le défaut ne pouvait se voir que ce jour-là : il faut à la fois un
libellé décoré et une session promue le même jour. `_dateKey` passe désormais par
`_matchDayFromLabel` et retourne la journée comme clé, avec repli sur l'ancienne
normalisation si la date est illisible (sinon tous les libellés non parsés
fusionneraient entre eux).

### Compo partagée (table Supabase `slot_sessions`) — depuis juin 2026

Dès **10 inscrits** sur un créneau, le front génère la compo (`_genBalancedTeams`) et la **publie dans la table Supabase `slot_sessions`** (`syncSharedTeams` dans index.html) : tous les visiteurs voient la même compo. À **chaque changement des 10 titulaires** (désistement via `doUnregister`, nouvel inscrit), le front **ré-équilibre entièrement** et republie pour tout le monde (option B : meilleur mix à chaque mouvement, pas d'échange minimal). Migration : `supabase/migrations/20260610_slot_sessions.sql`. Les anciens caches locaux `ins_teams_v2_*` sont supprimés (purgés au boot).

### Contrainte exceptionnelle `together` (par créneau)

Un créneau peut porter `together:['Samy','Gugu','Quentin']` dans `INSCRIPTION_SLOTS` : l'algo (`_genBalancedTeams`) ne considère alors que les splits où ces joueurs sont **dans la même équipe** et choisit le meilleur ratio parmi eux. La contrainte suit tous les recalculs (absences, désistements, banc) ; si un membre du groupe manque au roster, elle ne porte que sur les présents. **⚠️ Posée sur `ins_jul_06` (match du 6 juillet) — à retirer après. Reste aussi sur l'ancien `ins_jun_15` fermé (sans effet).**

### Promotion du créneau en session (le geste du lock) — automatisée

Concrètement, « figer à 21h30 » = **promouvoir le créneau d'inscription en entrée `SESSIONS`** avec des `players` explicites. C'est ce qui rend la compo **immunisée contre les notes ajustées** (une entrée `SESSIONS` n'est jamais recalculée). Le `_dateKey` de `buildTabs()` fait alors primer la session sur le créneau → 1 seul onglet par date.

**Automatique depuis juin 2026** : le workflow `lock-session.yml` (cron lundi 21h30→22h30 Paris toutes les 5-10 min, script `.github/scripts/lock_session.py`) calcule les **titulaires effectifs** (inscrits − absents de la feuille de match + banc), prend la compo `slot_sessions` si elle correspond, sinon **régénère avec l'algo du site** (fonctions extraites de index.html, exécutées via node, contrainte `together` comprise), insère l'entrée `SESSIONS` en tête (id `sN` suivant, `current:true`, banc = inscrits hors compo non absents), passe le créneau en `open:false` et push sur main (commit préfixé « Auto : »). Après le lock, `syncSharedTeams` **refuse toute écriture** (`_slotLocked`). Penser à mettre à jour la table Sessions ci-dessous après coup.

**⚠️ Audit du 7 juillet 2026** : le trigger `schedule` de GitHub Actions a montré un retard systématique d'environ 1h30-1h40 (exécution réelle vers 23h10-23h12 Paris au lieu de ~21h35 visé, les 29 juin et 6 juillet). Le 6 juillet, ce retard a mené à un fallback manuel (compo tapée de mémoire dans le chat) qui a raté un remplacement de dernière minute, 2 minutes avant que le run automatique (correct, lui) ne se déclenche enfin. Mitigation appliquée : le cron a été multiplié (21h30→22h30 Paris, ~5-10 min d'écart, idempotent) pour réduire la fenêtre de retard. **Si malgré ça 21h30 passe sans session verrouillée : ne jamais retaper la compo de mémoire** — déclencher le workflow "Lock session du lundi 21h30" manuellement (`workflow_dispatch`, déjà activé) pour qu'il recroise en direct `registrations`+`presences`, seule source fiable des remplacements.

Secours manuel en dernier recours (le workflow_dispatch lui-même échoue) : console → `exportSessionEntry()` → coller l'entrée en tête de `SESSIONS`. Cas tournoi (4 équipes, ex. 22 juin) non géré par le workflow ni l'outil → promotion manuelle.

### Filet de sécurité : le site déclenche le lock lui-même (depuis septembre 2026)

**On ne peut pas rendre les crons ponctuels.** Le trigger `schedule` de GitHub Actions
est best-effort : documenté comme retardable en période de charge, et parfois abandonné.
Mesuré sur `lock-session.yml`, en prenant le premier run utile (celui qui tombe après
19h30 UTC, les précédents sortant à vide) :

| lundi | 1er run utile | = Paris | retard |
|---|---|---|---|
| 17 août | 19h32 UTC | 21h32 | 3 min |
| 24 août | 19h33 UTC | 21h33 | 4 min |
| 31 août | 21h21 UTC | 23h21 | **111 min** |

Le `workflow_dispatch`, lui, part en **moins d'une seconde** (les deux dispatches de test
du 4 septembre ont créé leur run dans la même seconde). C'est le seul levier : ne pas
attendre le scheduler de GitHub, faire déclencher le dispatch par une horloge fiable.

L'horloge retenue est **le site lui-même** : au chargement, `_maybeTriggerLock()` appelle
l'Edge Function `trigger-lock`, qui dispatche `lock-session.yml`. Le lundi soir tout le
monde ouvre la page — le premier visiteur après 21h30 réveille le lock.

`_slotAwaitingLock()` ne rend un créneau que si **tout** est réuni : il est 21h30 ou plus
à Paris, aucune entrée `SESSIONS` n'est datée d'aujourd'hui, et un créneau ouvert non-
tournoi porte la date du jour. `trigger-lock` revérifie côté serveur (lundi, ≥ 21h30
Paris) pour ne pas dépenser de minutes Actions sur un appel inutile.

Rien ne peut partir en double : `localStorage` limite à un déclenchement par navigateur
et par tranche de 10 min, `concurrency: lock-session` sérialise les runs, et
`lock_session.py` sort sans rien faire si la session du jour existe déjà.

⚠️ Le filet **ne couvre pas les tournois** (le script non plus) ni le cas où personne
n'ouvre le site. Le `workflow_dispatch` manuel reste le dernier recours, et il marche
même quand aucun cron n'est arrivé — vérifié le 31 août.

⚠️ La page qui déclenche le lock ne le voit pas : il faut **recharger** une fois le run
terminé (~1 min, plus le déploiement Pages). Pas de rechargement automatique, volontairement.

**Règle position : les places ne sont pas un sujet, gardien compris.** Au five tout le monde tourne, y compris dans les buts (confirmé par l'utilisateur le 27 juillet 2026 : « on s'en fout des gardiens vraiment »). **Ne jamais alerter ni « corriger » un changement de position**, qu'il s'agisse de défenseurs qui permutent ou du gardien qui change. Ce qui doit rester stable, et cela seul : la **répartition des deux équipes** et leurs **couleurs**.

Pour mémoire technique : aucun joueur actif n'a le rôle `Gardien` (seul Rémi l'a dans `PLAYER_ROLES`), donc `_assignPositions` retombe sur « premier Défenseur/Récupérateur, sinon premier de la liste » et le gardien dépend de l'ordre du roster. `_anchorPositions` (front, `index.html`) et son équivalent dans `lock_session.py` restituent à chaque joueur la place qu'il occupait dans la compo annoncée, les nouveaux venus prenant les emplacements libres. C'est du confort — éviter que l'affichage bouge sans raison — pas une règle métier : quand un gardien est absent, son remplacement dans les buts est normal et ne se signale pas.

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

### Saisie du score depuis le site (sans code) — opérationnelle depuis juillet 2026

Le formulaire s'affiche sous le terrain à partir de 22h30 Paris le soir du match, uniquement sur une entrée `SESSIONS` sans score (donc après le lock). Chaîne complète :

`formulaire` → Edge Function `submit-score` → **`GITHUB_PAT`** → `workflow_dispatch` sur `set-score.yml` → `set_score.py` + `update_stats.py` → commit « Auto : score … » poussé sur `main`.

⚠️ **`GITHUB_PAT` est un token GitHub stocké dans les secrets Supabase** (Project Settings → Edge Functions → Secrets), pas dans les secrets GitHub. Il doit être *fine-grained*, limité au dépôt `five-lundi`, avec la permission **Actions : Read and write**. Il expire — et son expiration est passée inaperçue de mai à juillet 2026, période pendant laquelle la saisie sur le site n'a jamais fonctionné et où tous les scores ont été rentrés à la main.

Diagnostic en une commande (payload volontairement invalide, rejeté avant tout appel à GitHub) :
```bash
curl -s -X POST "$SB_URL/functions/v1/submit-score" -H "Authorization: Bearer $SB_KEY" \
  -H 'Content-Type: application/json' -d '{}'
```
- `Champs manquants` → la fonction répond, le PAT n'est pas en cause
- `Bad credentials` (401) → **PAT expiré ou absent** → le régénérer et le redéposer
- `Resource not accessible by personal access token` (403) → PAT valide mais **permission Actions manquante**

⚠️ **`curl` ne teste pas le chemin du navigateur.** Il n'effectue pas de préflight CORS : une chaîne validée en `curl` peut échouer depuis le site. C'est arrivé le 27 juillet 2026 — le formulaire affichait « Erreur réseau » (le `catch` de `_submitScore`, donc un `fetch` qui échoue, à ne pas confondre avec « Erreur : … » qui vient d'une réponse de la fonction) parce que la réponse au préflight n'autorisait que `Content-Type` alors que le POST envoie aussi `Authorization`. Vérifier le préflight explicitement :
```bash
curl -s -i -X OPTIONS "$SB_URL/functions/v1/submit-score" \
  -H "Origin: https://augustintiberghien.github.io" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,content-type"
```
`access-control-allow-headers` doit mentionner `authorization`.

⚠️ **`deploy-functions.yml` déploie toutes les fonctions d'un bloc** : si une seule échoue au bundling, aucune n'est déployée. Le 27 juillet, `send-push` n'a pas pu résoudre `https://esm.sh/@supabase/supabase-js@2` (522, panne CDN) et a bloqué le déploiement de `submit-score`, qui n'a pourtant aucune dépendance externe. Symptôme : `failed to create the graph`. Remède : relancer le workflow une fois le CDN rétabli.

**Test à blanc sans rien casser** : renvoyer le score **déjà enregistré** d'une session passée (ex. `{"session_id":"s16","score_a":14,"score_b":8}`). `set_score.py` refuse de modifier une session qui a déjà un `scoreWinner` et sort en succès, donc toute la chaîne est exercée sans écrire de score. Repli si Supabase est en cause : déclencher `set-score.yml` directement en `workflow_dispatch`.

**`update_stats.py` recalcule tout depuis zéro** — `SESSIONS` **et** les tournois de `INSCRIPTION_SLOTS`. Ne jamais retirer la prise en compte des tournois : sans elle, le recalcul efface les 60 apparitions du 22 juin. Les joueurs vus uniquement en tournoi, ainsi que le nom générique `Invité`, sont volontairement écartés des stats, mais leurs matchs restent comptés pour leurs coéquipiers.

## Vote MVP
- Ouverture : 22h30 Paris le soir du match
- Clôture : 10 votes atteints OU 22h30 le lendemain
- Timezone : toujours via `toLocaleString('en-US', {timeZone:'Europe/Paris'})`
- **Résumé MVP** : le code d'appel direct à l'API Anthropic a été supprimé (juin 2026 — il partait sans clé et ne marchait pas). Le résumé/article est rédigé par Claude **au débrief après chaque match** et poussé manuellement dans le HTML (`ARTICLES`). À la clôture du vote, le site affiche les commentaires bruts des votants.

### ⚠️ L'ouverture du vote ne doit jamais dépendre du score (corrigé le 4 septembre 2026)

`mvpIsOpen` testait « on est le soir du match après 22h30 » (`mvpMatchNight`) **OU**
« le score est rentré ». Le premier terme retombe à faux **à minuit** : sans score saisi,
le vote disparaissait de 00h00 jusqu'à la saisie — alors que c'est justement la clameur
du vote qui fait rentrer le score. Le défaut n'a jamais mordu parce que le score a
toujours été saisi le soir même (le 31 août, à 23h03, une heure avant le piège).

Le vote court désormais de 22h30 le soir du match à la deadline du lendemain, score ou
pas. `mvpMatchNight` a été retirée avec : elle n'avait que cet appelant, et la laisser
invitait à réutiliser la logique fautive. Le garde-fou `if (!dl) return false;` reste en
tête — c'est lui qui écarte les libellés de créneau (4 mots) et protège `_matchDateParis`.

### ⚠️ Une Edge Function ne doit jamais relayer le statut 204 de GitHub

`trigger-switch` (10ᵉ vote → `switch-session.yml`) faisait
`new Response(msg, {status: gh.status})`. GitHub répond **204 No Content** à un
`workflow_dispatch` réussi, et 204 interdit un corps : `new Response` lève
`TypeError: Invalid response status code 204`, non attrapée → **500**. Le dispatch, lui,
était bien parti. Le webhook DB voyait donc un échec et **rejouait**, chaque rejeu
relançant un run `switch-session` qui dort 3 h. Corrigé le 4 septembre 2026 : succès →
200, erreur → 502.

Règle générale : ne jamais repasser tel quel le statut d'une API tierce dans
`new Response`. Les « null body status » (101, 103, 204, 205, 304) font lever le
constructeur dès qu'un corps est fourni.

### Répétition générale : comment tester la soirée sans rien casser

Rejouée le 4 septembre 2026 avant le match du 7. Aucun de ces tests n'écrit quoi que ce
soit dans `main` :

- **Lock** : copier `index.html` dans un dossier de travail, remplacer
  `now = datetime.now(PARIS)` par la date du lundi à 21h35 dans une copie de
  `lock_session.py`, lancer, puis lire l'entrée `SESSIONS` produite. Vérifier que le
  message « compo publiée absente ou périmée » **n'apparaît pas** (sinon la compo
  `slot_sessions` est désynchronisée et le lock reshufflera tout).
- **Score** : renvoyer le score **déjà enregistré** d'une session passée à
  `submit-score` (cf. plus haut). `set_score.py` refuse d'écraser et sort en succès.
- **Horloges** : extraire `_matchDateParis` / `mvpDeadline` / `mvpIsOpen` et les exécuter
  dans node avec un `Date` truqué, **sous plusieurs `TZ`** (`Europe/Paris`, `UTC`,
  `America/New_York`) — c'est ce qui prouve que l'heure de Paris ne dépend pas du fuseau
  du visiteur.
- **Garde-fou stats** : après lock + score + `update_stats.py`, revérifier que
  `_computeStats(null)` reproduit `PLAYER_STATS` et `PAIR_STATS` à l'identique.

⚠️ **`trigger-switch` ne se teste pas à blanc sur une session à 10 votes** : la fonction
dispatche pour de vrai avant de répondre. Le run `switch-session` déclenché **dort 3 h**
avant de no-oper — l'annuler tout de suite. Pour un simple test de disponibilité, viser
une session à moins de 10 votes : elle renvoie « N/10 — not triggering » sans rien
déclencher.

⚠️ **`switch-session` est un no-op depuis que le lock est automatique.** Le lock crée
chaque lundi une session `current:true` en tête de `SESSIONS`, donc `switch_session.py`
trouve toujours `idx == 0` (« Déjà sur la session la plus récente ») et sort. Ce n'est
pas une panne. La section « Passage à la session suivante » ci-dessous décrit un geste
que plus personne n'a à faire.

## Section « Récap 25-26 » (bilan de saison) — depuis juillet 2026

Onglet `🏁 Récap 25-26` (vert, à droite d'Inscriptions) ajouté pour le message de fin de saison envoyé au groupe WhatsApp. Contenu **figé, écrit à la main** : chiffres clés, palmarès, top 10 des winrates, section chambrage, sept soirées marquantes, best-of des commentaires de vote, plan d'entraînement estival, annonce de la reprise.

Tout tient dans des tableaux `RECAP_TILES` / `RECAP_PALMARES` / `RECAP_WINRATE` / `RECAP_CAROTIDE` / `RECAP_MOMENTS` / `RECAP_QUOTES` / `RECAP_PLAN`, rendus par `renderRecap()`. Aucune donnée n'est recalculée au chargement, rien n'est lu depuis Supabase : pour modifier un chiffre, il faut éditer le tableau concerné.

**⚠️ Piège des winrates.** Le tableau `RECAP_WINRATE` doit reprendre `PLAYER_STATS`, qui compte **championnat + tournoi du 22 juin**. Une première version filtrait sur le seul nombre de sessions de championnat (`≥ 5 sessions`), ce qui écartait Henri, Quentin et Samy (4, 4 et 3 sessions) alors que `PLAYER_STATS` les compte à 7, 7 et 6 matchs — et qu'ils occupent en réalité les trois premières places. Un onglet Récap qui contredit l'onglet Stats se repère immédiatement : **toujours partir de `PLAYER_STATS`**.

Les stats non stockées dans le HTML (rangs et horodatages d'inscription, nombre de votes donnés/reçus, longueur des commentaires, désistements) proviennent des tables Supabase `registrations`, `presences` et `votes`, interrogeables en lecture avec `SB_URL` + `SB_KEY` (clé anon, en clair dans `index.html`).

Pour une nouvelle saison : dupliquer la section plutôt que l'écraser — le récap 25-26 est une archive.
Depuis le modèle de saison, son onglet n'est affiché qu'en `25-26` (ou tant que la saison
courante n'a joué aucun match).

## Modèle de saison (depuis août 2026)

Une saison court **d'août à juillet** : les 17 journées de mars→juillet 2026 sont la
saison `25-26`, la reprise du 31 août 2026 ouvre `26-27`. La bascule se fait sur le
mois (`_MN[7] = août`) dans `_seasonOfDate(dateStr)`, qui accepte aussi bien
`'27 juillet 2026'` (une entrée `SESSIONS`) que `'Lundi 31 août 2026 · Reprise 🔥'`
(un label d'`INSCRIPTION_SLOTS`, exposants et emoji compris).

**Rien n'est stocké par saison.** `_computeStats(season)` recalcule tout depuis
`SESSIONS` + les tournois d'`INSCRIPTION_SLOTS`, avec exactement les mêmes règles que
`update_stats.py` — y compris l'exclusion des joueurs vus uniquement en tournoi et du
nom générique `Invité`. `season` à `null` = depuis toujours.

⚠️ **Le garde-fou à ne pas perdre** : `_computeStats(null)` doit reproduire
`PLAYER_STATS` et `PAIR_STATS` **à l'identique** (24 joueurs, 157 paires au 24 août
2026). C'est ce qui garantit qu'un onglet ne contredit pas l'autre. Toute modification
du calcul doit être revérifiée contre les tables figées, qui restent la référence et
continuent d'être maintenues par `update_stats.py`.

### Ce que ça change dans l'interface
- **Barre d'onglets** : une ligne de saisons (`.season-row`) au-dessus des onglets de
  dates, pilotée par `_tabSeason`. Elle n'apparaît qu'à partir de la deuxième saison.
  Par défaut on ouvre sur la **plus récente** — c'est là que se joue l'actualité.
- **Vue Stats** : sélecteur `Saison 25-26 / Saison 26-27 / Depuis toujours`, piloté par
  `_statsSeason` (`undefined` = non choisi, `null` = depuis toujours). Par défaut on
  ouvre sur la saison en cours **si elle a des matchs**, sinon sur « Depuis toujours » —
  sinon le classement serait vide entre la fin d'une saison et la reprise.
  Le classement **et** la matrice des duos suivent le périmètre choisi.
- **Onglet Récap 25-26** : visible en `25-26`, et aussi tant que la saison choisie n'a
  joué aucun match (sinon il disparaîtrait pendant toute la trêve).
- Les **courbes de duos sur le terrain** restent en all-time (`getPairWinRate`,
  inchangé) : elles décrivent l'historique d'une paire, pas une saison.

### Forme (notes ajustées) : remise à plat à chaque saison — depuis août 2026

`_getPlayerForm` ne regarde plus que les sessions **de la saison en cours**
(`_currentSeason()`, même bascule d'août que `_seasonOfDate`). À la reprise, tout le
monde repart sur sa note de base : la dynamique de juillet ne traverse pas la trêve.
En début de saison, avec moins de 3 matchs joués, seul le dernier résultat compte
(±0,5) ; le ±1 (trois V ou trois D d'affilée) ne peut apparaître qu'à partir de la
3ᵉ journée.

Les badges 🛡 Invincible / 🔥 En feu / 💀 Maudit suivent la même règle : `getPlayerForm`
(sans underscore, sessions **+ tournois**) prend un 2ᵉ argument `season` — non renseigné
= saison en cours, ce que veulent les badges du terrain ; `null` = depuis toujours. La
vue Stats lui passe le périmètre choisi (`_statsScope()`), pour que la colonne
« 5 derniers » colle aux M/V affichés sur la même ligne. Personne ne porte donc de badge
tant que la nouvelle saison n'a pas 3 matchs (5 pour Invincible).

⚠️ **Trois notions de saison, à ne pas confondre** :
- `_seasonOfDate(str)` — la saison d'une date donnée.
- `_currentSeason()` — la saison la plus récente **présente dans les données** (sessions
  + créneaux ouverts). Pilote les onglets (`buildTabs`) et le périmètre par défaut des
  stats (`_statsScope`).
- `_seasonNow()` — la saison **réelle à la date du jour** (Paris, bascule d'août). Pilote
  la forme et les badges. Pendant une trêve sans créneau ouvert, `_currentSeason()`
  renvoie encore la saison écoulée alors que `_seasonNow()` a déjà basculé : c'est
  voulu, la forme doit être à plat même si aucun créneau n'est encore ouvert.
  Ne pas redéfinir l'une en croyant écrire l'autre — la seconde déclaration écrase
  silencieusement la première.

`lock_session.py` rejoue ces fonctions dans node : sa liste d'extraction inclut
désormais `_MN` et `_seasonOfDate`, sans quoi `_getPlayerForm` planterait au lock.
Toute nouvelle dépendance de l'algo d'équilibrage doit être ajoutée à cette liste.

Pour la saison suivante, il n'y a **rien à faire** : la première session de `27-28`
créera la saison toute seule.

## Section Joueurs (depuis août 2026)

Onglet `👤 Joueurs` : une fiche par joueur — photo, poste, équipe de cœur, matchs,
victoires, winrate, trophées d'homme du match et forme récente. Les stats viennent de
`_computeStats(_statsScope())`, donc la fiche suit **le même périmètre de saison que
l'onglet Stats**.

⚠️ **Les trophées MVP passent par `_computeMotmTitles(allVotes)`**, désormais partagée
avec `buildStatsView`. Ne jamais recalculer les titres ailleurs : c'est exactement le
piège du Récap (deux onglets qui annoncent des chiffres différents).

### Équipe de cœur
`PLAYER_CLUBS` (nom → clé de club) est **vide par défaut** : une fiche sans club
s'affiche normalement, sans écusson. `CLUBS` porte le nom, le code court et les deux
couleurs de chaque club ; `_crestSVG(clé, taille)` en dessine un blason bicolore.

`CLUB_LOGOS` porte les **vrais écussons** en base64, réduits à 96 px : **130 Ko pour les
dix**, contre plus d'un Mo de fichiers source. `_clubBadge(clé, taille)` sert le vrai logo
quand il existe et retombe sur `_crestSVG` sinon — plus aucun club n'est dans ce cas
aujourd'hui, mais le repli reste la porte d'entrée d'un nouveau club.

**Écusson sombre : le champ `fond`.** Un logo foncé sur fond transparent disparaît sur le
fond nuit du site. `CLUBS[clé].fond` (une couleur) demande alors à `_clubBadge` une
pastille ronde de cette couleur derrière le logo, réduit à 78 % pour laisser voir l'anneau.
Seul `tot` l'utilise : le coq de Tottenham est bleu marine et son fichier est transparent à
83 %, contre 49 % pour le suivant. **Mesurer avant de décider** — sur un canvas, part de
pixels transparents et luminance moyenne des pixels opaques : le coq semblait blanc, il est
marine. Clermont est aussi sombre (luminance 71) mais opaque à 62 % : son bouclier rouge et
son lettrage blanc suffisent, pas de pastille.

⚠️ **Un test a démenti l'intuition de départ.** On avait supposé qu'un vrai écusson serait
illisible à 14 px et qu'il fallait des blasons générés. Comparaison faite à la taille
réelle, c'est l'inverse : à 14 px l'identification tient au couple couleur + silhouette,
et les blasons bicolores générés deviennent interchangeables entre clubs de palette
voisine (PSG marine/rouge, LOSC rouge/marine, Toulouse violet/rouge). **Toujours préférer
le vrai logo.**

Wikimedia refuse le téléchargement automatisé de ses médias (`429`, robot policy) : les
logos doivent être déposés à la main dans le dépôt, puis réduits (via Chromium et un
canvas, faute de Pillow ou d'ImageMagick sur la machine).

### Atterrissage : sur quelle session le site s'ouvre (depuis septembre 2026)

`_landingSession()` est **la seule définition** de la session d'arrivée. Elle sert à la
fois à `_loadInscriptionSessions` (qui la rend sur le terrain) et à `buildTabs` (qui
déplie son mois) : deux calculs séparés finiraient par diverger et l'onglet actif se
retrouverait dans un groupe replié.

La règle tient en une comparaison de dates, avec `_matchDayFromLabel` :
- session `current` datée d'aujourd'hui ou plus tard → **on reste dessus**. C'est le
  lundi soir après le lock : le créneau encore ouvert est celui de la semaine suivante,
  y basculer serait une erreur.
- sinon → **le premier créneau ouvert dont la date n'est pas passée**. Pendant la
  semaine on vient voir le match à venir, pas le résultat de lundi dernier.
- une ancre dans l'URL (`#s14`) reste prioritaire sur tout.

Cas limite couvert au passage : si le lock échoue un lundi soir (pas d'entrée
`SESSIONS`, créneau resté ouvert), la session du jour est quand même celle qui
s'affiche — c'est ce qui manquait le 31 août.

⚠️ `_monthKey` passe elle aussi par `_matchDayFromLabel` : elle lisait l'année au
dernier mot du libellé, ce qui faisait retomber `'Lundi 31 août 2026 · Reprise 🔥'` sur
2026 en dur. Invisible cette saison, faux dès 2027.

## Passage à la session suivante
- **3 heures après la clôture du vote**, passer `current: true` à la session suivante (et `current: false` sur la session active)
- Clôture = 10 votes atteints OU 22h30 le lendemain → donc au plus tard à **01h30** (nuit du lendemain au surlendemain)
- Opération manuelle : mettre à jour `current` dans SESSIONS dans index.html, puis commit/push/PR/merge

## Sessions existantes
| ID | Date | Score | current |
|----|------|-------|---------|
| s18 | 31 août 2026 | 10 – 9 (A) | ✅ |
| s17 | 27 juillet 2026 | 15 – 10 (A) | |
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

## Joueurs actifs (s18 — 31 août 2026, reprise)
Blanche ⚪ : Michael, Edouard, Gugu, Spy, Hugo
Bleue 🔵 : Rémi, Ibrahima, Johann, Quentin, Flo
Blanche l'emporte 10-9. Première journée de la saison **26-27**. Seize inscrits mais
seulement dix présents : les six du banc (Khalid, Landry, Théo, Henri, Dylan, Jack)
ne se déplacent pas. Équilibrage à 69,5 contre 69 — l'écart le plus serré produit
jusqu'ici — pour un but d'écart au final. Homme du match : Hugo (5 voix), devant Spy
(3), Michael (1) et Gugu (1). Article poussé dans `ARTICLES['s18']`.

**⚠️ Audit du 31 août 2026 — retard record des crons (constat corrigé le 1ᵉʳ
septembre).** Le soir même, aucun run planifié n'était visible et l'audit a conclu à
un abandon complet. **C'était faux** : les runs sont arrivés après coup, tous en
succès — le premier à 21h59 UTC (**23h59 Paris**), le dernier à 01h20 UTC (03h20
Paris). La fenêtre de crons couvre 16h00→22h30 UTC : le retard va donc d'environ
**2h50 sur le dernier cron à près de 6h sur le premier**, et **aucun n'a atterri près
de 21h30 Paris**. À comparer au 13 juillet (8/22, retard moyen 180 min) et au
20 juillet (22/22, 63 min). Leçon de méthode : **ne pas conclure à un abandon le soir
même** — un run planifié peut arriver des heures plus tard, et la compensation par
fenêtre élargie ne protège que jusqu'à ~3h30 de retard. Conséquences en
cascade : pas d'entrée `SESSIONS` → **le site atterrissait sur s17 (27 juillet)** car
la règle d'atterrissage d'alors n'opérait que tant que `_parisNow() < SEASON_RESUME`
(corrigé depuis, cf. « Atterrissage » plus bas) → et **pas de formulaire de score**,
qui exige une entrée `SESSIONS` sans score. Remède appliqué : `workflow_dispatch` sur
`lock-session.yml`, qui a repris la compo `slot_sessions` telle quelle (aucun
reshuffle, aucune inversion de couleur). **Ne jamais retaper la compo de mémoire —
le dispatch manuel reste fiable même quand aucun cron n'est arrivé à l'heure.** Cinq absents (Tim, Khalid, Landry, Henri, Thomas D) et trois remplacements successifs absorbés automatiquement dans la journée : la compo publiée est restée alignée sur les titulaires effectifs à chaque mouvement, et le lock l'a reprise telle quelle.

**⚠️ Audit du 20 juillet 2026** : le lock auto a tourné à l'heure (20h49 UTC / 22h49 Paris, dans la fenêtre étendue) mais a figé une mauvaise répartition des couleurs (Gugu/Théo et Dylan/Thomas D inversés par rapport à la compo décidée avant match). Cause : des absences de dernière minute (Alex, Cyril, Henri, Hugo, Landry, Raphaël, Tim) déclarées sur la feuille de match ont changé les 10 titulaires effectifs, mais **marquer un joueur absent ne redéclenche pas `syncSharedTeams`** (seuls `doUnregister`/nouvel inscrit le font) — la compo publiée dans `slot_sessions` est donc restée périmée. Au lock, `lock_session.py` a détecté le désaccord ("compo publiée absente ou périmée") et est tombé dans le repli : régénération complète par `_genBalancedTeams`, qui reshuffle tout le monde (option B, pas d'échange minimal) au lieu de ne remplacer que les absents. Corrigé manuellement dans `SESSIONS` (s16) + `PLAYER_STATS`/`PAIR_STATS` recalculés sur la bonne compo.

**Corrigé le 27 juillet 2026** : `setPresence` déclenche désormais `_resyncSharedCompo` quand un joueur passe absent ou revient de l'absence, et `syncSharedTeams` calcule les **titulaires effectifs** via `_effectiveRoster` (inscrits dans l'ordre, banc trié par `benchPriority`, absents retirés, 10 premiers) — exactement la règle de `lock_session.py`. La compo publiée dans `slot_sessions` reste donc toujours à jour avant le lock : à 21h30 le script la reprend telle quelle (`roster_key` correspond) au lieu de tomber dans le repli qui reshuffle tout.
