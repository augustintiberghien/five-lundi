#!/usr/bin/env python3
# Ajoute "Homme du tournoi" (Khalid) au Hall of Fame de l'onglet stats, avec twist visuel.
import io

snippet = io.open("tournament_hof_snippet.js", encoding="utf-8").read()
html = io.open("index.html", encoding="utf-8").read()

# 1) Déclarer le gagnant dans la config du tournoi
OLD_CFG = "motm:{close:'2026-06-24'}"
NEW_CFG = "motm:{close:'2026-06-24',winner:'Khalid'}"
assert html.count(OLD_CFG) == 1, "config motm: %d" % html.count(OLD_CFG)
html = html.replace(OLD_CFG, NEW_CFG)

# 2) Insérer la fonction _tournamentHofMedal avant buildStatsView
ANCHOR_FN = "function buildStatsView(){\n"
assert html.count(ANCHOR_FN) == 1, "buildStatsView anchor: %d" % html.count(ANCHOR_FN)
html = html.replace(ANCHOR_FN, snippet + ANCHOR_FN, 1)

# 3) Intégrer la/les médaille(s) tournoi dans la grille du HoF
OLD_HOF = (
    "    if (!hof.length) {\n"
    "      html += '<div style=\"text-align:center;color:rgba(255,255,255,.3);font-size:.75rem;font-style:italic;padding:.8rem 0\">Résultats disponibles après clôture du vote.</div>';\n"
    "    } else {\n"
    "      // Grille de médaillons cliquables — du plus récent au plus ancien\n"
    "      var orderedIds = SESSIONS.map(function(s){ return s.id; }).filter(function(id){ return titlesBySession[id]; });\n"
    "      html += '<div style=\"display:flex;flex-wrap:wrap;gap:.8rem;justify-content:center;padding:.4rem 0\">';\n"
)
NEW_HOF = (
    "    // Homme(s) du tournoi (4 équipes, hors SESSIONS) — affiché en tête du HoF\n"
    "    var tournHof = '';\n"
    "    if (typeof INSCRIPTION_SLOTS !== 'undefined') {\n"
    "      INSCRIPTION_SLOTS.forEach(function(sl){\n"
    "        if (sl.tournament && sl.tournament.motm && sl.tournament.motm.winner) tournHof += _tournamentHofMedal(sl);\n"
    "      });\n"
    "    }\n"
    "    if (!hof.length && !tournHof) {\n"
    "      html += '<div style=\"text-align:center;color:rgba(255,255,255,.3);font-size:.75rem;font-style:italic;padding:.8rem 0\">Résultats disponibles après clôture du vote.</div>';\n"
    "    } else {\n"
    "      // Grille de médaillons cliquables — du plus récent au plus ancien\n"
    "      var orderedIds = SESSIONS.map(function(s){ return s.id; }).filter(function(id){ return titlesBySession[id]; });\n"
    "      html += '<div style=\"display:flex;flex-wrap:wrap;gap:.8rem;justify-content:center;padding:.4rem 0\">';\n"
    "      html += tournHof;\n"
)
assert html.count(OLD_HOF) == 1, "HoF grid anchor: %d" % html.count(OLD_HOF)
html = html.replace(OLD_HOF, NEW_HOF)

io.open("index.html", "w", encoding="utf-8").write(html)
print("OK — Homme du tournoi ajouté au Hall of Fame")
