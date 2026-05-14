#!/usr/bin/env python3
"""Améliore le rendu des tabs de sessions d'inscription ouvertes."""

with open('index.html', 'r') as f:
    content = f.read()

# ── 1. shortDate : strip les exposants (ᵉʳ, ᵉ, etc.) ──
OLD1 = """      var shortDate='';
      var parts=slot.label.split(' ');
      // "Lundi 8 juin" → "8 juin"
      if(parts.length>=3) shortDate=parts.slice(1).join(' ');
      else shortDate=slot.label;"""
NEW1 = """      var shortDate='';
      var parts=slot.label.split(' ');
      // "Lundi 1ᵉʳ juin" → "1 juin" (sans exposants)
      if(parts.length>=3) shortDate=parts.slice(1).join(' ').replace(/[ᵉʳˢᵉⁱᵒ]+/g,'');
      else shortDate=slot.label.replace(/[ᵉʳˢᵉⁱᵒ]+/g,'');
      shortDate=shortDate.trim();"""

if OLD1 in content:
    content = content.replace(OLD1, NEW1, 1)
    print("✅ shortDate sans exposants")
else:
    print("❌ Ancre 1 non trouvée")

# ── 2. Format du tab : sans emoji, plus propre ──
OLD2 = "        b.textContent=(s.regCount<10?'🔵 '+s.shortDate+' ('+s.regCount+'/10)':'🟢 '+s.shortDate+' ✦');"
NEW2 = "        b.textContent=(s.regCount<10?s.shortDate+' · '+s.regCount+'/10':s.shortDate+' ✦');"

if OLD2 in content:
    content = content.replace(OLD2, NEW2, 1)
    print("✅ Format tab épuré")
else:
    print("❌ Ancre 2 non trouvée")

# ── 3. CSS : améliorer tab-forming et tab-ins-session ──
OLD3 = ".tab-ins-session{background:rgba(255,214,0,.06);border-color:rgba(255,214,0,.2);color:rgba(255,214,0,.75)}.tab-ins-session.active{background:rgba(255,214,0,.18);color:#FFD600}.tab-forming{background:rgba(255,255,255,.03);border-color:rgba(255,255,255,.08);color:rgba(255,255,255,.35)}"
NEW3 = ".tab-ins-session{background:rgba(255,214,0,.08);border-color:rgba(255,214,0,.3);color:rgba(255,214,0,.85);font-weight:600}.tab-ins-session.active{background:rgba(255,214,0,.2);border-color:rgba(255,214,0,.5);color:#FFD600}.tab-forming{background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.12);color:rgba(255,255,255,.5);font-size:.72rem}"

if OLD3 in content:
    content = content.replace(OLD3, NEW3, 1)
    print("✅ CSS tabs affiné")
else:
    print("❌ Ancre 3 (CSS) non trouvée")

with open('index.html', 'w') as f:
    f.write(content)

print("\nDone.")
