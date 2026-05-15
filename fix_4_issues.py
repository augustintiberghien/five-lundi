#!/usr/bin/env python3
"""4 fixes : ordre s10, présence non-current, duos une ligne, font pills."""
import re

with open('index.html', 'r') as f:
    c = f.read()

fixes = 0

# ── 1. Déplacer s10 en première position dans SESSIONS ──
# Trouver les positions précises de s9 et s10 dans le fichier
sessions_start = c.find('var SESSIONS = [')

# Trouver le bloc s10 : de "{id:'s10'" jusqu'au prochain "},\n  {" ou "}]" de niveau session
s10_start = c.find("{id:'s10'", sessions_start)
s9_start  = c.find("{id:'s9'",  sessions_start)
s8_start  = c.find("{id:'s8'",  sessions_start)

# s10 est entre s8 et s7 actuellement → il finit juste avant s7
s7_start = c.find("{id:'s7'", sessions_start)

if s10_start > 0 and s9_start > 0 and s10_start > s9_start:
    # Extraire le bloc s10 (entre s10_start et s7_start, strip trailing comma+newline)
    s10_block_raw = c[s10_start:s7_start]
    # Retirer virgule et espaces en fin
    s10_block = s10_block_raw.rstrip().rstrip(',').rstrip()
    # Supprimer s10 de sa position actuelle
    c = c[:s10_start] + c[s7_start:]
    # Réinsérer en premier (juste avant s9)
    s9_start2 = c.find("{id:'s9'", sessions_start)
    c = c[:s9_start2] + s10_block + ',\n  ' + c[s9_start2:]
    print("✅ Fix 1 : s10 déplacé en première position")
    fixes += 1
else:
    print(f"❌ Fix 1 : positions s10={s10_start}, s9={s9_start}")

# ── 2. Présence : cacher pour sessions non-current sans score ──
OLD2 = "function renderPresence(s) {\n  var wrap = document.getElementById('presence-section');\n  if (!wrap) return;\n  // Sessions d'inscription : pas de logique présence standard\n  if(s.fromInscription){"
NEW2 = "function renderPresence(s) {\n  var wrap = document.getElementById('presence-section');\n  if (!wrap) return;\n  // Sessions futures non-actives : pas de présence\n  if(!s.current && !s.scoreWinner && !s.fromInscription){ wrap.style.display='none'; return; }\n  // Sessions d'inscription : pas de logique présence standard\n  if(s.fromInscription){"
if OLD2 in c:
    c = c.replace(OLD2, NEW2, 1)
    print("✅ Fix 2 : présence cachée pour sessions non-current")
    fixes += 1
else:
    print("❌ Fix 2 : ancre renderPresence non trouvée")

# ── 3. Duos légende : une seule ligne ──
OLD3 = '<div id="pitch-duos" style="display:flex;gap:.8rem;justify-content:center;align-items:center;margin-top:.6rem;flex-wrap:wrap">\n  <span style="font-size:.58rem;color:rgba(255,255,255,.3);letter-spacing:.1em;text-transform:uppercase">Duos</span>\n  <span style="font-size:.62rem;color:#4ade80;display:flex;align-items:center;gap:.3rem"><svg width="18" height="4"><line x1="0" y1="2" x2="18" y2="2" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round"/></svg>≥67% victoires</span>\n  <span style="font-size:.62rem;color:#FFD600;display:flex;align-items:center;gap:.3rem"><svg width="18" height="4"><line x1="0" y1="2" x2="18" y2="2" stroke="#FFD600" stroke-width="2.5" stroke-linecap="round"/></svg>50–66%</span>\n  <span style="font-size:.62rem;color:#ef4444;display:flex;align-items:center;gap:.3rem"><svg width="18" height="4"><line x1="0" y1="2" x2="18" y2="2" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/></svg>&lt;50%</span>\n</div>'
NEW3 = '<div id="pitch-duos" style="display:flex;gap:.6rem;justify-content:center;align-items:center;margin-top:.6rem;white-space:nowrap">\n  <span style="font-size:.55rem;color:rgba(255,255,255,.3);letter-spacing:.1em;text-transform:uppercase">Duos</span>\n  <span style="font-size:.6rem;color:#4ade80;display:flex;align-items:center;gap:.25rem"><svg width="14" height="4"><line x1="0" y1="2" x2="14" y2="2" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round"/></svg>≥67%</span>\n  <span style="font-size:.6rem;color:#FFD600;display:flex;align-items:center;gap:.25rem"><svg width="14" height="4"><line x1="0" y1="2" x2="14" y2="2" stroke="#FFD600" stroke-width="2.5" stroke-linecap="round"/></svg>50–66%</span>\n  <span style="font-size:.6rem;color:#ef4444;display:flex;align-items:center;gap:.25rem"><svg width="14" height="4"><line x1="0" y1="2" x2="14" y2="2" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/></svg>&lt;50%</span>\n</div>'
if OLD3 in c:
    c = c.replace(OLD3, NEW3, 1)
    print("✅ Fix 3 : duos légende sur une ligne")
    fixes += 1
else:
    print("❌ Fix 3 : ancre duos non trouvée")

# ── 4. Font-size team-pill : 0.72rem → 0.82rem ──
OLD4 = ".team-pill{font-family:'Oswald',sans-serif;font-size:.72rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:.15rem .1rem;background:none;white-space:nowrap}"
NEW4 = ".team-pill{font-family:'Oswald',sans-serif;font-size:.82rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:.15rem .1rem;background:none;white-space:nowrap}"
if OLD4 in c:
    c = c.replace(OLD4, NEW4, 1)
    print("✅ Fix 4 : font-size pills 0.82rem")
    fixes += 1
else:
    print("❌ Fix 4 : ancre CSS non trouvée")

print(f"\n{fixes}/4 fixes appliqués")

with open('index.html', 'w') as f:
    f.write(c)
