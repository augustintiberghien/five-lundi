#!/usr/bin/env python3
# Injecte le vote "Homme du tournoi" dans index.html.
import io

with io.open("tmotm_snippet.js", "r", encoding="utf-8") as f:
    snippet = f.read()

with io.open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# 1) Activer le vote dans le slot (config motm + date de clôture)
OLD_SLOT = "{a:'bleu',b:'blanc',sa:5,sb:1}]}"
NEW_SLOT = "{a:'bleu',b:'blanc',sa:5,sb:1}],motm:{close:'2026-06-24'}}"
assert html.count(OLD_SLOT) == 1, "slot motm anchor: %d" % html.count(OLD_SLOT)
html = html.replace(OLD_SLOT, NEW_SLOT)

# 2) Brancher le rendu du vote dans renderTournament
OLD_RT = "  tSection.innerHTML = html;\n  tSection.style.display = 'block';\n"
NEW_RT = ("  html += '<div id=\"tmotm-section\" style=\"padding-top:.3rem\"></div>';\n"
          "  tSection.innerHTML = html;\n  tSection.style.display = 'block';\n"
          "  renderTournamentMvp(s);\n")
assert html.count(OLD_RT) == 1, "renderTournament anchor: %d" % html.count(OLD_RT)
html = html.replace(OLD_RT, NEW_RT)

# 3) Insérer les fonctions du vote (après submitMvpVote)
ANCHOR = "      alert('Erreur lors du vote. Vérifie ta connexion.');\n    }\n  }\n}\n"
assert html.count(ANCHOR) == 1, "submitMvpVote tail anchor: %d" % html.count(ANCHOR)
html = html.replace(ANCHOR, ANCHOR + "\n" + snippet + "\n", 1)

with io.open("index.html", "w", encoding="utf-8") as f:
    f.write(html)
print("OK — vote Homme du tournoi injecté")
