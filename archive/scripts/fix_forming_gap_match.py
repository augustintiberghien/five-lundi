#!/usr/bin/env python3
"""Fix gap terrain + affiche spectateurs match dans la vue en formation."""

with open('index.html', 'r') as f:
    c = f.read()

fixes = 0

# ── 1. renderInFormation : display:none sur pitch-wrap au lieu de visibility:hidden ──
OLD1 = """  // Masquer le terrain et les éléments liés au match
  var pitch=document.querySelector('.pitch');
  if(pitch) pitch.style.visibility='hidden';"""
NEW1 = """  // Masquer le terrain et les éléments liés au match
  var pitchWrap=document.querySelector('.pitch-wrap');
  if(pitchWrap) pitchWrap.style.display='none';"""
if OLD1 in c:
    c = c.replace(OLD1, NEW1, 1)
    print("✅ Fix 1 : pitch-wrap display:none (supprime le gap)")
    fixes += 1
else:
    print("❌ Fix 1 : ancre non trouvée")

# ── 2. renderSession : restaurer pitch-wrap ──
OLD2 = """  var pitch=document.querySelector('.pitch');
  if(pitch) pitch.style.visibility='';"""
NEW2 = """  var pitchWrap=document.querySelector('.pitch-wrap');
  if(pitchWrap) pitchWrap.style.display='';"""
if OLD2 in c:
    c = c.replace(OLD2, NEW2, 1)
    print("✅ Fix 2 : renderSession restaure pitch-wrap")
    fixes += 1
else:
    print("❌ Fix 2 : ancre non trouvée")

# ── 3. Ajouter les spectateurs du match dans le forming banner ──
OLD3 = """  var n=s.regCount;
  var rows=s.regs.map(function(r,i){
    return '<div class="forming-player-row"><span class="forming-rank">'+(i+1)+'</span><span>'+r.player_name+'</span></div>';
  }).join('');
  formBanner.innerHTML=`<div class="forming-banner"><div class="forming-count">${n}<span style="font-size:1.2rem;color:rgba(255,255,255,.3)">/10</span></div><div class="forming-label">joueurs inscrits</div><div class="forming-players">${rows}</div></div>`;"""
NEW3 = """  var n=s.regCount;
  var rows=s.regs.map(function(r,i){
    return '<div class="forming-player-row"><span class="forming-rank">'+(i+1)+'</span><span>'+r.player_name+'</span></div>';
  }).join('');
  var matchSection='';
  if(s.matchRegs&&s.matchRegs.length>0){
    var matchLabel=s.matchEvent&&s.matchEvent.label?s.matchEvent.label:'Match';
    var matchRows=s.matchRegs.map(function(r){
      var alsoFive=s.regs.some(function(f){return f.player_name===r.player_name;});
      return '<div class="forming-player-row">'+(alsoFive?'<span style="font-size:.75rem;margin-right:.3rem">⚽</span>':'<span style="font-size:.75rem;margin-right:.3rem;opacity:.4">👁</span>')+'<span>'+r.player_name+'</span></div>';
    }).join('');
    matchSection='<div style="font-family:Oswald,sans-serif;font-size:.6rem;color:rgba(100,150,255,.7);letter-spacing:.1em;text-transform:uppercase;margin:1rem 0 .4rem;text-align:center">🇫🇷🇮🇶 '+matchLabel+'</div><div class="forming-players">'+matchRows+'</div>';
  }
  formBanner.innerHTML=`<div class="forming-banner"><div class="forming-count">${n}<span style="font-size:1.2rem;color:rgba(255,255,255,.3)">/10</span></div><div class="forming-label">joueurs inscrits</div><div class="forming-players">${rows}</div>${matchSection}</div>`;"""
if OLD3 in c:
    c = c.replace(OLD3, NEW3, 1)
    print("✅ Fix 3 : spectateurs match ajoutés dans le forming banner")
    fixes += 1
else:
    print("❌ Fix 3 : ancre non trouvée")

print(f"\n{fixes}/3 fixes appliqués")

with open('index.html', 'w') as f:
    f.write(c)
