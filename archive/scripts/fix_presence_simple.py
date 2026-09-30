#!/usr/bin/env python3
"""Simplifie la feuille de match du 22 juin selon la vision de l'utilisateur."""

with open('index.html', 'r') as f:
    c = f.read()

OLD = """      // Équipes générées : banc + section match TV
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

NEW = """      // Feuille de match : titulaires + banc + match-only + absents
      var allFiveNames=s.regs.map(function(r){return r.player_name;});
      var top10Names=allFiveNames.slice(0,10);
      var benchRegs=s.bench||[];
      var matchRegs=s.matchRegs||[];
      var matchNames=matchRegs.map(function(r){return r.player_name;});
      // Match-only = inscrits au match mais pas dans le five du tout
      var matchOnly=matchRegs.filter(function(r){return allFiveNames.indexOf(r.player_name)===-1;});
      var sep='font-family:Oswald,sans-serif;font-size:.6rem;letter-spacing:.1em;text-transform:uppercase;margin:.7rem 0 .3rem .2rem';
      wrap.style.display='block';
      var html='<div class="presence-title">📋 Feuille de match</div>';
      // Titulaires
      html+='<div class="presence-grid" style="margin-top:.4rem">';
      top10Names.forEach(function(n){
        var flag=matchNames.indexOf(n)!==-1?' <span style="font-size:.8rem">🇫🇷🇮🇶</span>':'';
        html+='<div class="presence-item presence-present"><span class="presence-name">'+n+flag+'</span></div>';
      });
      html+='</div>';
      // Banc
      if(benchRegs.length>0){
        html+='<div class="presence-sep">🪑 Banc</div>';
        html+='<div class="presence-grid">';
        benchRegs.forEach(function(n,i){
          var flag=matchNames.indexOf(n)!==-1?' <span style="font-size:.8rem">🇫🇷🇮🇶</span>':'';
          html+='<div class="presence-item presence-present"><span class="presence-name">'+(i+11)+'. '+n+flag+'</span></div>';
        });
        html+='</div>';
      }
      // Match-only
      if(matchOnly.length>0){
        html+='<div class="presence-sep" style="color:rgba(100,150,255,.8)">🇫🇷 France-Irak uniquement 🇮🇶</div>';
        html+='<div class="presence-grid">';
        matchOnly.forEach(function(r){
          html+='<div class="presence-item presence-present"><span class="presence-name">'+r.player_name+'</span></div>';
        });
        html+='</div>';
      }
      wrap.innerHTML=html;"""

if OLD in c:
    c = c.replace(OLD, NEW, 1)
    print("✅ Feuille de match simplifiée")
else:
    print("❌ Ancre non trouvée")

with open('index.html', 'w') as f:
    f.write(c)
