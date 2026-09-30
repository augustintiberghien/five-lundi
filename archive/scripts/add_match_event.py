#!/usr/bin/env python3
"""Ajoute la section France-Irak dans la card du 22 juin."""

with open('index.html', 'r') as f:
    c = f.read()

# ── 1. INSCRIPTION_SLOTS : ajouter matchEvent à ins_jun_22 ──
OLD1 = "  { id:'ins_jun_22', label:'Lundi 22 juin',  open:false },"
NEW1 = "  { id:'ins_jun_22', label:'Lundi 22 juin',  open:false, matchEvent:{id:'ins_jun_22_match',label:'France 🇫🇷 vs Irak 🇮🇶 · 23h00'} },"

if OLD1 in c:
    c = c.replace(OLD1, NEW1, 1)
    print("✅ matchEvent ajouté à ins_jun_22")
else:
    print("❌ Ancre 1 non trouvée")

# ── 2. renderInscriptions : ajouter section match dans la card du 22 ──
OLD2 = """    html+='<div id="ins-list-'+slot.id+'"><div class="ins-empty">Chargement…</div></div>';
    if(slot.open) html+='<div id="ins-form-'+slot.id+'"></div>';
    else html+='<div class="ins-locked-overlay"><span class="ins-locked-label">👀 Ouverture prochainement</span></div>';
    html+='</div>';
  });"""

NEW2 = """    html+='<div id="ins-list-'+slot.id+'"><div class="ins-empty">Chargement…</div></div>';
    if(slot.open) html+='<div id="ins-form-'+slot.id+'"></div>';
    else html+='<div class="ins-locked-overlay"><span class="ins-locked-label">👀 Ouverture prochainement</span></div>';
    // Section match TV si applicable
    if(slot.matchEvent){
      html+='<div class="ins-match-section">';
      html+='<div class="ins-match-header">'+slot.matchEvent.label+'</div>';
      html+='<div id="ins-match-list-'+slot.matchEvent.id+'"><div class="ins-empty">Chargement…</div></div>';
      html+='<div id="ins-match-form-'+slot.matchEvent.id+'"></div>';
      html+='</div>';
    }
    html+='</div>';
  });"""

if OLD2 in c:
    c = c.replace(OLD2, NEW2, 1)
    print("✅ Section match TV ajoutée dans renderInscriptions")
else:
    print("❌ Ancre 2 non trouvée")

# ── 3. renderInscriptions : fetcher aussi le match event ──
OLD3 = """  INSCRIPTION_SLOTS.forEach(function(slot){
    sbGetRegistrations(slot.id).then(function(regs){
      _updateSlotUI(slot, regs, myName);
    }).catch(function(){
      var el=document.getElementById('ins-list-'+slot.id);
      if(el) el.innerHTML='<div class="ins-empty">Erreur de chargement</div>';
    });
  });
}"""

NEW3 = """  INSCRIPTION_SLOTS.forEach(function(slot){
    var fivePromise=sbGetRegistrations(slot.id);
    var matchPromise=slot.matchEvent ? sbGetRegistrations(slot.matchEvent.id) : Promise.resolve([]);
    Promise.all([fivePromise, matchPromise]).then(function(results){
      _updateSlotUI(slot, results[0], myName, results[1]);
    }).catch(function(){
      var el=document.getElementById('ins-list-'+slot.id);
      if(el) el.innerHTML='<div class="ins-empty">Erreur de chargement</div>';
    });
  });
}"""

if OLD3 in c:
    c = c.replace(OLD3, NEW3, 1)
    print("✅ Fetch match event ajouté dans renderInscriptions")
else:
    print("❌ Ancre 3 non trouvée")

# ── 4. _updateSlotUI : ajouter param matchRegs + flags + section match ──
OLD4 = "function _updateSlotUI(slot, regs, myName){"
NEW4 = "function _updateSlotUI(slot, regs, myName, matchRegs){\n  matchRegs=matchRegs||[];\n  var matchNames=matchRegs.map(function(r){return r.player_name;});"

if OLD4 in c:
    c = c.replace(OLD4, NEW4, 1)
    print("✅ Paramètre matchRegs ajouté à _updateSlotUI")
else:
    print("❌ Ancre 4 non trouvée")

