#!/usr/bin/env python3
"""s10 nouveau split : Rémi(GK Blanche), Johann, Théo, Spy, Gugu | Michael(GK Bleue), Hugo, Khalid, Flo, Alex"""

with open('index.html', 'r') as f:
    c = f.read()

s10_start = c.find("id:'s10'")
s9_start  = c.find("id:'s9'")
assert s10_start > 0 and s9_start > s10_start

def move(content, s10_s, s9_s, name, old_x, old_y, old_team, new_x, new_y, new_team):
    old_str = '{x:%d,y:%d,name:"%s",teamA:%s,' % (old_x, old_y, name, old_team)
    new_str = '{x:%d,y:%d,name:"%s",teamA:%s,' % (new_x, new_y, name, new_team)
    pos = content.find(old_str, s10_s)
    if pos < 0 or pos > s9_s:
        print(f"  ❌ {name} non trouvé à ({old_x},{old_y},{old_team})")
        return content
    content = content[:pos] + new_str + content[pos+len(old_str):]
    s9_s2 = content.find("id:'s9'")
    if old_team != new_team:
        old_cls = 'class="card team-a"' if old_team == 'true' else 'class="card team-b"'
        new_cls = 'class="card team-a"' if new_team == 'true' else 'class="card team-b"'
        cp = content.find(old_cls, pos)
        if 0 < cp < s9_s2:
            content = content[:cp] + new_cls + content[cp+len(old_cls):]
    print(f"  ✅ {name} ({old_x},{old_y},{old_team}) → ({new_x},{new_y},{new_team})")
    return content

# Blanche actuelle : Rémi(50,8), Johann(12,24), Hugo(88,24), Alex(35,38), Flo(65,38)
# Bleue actuelle   : Michael(50,92), Théo(12,76), Khalid(88,76), Spy(35,62), Gugu(65,62)
#
# Cible Blanche : Rémi(GK,50,8), Johann(12,24), Théo(88,24), Spy(35,38), Gugu(65,38)
# Cible Bleue   : Michael(GK,50,92), Hugo(12,76), Khalid(88,76), Flo(65,62), Alex(35,62)

moves = [
    # name,    ox,  oy,  ot,       nx,  ny,  nt
    ('Hugo',   88,  24, 'true',   12,  76, 'false'),  # DR Blanche → DL Bleue
    ('Alex',   35,  38, 'true',   35,  62, 'false'),  # ML Blanche → ML Bleue
    ('Flo',    65,  38, 'true',   65,  62, 'false'),  # MR Blanche → MR Bleue
    ('Théo',   12,  76, 'false',  88,  24, 'true'),   # DL Bleue → DR Blanche
    ('Spy',    35,  62, 'false',  35,  38, 'true'),   # ML Bleue → ML Blanche
    ('Gugu',   65,  62, 'false',  65,  38, 'true'),   # MR Bleue → MR Blanche
]

for name, ox, oy, ot, nx, ny, nt in moves:
    s10_start = c.find("id:'s10'"); s9_start = c.find("id:'s9'")
    c = move(c, s10_start, s9_start, name, ox, oy, ot, nx, ny, nt)

# Vérification finale
import re
s10_start = c.find("id:'s10'"); s9_start = c.find("id:'s9'")
players = re.findall(r'\{x:(\d+),y:(\d+),name:"(\w+)",teamA:(true|false)', c[s10_start:s9_start])
print("\nÉtat final s10 :")
for x,y,name,team in players:
    equipe = "Blanche" if team=="true" else "Bleue"
    print(f"  {name:<10} ({x:>2},{y:>2}) {equipe}")

with open('index.html', 'w') as f:
    f.write(c)
