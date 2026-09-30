#!/usr/bin/env python3
"""Masque session-header (Blanche/Bleue) et presence-section dans la vue en formation."""

with open('index.html', 'r') as f:
    c = f.read()

fixes = 0

# ── 1. renderInFormation : masquer session-header et presence-section ──
OLD1 = """  var legendEl=document.getElementById('pitch-legend');
  var duosEl=document.getElementById('pitch-duos');
  if(legendEl) legendEl.style.display='none';
  if(duosEl) duosEl.style.display='none';"""
NEW1 = """  var legendEl=document.getElementById('pitch-legend');
  var duosEl=document.getElementById('pitch-duos');
  if(legendEl) legendEl.style.display='none';
  if(duosEl) duosEl.style.display='none';
  var headerEl=document.getElementById('session-header');
  if(headerEl) headerEl.style.display='none';
  var presenceEl=document.getElementById('presence-section');
  if(presenceEl) presenceEl.style.display='none';"""
if OLD1 in c:
    c = c.replace(OLD1, NEW1, 1)
    print("✅ Fix 1 : renderInFormation masque session-header et presence-section")
    fixes += 1
else:
    print("❌ Fix 1 : ancre non trouvée")

# ── 2. renderSession : restaurer session-header (presence déjà gérée par renderPresence) ──
OLD2 = """  var legendEl=document.getElementById('pitch-legend');
  var duosEl=document.getElementById('pitch-duos');
  if(legendEl) legendEl.style.display='';
  if(duosEl) duosEl.style.display='';"""
NEW2 = """  var legendEl=document.getElementById('pitch-legend');
  var duosEl=document.getElementById('pitch-duos');
  if(legendEl) legendEl.style.display='';
  if(duosEl) duosEl.style.display='';
  var headerEl=document.getElementById('session-header');
  if(headerEl) headerEl.style.display='';"""
if OLD2 in c:
    c = c.replace(OLD2, NEW2, 1)
    print("✅ Fix 2 : renderSession restaure session-header")
    fixes += 1
else:
    print("❌ Fix 2 : ancre non trouvée")

print(f"\n{fixes}/2 fixes appliqués")

with open('index.html', 'w') as f:
    f.write(c)
