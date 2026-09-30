#!/usr/bin/env python3
"""Ajoute les fonctions d'historisation : _loadInscriptionSessions, renderInFormation,
et modifie renderSession + renderPresence pour les sessions d'inscription."""

with open('index.html', 'r') as f:
    content = f.read()

# ── 1. Ajouter _loadInscriptionSessions après var _INS_SESSIONS ──
ANCHOR1 = "var _INS_SESSIONS = [];\n"
INS_SESSIONS_CODE = r"""var _INS_SESSIONS = [];

async function _loadInscriptionSessions(){
  _INS_SESSIONS=[];
  var promises=INSCRIPTION_SLOTS.map(function(slot){
    return sbGetRegistrations(slot.id).then(function(regs){
      var shortDate='';
      var parts=slot.label.split(' ');
      // "Lundi 8 juin" → "8 juin"
      if(parts.length>=3) shortDate=parts.slice(1).join(' ');
      else shortDate=slot.label;
      var s={
        id:slot.id,
        date:slot.label,
        shortDate:shortDate,
        fromInscription:true,
        regCount:regs.length,
        regs:regs,
        bench:regs.slice(10).map(function(r){return r.player_name;}),
        nameA:'Blanche ⚪',
        nameB:'Bleue 🔵',
        score:'— vs —',
        current:false,
        players:[]
      };
      // Si >= 10 inscrits, générer les équipes (cache localStorage)
      if(regs.length>=10){
        var top10=regs.slice(0,10).map(function(r){return r.player_name;});
        var cacheKey='ins_teams_'+slot.id+'_'+top10.slice().sort().join(',');
        var cached=localStorage.getItem(cacheKey);
        if(cached){
          try{ s.players=JSON.parse(cached); }catch(e){ cached=null; }
        }
        if(!cached){
          var result=_genBalancedTeams(top10);
          if(result){
            var posA=_assignPositions(result.teamA,true);
            var posB=_assignPositions(result.teamB,false);
            s.players=posA.concat(posB).map(function(p){
              var html=_getPlayerHtml(p.name);
              html=html.replace(/class="card team-[ab]"/,'class="card '+(p.teamA?'team-a':'team-b')+'"');
              var isGK=(p.y<=10||p.y>=90);
              var role=isGK?'Gardien':(PLAYER_ROLES[p.name]||'');
              if(role&&html.indexOf('cphoto" style=')===-1){
                if(html.indexOf('class="crole"')!==-1){
                  html=html.replace(/<div class="crole">[^<]*<\/div>/,'<div class="crole">'+role+'<\/div>');
                } else {
                  html=html.replace('<div class="cphoto">','<div class="cphoto"><div class="crole">'+role+'<\/div>');
                }
              }
              return {x:p.x,y:p.y,name:p.name,teamA:p.teamA,html:html};
            });
            localStorage.setItem(cacheKey,JSON.stringify(s.players));
          }
        }
      }
      _INS_SESSIONS.push(s);
    }).catch(function(){});
  });
  await Promise.all(promises);
  // Trier par date (les plus récentes d'abord = ordre inverse des slots)
  _INS_SESSIONS.sort(function(a,b){
    var ia=INSCRIPTION_SLOTS.findIndex(function(s){return s.id===a.id;});
    var ib=INSCRIPTION_SLOTS.findIndex(function(s){return s.id===b.id;});
    return ia-ib;
  });
  buildTabs();
}
"""

if ANCHOR1 in content:
    content = content.replace(ANCHOR1, INS_SESSIONS_CODE, 1)
    print("✅ _loadInscriptionSessions ajoutée")
else:
    print("❌ Ancre 1 non trouvée")

# ── 2. Ajouter renderInFormation avant renderSession ──
ANCHOR2 = "function renderSession(s){"
RENDER_IN_FORMATION = r"""function renderInFormation(s){
  showPitch();
  document.getElementById('view-pitch').style.display='block';
  var layer=document.getElementById('players');
  if(layer) layer.innerHTML='';
  // Masquer le terrain et les éléments liés au match
  var pitch=document.querySelector('.pitch');
  if(pitch) pitch.style.visibility='hidden';
  var scoreEl=document.getElementById('score');
  if(scoreEl) scoreEl.style.display='none';
  var legA=document.getElementById('leg-a');
  var legB=document.getElementById('leg-b');
  if(legA) legA.style.display='none';
  if(legB) legB.style.display='none';

  // Zone d'affichage "en formation"
  var viewPitch=document.getElementById('view-pitch');
  var formBanner=document.getElementById('forming-banner');
  if(!formBanner){
    formBanner=document.createElement('div');
    formBanner.id='forming-banner';
    viewPitch.appendChild(formBanner);
  }
  var n=s.regCount;
  var rows=s.regs.map(function(r,i){
    return '<div class="forming-player-row"><span class="forming-rank">'+(i+1)+'</span><span>'+r.player_name+'</span></div>';
  }).join('');
  formBanner.innerHTML=`<div class="forming-banner"><div class="forming-count">${n}<span style="font-size:1.2rem;color:rgba(255,255,255,.3)">/10</span></div><div class="forming-label">joueurs inscrits</div><div class="forming-players">${rows}</div></div>`;
  formBanner.style.display='block';

  // Feuille de match (présences)
  var benchWrap=document.getElementById('bench-section');
  if(benchWrap) benchWrap.style.display='none';
  var mvpWrap=document.getElementById('mvp-section');
  if(mvpWrap) mvpWrap.style.display='none';
  var artWrap=document.getElementById('article-section');
  if(artWrap) artWrap.style.display='none';

  renderPresence(s);
  setActiveTab(s.id);
}

"""

