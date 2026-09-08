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
- **App** : single-file HTML (`index.html`, ~0,8 Mo) — tout est dedans : CSS, JS, photos joueurs en base64
- **Backend votes MVP** : Supabase
- **Hébergement** : GitHub Pages via le repo
- **Pas de build, pas de bundler** — édition directe du fichier HTML via scripts Python (le fichier reste trop long pour un Read en une fois : ~7 000 lignes, dont des lignes de plusieurs centaines de Ko)

### ⚠️ Toute photo ajoutée doit être réduite avant d'être collée (depuis septembre 2026)

Les photos de `PLAYER_PHOTOS` s'affichent en **56×58 px** sur le terrain et **60×64 px**
sur les fiches. Elles étaient stockées en pleine résolution : 1276×1298, 1428×1200… soit
**5,95 Mo de base64 pour 22 photos**, 94 % du fichier. Une seule pesait 2,1 Mo.

Réduites à ~240×260 (large même à 3× de densité), en JPEG q0.82 : **5,95 Mo → 0,28 Mo**,
et `index.html` passe de 6,5 Mo à 0,8 Mo. Comparaison faite à 1,5× la taille réelle du
téléphone, terrain et fiches sont **indiscernables** de l'avant.

**La règle, pour ne pas y revenir** : une nouvelle photo se réduit à ~240 px de large
**avant** d'être inlinée. Sinon un seul ajout rend les 5 Mo d'un coup — et le fichier est
retéléchargé en entier par tout le monde à chaque commit du lundi soir (lock, puis score).

Pas de Pillow ni d'ImageMagick sur la machine : la réduction passe par Chromium + un
canvas (`playwright-core`, binaire dans `/opt/pw-browsers/`), comme les écussons de clubs.
Deux garde-fous à garder dans le script : ne **jamais agrandir** une image déjà plus petite
que la cible, et **ne pas ré-encoder** quand ça ne fait pas gagner d'octets — sept photos
sources (80×100) grossissaient en repassant par le canvas, elles ont été laissées intactes.

## Architecture du fichier index.html
- `SESSIONS` array (newest first : s11 → s1) — chaque session a `id`, `date`, `score`, `scoreWinner`, `current`, `bench`, `nameA`, `nameB`, `players`
- `PLAYER_STATS` — stats agrégées par joueur (played, wins)
- `PAIR_STATS` — stats par duo (p1, p2, together, wins)
- `ARTICLES` — articles L'Équipe par session id
- `RANK_METHODS` + `_rankMethod` — 4 méthodes de classement (Winrate / Régularité / Équilibre / Stabilité)
- `RECAP_*` + `renderRecap()` / `showRecap()` — section « Récap 25-26 » (bilan de saison, cf. plus bas)
- `renderPresseView()` / `showPresse()` — onglet « 📰 Presse » (tous les articles, cf. plus bas)

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

### Effectif sous les 10 : la compo reste affichée (depuis septembre 2026)

Le 8 septembre 2026, le créneau du 14 comptait **18 inscrits et 9 désistements** : neuf
joueurs disponibles, un de moins qu'il n'en faut. Le site affichait alors
`18/10 joueurs inscrits` et une liste de dix-huit noms — **ni terrain, ni compo, ni
feuille de match**. Autrement dit un décompte qui annonce un effectif au complet le jour
précis où il manque quelqu'un, et plus aucun moyen de voir qui s'est désisté.

La cause : `syncSharedTeams` rendait `false` dès que `_effectiveRoster` tombait sous dix
(l'algo d'équilibrage travaille sur exactement dix noms), et `renderSession` renvoie toute
session `fromInscription` de moins de dix joueurs à `renderInFormation`, qui masque le
terrain **et** la feuille de match.

Trois corrections, par ordre d'importance :

1. **La dernière compo publiée reste affichée.** Sous dix disponibles, `syncSharedTeams`
   reprend la ligne `slot_sessions` telle quelle — et ne publie rien, puisqu'on ne peut
   plus rééquilibrer. C'est la compo annoncée au groupe, les absents y portent déjà leur
   ❌ (`updatePitchPresence`) et **le trou se voit à la place qu'il laisse**. Ne pas
   remplacer ça par une compo générée à neuf : `_genBalancedTeams` énumère C(10,5), et
   c'est le bloc que `lock_session.py` extrait pour rejouer l'algo dans node.
