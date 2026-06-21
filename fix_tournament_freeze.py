#!/usr/bin/env python3
# Fige la compo du tournoi du 22 juin pour tous les visiteurs.
# Cause racine : la compo tournoi (4 equipes) est generee localement (_genTournamentTeams)
# et cachee par navigateur, sans source partagee. Le tie-break a egalite de notes depend
# de l'ordre des inscriptions -> compos divergentes selon le moment du refresh.
# Fix : compo figee a la main dans slot.tournament.teams, source de verite unique.

import io

PATH = "index.html"
with io.open(PATH, "r", encoding="utf-8") as f:
    html = f.read()

# ── 1. Ajouter la compo figee au slot ins_jun_22 ──
OLD_SLOT = "tournament:{fixedTeam:['Cyriaque','Matteo','Gugu','Samy','Quentin'],pairs:[['Cyril','Spy']]}"
NEW_SLOT = ("tournament:{fixedTeam:['Cyriaque','Matteo','Gugu','Samy','Quentin'],pairs:[['Cyril','Spy']],"
            "teams:["
            "{color:'noir',names:['Cyriaque','Matteo','Gugu','Samy','Quentin']},"
            "{color:'bleu',names:['Michael','Rémi','Alex','Flo','Dylan']},"
            "{color:'rouge',names:['Ibrahima','Théo','Edouard','Henri','Khalid']},"
            "{color:'blanc',names:['Landry','Spy','Hugo','Cyril','Tim']}"
            "]}")
assert html.count(OLD_SLOT) == 1, "slot ins_jun_22 introuvable ou ambigu: %d" % html.count(OLD_SLOT)
html = html.replace(OLD_SLOT, NEW_SLOT)

# ── 2. _setTournamentTeams : preferer la compo figee ──
OLD_FN = (
    "function _setTournamentTeams(s, regs, slot) {\n"
    "  if (!slot || !slot.tournament) return;\n"
    "  var allNames = regs.map(function(r){ return r.player_name; });\n"
    "  var tKey = 'ins_tournament_v3_' + s.id + '_' + allNames.slice().sort().join(',');\n"
)
NEW_FN = (
    "function _setTournamentTeams(s, regs, slot) {\n"
    "  if (!slot || !slot.tournament) return;\n"
    "  var allNames = regs.map(function(r){ return r.player_name; });\n"
    "  // Compo figee a la main (source de verite unique pour tous les visiteurs).\n"
    "  // On ignore le cache local et la generation pour eviter les compos divergentes.\n"
    "  if (slot.tournament.teams) {\n"
    "    var _fixed = slot.tournament.teams.map(function(t){ return { color:t.color, names:t.names.slice() }; });\n"
    "    if (allNames.length) {\n"
    "      var _present = {}; allNames.forEach(function(n){ _present[n] = true; });\n"
    "      _fixed = _fixed.map(function(t){ return { color:t.color, names:t.names.filter(function(n){ return _present[n]; }) }; });\n"
    "    }\n"
    "    s.tournamentTeams = _fixed;\n"
    "    return;\n"
    "  }\n"
    "  var tKey = 'ins_tournament_v3_' + s.id + '_' + allNames.slice().sort().join(',');\n"
)
assert html.count(OLD_FN) == 1, "_setTournamentTeams introuvable ou ambigu: %d" % html.count(OLD_FN)
html = html.replace(OLD_FN, NEW_FN)

with io.open(PATH, "w", encoding="utf-8") as f:
    f.write(html)
print("OK — compo tournoi figee + override applique")
