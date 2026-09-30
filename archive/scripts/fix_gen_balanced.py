#!/usr/bin/env python3
"""Nouvel algo _genBalancedTeams : notes ajustées en priorité, critères en secondaire."""

with open('index.html', 'r') as f:
    c = f.read()

OLD = """function _genBalancedTeams(names10) {
  // Pre-compute top-2 by adjusted note (must be separated)
  var sorted = names10.slice().sort(function(a,b){ return _adjustedNote(b)-_adjustedNote(a); });
  var top2 = [sorted[0], sorted[1]];

  var best = null, bestScore = Infinity;
  function combo(start, chosen) {
    if (chosen.length === 5) {
      var tB = names10.filter(function(n){ return chosen.indexOf(n) === -1; });
      var smA = 0, smB = 0, nA = 0, nB = 0;
      chosen.forEach(function(n){ smA += _playerSM(n); nA += _adjustedNote(n); });
      tB.forEach(function(n){ smB += _playerSM(n); nB += _adjustedNote(n); });
      var dSM = Math.abs(smA - smB), dN = Math.abs(nA - nB);

      // Functional penalties (tiebreaker after SM)
      var pen = 0;
      // Top 2 must be separated
      var top2TogetherA = top2.every(function(n){ return chosen.indexOf(n) !== -1; });
      var top2TogetherB = top2.every(function(n){ return tB.indexOf(n) !== -1; });
      if (top2TogetherA || top2TogetherB) pen += 100;
      // Each team should have a natural GK
      var gkA = chosen.some(function(n){ return (PLAYER_ROLES[n]||'')==='Gardien'; });
      var gkB = tB.some(function(n){ return (PLAYER_ROLES[n]||'')==='Gardien'; });
      if (!gkA) pen += 20;
      if (!gkB) pen += 20;
      // Avoid Michael + Ibrahima together
      var mIbrA = chosen.indexOf('Michael')!==-1 && chosen.indexOf('Ibrahima')!==-1;
      var mIbrB = tB.indexOf('Michael')!==-1 && tB.indexOf('Ibrahima')!==-1;
      if (mIbrA || mIbrB) pen += 10;

      // Duo tiebreaker: balance historical pair chemistry across teams
      var duoPen = Math.max(_duoPairScore(chosen), _duoPairScore(tB));
      var score = dSM * 1000 + pen * 10 + dN + duoPen * 0.01;
      if (score < bestScore) {
        bestScore = score;
        best = {teamA: chosen.slice(), teamB: tB, smA: smA, smB: smB, noteA: nA, noteB: nB};
      }
      return;
    }
    for (var i = start; i < names10.length; i++) {
      chosen.push(names10[i]);
      combo(i + 1, chosen);
      chosen.pop();
    }
  }
  combo(0, []);
  return best;
}"""

NEW = """function _genBalancedTeams(names10) {
  // Pre-compute top-2 by adjusted note (à séparer si possible)
  var sorted = names10.slice().sort(function(a,b){ return _adjustedNote(b)-_adjustedNote(a); });
  var top2 = [sorted[0], sorted[1]];

  // Collecter toutes les combinaisons C(10,5)
  var allCombos = [];
  function combo(start, chosen) {
    if (chosen.length === 5) {
      var tB = names10.filter(function(n){ return chosen.indexOf(n) === -1; });
      var smA = 0, smB = 0, nA = 0, nB = 0;
      chosen.forEach(function(n){ smA += _playerSM(n); nA += _adjustedNote(n); });
      tB.forEach(function(n){ smB += _playerSM(n); nB += _adjustedNote(n); });
      var dSM = Math.abs(smA - smB), dN = Math.abs(nA - nB);

      // Critères (pénalités légères — secondaires aux notes)
      var pen = 0;
      var top2TogetherA = top2.every(function(n){ return chosen.indexOf(n) !== -1; });
      var top2TogetherB = top2.every(function(n){ return tB.indexOf(n) !== -1; });
      if (top2TogetherA || top2TogetherB) pen += 10;
      var gkA = chosen.some(function(n){ return (PLAYER_ROLES[n]||'')==='Gardien'; });
      var gkB = tB.some(function(n){ return (PLAYER_ROLES[n]||'')==='Gardien'; });
      if (!gkA) pen += 2;
      if (!gkB) pen += 2;
      var mIbrA = chosen.indexOf('Michael')!==-1 && chosen.indexOf('Ibrahima')!==-1;
      var mIbrB = tB.indexOf('Michael')!==-1 && tB.indexOf('Ibrahima')!==-1;
      if (mIbrA || mIbrB) pen += 1;
      var duoPen = Math.max(_duoPairScore(chosen), _duoPairScore(tB));

      allCombos.push({teamA:chosen.slice(), teamB:tB, smA:smA, smB:smB, noteA:nA, noteB:nB, dSM:dSM, dN:dN, pen:pen, duoPen:duoPen});
      return;
    }
    for (var i = start; i < names10.length; i++) {
      chosen.push(names10[i]);
      combo(i + 1, chosen);
      chosen.pop();
    }
  }
  combo(0, []);

  // Pass 1 : trouver le ΔNote minimum (notes ajustées les plus proches)
  var minDN = Infinity;
  allCombos.forEach(function(c){ if(c.dN < minDN) minDN = c.dN; });

  // Pass 2 : parmi les splits dans la zone (tolérance = 0.5 = résolution du système),
  //          choisir celui où les critères sont les plus équilibrés (ΔSM + pénalités)
  var NOTE_TOL = 0.5;
  var pool = allCombos.filter(function(c){ return c.dN <= minDN + NOTE_TOL; });
  pool.sort(function(a, b){
    var sA = a.dSM * 10 + a.pen + a.duoPen * 0.01;
    var sB = b.dSM * 10 + b.pen + b.duoPen * 0.01;
    return sA - sB;
  });

  var best = pool[0];
  return {teamA: best.teamA, teamB: best.teamB, smA: best.smA, smB: best.smB, noteA: best.noteA, noteB: best.noteB};
}"""

if OLD in c:
    c = c.replace(OLD, NEW, 1)
    print("✅ _genBalancedTeams mis à jour (notes ajustées en priorité)")
else:
    print("❌ Ancre non trouvée")

with open('index.html', 'w') as f:
    f.write(c)