2. **`renderRosterAlert`**, une bannière au-dessus du terrain : « ⚠️ Il manque 1 joueur ·
   9 disponibles sur 10 · 9 désistements sur 18 inscrits · Personne au banc pour remplacer
   Jack », avec un raccourci vers Inscriptions. Le chiffre n'est pas nouveau —
   `renderPresence` calculait déjà les postes que le banc ne couvre plus — il était
   imprimé en italique **tout en bas de la feuille de match**, sous la liste des absents,
   alors que c'est la seule chose à faire ce jour-là : trouver quelqu'un. La bannière vit
   dans `#view-pitch` : chaque onglet plein écran masque ce conteneur entier, il n'y a donc
   pas un septième endroit où penser à la cacher (Stats, Joueurs, Presse, Inscriptions et
   Récap listent déjà chacun les sections à masquer, et ces listes divergeraient).
3. **Les décomptes comptent les disponibles, pas les inscrits** : la bannière « en
   formation » (`9/10 joueurs disponibles`, désistements listés à part et barrés, rang
   d'inscription conservé) et l'onglet du lundi (`Lun 14 (9/10)`).
   `_loadInscriptionSessions` lit la feuille de match des créneaux **ouverts** en même
   temps que les inscriptions et pose `availCount` ; la requête n'est pas nouvelle, elle
   est seulement remontée d'un cran (`syncSharedTeams` la faisait pour son compte).
   `renderPresence` rafraîchit `availCount` à chaque clic, pour que l'onglet suive sans
   rechargement.

⚠️ **`undefined`, jamais `{}`, quand la feuille de match ne se lit pas.** `sbGetPresences`
renvoie `[]` sur une lecture ratée comme sur une feuille vide — c'est ce qui avait republié
Tim titulaire le 27 juillet. La nouvelle `sbGetPresenceMap` **lève**, et chaque appelant
décide : la publication reste suspendue et le site retombe sur son comportement d'avant,
plutôt que d'annoncer « il manque un joueur » sur une requête en erreur.

Le **style** de l'onglet suit toujours les inscrits (`tab-ins-session` dès 10 inscrits), pas
les disponibles : une compo existe, l'onglet ne doit pas repasser au gris « en formation ».

⚠️ **Mesurer les débordements avec les vraies polices.** Un premier test donnait la feuille
de match débordante à 320 px : c'était la police de repli du harnais, Google Fonts étant
injoignable depuis le conteneur. Avec Saira Condensed rapatriée en local et servie par le
routeur Playwright, aucun débordement, ni avant ni après. Une police de repli est toujours
plus large — conclure sur elle, c'est « corriger » une mise en page qui va bien.

Vérifié dans Chromium sur la vraie base : désistement en direct (la compo ne bouge pas, la
bannière apparaît, l'onglet passe à `(9/10)`), retour du joueur (tout redisparaît), et
non-régression quand le banc peut encore remplacer — testé sur le 21 septembre, Cyril entre,
la compo est republiée dans `slot_sessions`, aucune bannière. `_computeStats(null)` reproduit
toujours `PLAYER_STATS` et `PAIR_STATS` à l'identique (24 joueurs, 161 paires), et
l'extraction node de `lock_session.py` rejoue l'algo sans erreur, avec la même compo et les
mêmes notes.

### Contrainte exceptionnelle `together` (par créneau)

Un créneau peut porter `together:['Samy','Gugu','Quentin']` dans `INSCRIPTION_SLOTS` : l'algo (`_genBalancedTeams`) ne considère alors que les splits où ces joueurs sont **dans la même équipe** et choisit le meilleur ratio parmi eux. La contrainte suit tous les recalculs (absences, désistements, banc) ; si un membre du groupe manque au roster, elle ne porte que sur les présents. **Retirée d'`ins_jul_06` après le match ; elle ne subsiste que sur l'ancien `ins_jun_15`, fermé, donc sans effet. Aucun créneau ouvert n'en porte aujourd'hui.**

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

**Règle couleur : la couleur annoncée avant 21h30 fait foi.** `teamA=true` → Blanche ⚪, `teamA=false` → Bleue 🔵. La régénération du lock peut **inverser la couleur** d'une équipe par rapport à ce qui était affiché avant le lock. Depuis juin 2026, `lock_session.py` **réancre les couleurs** sur la compo `slot_sessions` annoncée (échange des moitiés si l'orientation est inversée). Le lock ne doit jamais inverser une couleur déjà annoncée.

### ⚠️ L'orientation des couleurs ne doit jamais dépendre de l'ordre du roster (corrigé le 7 septembre 2026)

`_genBalancedTeams` ne choisissait pas l'orientation : elle la subissait. Chaque split est
énuméré **deux fois** dans `allCombos` (une moitié, puis son complément), les deux
orientations ont un score de tri **strictement identique** (`dSM` et `dN` sont des valeurs
absolues, `pen` teste A *et* B, `duoPen` est un `max`), et `Array.sort` est stable : la
gagnante était donc toujours la **première énumérée**, c'est-à-dire celle contenant
`names10[0]`. Autrement dit **le premier inscrit était en Blanche à chaque journée**.

Mesuré : 400/400 tirages aléatoires, part en Blanche de 100 % pour la place 1 contre 42-49 %
pour toutes les autres ; et **10 compos publiées sur 10** avec Gugu en ⚪, lui qui ouvre la
feuille d'inscription toutes les semaines. « Blanche » ne voulait donc pas dire une couleur,
mais « l'équipe du premier inscrit ». Les deux exceptions apparentes (s13, s14) confirment le
mécanisme : les compos publiées avaient bien Gugu en ⚪, c'est la régénération du lock, avant
que le réancrage n'existe, qui a retourné les couleurs.

L'orientation se décide désormais sur `_halfHash` — une empreinte FNV-1a des noms triés de
chaque moitié, la plus petite prend le blanc. **Ne jamais la remplacer par un tirage au
sort** : plusieurs navigateurs calculent la compo en parallèle avant qu'elle soit publiée
dans `slot_sessions`, et le lock la recalcule encore ; le déterminisme est ce qui les fait
tomber d'accord. Un hash convient parce qu'aucun joueur n'y est ancré : la composition d'une
moitié change à chaque journée. Après correctif, sur 400 tirages : place 1 à 48,5 %, toutes
les places entre 47 et 53 %, et « même roster, même ordre → même compo » 100 fois sur 100.

`_halfHash` doit rester **dans le bloc `/* ── AUTO-TEAM BALANCING ── */`** : c'est la tranche
que `lock_session.py` extrait pour rejouer l'algo dans node. Un helper posé ailleurs ferait
planter le lock.

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
  Le classement, la matrice des duos **et** le palmarès « 🏅 Hommes du match »
  suivent le périmètre choisi.
- **Palmarès « Hommes du match »** (depuis septembre 2026) : filtré par le sélecteur
  comme le reste de l'onglet, et en « Depuis toujours » **découpé par saison** (un filet
  `Saison 26-27 · N titres` avant chaque bloc de médaillons) — un mur continu ne disait
  plus de quelle année venait un titre. Le bandeau « vote en cours » suit la même règle.