# ── 5. Ajouter les flags 🇫🇷🇮🇶 sur les lignes du five ──
OLD5 = """      var nameHtml=slot.open?'<span class="ins-name ins-name-tap" onclick="insConfirm(\\''+slot.id+'\\',\\''+r.player_name+'\\')">'+r.player_name+'</span>':'<span class="ins-name">'+r.player_name+'</span>';
      listHtml+='<div class="ins-item starter"><span class="ins-rank">'+(i+1)+'</span>'+nameHtml+'</div>';
    });
    if(bench.length>0){
      listHtml+='<hr class="ins-sep"><div style="font-family:Oswald,sans-serif;font-size:.6rem;color:rgba(255,165,0,.6);letter-spacing:.1em;text-transform:uppercase;margin:.2rem 0 .4rem">🟡 Banc</div>';
      bench.forEach(function(r,i){
        var nameHtml=slot.open?'<span class="ins-name ins-name-tap" onclick="insConfirm(\\''+slot.id+'\\',\\''+r.player_name+'\\')">'+r.player_name+'</span>':'<span class="ins-name">'+r.player_name+'</span>';
        listHtml+='<div class="ins-item bench"><span class="ins-rank">'+(i+11)+'</span>'+nameHtml+'</div>';"""

NEW5 = """      var hasMatch=matchNames.indexOf(r.player_name)!==-1;
      var flagHtml=hasMatch?'<span style="font-size:.85rem;margin-left:.3rem">🇫🇷🇮🇶</span>':'';
      var nameHtml=slot.open?'<span class="ins-name ins-name-tap" onclick="insConfirm(\\''+slot.id+'\\',\\''+r.player_name+'\\')">'+r.player_name+'</span>':'<span class="ins-name">'+r.player_name+'</span>';
      listHtml+='<div class="ins-item starter"><span class="ins-rank">'+(i+1)+'</span>'+nameHtml+flagHtml+'</div>';
    });
    if(bench.length>0){
      listHtml+='<hr class="ins-sep"><div style="font-family:Oswald,sans-serif;font-size:.6rem;color:rgba(255,165,0,.6);letter-spacing:.1em;text-transform:uppercase;margin:.2rem 0 .4rem">🟡 Banc</div>';
      bench.forEach(function(r,i){
        var hasMatch=matchNames.indexOf(r.player_name)!==-1;
        var flagHtml=hasMatch?'<span style="font-size:.85rem;margin-left:.3rem">🇫🇷🇮🇶</span>':'';
        var nameHtml=slot.open?'<span class="ins-name ins-name-tap" onclick="insConfirm(\\''+slot.id+'\\',\\''+r.player_name+'\\')">'+r.player_name+'</span>':'<span class="ins-name">'+r.player_name+'</span>';
        listHtml+='<div class="ins-item bench"><span class="ins-rank">'+(i+11)+'</span>'+nameHtml+flagHtml+'</div>';"""

if OLD5 in c:
    c = c.replace(OLD5, NEW5, 1)
    print("✅ Flags 🇫🇷🇮🇶 ajoutés sur les lignes du five")
else:
    print("❌ Ancre 5 non trouvée")

# ── 6. En fin de _updateSlotUI, rendre la section match ──
OLD6 = """  if(!slot.open||!formEl) return;
  var players=Object.keys(Object.assign({},PLAYER_STATS,PLAYER_NOTES)).sort();
  var opts=players.map(function(n){ return '<option value="'+n+'">'+n+'</option>'; }).join('');
  formEl.innerHTML=`<div class="ins-register"><select class="ins-select" id="ins-input-${slot.id}"><option value="">— Ton prénom —</option>${opts}</select><button class="ins-btn" onclick="doRegister('${slot.id}')">S'inscrire</button></div>`;\n}"""

NEW6 = """  if(slot.matchEvent){
    _updateMatchUI(slot.matchEvent, matchRegs, slot.open);
  }
  if(!slot.open||!formEl) return;
  var players=Object.keys(Object.assign({},PLAYER_STATS,PLAYER_NOTES)).sort();
  var opts=players.map(function(n){ return '<option value="'+n+'">'+n+'</option>'; }).join('');
  formEl.innerHTML=`<div class="ins-register"><select class="ins-select" id="ins-input-${slot.id}"><option value="">— Ton prénom —</option>${opts}</select><button class="ins-btn" onclick="doRegister('${slot.id}')">S'inscrire</button></div>`;\n}"""

if OLD6 in c:
    c = c.replace(OLD6, NEW6, 1)
    print("✅ Appel _updateMatchUI en fin de _updateSlotUI")
else:
    print("❌ Ancre 6 non trouvée")

# ── 7. Ajouter CSS pour la section match ──
OLD_CSS = ".forming-rank{font-family:Oswald,sans-serif;font-size:.65rem;color:rgba(255,255,255,.3);width:1.2rem}"
NEW_CSS = """.forming-rank{font-family:Oswald,sans-serif;font-size:.65rem;color:rgba(255,255,255,.3);width:1.2rem}
.ins-match-section{margin-top:1rem;border-top:1px solid rgba(255,255,255,.07);padding-top:.8rem}
.ins-match-header{font-family:Oswald,sans-serif;font-size:.75rem;font-weight:700;color:rgba(255,255,255,.6);letter-spacing:.06em;text-transform:uppercase;margin-bottom:.6rem;text-align:center}"""

