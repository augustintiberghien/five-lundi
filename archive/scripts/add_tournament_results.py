#!/usr/bin/env python3
# Ajoute les resultats + le classement du tournoi du 22 juin a la vue tournoi.
# Departage : difference de buts generale. Pas de modif PLAYER_STATS (cas tournoi).
import io

PATH = "index.html"
with io.open(PATH, "r", encoding="utf-8") as f:
    html = f.read()

# ── 1. Resultats des 6 matchs dans slot.tournament ──
OLD_SLOT = ("teams:[{color:'noir',names:['Cyriaque','Matteo','Gugu','Samy','Quentin']},"
            "{color:'bleu',names:['Michael','Rémi','Alex','Flo','Dylan']},"
            "{color:'rouge',names:['Ibrahima','Théo','Edouard','Henri','Khalid']},"
            "{color:'blanc',names:['Landry','Spy','Hugo','Cyril','Tim']}]}")
NEW_SLOT = (OLD_SLOT[:-1] + ","
            "results:["
            "{a:'bleu',b:'noir',sa:1,sb:2},"
            "{a:'rouge',b:'blanc',sa:5,sb:4},"
            "{a:'bleu',b:'rouge',sa:4,sb:3},"
            "{a:'noir',b:'blanc',sa:6,sb:4},"
            "{a:'rouge',b:'noir',sa:3,sb:1},"
            "{a:'bleu',b:'blanc',sa:5,sb:1}"
            "]}")
assert html.count(OLD_SLOT) == 1, "slot teams introuvable: %d" % html.count(OLD_SLOT)
html = html.replace(OLD_SLOT, NEW_SLOT)

# ── 2. _setTournamentTeams : exposer les resultats sur la session ──
OLD_FN = "    s.tournamentTeams = _fixed;\n    return;\n"
NEW_FN = "    s.tournamentTeams = _fixed;\n    s.tournamentResults = slot.tournament.results || null;\n    return;\n"
assert html.count(OLD_FN) == 1, "set _fixed introuvable: %d" % html.count(OLD_FN)
html = html.replace(OLD_FN, NEW_FN)

# ── 3. renderTournament : calcul du classement ──
OLD_TP = ("  var totalPlayers = 0;\n"
          "  teams.forEach(function(t){ totalPlayers += t.names.length; });\n")
NEW_TP = OLD_TP + (
    "\n  // Classement (round-robin, 3pts/victoire, departage = diff de buts generale)\n"
    "  var _tResults = s.tournamentResults || [];\n"
    "  var _tRank = null;\n"
    "  if (_tResults.length) {\n"
    "    var _tStand = {};\n"
    "    teams.forEach(function(t){ _tStand[t.color] = {color:t.color, pts:0, gf:0, ga:0, w:0, l:0}; });\n"
    "    _tResults.forEach(function(m){\n"
    "      if(!_tStand[m.a]||!_tStand[m.b]) return;\n"
    "      _tStand[m.a].gf+=m.sa; _tStand[m.a].ga+=m.sb;\n"
    "      _tStand[m.b].gf+=m.sb; _tStand[m.b].ga+=m.sa;\n"
    "      if(m.sa>m.sb){ _tStand[m.a].pts+=3; _tStand[m.a].w++; _tStand[m.b].l++; }\n"
    "      else if(m.sb>m.sa){ _tStand[m.b].pts+=3; _tStand[m.b].w++; _tStand[m.a].l++; }\n"
    "    });\n"
    "    _tRank = Object.keys(_tStand).map(function(k){return _tStand[k];}).sort(function(x,y){\n"
    "      if(y.pts!==x.pts) return y.pts-x.pts;\n"
    "      var gx=x.gf-x.ga, gy=y.gf-y.ga;\n"
    "      if(gy!==gx) return gy-gx;\n"
    "      return y.gf-x.gf;\n"
    "    });\n"
    "  }\n"
)
assert html.count(OLD_TP) == 1, "totalPlayers introuvable: %d" % html.count(OLD_TP)
html = html.replace(OLD_TP, NEW_TP)