- **Vue Joueurs** : les mêmes pastilles, sur la **même variable `_statsSeason`** que
  l'onglet Stats — les deux vues montrent les mêmes chiffres, elles ne doivent pas
  pouvoir être réglées sur deux saisons différentes. La Presse garde son
  `_presseSeason` : lire les articles d'une saison ne doit pas déplacer le classement.
  Les trois rangées passent par `_seasonPills(scope, action, allLabel)` — trois copies
  du même bouton finiraient par diverger.
- **Titres d'homme du match : toujours sur le périmètre affiché.**
  `_computeMotmTitles(allVotes, season)` prend la saison en 2ᵉ argument ; le 🏆 de la
  fiche Joueurs et la médaille du palmarès (🥇 ≥3 / 🏅 1) s'en servent tous les deux.
  ⚠️ Le trophée était resté un total de carrière : sur la pastille `26-27`, une fiche
  annonçait « 1 match » et « 🏆 2 ». Un compteur ne doit jamais couvrir une autre période
  que les matchs affichés à côté de lui.
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

⚠️ **« Aujourd'hui ou plus tard » retombait à faux à minuit** (corrigé le
8 septembre 2026). Le mardi à 00h00, la session du match de la veille n'était plus
« datée d'aujourd'hui ou plus tard » : le site quittait le match — score rentré à
peine une heure plus tôt, **vote en cours**, article pas encore écrit — pour le
créneau de la semaine suivante. Constaté à 00h34 le 8 septembre, avec s19 verrouillée
et son vote ouvert jusqu'au mardi 22h30. C'est **exactement le piège de `mvpIsOpen`**
corrigé le 4 septembre, sur une autre fonction : une soirée de five déborde sur le
lendemain, et une comparaison de **journées** ne peut pas le voir.