if OLD_CSS in c:
    c = c.replace(OLD_CSS, NEW_CSS, 1)
    print("✅ CSS ins-match-section ajouté")
else:
    print("❌ Ancre CSS non trouvée")

# ── 8. Ajouter la fonction _updateMatchUI + doRegisterMatch + insConfirmMatch ──
ANCHOR_FN = "function insConfirm(slotId, playerName){"
MATCH_FUNCTIONS = r"""function _updateMatchUI(matchEvent, matchRegs, fiveOpen){
  var listEl=document.getElementById('ins-match-list-'+matchEvent.id);
  var formEl=document.getElementById('ins-match-form-'+matchEvent.id);
  if(!listEl) return;
  var html='';
  if(matchRegs.length===0){
    html='<div class="ins-empty" style="font-size:.7rem">Personne pour l&#39;instant — sois le premier !</div>';
  } else {
    matchRegs.forEach(function(r){
      var nameHtml=fiveOpen
        ?'<span class="ins-name ins-name-tap" onclick="insConfirmMatch(\''+matchEvent.id+'\',\''+r.player_name+'\')">'+r.player_name+'</span>'
        :'<span class="ins-name">'+r.player_name+'</span>';
      html+='<div class="ins-item starter" style="background:rgba(0,35,90,.25)">'+nameHtml+'</div>';
    });
  }
  listEl.innerHTML=html;
  if(!fiveOpen||!formEl) return;
  var players=Object.keys(Object.assign({},PLAYER_STATS,PLAYER_NOTES)).sort();
  var opts=players.map(function(n){ return '<option value="'+n+'">'+n+'</option>'; }).join('');
  formEl.innerHTML=`<div class="ins-register" style="margin-top:.5rem"><select class="ins-select" id="ins-match-input-${matchEvent.id}"><option value="">— Ton prénom —</option>${opts}</select><button class="ins-btn" style="background:rgba(0,50,150,.6);border-color:rgba(100,150,255,.4)" onclick="doRegisterMatch('${matchEvent.id}')">Je regarde 🇫🇷🇮🇶</button></div>`;
}

function doRegisterMatch(matchSlotId){
  var input=document.getElementById('ins-match-input-'+matchSlotId);
  if(!input) return;
  var name=input.value.trim();
  if(!name) return;
  input.disabled=true;
  var btn=input.parentElement.querySelector('.ins-btn');
  if(btn) btn.disabled=true;
  sbRegister(matchSlotId, name).then(function(){ return sbGetRegistrations(matchSlotId); }).then(function(regs){
    // Trouver le slot parent et recharger tout
    var parentSlot=INSCRIPTION_SLOTS.find(function(s){ return s.matchEvent&&s.matchEvent.id===matchSlotId; });
    if(parentSlot){
      sbGetRegistrations(parentSlot.id).then(function(fiveRegs){
        _updateSlotUI(parentSlot, fiveRegs, '', regs);
      });
    } else {
      _updateMatchUI({id:matchSlotId,label:''}, regs, true);
    }
  }).catch(function(e){ console.error(e); });
}

function insConfirmMatch(matchSlotId, playerName){
  var overlay=document.getElementById('ins-confirm-overlay');
  if(!overlay) return;
  document.getElementById('ins-confirm-name').textContent=playerName;
  document.getElementById('ins-confirm-ok').onclick=function(){
    overlay.style.display='none';
    sbUnregister(matchSlotId, playerName).then(function(){ return sbGetRegistrations(matchSlotId); }).then(function(regs){
      var parentSlot=INSCRIPTION_SLOTS.find(function(s){ return s.matchEvent&&s.matchEvent.id===matchSlotId; });
      if(parentSlot){
        sbGetRegistrations(parentSlot.id).then(function(fiveRegs){
          _updateSlotUI(parentSlot, fiveRegs, '', regs);
        });
      } else {
        _updateMatchUI({id:matchSlotId,label:''}, regs, true);
      }
    }).catch(function(e){ console.error(e); });
  };
  document.getElementById('ins-confirm-cancel').onclick=function(){ overlay.style.display='none'; };
  overlay.style.display='flex';
}

"""

if ANCHOR_FN in c:
    c = c.replace(ANCHOR_FN, MATCH_FUNCTIONS + ANCHOR_FN, 1)
    print("✅ Fonctions _updateMatchUI / doRegisterMatch / insConfirmMatch ajoutées")
else:
    print("❌ Ancre 8 non trouvée")

with open('index.html', 'w') as f:
    f.write(c)

print("\nDone.")
