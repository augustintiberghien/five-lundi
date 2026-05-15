#!/usr/bin/env python3
"""Masque correctement Blanche/Bleue et duos dans la vue en formation."""

with open('index.html', 'r') as f:
    c = f.read()

fixes = 0

# ── 1. Ajouter IDs sur legend et duos dans le HTML ──
OLD1 = '<div class="legend" style="margin-top:1.2rem">'
NEW1 = '<div id="pitch-legend" class="legend" style="margin-top:1.2rem">'
if OLD1 in c:
    c = c.replace(OLD1, NEW1, 1)
    print("✅ Fix 1a : id='pitch-legend' ajouté")
    fixes += 1
else:
    print("❌ Fix 1a : ancre non trouvée")

OLD2 = '<div style="display:flex;gap:.8rem;justify-content:center;align-items:center;margin-top:.6rem;flex-wrap:wrap">\n  <span style="font-size:.58rem;color:rgba(255,255,255,.3);letter-spacing:.1em;text-transform:uppercase">Duos</span>'
NEW2 = '<div id="pitch-duos" style="display:flex;gap:.8rem;justify-content:center;align-items:center;margin-top:.6rem;flex-wrap:wrap">\n  <span style="font-size:.58rem;color:rgba(255,255,255,.3);letter-spacing:.1em;text-transform:uppercase">Duos</span>'
if OLD2 in c:
    c = c.replace(OLD2, NEW2, 1)
    print("✅ Fix 1b : id='pitch-duos' ajouté")
    fixes += 1
else:
    print("❌ Fix 1b : ancre non trouvée")

# ── 2. renderInFormation : masquer pitch-legend et pitch-duos, supprimer leg-a/leg-b erronés ──
OLD3 = """  var legA=document.getElementById('leg-a');
  var legB=document.getElementById('leg-b');
  if(legA) legA.style.display='none';
  if(legB) legB.style.display='none';"""
NEW3 = """  var legendEl=document.getElementById('pitch-legend');
  var duosEl=document.getElementById('pitch-duos');
  if(legendEl) legendEl.style.display='none';
  if(duosEl) duosEl.style.display='none';"""
if OLD3 in c:
    c = c.replace(OLD3, NEW3, 1)
    print("✅ Fix 2 : renderInFormation masque pitch-legend et pitch-duos")
    fixes += 1
else:
    print("❌ Fix 2 : ancre non trouvée")

# ── 3. renderSession : restaurer pitch-legend et pitch-duos ──
OLD4 = """  var legA=document.getElementById('leg-a');
  var legB=document.getElementById('leg-b');
  if(legA) legA.style.display='';
  if(legB) legB.style.display='';"""
NEW4 = """  var legendEl=document.getElementById('pitch-legend');
  var duosEl=document.getElementById('pitch-duos');
  if(legendEl) legendEl.style.display='';
  if(duosEl) duosEl.style.display='';"""
if OLD4 in c:
    c = c.replace(OLD4, NEW4, 1)
    print("✅ Fix 3 : renderSession restaure pitch-legend et pitch-duos")
    fixes += 1
else:
    print("❌ Fix 3 : ancre non trouvée")

print(f"\n{fixes}/4 fixes appliqués")

with open('index.html', 'w') as f:
    f.write(c)