if ANCHOR2 in content:
    content = content.replace(ANCHOR2, RENDER_IN_FORMATION + ANCHOR2, 1)
    print("✅ renderInFormation ajoutée")
else:
    print("❌ Ancre 2 non trouvée")

# ── 3. Modifier renderSession pour détecter les sessions d'inscription ──
OLD_RENDER_SESSION_START = "function renderSession(s){\n  window._cur=s;\n  if (!s._originalPlayers) s._originalPlayers = s.players.map(function(p){ return p.name; });\n  s._autoTeamKey = null;"
NEW_RENDER_SESSION_START = """function renderSession(s){
  // Sessions d'inscription en formation (< 10 joueurs)
  if(s.fromInscription && s.regCount<10){ renderInFormation(s); return; }
  // Nettoyage bannière en formation si on revient sur une session normale
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
  window._cur=s;
  if (!s._originalPlayers) s._originalPlayers = s.players.map(function(p){ return p.name; });
  s._autoTeamKey = null;"""

if OLD_RENDER_SESSION_START in content:
    content = content.replace(OLD_RENDER_SESSION_START, NEW_RENDER_SESSION_START, 1)
    print("✅ renderSession modifié")
else:
    print("❌ Ancre 3 non trouvée")

# ── 4. Modifier renderPresence pour les sessions d'inscription ──
OLD_PRESENCE_START = """function renderPresence(s) {
  var wrap = document.getElementById('presence-section');
  if (!wrap) return;
  if (!isPresenceVisible(s)) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';

  var myName = localStorage.getItem('presence_name') || '';
  var locked = isPresenceLocked(s);

  if (!document.getElementById('presence-grid')) {
    wrap.innerHTML = '<div class="presence-title">📋 Feuille de match</div><div class="presence-summary" id="presence-summary"></div><div class="presence-grid" id="presence-grid">' + (locked ? '<div class="presence-locked">Les présences sont verrouillées pour ce match.</div>' : '') + '</div>';
  }
  // Grid content is replaced directly by the fetch result — no pre-clear to avoid scroll jump

  sbGetPresences(s.id).then(function(presences) {"""

NEW_PRESENCE_START = """function renderPresence(s) {
  var wrap = document.getElementById('presence-section');
  if (!wrap) return;
  // Pour les sessions d'inscription en formation, afficher juste la feuille
  if(s.fromInscription && s.regCount<10){
    wrap.style.display='block';
    var registeredNames=s.regs.map(function(r){return r.player_name;});
    wrap.innerHTML='<div class="presence-title">📋 Inscrits</div><div class="presence-grid" id="presence-grid">'
      +registeredNames.map(function(n,i){
        return '<div class="presence-item presence-present"><span class="presence-name">'+n+'</span></div>';
      }).join('')+'</div>';
    return;
  }
  if (!isPresenceVisible(s)) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';

  var myName = localStorage.getItem('presence_name') || '';
  var locked = isPresenceLocked(s);

  if (!document.getElementById('presence-grid')) {
    wrap.innerHTML = '<div class="presence-title">📋 Feuille de match</div><div class="presence-summary" id="presence-summary"></div><div class="presence-grid" id="presence-grid">' + (locked ? '<div class="presence-locked">Les présences sont verrouillées pour ce match.</div>' : '') + '</div>';
  }
  // Grid content is replaced directly by the fetch result — no pre-clear to avoid scroll jump

  sbGetPresences(s.id).then(function(presences) {"""

if OLD_PRESENCE_START in content:
    content = content.replace(OLD_PRESENCE_START, NEW_PRESENCE_START, 1)
    print("✅ renderPresence modifié")
else:
    print("❌ Ancre 4 non trouvée — tentative variante...")
    # Cherche variante
    idx = content.find("function renderPresence(s) {")
    if idx != -1:
        print("renderPresence trouvée à", idx)
        print(repr(content[idx:idx+500]))

# ── 5. Ajouter appel _loadInscriptionSessions() dans l'init ──
OLD_INIT = "buildTabs();\n// Afficher la session current:true au chargement\nvar defaultSession = SESSIONS.find(function(s){ return s.current; }) || SESSIONS[0];\nrenderSession(defaultSession);"
NEW_INIT = "buildTabs();\n// Afficher la session current:true au chargement\nvar defaultSession = SESSIONS.find(function(s){ return s.current; }) || SESSIONS[0];\nrenderSession(defaultSession);\n// Charger les sessions d'inscription en arrière-plan\n_loadInscriptionSessions();"

if OLD_INIT in content:
    content = content.replace(OLD_INIT, NEW_INIT, 1)
    print("✅ _loadInscriptionSessions() appelée dans init")
else:
    print("❌ Ancre 5 non trouvée")

with open('index.html', 'w') as f:
    f.write(content)

print("\nDone.")
