#!/usr/bin/env python3
# getPlayerForm doit inclure les matchs de tournoi (absents de SESSIONS) pour que
# les badges "5 derniers" et getTrophy collent aux colonnes M/V de PLAYER_STATS.
import io
html = io.open("index.html", encoding="utf-8").read()

# 1) Nouvelle fonction getTournamentForm, insérée juste avant getPlayerForm
ANCHOR = "function getPlayerForm(name) {\n"
NEWFN = (
    "function getTournamentForm(name) {\n"
    "  // Résultats des matchs de tournoi (4 équipes) — non présents dans SESSIONS.\n"
    "  var out = [];\n"
    "  if (typeof INSCRIPTION_SLOTS === 'undefined') return out;\n"
    "  INSCRIPTION_SLOTS.forEach(function(sl) {\n"
    "    var t = sl.tournament;\n"
    "    if (!t || !t.teams || !t.results) return;\n"
    "    var color = null;\n"
    "    t.teams.forEach(function(tm){ if ((tm.names || []).indexOf(name) !== -1) color = tm.color; });\n"
    "    if (!color) return;\n"
    "    t.results.forEach(function(m) {\n"
    "      if (m.a === color) out.push(m.sa > m.sb ? 'W' : 'L');\n"
    "      else if (m.b === color) out.push(m.sb > m.sa ? 'W' : 'L');\n"
    "    });\n"
    "  });\n"
    "  return out;\n"
    "}\n\n"
)
assert html.count(ANCHOR) == 1, "anchor getPlayerForm: %d" % html.count(ANCHOR)
html = html.replace(ANCHOR, NEWFN + ANCHOR, 1)

# 2) Concaténer le tournoi (plus récent) en fin de getPlayerForm
OLD = "  return results.reverse(); // oldest→newest so slice(-N) = N most recentr\n"
NEW = ("  results.reverse(); // oldest→newest so slice(-N) = N most recent\n"
       "  return results.concat(getTournamentForm(name)); // tournoi(s) = matchs les plus récents\n")
assert html.count(OLD) == 1, "anchor reverse: %d" % html.count(OLD)
html = html.replace(OLD, NEW, 1)

io.open("index.html", "w", encoding="utf-8").write(html)
print("OK — getPlayerForm inclut désormais les matchs de tournoi")
