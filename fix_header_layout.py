#!/usr/bin/env python3
"""Header équipes : 2 lignes symétriques, supprime les traits autour du VS/score."""

with open('index.html', 'r') as f:
    c = f.read()

fixes = 0

# ── 1. JS : innerHTML pour le retour à la ligne ÉQUIPE / NOM ──
OLD1 = "  elA.textContent='ÉQUIPE '+s.nameA.replace(/[⚪🔵]/g,'').trim();\n  elB.textContent='ÉQUIPE '+s.nameB.replace(/[⚪🔵]/g,'').trim();"
NEW1 = "  elA.innerHTML='ÉQUIPE<br>'+s.nameA.replace(/[⚪🔵]/g,'').trim();\n  elB.innerHTML='ÉQUIPE<br>'+s.nameB.replace(/[⚪🔵]/g,'').trim();"
if OLD1 in c:
    c = c.replace(OLD1, NEW1, 1)
    print("✅ Fix 1 : innerHTML ÉQUIPE<br>NOM")
    fixes += 1
else:
    print("❌ Fix 1 non trouvé")

# ── 2. CSS team-pill : line-height pour les deux lignes, text-align selon côté ──
OLD2 = ".team-pill{font-family:'Oswald',sans-serif;font-size:1rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:.15rem .1rem;background:none}"
NEW2 = ".team-pill{font-family:'Oswald',sans-serif;font-size:.9rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:.15rem .1rem;background:none;line-height:1.15}.side-a .team-pill{text-align:left}.side-b .team-pill{text-align:right}"
if OLD2 in c:
    c = c.replace(OLD2, NEW2, 1)
    print("✅ Fix 2 : CSS team-pill 2 lignes")
    fixes += 1
else:
    print("❌ Fix 2 non trouvé")

# ── 3. renderScore : supprimer les traits (pending et scoré) ──
OLD3 = """  var cA='rgba(255,255,255,.85)', cB='#4d9fff';
  var dash='font-family:Oswald,sans-serif;font-size:1.3rem;font-weight:700';
  var vs='font-family:Oswald,sans-serif;font-size:2rem;font-weight:700;margin:0 .25rem';
  if(!s.scoreWinner){
    el.innerHTML='<span style="'+dash+';color:'+cA+'">—</span>'
      +'<span style="'+vs+'"><span style="color:'+cA+'">V</span><span style="color:'+cB+'">S</span></span>'
      +'<span style="'+dash+';color:'+cB+'">—</span>';
  } else {
    var c=s.scoreWinner==='A'?cA:cB;
    var sc='<span style="'+dash+';color:'+c+'">—</span>'
      +'<span style="font-family:Oswald,sans-serif;font-size:2.2rem;font-weight:700;letter-spacing:.05em;color:'+c+';margin:0 .25rem" id="score-num">'+s.score+'</span>'
      +'<span style="'+dash+';color:'+c+'">—</span>';
    el.innerHTML=sc;
    var num=document.getElementById('score-num');
    if(num){ num.classList.remove('score-animate'); void num.offsetWidth; num.classList.add('score-animate'); }
  }"""
NEW3 = """  var cA='rgba(255,255,255,.85)', cB='#4d9fff';
  var vs='font-family:Oswald,sans-serif;font-size:2rem;font-weight:700';
  if(!s.scoreWinner){
    el.innerHTML='<span style="'+vs+'"><span style="color:'+cA+'">V</span><span style="color:'+cB+'">S</span></span>';
  } else {
    var c=s.scoreWinner==='A'?cA:cB;
    el.innerHTML='<span style="font-family:Oswald,sans-serif;font-size:2rem;font-weight:700;letter-spacing:.05em;color:'+c+'" id="score-num">'+s.score+'</span>';
    var num=document.getElementById('score-num');
    if(num){ num.classList.remove('score-animate'); void num.offsetWidth; num.classList.add('score-animate'); }
  }"""
if OLD3 in c:
    c = c.replace(OLD3, NEW3, 1)
    print("✅ Fix 3 : traits supprimés autour VS/score")
    fixes += 1
else:
    print("❌ Fix 3 non trouvé")

print(f"\n{fixes}/3 fixes appliqués")

with open('index.html', 'w') as f:
    f.write(c)
