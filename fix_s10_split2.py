#!/usr/bin/env python3
"""Second split s10 correct : 4 joueurs déplacés sans chevauchement.

Blanche : Rémi(GK,50,8), Johann(12,24), Hugo(88,24), Alex(35,38), Flo(65,38)
Bleue   : Michael(GK,50,92), Théo(12,76), Khalid(88,76), Spy(35,62), Gugu(65,62)

Rotations vs original :
  Flo  : (35,38 team-a) → (65,38 team-a)   prend la place de Gugu
  Gugu : (65,38 team-a) → (65,62 team-b)   descend en Bleue
  Alex : (35,62 team-b) → (35,38 team-a)   monte en Blanche
  Spy  : (65,62 team-b) → (35,62 team-b)   prend la place d'Alex
"""

with open('index.html', 'r') as f:
    c = f.read()

s10_start = c.find("id:'s10'")
s9_start  = c.find("id:'s9'")
assert s10_start > 0 and s9_start > s10_start

def swap_player(content, s10_s, s9_s, old_coords, new_coords, old_class=None, new_class=None):
    """Remplace x,y,teamA d'un joueur dans le bloc s10, et optionnellement la classe card."""
    old_str = '{x:%d,y:%d,name:"%s",teamA:%s,' % old_coords
    new_str = '{x:%d,y:%d,name:"%s",teamA:%s,' % new_coords
    pos = content.find(old_str, s10_s)
    if pos < 0 or pos > s9_s:
        return content, False
    content = content[:pos] + new_str + content[pos+len(old_str):]
    s9_s2 = content.find("id:'s9'")  # recalculate after replacement
    if old_class and new_class:
        cp = content.find(old_class, pos)
        if 0 < cp < s9_s2:
            content = content[:cp] + new_class + content[cp+len(old_class):]
    return content, True

# Flo : (35,38,true) → (65,38,true)  [reste Blanche, juste change de colonne]
c, ok = swap_player(c, s10_start, s9_start,
    (35, 38, 'Flo', 'true'),
    (65, 38, 'Flo', 'true'))
print("✅ Flo → (65,38) Blanche" if ok else "❌ Flo")

s10_start = c.find("id:'s10'"); s9_start = c.find("id:'s9'")

# Gugu : (65,38,true) → (65,62,false)  [Blanche → Bleue]
c, ok = swap_player(c, s10_start, s9_start,
    (65, 38, 'Gugu', 'true'),
    (65, 62, 'Gugu', 'false'),
    'class="card team-a"', 'class="card team-b"')
print("✅ Gugu → (65,62) Bleue" if ok else "❌ Gugu")

s10_start = c.find("id:'s10'"); s9_start = c.find("id:'s9'")

# Alex : (35,62,false) → (35,38,true)  [Bleue → Blanche]
c, ok = swap_player(c, s10_start, s9_start,
    (35, 62, 'Alex', 'false'),
    (35, 38, 'Alex', 'true'),
    'class="card team-b"', 'class="card team-a"')
print("✅ Alex → (35,38) Blanche" if ok else "❌ Alex")

s10_start = c.find("id:'s10'"); s9_start = c.find("id:'s9'")

# Spy : (65,62,false) → (35,62,false)  [reste Bleue, prend la place d'Alex]
c, ok = swap_player(c, s10_start, s9_start,
    (65, 62, 'Spy', 'false'),
    (35, 62, 'Spy', 'false'))
print("✅ Spy → (35,62) Bleue" if ok else "❌ Spy")

# Vérification finale
import re
s10_start = c.find("id:'s10'"); s9_start = c.find("id:'s9'")
players = re.findall(r'\{x:(\d+),y:(\d+),name:"(\w+)",teamA:(true|false)', c[s10_start:s9_start])
print("\nÉtat final s10 :")
for x,y,name,team in players:
    equipe = "Blanche" if team=="true" else "Bleue"
    print(f"  {name:10} ({x:>2},{y:>2}) {equipe}")

with open('index.html', 'w') as f:
    f.write(c)
