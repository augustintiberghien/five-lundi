#!/usr/bin/env python3
"""
Ajoute les inscrits France-Irak dans la feuille de match de la session du 22 juin.
1. _loadInscriptionSessions : fetch matchEvent regs → s.matchRegs
2. renderPresence inscription ≥10 : section France-Irak
"""

with open('index.html', 'r') as f:
    c = f.read()

# ── 1. Dans _loadInscriptionSessions : fetch matchEvent regs et stocker dans s.matchRegs ──
OLD1 = """      _INS_SESSIONS.push(s);
    }).catch(function(){});
  });
  await Promise.all(promises);"""

NEW1 = """      // Fetch match event regs si applicable
      if(slot.matchEvent){
        return sbGetRegistrations(slot.matchEvent.id).then(function(matchRegs){
          s.matchRegs=matchRegs;
          s.matchEvent=slot.matchEvent;
          _INS_SESSIONS.push(s);
        }).catch(function(){ s.matchRegs=[]; _INS_SESSIONS.push(s); });
      }
      _INS_SESSIONS.push(s);
    }).catch(function(){});
  });
  await Promise.all(promises);"""

if OLD1 in c:
    c = c.replace(OLD1, NEW1, 1)
    print("✅ matchRegs chargés dans _loadInscriptionSessions")
else:
    print("❌ Ancre 1 non trouvée")

# ── 2. renderPresence inscription ≥10 : ajouter section France-Irak ──
OLD2 = """      // Équipes générées : afficher le banc éventuel
      var benchRegs=s.bench||[];
      if(benchRegs.length>0){
        wrap.style.display='block';
        wrap.innerHTML='<div class="presence-title">🪑 Banc (inscrits hors top 10)</div><div class="presence-grid" id="presence-grid">'
          +benchRegs.map(function(n,i){
            return '<div class="presence-item presence-present"><span class="presence-name">'+(i+11)+'. '+n+'</span></div>';
          }).join('')+'</div>';
      } else {
        wrap.style.display='none';
      }"""

NEW2 = """      // Équipes générées : banc + section match TV
      var benchRegs=s.bench||[];
      var matchRegs=s.matchRegs||[];
      var top10Names=s.regs.slice(0,10).map(function(r){return r.player_name;});
      var hasBench=benchRegs.length>0;
      var hasMatch=matchRegs.length>0;
      if(hasBench||hasMatch){
        wrap.style.display='block';
        var html='<div class="presence-title">📋 Feuille de match</div>';
        // Titulaires (top 10)
        html+='<div style="font-family:Oswald,sans-serif;font-size:.6rem;color:rgba(255,255,255,.35);letter-spacing:.1em;text-transform:uppercase;margin:.6rem 0 .3rem .2rem">⚽ Titulaires</div>';
        html+='<div class="presence-grid">';
        top10Names.forEach(function(n){
          var alsoMatch=matchRegs.some(function(r){return r.player_name===n;});
          html+='<div class="presence-item presence-present"><span class="presence-name">'+n+(alsoMatch?' <span style="font-size:.8rem">🇫🇷🇮🇶</span>':'')+'</span></div>';
        });
        html+='</div>';
        // Banc
        if(hasBench){
          html+='<div style="font-family:Oswald,sans-serif;font-size:.6rem;color:rgba(255,165,0,.6);letter-spacing:.1em;text-transform:uppercase;margin:.6rem 0 .3rem .2rem">🪑 Banc</div>';
          html+='<div class="presence-grid">';
          benchRegs.forEach(function(n,i){
            var alsoMatch=matchRegs.some(function(r){return r.player_name===n;});
            html+='<div class="presence-item presence-present"><span class="presence-name">'+(i+11)+'. '+n+(alsoMatch?' <span style="font-size:.8rem">🇫🇷🇮🇶</span>':'')+'</span></div>';
          });
          html+='</div>';
        }
        // France-Irak
        if(hasMatch){
          html+='<div style="font-family:Oswald,sans-serif;font-size:.6rem;color:rgba(100,150,255,.7);letter-spacing:.1em;text-transform:uppercase;margin:.8rem 0 .3rem .2rem">🇫🇷 France vs Irak 🇮🇶 · 23h</div>';
          html+='<div class="presence-grid">';
          matchRegs.forEach(function(r){
            var inFive=top10Names.indexOf(r.player_name)!==-1||benchRegs.indexOf(r.player_name)!==-1;
            html+='<div class="presence-item presence-present"><span class="presence-name">'+(inFive?'⚽ ':'')+r.player_name+'</span></div>';
          });
          html+='</div>';
        }
        wrap.innerHTML=html;
      } else {
        wrap.style.display='none';
      }"""

if OLD2 in c:
    c = c.replace(OLD2, NEW2, 1)
    print("✅ Section France-Irak ajoutée dans renderPresence")
else:
    print("❌ Ancre 2 non trouvée")

with open('index.html', 'w') as f:
    f.write(c)

print("\nDone.")
