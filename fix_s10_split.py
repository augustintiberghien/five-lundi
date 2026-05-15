#!/usr/bin/env python3
"""Corrige s10 : nouveau split + Edouard sans accent."""
import re

with open('index.html', 'r') as f:
    c = f.read()

fixes = 0

# ── 1. Corriger 'Édouard' → 'Edouard' dans le banc de s10 ──
OLD1 = "bench:['Édouard','Ibrahima','Henri']"
NEW1 = "bench:['Edouard','Ibrahima','Henri']"
if OLD1 in c:
    c = c.replace(OLD1, NEW1, 1)
    print("✅ Fix 1 : Édouard → Edouard dans le banc")
    fixes += 1
else:
    print("❌ Fix 1 : non trouvé")

# ── 2. Nouveau split : changer les teamA pour les joueurs de s10 ──
# Ancien : Blanche = Rémi, Gugu, Flo, Johann, Hugo | Bleue = Michael, Spy, Théo, Khalid, Alex
# Nouveau : Blanche = Rémi(GK), Johann, Hugo, Alex, Flo | Bleue = Michael(GK), Gugu, Spy, Théo, Khalid
# Positions à changer :
#   Gugu : teamA:true (50,8→ non, 65,38) → teamA:false, position (65,62) dans Bleue
#   Alex : teamA:false (35,62) → teamA:true, position (35,38) dans Blanche
# Et il faut échanger leurs positions y aussi : Gugu descend côté Bleue, Alex monte côté Blanche

# Dans s10, trouver le bloc players et modifier directement
s10_start = c.find("{id:'s10'")
s9_start  = c.find("{id:'s9'")
s10_block = c[s10_start:s9_start]

# Gugu était en (65,38,teamA:true) → doit être (65,62,teamA:false)
old_gugu = '{x:65,y:38,name:"Gugu",teamA:true,'
new_gugu = '{x:65,y:62,name:"Gugu",teamA:false,'
# Alex était en (35,62,teamA:false) → doit être (35,38,teamA:true)
old_alex = '{x:35,y:62,name:"Alex",teamA:false,'
new_alex = '{x:35,y:38,name:"Alex",teamA:true,'

if old_gugu in s10_block and old_alex in s10_block:
    # Aussi changer le class card dans leur html
    # Gugu : team-a → team-b
    # Alex : team-b → team-a
    # On doit faire les remplacements uniquement dans le bloc s10

    # Pour Gugu : trouver sa position dans le fichier global
    gugu_pos = c.find(old_gugu, s10_start)
    if gugu_pos > 0 and gugu_pos < s9_start:
        c = c[:gugu_pos] + new_gugu + c[gugu_pos+len(old_gugu):]
        # Changer class="card team-a" → team-b dans le html de Gugu (dans s10)
        # Trouver le html de Gugu juste après
        card_pos = c.find('class="card team-a"', gugu_pos)
        if card_pos > 0 and card_pos < s9_start:
            c = c[:card_pos] + 'class="card team-b"' + c[card_pos+len('class="card team-a"'):]
        print("  ✅ Gugu → Bleue (65,62)")

    # Pour Alex : recalculer position après modification de Gugu
    alex_pos = c.find(old_alex, s10_start)
    if alex_pos > 0 and alex_pos < c.find("{id:'s9'"):
        c = c[:alex_pos] + new_alex + c[alex_pos+len(old_alex):]
        # Changer class="card team-b" → team-a dans le html de Alex (dans s10)
        card_pos = c.find('class="card team-b"', alex_pos)
        if card_pos > 0 and card_pos < c.find("{id:'s9'"):
            c = c[:card_pos] + 'class="card team-a"' + c[card_pos+len('class="card team-b"'):]
        print("  ✅ Alex → Blanche (35,38)")

    print("✅ Fix 2 : split s10 mis à jour (Gugu/Rémi séparés)")
    fixes += 1
else:
    print(f"❌ Fix 2 : Gugu={old_gugu in s10_block}, Alex={old_alex in s10_block}")

print(f"\n{fixes}/2 fixes appliqués")

with open('index.html', 'w') as f:
    f.write(c)
