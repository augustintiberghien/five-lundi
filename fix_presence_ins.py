#!/usr/bin/env python3
"""Améliore renderPresence + renderSession pour les sessions d'inscription >= 10."""

with open('index.html', 'r') as f:
    content = f.read()

# ── 1. Compléter renderPresence pour gérer fromInscription >= 10 ──
OLD = """  // Pour les sessions d'inscription en formation, afficher juste la feuille
  if(s.fromInscription && s.regCount<10){
    wrap.style.display='block';
    var registeredNames=s.regs.map(function(r){return r.player_name;});
    wrap.innerHTML='<div class="presence-title">📋 Inscrits</div><div class="presence-grid" id="presence-grid">'
      +registeredNames.map(function(n,i){
        return '<div class="presence-item presence-present"><span class="presence-name">'+n+'</span></div>';
      }).join('')+'</div>';
    return;
  }"""

NEW = """  // Sessions d'inscription : pas de logique présence standard
  if(s.fromInscription){
    if(s.regCount<10){
      // En formation : juste la liste des inscrits
      wrap.style.display='block';
      var registeredNames=s.regs.map(function(r){return r.player_name;});
      wrap.innerHTML='<div class="presence-title">📋 Inscrits</div><div class="presence-grid" id="presence-grid">'
        +registeredNames.map(function(n,i){
          return '<div class="presence-item presence-present"><span class="presence-name">'+n+'</span></div>';
        }).join('')+'</div>';
    } else {
      // Équipes générées : afficher le banc éventuel
      var benchRegs=s.bench||[];
      if(benchRegs.length>0){
        wrap.style.display='block';
        wrap.innerHTML='<div class="presence-title">🪑 Banc (inscrits hors top 10)</div><div class="presence-grid" id="presence-grid">'
          +benchRegs.map(function(n,i){
            return '<div class="presence-item presence-present"><span class="presence-name">'+(i+11)+'. '+n+'</span></div>';
          }).join('')+'</div>';
      } else {
        wrap.style.display='none';
      }
    }
    return;
  }"""

if OLD in content:
    content = content.replace(OLD, NEW, 1)
    print("✅ renderPresence inscription >= 10 ajouté")
else:
    print("❌ Ancre non trouvée")

# ── 2. Dans renderSession, masquer mvp/article/bench pour sessions d'inscription ──
OLD2 = """  // Nettoyage bannière en formation si on revient sur une session normale
  var fb=document.getElementById('forming-banner');
  if(fb) fb.style.display='none';
  var pitch=document.querySelector('.pitch');
  if(pitch) pitch.style.visibility='';
  var scoreEl=document.getElementById('score');
  if(scoreEl) scoreEl.style.display='';
  var legA=document.getElementById('leg-a');
  var legB=document.getElementById('leg-b');
  if(legA) legA.style.display='';
  if(legB) legB.style.display='';
  window._cur=s;"""

NEW2 = """  // Nettoyage bannière en formation si on revient sur une session normale
  var fb=document.getElementById('forming-banner');
  if(fb) fb.style.display='none';
  var pitch=document.querySelector('.pitch');
  if(pitch) pitch.style.visibility='';
  var scoreEl=document.getElementById('score');
  if(scoreEl) scoreEl.style.display=s.fromInscription?'none':'';
  var legA=document.getElementById('leg-a');
  var legB=document.getElementById('leg-b');
  if(legA) legA.style.display='';
  if(legB) legB.style.display='';
  window._cur=s;"""

if OLD2 in content:
    content = content.replace(OLD2, NEW2, 1)
    print("✅ Score masqué pour sessions d'inscription")
else:
    print("❌ Ancre 2 non trouvée")

# ── 3. Dans renderSession, masquer mvp/article pour sessions inscription ──
OLD3 = "  renderMvpSection(s);\n  renderArticle(s);\n  renderBench(s);\n  renderPresence(s);\n}"
NEW3 = """  if(!s.fromInscription){
    renderMvpSection(s);
    renderArticle(s);
    renderBench(s);
  } else {
    var mvpWrap=document.getElementById('mvp-section');
    if(mvpWrap) mvpWrap.style.display='none';
    var artWrap=document.getElementById('article-section');
    if(artWrap) artWrap.style.display='none';
  }
  renderPresence(s);
}"""

if OLD3 in content:
    content = content.replace(OLD3, NEW3, 1)
    print("✅ MVP/article masqués pour sessions d'inscription")
else:
    print("❌ Ancre 3 non trouvée")

with open('index.html', 'w') as f:
    f.write(content)

print("\nDone.")