La règle passe désormais par `_sessionStillLanding(s)`, seule définition du test, et
c'est la **deadline du vote** (22h30 le lendemain) qui dit quand la soirée est finie.
La clôture anticipée à 10 votes ne déplace **volontairement pas** l'atterrissage :
la page ne doit pas sauter pendant que le groupe commente encore le match.

### L'article publié libère l'atterrissage, 4 h plus tard (8 septembre 2026)

Quatre tests, **dans cet ordre, et l'ordre fait tout** :

1. **Le soir du match, on ne quitte jamais la session.** Quoi qu'il arrive par ailleurs —
   c'est ce qui interdit à un article publié à 23h de faire sauter la page pendant que le
   groupe est encore dessus.
2. **Passé la deadline du vote, on est parti.** Ce plafond est testé *avant* l'article, et
   c'est lui qui rend la règle **monotone** : une fois la session quittée on n'y revient
   jamais, même si l'article est déposé le lendemain. Sans ce test placé là, un article
   écrit le mercredi ramènerait tout le monde sur le match du lundi.
3. **Un article publié raccourcit l'attente, mais laisse `_ARTICLE_READ_MS` (4 h) pour le
   lire** avant de basculer sur le prochain créneau.
4. **Sans article — ou sans `publishedAt` —, la deadline du vote comme avant.**

Le raisonnement : l'article s'écrit au débrief, une fois l'homme du match connu (règle
posée par l'utilisateur : « ne publions pas avant de savoir qui est l'homme du match et
les commentaires de chacun »). Sa présence veut dire « c'est raconté ». Les 4 h sont là
pour que ceux qui ouvrent le site dans la foulée tombent sur l'article plutôt que sur la
feuille du match suivant. C'est aussi **un levier volontaire** : publier l'article
programme le passage au match d'après, ce qui compte quand la compo bouge — le
8 septembre, cinq absents étaient déjà déclarés pour le 14.

**`ARTICLES[id].publishedAt`** porte l'horodatage (ISO, `…Z`). Les 18 articles antérieurs
n'en ont pas : ils ne raccourcissent rien, on retombe sur la deadline, donc rien du passé
ne bouge. **À renseigner à chaque nouvel article**, sinon le levier ne sert pas.

Le champ marque **le début de la fenêtre de lecture, pas l'heure du commit** : on peut le
reculer volontairement pour ouvrir tout de suite sur le match suivant. C'est ce qui a été
fait pour s19 le 8 septembre (article en ligne à 10h36, horodatage posé à 08h00) parce que
cinq absents étaient déjà déclarés pour le 14 et que la feuille de match primait sur le
résultat de la veille. Quand on recule, **dire pourquoi dans le commentaire juste à côté** —
sinon la valeur se lit plus tard comme une heure de publication, et elle est fausse.

⚠️ Le test se fait sur `ARTICLES[s.id]`, donc **synchrone** : `_curIsLanding`, qui
s'exécute avant la réponse de Supabase, donne la même réponse que l'atterrissage.