# ── 4. Banniere vainqueur sous le sous-titre ──
OLD_SUB = ("  html += '<div style=\"font-family:Barlow,sans-serif;font-size:.62rem;color:rgba(255,255,255,.4);"
           "text-align:center;padding-bottom:.8rem\">4 équipes · round-robin · 3pts/victoire</div>';\n")
NEW_SUB = OLD_SUB + (
    "  if (_tRank) {\n"
    "    var _champ = tColors[_tRank[0].color] || tColors['bleu'];\n"
    "    html += '<div style=\"text-align:center;padding:0 0 .9rem\"><span style=\"display:inline-flex;align-items:center;gap:.4rem;"
    "background:linear-gradient(135deg,'+_champ.border+','+_champ.acc+');padding:.42rem .95rem;border-radius:999px;"
    "font-family:Oswald,sans-serif;font-weight:700;letter-spacing:.05em;color:#fff;font-size:.78rem;"
    "box-shadow:0 2px 12px rgba(0,0,0,.35)\">👑 '+_champ.emoji+' '+_champ.label+' remporte le tournoi</span></div>';\n"
    "  }\n"
)
assert html.count(OLD_SUB) == 1, "sous-titre introuvable: %d" % html.count(OLD_SUB)
html = html.replace(OLD_SUB, NEW_SUB)

