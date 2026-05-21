#!/usr/bin/env python3
"""
Modifie la logique de présence :
- Quand un titulaire se met absent → sa carte garde le overlay ❌ (déjà en place)
- Quand un remplaçant confirme (status='playing') → on remplace la carte du titulaire absent
  et on recalcule l'équilibre, SANS attendre que les autres titulaires aient confirmé
"""

import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# ── Patch : chemin principal dans renderPresence ──────────────────────────────
# Avant : déclenche applyAutoTeams seulement quand les 10 ont confirmé 'playing'
# Après : déclenche aussi dès qu'un remplaçant a confirmé et qu'on a 10 joueurs effectifs
#         (les titulaires sans réponse sont considérés présents par défaut)

OLD = """    // Auto-balance teams when 10 players confirmed playing
    var actual10 = starterNames.filter(function(n){ return byName[n] !== 'absent'; }).concat(calledUp);
    var playing10 = actual10.filter(function(n){ return byName[n] === 'playing'; });
    if (playing10.length === 10 && !s.scoreWinner && !locked) applyAutoTeams(s, playing10);
    updateBenchHighlight(calledUp);"""

NEW = """    // Auto-balance : soit les 10 ont confirmé, soit un remplaçant a confirmé et on a 10 joueurs effectifs
    var actual10 = starterNames.filter(function(n){ return byName[n] !== 'absent'; }).concat(calledUp);
    var playing10 = actual10.filter(function(n){ return byName[n] === 'playing'; });
    var calledPlaying = calledUp.filter(function(n){ return byName[n] === 'playing'; });
    if (!s.scoreWinner && !locked) {
      if (playing10.length === 10) {
        applyAutoTeams(s, playing10);
      } else if (calledPlaying.length > 0 && actual10.length === 10) {
        // Un remplaçant a confirmé sa venue : recalculer avec les 10 joueurs effectifs
        // (titulaires sans réponse sont traités comme présents)
        applyAutoTeams(s, actual10);
      }
    }
    updateBenchHighlight(calledUp);"""

if OLD not in content:
    print('ERREUR : texte cible non trouvé')
    sys.exit(1)

content = content.replace(OLD, NEW, 1)
print('✓ Patch appliqué')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('✓ index.html mis à jour')