Vérifié sur huit horloges truquées, dont les trois qui comptent : le cas d'origine
(mardi 00h34, vote ouvert, pas d'article → session gardée), un article publié 34 min plus
tôt à minuit (→ session gardée, les 4 h courent), et un article déposé le mercredi matin
(→ **on ne revient pas** sur le match du lundi).

Le premier rendu (`_curIsLanding`, avant la réponse de Supabase) appelle la même
fonction. Il en avait sa propre copie, et deux copies d'une règle de date finissent
toujours par diverger : le terrain aurait peint une session que l'atterrissage
remplace aussitôt.

⚠️ `_monthKey` passe elle aussi par `_matchDayFromLabel` : elle lisait l'année au
dernier mot du libellé, ce qui faisait retomber `'Lundi 31 août 2026 · Reprise 🔥'` sur
2026 en dur. Invisible cette saison, faux dès 2027.

## Section Presse (depuis septembre 2026)

Onglet `📰 Presse` : tous les articles d'`ARTICLES`, du plus récent au plus ancien, cartes
repliées qu'on déplie sur place. Avant, un article n'était lisible que depuis la session qui
le portait — un seul à la fois, celui du match affiché.

**Rien de nouveau n'est stocké** : la liste est déduite d'`ARTICLES` + `SESSIONS`
(date, score, vainqueur, composition). Écrire un article, c'est toujours ajouter une entrée
à `ARTICLES` au débrief ; elle apparaît dans l'onglet toute seule.

- **Périmètre de saison** : mêmes pastilles et même règle par défaut que l'onglet Stats
  (`_presseScope`, calqué sur `_statsScope`) — la saison en cours si elle a des articles,
  sinon « Depuis le début ». La saison d'un article vient de `_seasonOfDate(s.date)`.
- **Carte Récap** : en `25-26` et en « Depuis le début », une carte verte en fin de liste
  ouvre l'onglet Récap. Le récap est un article comme un autre pour le lecteur, même s'il
  vit dans sa propre vue. Masquée dès qu'un filtre est actif.
- **Filtre par prénom** : `datalist` alimentée par `PLAYER_NOTES` (autocomplétion native sur
  téléphone). Chaque carte affiche le nombre de mentions **et la couleur portée ce soir-là**
  (`_prWore`), les occurrences sont surlignées dans l'article déplié.

⚠️ **Le champ de recherche ne doit jamais provoquer un rendu complet de la vue.**
`_prSearch` ne repeint que `#pr-list` : reconstruire `#view-presse` ferait perdre le focus de
l'input, donc replierait le clavier à chaque lettre tapée sur téléphone.

⚠️ **Frontières de mot obligatoires dans `_prRegex`.** La recherche est insensible à la casse
et aux accents (« remi » trouve « Rémi »), ce qui est indispensable sur mobile — mais sans
`\b`, « remi » comptait **9 mentions** dans l'article du 31 août en surlignant « **remi**se en
route » et « p**remi**ères ». La vraie réponse est 2. Les bornes ne sont posées que si la
requête commence et finit par un caractère ASCII : `\b` ne voit pas les lettres accentuées
comme des lettres, donc un prénom commençant par un accent (aucun aujourd'hui) ne serait pas
trouvé. Recherche et surlignage partagent la même regex — c'est ce qui garantit que le compte
affiché et ce qu'on voit surligné disent la même chose.

⚠️ `renderPresseView` ≠ `renderPresence` (feuille de match). Les deux noms sont voisins dans
un fichier de 20 Mo : toujours vérifier lequel on grep.

### ⚠️ Un rendu tardif ne doit jamais repeindre par-dessus l'onglet ouvert

Défaut **préexistant**, trouvé en testant la section Presse dans Chromium et corrigé au
passage : en cliquant sur un onglet **pendant le chargement**, l'en-tête de session et
« Homme du match » se rempilaient au-dessus de la vue ouverte, et la surbrillance repassait
sur l'onglet de session. Reproduit à l'identique sur Stats, Joueurs, Inscriptions **et**
Presse — ce n'est pas la nouvelle vue qui est fautive, elle héritait du défaut.

Trois appelants tardifs révèlent les sections du terrain sans savoir ce qui est à l'écran :
l'atterrissage (après un `await`), la bannière de créneau qui se rafraîchit, et le timeout de
secours à 6 s quand Supabase ne répond pas. Le point de passage commun est `renderSession`,
qui reprend en plus la surbrillance (`setActiveTab(s.id)`).

Deux garde-fous, tous deux nécessaires :
- **`renderSession`** remasque les sections du terrain et rend son onglet à la vue ouverte
  quand `_visibleViewTab()` renvoie une vue. Le contenu a bien été calculé : il est là au
  retour sur le terrain.
- **L'atterrissage** ne s'exécute plus si une vue est ouverte — il appelle `showPitch()`,
  qui masque les vues, donc le garde-fou de `renderSession` ne peut pas le rattraper.

`_visibleViewTab()` lit l'état **dans le DOM** (quelle vue est en `display:block`) plutôt que
dans une variable parallèle qui finirait par diverger. Toute nouvelle vue plein écran doit
être ajoutée à sa table — et masquée dans les `show*` des autres onglets, comme les
précédentes.

## Écran de chargement : la vraie limite est la largeur, pas le nombre

`LOADING_PHRASES` (dans `index.html`) porte les phrases affichées sous le ballon pendant
le chargement. Elles sortent **deux par deux**, l'ordre des paires est tiré au hasard à
chaque ouverture, et `_syncLoadingPhrases()` recalcule seul le rythme (2 s par paire) :
**ajouter ou retirer une ligne suffit**, il n'y a rien d'autre à régler dans le JS.

Passé de 8 à **20 phrases (10 paires) le 8 septembre 2026**.

**Il n'y a pas de plafond dans le code.** Ce qui se paie, c'est la visibilité : l'écran
ne vit qu'environ une seconde (`_LOADING_MIN_MS`) et une paire tient 2 s, donc **on ne
voit qu'une paire par chargement**. Chaque paire a exactement `1/nb_paires` chance de
sortir — 25 % à 4 paires, 10 % à 10. En ajouter donne de la variété d'une visite à
l'autre ; ça ne fait jamais lire plus de deux phrases d'un coup.

**La contrainte réelle, mesurée : la longueur.** Le corps de page est un flex
`align-items:center`, donc `#view-pitch` se rétracte sur son contenu : pendant le
chargement la bannière ne faisait que **210 px de large**, et *six des huit phrases
d'origine passaient à la ligne au milieu d'un mot*. `.loading-banner` porte désormais
`width:min(340px,92vw)`, ce qui donne **308 px de texte utile** dès 360 px de viewport.

À la règle : une phrase tient sur une ligne jusqu'à **~290 px** en Saira Condensed
0,8 rem, graisse 600, `letter-spacing:.18em`, en majuscules — soit **28 à 30 caractères**.
Au-delà elle passe sur deux lignes (pas cassé, mais moins net), et sur un écran de 320 px
la limite tombe à ~24 caractères. Se mesurer avec un `<span>` sonde plutôt qu'au jugé :
les majuscules et l'interlettrage coûtent bien plus large qu'on ne le croit.

Liste réécrite par l'utilisateur le 8 septembre 2026, et **les vingt tiennent maintenant
sur une ligne à toutes les largeurs testées** (320, 360, 390, 430 px) : la plus longue,
« Marc n'est toujours pas revenu… », fait 243 px pour 262 px disponibles à 320 px. Les
deux anciennes qui débordaient partout — « Jack s'échauffe pour vous pulvériser… » et
« Spy vise le trophée d'homme du match… », 383 et 378 px — ont été raccourcies de moitié.
C'est l'état à préserver : **mesurer une nouvelle phrase avant de l'ajouter**, la marge
n'est plus que d'une vingtaine de pixels sur petit écran.

⚠️ **Le même texte est en dur dans le `<div id="forming-banner">` du corps de page** :
c'est le tout premier affichage, celui d'avant l'exécution du JS, il ne peut pas être
généré. Le CSS statique (`animation:phraseCycle Ns`, les `nth-child` et les pourcentages
de `@keyframes`) est réglé sur le nombre de paires du moment. `_syncLoadingPhrases()`
remplace les deux au démarrage, donc une divergence ne se voit que quelques dizaines de
millisecondes — mais **ne pas la laisser s'installer** : c'est ce bloc statique qui
s'affiche sur une connexion lente, exactement quand l'écran de chargement sert vraiment.

## Notifications push : construites, jamais branchées — décision de septembre 2026

Le code existe et il est complet : `registerPushSubscription` dans `index.html`, `sw.js`
(affichage + clic), les Edge Functions `send-push` et `notify-substitute`, la migration
`supabase/migrations/20260515_push_subscriptions.sql`, et l'appel depuis le site —
`notifySubstituteIfNeeded` prévient le remplaçant promu quand un titulaire se déclare
absent, exactement le scénario qui a mis la pagaille les 6 et 20 juillet.

**Rien de tout ça ne peut fonctionner aujourd'hui**, et c'est volontaire. Constaté le
7 septembre 2026, trois verrous dont chacun suffit :

1. **`VAPID_PUBLIC_KEY` est vide** dans `index.html`. `registerPushSubscription` sort à sa
   première ligne : la demande d'autorisation n'a jamais été affichée à personne.
2. **La table `push_subscriptions` n'existe pas** dans le projet Supabase — la migration
   est dans le dépôt, elle n'a jamais été appliquée. Vérifiable en une requête :
   `registrations`, `presences`, `votes` et `slot_sessions` répondent, `push_subscriptions`
   (comme `push_tokens`, `sessions` et `player_profiles`, tables du projet mobile) renvoie
   **404**.
3. **`icon-192.png` est absent du dépôt** alors que `sw.js` le référence en `icon` et en
   `badge` — la notification s'afficherait sans logo.

### Pourquoi on ne l'allume pas

**On ne sait pas à qui on parle.** L'abonnement est rattaché au nom que le visiteur a tapé
sur le site et que garde son `localStorage` : n'importe qui peut saisir n'importe quel
prénom, et un téléphone partagé casse la correspondance. Prévenir « le bon joueur » suppose
donc une **authentification**, qui est au backlog mobile et hors de portée à date. Envoyer
une notification au mauvais joueur est pire que ne rien envoyer : le remplaçant croit être
titulaire.

Second obstacle, indépendant : sur **iPhone**, le push web exige que le site ait été
**ajouté à l'écran d'accueil**, ce qui suppose un `manifest.json` (absent lui aussi) et un
geste d'installation de chaque personne du groupe. Le groupe WhatsApp fait ce travail moins
bien, mais sans rien installer.

### Si on y revient un jour

Dans cet ordre, et pas autrement : **authentification d'abord** (c'est elle qui débloque le
sujet), puis paire de clés VAPID (publique dans `index.html`, privée dans les secrets
Supabase), application de la migration, redéploiement des fonctions — attention,
`deploy-functions.yml` déploie tout d'un bloc et échoue en bloc — puis `icon-192.png` et
`manifest.json`.

⚠️ **Ne pas recocher la ligne du backlog sans l'authentification.** Elle était cochée alors
que rien ne pouvait partir, ce qui a fait croire pendant des mois que la fonction marchait.

## Passage à la session suivante
- **3 heures après la clôture du vote**, passer `current: true` à la session suivante (et `current: false` sur la session active)
- Clôture = 10 votes atteints OU 22h30 le lendemain → donc au plus tard à **01h30** (nuit du lendemain au surlendemain)
- Opération manuelle : mettre à jour `current` dans SESSIONS dans index.html, puis commit/push/PR/merge

## Sessions existantes
| ID | Date | Score | current |
|----|------|-------|---------|
| s19 | 7 septembre 2026 | 9 – 8 (A) | ✅ |
| s18 | 31 août 2026 | 10 – 9 (A) | |
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
- [ ] **Notifications push** — relances ciblées, ex. : joueur titulaire dans 3 jours sans statut → push "Tu joues lundi ? Confirme ta présence". **Code écrit, jamais branché** : dépend de l'authentification, sans laquelle on ne peut pas garantir qu'on prévient le bon joueur (cf. « Notifications push : construites, jamais branchées »)

## Revue du 8 septembre 2026 (tour complet du site)

Passage de tous les onglets dans Chromium avec Supabase branché. Chaîne du lundi soir
vérifiée sur s19 : lock automatique à **21h39** (9 min de retard, dans la fenêtre), score
saisi depuis le site à **23h00**, atterrissage sur s19 le lendemain, vote MVP ouvert
jusqu'à 22h30. Garde-fou des stats revérifié : `_computeStats(null)` reproduit
`PLAYER_STATS` et `PAIR_STATS` **à l'identique** — 24 joueurs, **161 paires** (157 au
24 août, deux journées de plus depuis). Aucune erreur JS sur aucun onglet.