# ── 5. Bloc Programme -> Classement + Resultats si scores connus ──
OLD_PROG = (
    "  html += '<div style=\"font-family:Oswald,sans-serif;font-size:.57rem;font-weight:700;color:rgba(100,160,255,.7);"
    "text-transform:uppercase;letter-spacing:.1em;padding:.5rem .1rem .3rem\">📅 Programme</div>';\n"
    "  html += '<div style=\"display:grid;grid-template-columns:1fr 1fr 1fr;gap:.3rem;padding-bottom:.6rem\">';\n"
    "  matchups.forEach(function(m) {\n"
    "    var a = tColors[m[0].color] || tColors['bleu'];\n"
    "    var b = tColors[m[1].color] || tColors['bleu'];\n"
    "    html += '<div style=\"background:rgba(255,255,255,.04);border-radius:.4rem;padding:.28rem .4rem;display:flex;"
    "align-items:center;justify-content:center;gap:.25rem;font-size:.78rem\">'+a.emoji+'<span style=\"font-family:Barlow,sans-serif;"
    "font-size:.55rem;color:rgba(255,255,255,.4)\">vs</span>'+b.emoji+'</div>';\n"
    "  });\n"
    "  html += '</div>';\n"
)
GRID = "grid-template-columns:1.5rem 1fr 1.2rem 1.2rem 1.7rem 1.6rem"
NEW_PROG = (
    "  if (_tRank) {\n"
    "    html += '<div style=\"font-family:Oswald,sans-serif;font-size:.57rem;font-weight:700;color:rgba(100,160,255,.7);"
    "text-transform:uppercase;letter-spacing:.1em;padding:.5rem .1rem .3rem\">🏆 Classement</div>';\n"
    "    html += '<div style=\"background:rgba(255,255,255,.04);border-radius:.5rem;overflow:hidden;margin-bottom:.7rem\">';\n"
    "    html += '<div style=\"display:grid;" + GRID + ";gap:.2rem;padding:.35rem .55rem;font-family:Oswald,sans-serif;"
    "font-size:.5rem;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.04em\"><span></span><span>Équipe</span>"
    "<span style=\"text-align:center\">G</span><span style=\"text-align:center\">P</span><span style=\"text-align:center\">Diff</span>"
    "<span style=\"text-align:center\">Pts</span></div>';\n"
    "    _tRank.forEach(function(r, i){\n"
    "      var rc = tColors[r.color] || tColors['bleu'];\n"
    "      var gd = r.gf - r.ga; var gdStr = (gd>0?'+':'')+gd;\n"
    "      html += '<div style=\"display:grid;" + GRID + ";gap:.2rem;padding:.42rem .55rem;align-items:center;"
    "border-top:1px solid rgba(255,255,255,.05)'+(i===0?';background:rgba(255,214,0,.07)':'')+'\">';\n"
    "      html += '<span style=\"font-family:Oswald,sans-serif;font-weight:700;font-size:.72rem;color:'+(i===0?'#ffd600':'rgba(255,255,255,.55)')+'\">'+(i===0?'👑':(i+1))+'</span>';\n"
    "      html += '<span style=\"font-family:Barlow,sans-serif;font-size:.72rem;font-weight:600;color:#fff;display:flex;align-items:center;gap:.3rem\">'+rc.emoji+' '+rc.label+'</span>';\n"
    "      html += '<span style=\"text-align:center;font-family:Barlow,sans-serif;font-size:.7rem;color:rgba(255,255,255,.7)\">'+r.w+'</span>';\n"
    "      html += '<span style=\"text-align:center;font-family:Barlow,sans-serif;font-size:.7rem;color:rgba(255,255,255,.7)\">'+r.l+'</span>';\n"
    "      html += '<span style=\"text-align:center;font-family:Barlow,sans-serif;font-size:.7rem;color:rgba(255,255,255,.7)\">'+gdStr+'</span>';\n"
    "      html += '<span style=\"text-align:center;font-family:Oswald,sans-serif;font-weight:700;font-size:.78rem;color:#fff\">'+r.pts+'</span>';\n"
    "      html += '</div>';\n"
    "    });\n"
    "    html += '</div>';\n"
    "    html += '<div style=\"font-family:Oswald,sans-serif;font-size:.57rem;font-weight:700;color:rgba(100,160,255,.7);"
    "text-transform:uppercase;letter-spacing:.1em;padding:.2rem .1rem .3rem\">📋 Résultats</div>';\n"
    "    html += '<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:.3rem;padding-bottom:.6rem\">';\n"
    "    _tResults.forEach(function(m){\n"
    "      var a = tColors[m.a] || tColors['bleu'];\n"
    "      var b = tColors[m.b] || tColors['bleu'];\n"
    "      var aWin = m.sa>m.sb, bWin = m.sb>m.sa;\n"
    "      html += '<div style=\"background:rgba(255,255,255,.04);border-radius:.4rem;padding:.32rem .45rem;display:flex;"
    "align-items:center;justify-content:center;gap:.3rem\">';\n"
    "      html += '<span style=\"font-size:.78rem\">'+a.emoji+'</span>';\n"
    "      html += '<span style=\"font-family:Oswald,sans-serif;font-weight:700;font-size:.82rem;color:'+(aWin?'#4ade80':'rgba(255,255,255,.85)')+'\">'+m.sa+'</span>';\n"
    "      html += '<span style=\"font-family:Barlow,sans-serif;font-size:.55rem;color:rgba(255,255,255,.3)\">-</span>';\n"
    "      html += '<span style=\"font-family:Oswald,sans-serif;font-weight:700;font-size:.82rem;color:'+(bWin?'#4ade80':'rgba(255,255,255,.85)')+'\">'+m.sb+'</span>';\n"
    "      html += '<span style=\"font-size:.78rem\">'+b.emoji+'</span>';\n"
    "      html += '</div>';\n"
    "    });\n"
    "    html += '</div>';\n"
    "  } else {\n"
    + OLD_PROG +
    "  }\n"
)
assert html.count(OLD_PROG) == 1, "bloc Programme introuvable: %d" % html.count(OLD_PROG)
html = html.replace(OLD_PROG, NEW_PROG)

with io.open(PATH, "w", encoding="utf-8") as f:
    f.write(html)
print("OK — resultats + classement tournoi ajoutes")
