# Archive

Fichiers rangés le 30 septembre 2026 : plus rien ne les utilise (ni le site, ni les
workflows, ni la doc). Ils restent là pour mémoire ; l'historique git garde aussi tout.

- `scripts/` — retouches ponctuelles d'`index.html` faites au printemps et à l'été 2026
  (`fix_*`, `add_*`, `inject_*`…). Elles ont déjà été appliquées : **ne pas les relancer**,
  le fichier a beaucoup changé depuis. Elles supposent d'être lancées depuis la racine.
  `update_tournament_stats.py` est remplacé par `.github/scripts/update_stats.py`, qui
  recalcule championnat **et** tournois.
- `sources/` — photos de joueurs et écussons de clubs d'origine, avant réduction. Les
  versions utilisées sont en base64 dans `index.html` (`PLAYER_PHOTOS`, `CLUB_LOGOS`).

Restent à la racine : `index.html`, `sw.js`, `logo.svg`, `logo.png`, et les deux outils
encore en service, `republish_compo.py` et `flip_slot_colors.py` (cf. CLAUDE.md).