Quatre défauts trouvés et corrigés le jour même :

- **« résultats à midi »** sous le bandeau « vote en cours » de l'onglet Stats. La
  clôture est à 10 voix ou 22h30 le lendemain, jamais à midi — l'heure était en dur et
  fausse depuis que la deadline a bougé. Remplacée par « résultats après clôture », qui
  ne redit pas une règle vivant déjà dans `mvpDeadline`.
- **Teaser d'Inscriptions périmé** : « La trêve est finie. Reprise le lundi 31 août à
  21h30 » s'affichait encore alors que deux journées étaient jouées.
- **`SEASON_RESUME` resté au 31 août 2026**, dans le passé, alors que son propre
  commentaire dit de le repasser à `null` à la reprise. Sans effet (tous les tests sont
  `> now`) mais c'est un piège posé : remis à `null`, avec le mode d'emploi pour la
  prochaine trêve.
- **`getNextMatchDate` lisait la date par `split(' ')` avec `length === 3`** — le piège
  documenté plus haut, tombé trois fois déjà. Il ne mordait pas encore (les entrées
  `SESSIONS` portent une date nue), mais la première date décorée aurait fait tomber le
  compte à rebours sur « lundi prochain » en silence. Passé par `_matchDayFromLabel`.

Deux points laissés en l'état, volontairement :

