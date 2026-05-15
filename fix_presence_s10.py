#!/usr/bin/env python3
"""2 fixes : re-cacher renderBench (ancien panel) + renderPresence visible pour sessions upcoming."""

with open('index.html', 'r') as f:
    c = f.read()

fixes = 0

# ── 1. renderBench : recacher (l'ancien panel n'est pas souhaité) ──
OLD1 = """  if (!s.bench || !s.bench.length || s.scoreWinner) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';"""
NEW1 = """  wrap.style.display = 'none'; return;
  wrap.style.display = 'block';"""
if OLD1 in c:
    c = c.replace(OLD1, NEW1, 1)
    print("✅ Fix 1 : renderBench recaché")
    fixes += 1
else:
    print("❌ Fix 1 : ancre renderBench non trouvée")

# ── 2. renderPresence : retirer le guard qui cache les sessions upcoming (s10) ──
# On ne cache que les fromInscription avec <10 joueurs (géré ailleurs)
# Les sessions SESSIONS[] sans score (futures) doivent montrer la feuille de match
OLD2 = "  // Sessions futures non-actives : pas de présence\n  if(!s.current && !s.scoreWinner && !s.fromInscription){ wrap.style.display='none'; return; }\n  // Sessions d'inscription : pas de logique présence standard"
NEW2 = "  // Sessions d'inscription : pas de logique présence standard"
if OLD2 in c:
    c = c.replace(OLD2, NEW2, 1)
    print("✅ Fix 2 : guard renderPresence retiré (sessions upcoming visibles)")
    fixes += 1
else:
    print("❌ Fix 2 : ancre guard renderPresence non trouvée")

print(f"\n{fixes}/2 fixes appliqués")

with open('index.html', 'w') as f:
    f.write(c)
