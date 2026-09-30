#!/usr/bin/env python3
"""Redesign session-header : centrage + VS bicolore avec traits d'équipe."""

with open('index.html', 'r') as f:
    c = f.read()

fixes = 0

# ── 1. CSS session-header : flex équilibré ──
OLD1 = ".session-header{display:flex;gap:1.2rem;justify-content:center;align-items:center;margin-bottom:1.6rem;margin-top:1.4rem}"
NEW1 = ".session-header{display:flex;gap:.5rem;justify-content:center;align-items:center;margin-bottom:1.6rem;margin-top:1.4rem}.team-side{flex:1;display:flex;align-items:center}.side-a{justify-content:flex-start}.side-b{justify-content:flex-end}.vs-block{display:flex;align-items:center;gap:.25rem;white-space:nowrap;flex-shrink:0}"
if OLD1 in c:
    c = c.replace(OLD1, NEW1, 1)
    print("✅ Fix 1 : CSS session-header redesigné")
    fixes += 1
else:
    print("❌ Fix 1 : ancre CSS non trouvée")

# ── 2. HTML session-header : nouvelle structure ──
OLD2 = """<div class="session-header" id="session-header">
  <span class="team-pill pill-a" id="name-a">—</span>
  <div style="min-width:120px;text-align:center;overflow:visible;white-space:nowrap">
    <span class="score-bubble score-pending" id="score">—</span>
  </div>
  <span class="team-pill pill-b" id="name-b">—</span>
</div>"""
NEW2 = """<div class="session-header" id="session-header">
  <div class="team-side side-a"><span class="team-pill pill-a" id="name-a">—</span></div>
  <div class="vs-block" id="score-block"></div>
  <div class="team-side side-b"><span class="team-pill pill-b" id="name-b">—</span></div>
</div>"""
if OLD2 in c:
    c = c.replace(OLD2, NEW2, 1)
    print("✅ Fix 2 : HTML session-header redesigné")
    fixes += 1
else:
    print("❌ Fix 2 : ancre HTML non trouvée")

# ── 3. renderScore : génère le bloc VS ou score dans score-block ──
OLD3 = """function renderScore(s){
  var el=document.getElementById('score');
  el.textContent=s.score;
  el.className='score-bubble';
  if(s.scoreWinner==='A') el.classList.add('score-win-a');
  else if(s.scoreWinner==='B') el.classList.add('score-win-b');
  else el.classList.add('score-pending');
  // Animation uniquement sur les sessions passées (score connu)
  if(s.scoreWinner==='A'||s.scoreWinner==='B'){
    el.classList.remove('score-animate');
    void el.offsetWidth; // force reflow pour relancer l'animation
    el.classList.add('score-animate');
  }
}"""
NEW3 = """function renderScore(s){
  var el=document.getElementById('score-block');
  if(!el) return;
  var cA='rgba(255,255,255,.85)', cB='#4d9fff';
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
  }
}"""
if OLD3 in c:
    c = c.replace(OLD3, NEW3, 1)
    print("✅ Fix 3 : renderScore redesigné")
    fixes += 1
else:
    print("❌ Fix 3 : ancre renderScore non trouvée")

# ── 4. renderInFormation : score-block au lieu de score span ──
OLD4 = "  var scoreEl=document.getElementById('score');\n  if(scoreEl) scoreEl.style.display='none';"
NEW4 = "  var scoreBlockEl=document.getElementById('score-block');\n  if(scoreBlockEl) scoreBlockEl.style.display='none';"
if OLD4 in c:
    c = c.replace(OLD4, NEW4, 1)
    print("✅ Fix 4 : renderInFormation mise à jour")
    fixes += 1
else:
    print("❌ Fix 4 : ancre renderInFormation non trouvée")

# ── 5. renderSession : restaurer score-block ──
OLD5 = "  var scoreEl=document.getElementById('score');\n  if(scoreEl) scoreEl.style.display='';"
NEW5 = "  var scoreBlockEl=document.getElementById('score-block');\n  if(scoreBlockEl) scoreBlockEl.style.display='';"
if OLD5 in c:
    c = c.replace(OLD5, NEW5, 1)
    print("✅ Fix 5 : renderSession mise à jour")
    fixes += 1
else:
    print("❌ Fix 5 : ancre renderSession non trouvée")

print(f"\n{fixes}/5 fixes appliqués")

with open('index.html', 'w') as f:
    f.write(c)