- **Pas d'article pour s19** dans `ARTICLES` — il s'écrit au débrief, le vote n'était pas
  clos. L'onglet Presse n'affiche donc qu'un article pour la saison 26-27.
- **Le compte à rebours raisonne en heure locale du visiteur**, pas en heure de Paris
  (`new Date()`, et un « lundi prochain » calculé sur `d.getDay()` local). Sans
  conséquence pour un groupe qui est à Paris ; à reprendre le jour où quelqu'un ouvre le
  site depuis un autre fuseau, et à ne pas confondre avec les horloges du vote et du
  lock, qui passent bien par `_parisNow()`.

## Joueurs actifs (s19 — 7 septembre 2026)
Blanche ⚪ : Spy, Alex, Cyril, Hugo, Gugu
Bleue 🔵 : Michael, Flo, Edouard, Johann, Quentin
Blanche l'emporte 9-8. Vingt inscrits, trois absents de dernière minute (Samy, Rémi,
Jack), sept sur le banc. Équilibrage à 69,5 partout — zéro d'écart, ce qui **n'est pas
une première** (s12, s14, s16 et s17 aussi ; ne pas répéter l'erreur de la première
version de cette note), mais aucun de ces ex æquo n'avait donné un score aussi serré.
Homme du match : **Spy**, 6 voix sur 10, devant Johann (2), Gugu (1) et Alex (1) —
**son premier titre**, après avoir figuré au vote cinq fois sans jamais le gagner
(1, 1, 2, 2, 3 voix, puis 6). Lock automatique à 21h39, score saisi depuis le site à
23h00 : la chaîne complète a tourné sans intervention. Article poussé dans
`ARTICLES['s19']`, écrit à partir du déroulé donné par l'utilisateur **et** des
verbatims des dix votes. Le match : 3-0 Blanche (deux buts de Gugu, dont l'ouverture
sous ses nouvelles couleurs du LOSC, le second à la 13ᵉ), remontée bleue but à but
jusqu'à 7-7, puis **7-8 — la Bleue devant pour la première fois** ; dix minutes de
stress, égalisation de Spy à 8-8, faute tactique de Gugu sur Flo, et 9-8 signé Alex
au bout d'**une heure et trois minutes**.

⚠️ **Méthode, pour la prochaine fois** : une première version de cet article a été
écrite sans le récit du match, faute de l'avoir retrouvé dans le fil — et l'article
s'était replié sur le vote. Le déroulé avait pourtant été envoyé la veille. **Avant
d'écrire un article, demander le film du match plutôt que de faire sans** ; ne jamais
inventer un scénario, mais ne pas s'en passer non plus quand il existe.

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
