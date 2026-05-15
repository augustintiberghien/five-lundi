#!/usr/bin/env python3
"""Ferme inscriptions 22 juin + redesign pills équipes (texte + trait coloré)."""

with open('index.html', 'r') as f:
    c = f.read()

fixes = 0

# ── 1. Fermer inscriptions du 22 juin ──
OLD1 = "{ id:'ins_jun_22', label:'Lundi 22 juin 2026 (21h30)',  open:true,"
NEW1 = "{ id:'ins_jun_22', label:'Lundi 22 juin 2026 (21h30)',  open:false,"
if OLD1 in c:
    c = c.replace(OLD1, NEW1, 1)
    print("✅ Fix 1 : inscriptions 22 juin fermées")
    fixes += 1
else:
    print("❌ Fix 1 : ancre non trouvée")

# ── 2. Redesign CSS des team-pill : texte + trait coloré en bas, no box ──
OLD2 = ".team-pill{font-family:'Oswald',sans-serif;font-size:.95rem;font-weight:600;padding:.25rem .9rem;border-radius:4px}\n.pill-a{background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.25)}\n.pill-b{background:rgba(77,159,255,.15);color:#4d9fff;border:1px solid rgba(77,159,255,.4)}"
NEW2 = ".team-pill{font-family:'Oswald',sans-serif;font-size:1rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:.15rem .1rem;border-bottom:2px solid;background:none}\n.pill-a{color:rgba(255,255,255,.85);border-color:rgba(255,255,255,.45)}\n.pill-b{color:#4d9fff;border-color:#4d9fff}"
if OLD2 in c:
    c = c.replace(OLD2, NEW2, 1)
    print("✅ Fix 2 : CSS team-pill redesigné")
    fixes += 1
else:
    print("❌ Fix 2 : ancre CSS non trouvée")

# ── 3. Supprimer les emojis ⚪🔵 dans l'affichage des pills (elA/elB.textContent) ──
OLD3 = "  elA.textContent=s.nameA;\n  elB.textContent=s.nameB;"
NEW3 = "  elA.textContent=s.nameA.replace(/[⚪🔵]/g,'').trim();\n  elB.textContent=s.nameB.replace(/[⚪🔵]/g,'').trim();"
if OLD3 in c:
    c = c.replace(OLD3, NEW3, 1)
    print("✅ Fix 3 : emojis ⚪🔵 retirés des pills")
    fixes += 1
else:
    print("❌ Fix 3 : ancre textContent non trouvée")

print(f"\n{fixes}/3 fixes appliqués")

with open('index.html', 'w') as f:
    f.write(c)
