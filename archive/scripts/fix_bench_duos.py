#!/usr/bin/env python3
"""2 fixes : bench visible pour sessions non jouées + duos légende inline-flex."""

with open('index.html', 'r') as f:
    c = f.read()

fixes = 0

# ── 1. renderBench : retirer le return hardcodé, ajouter condition session non jouée ──
OLD1 = """function renderBench(s) {
  var wrap = document.getElementById('bench-section');
  if (!wrap) return;
  wrap.style.display = 'none'; return;
  wrap.style.display = 'block';"""
NEW1 = """function renderBench(s) {
  var wrap = document.getElementById('bench-section');
  if (!wrap) return;
  if (!s.bench || !s.bench.length || s.scoreWinner) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';"""
if OLD1 in c:
    c = c.replace(OLD1, NEW1, 1)
    print("✅ Fix 1 : renderBench — condition session non jouée")
    fixes += 1
else:
    print("❌ Fix 1 : ancre renderBench non trouvée")

# ── 2. Duos légende : display:flex → inline-flex pour garantir une ligne ──
OLD2 = '<div id="pitch-duos" style="display:flex;gap:.6rem;justify-content:center;align-items:center;margin-top:.6rem;white-space:nowrap">\n  <span style="font-size:.55rem;color:rgba(255,255,255,.3);letter-spacing:.1em;text-transform:uppercase">Duos</span>\n  <span style="font-size:.6rem;color:#4ade80;display:flex;align-items:center;gap:.25rem"><svg width="14" height="4"><line x1="0" y1="2" x2="14" y2="2" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round"/></svg>≥67%</span>\n  <span style="font-size:.6rem;color:#FFD600;display:flex;align-items:center;gap:.25rem"><svg width="14" height="4"><line x1="0" y1="2" x2="14" y2="2" stroke="#FFD600" stroke-width="2.5" stroke-linecap="round"/></svg>50–66%</span>\n  <span style="font-size:.6rem;color:#ef4444;display:flex;align-items:center;gap:.25rem"><svg width="14" height="4"><line x1="0" y1="2" x2="14" y2="2" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/></svg>&lt;50%</span>\n</div>'
NEW2 = '<div id="pitch-duos" style="text-align:center;margin-top:.6rem;white-space:nowrap">\n  <span style="font-size:.55rem;color:rgba(255,255,255,.3);letter-spacing:.1em;text-transform:uppercase">Duos</span>\n  <span style="font-size:.6rem;color:#4ade80;display:inline-flex;align-items:center;gap:.25rem;margin-left:.6rem"><svg width="14" height="4"><line x1="0" y1="2" x2="14" y2="2" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round"/></svg>≥67%</span>\n  <span style="font-size:.6rem;color:#FFD600;display:inline-flex;align-items:center;gap:.25rem;margin-left:.6rem"><svg width="14" height="4"><line x1="0" y1="2" x2="14" y2="2" stroke="#FFD600" stroke-width="2.5" stroke-linecap="round"/></svg>50–66%</span>\n  <span style="font-size:.6rem;color:#ef4444;display:inline-flex;align-items:center;gap:.25rem;margin-left:.6rem"><svg width="14" height="4"><line x1="0" y1="2" x2="14" y2="2" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/></svg>&lt;50%</span>\n</div>'
if OLD2 in c:
    c = c.replace(OLD2, NEW2, 1)
    print("✅ Fix 2 : duos légende inline-flex (une seule ligne garantie)")
    fixes += 1
else:
    print("❌ Fix 2 : ancre duos non trouvée")

print(f"\n{fixes}/2 fixes appliqués")

with open('index.html', 'w') as f:
    f.write(c)
