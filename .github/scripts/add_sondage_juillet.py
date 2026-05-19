#!/usr/bin/env python3
"""Injecte la section Sondage Juillet dans index.html."""

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# ── 1. CSS ──────────────────────────────────────────────────────────────────
CSS = """.sondage-section-label{font-family:'Oswald',sans-serif;font-size:.6rem;font-weight:700;color:rgba(255,255,255,.2);text-transform:uppercase;letter-spacing:.14em;text-align:center;margin:1.4rem 0 .8rem}
.sondage-card{background:rgba(255,214,0,.04);border:1px solid rgba(255,214,0,.18);border-radius:14px;padding:1rem 1.1rem;margin-bottom:.9rem}
.sondage-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.8rem}
.sondage-title{font-family:'Oswald',sans-serif;font-size:.9rem;font-weight:700;color:#FFD600;text-transform:uppercase;letter-spacing:.08em}
.sondage-desc{font-family:'Barlow',sans-serif;font-size:.65rem;color:rgba(255,255,255,.35);letter-spacing:.08em;text-transform:uppercase;margin-bottom:.9rem}
.sondage-checkboxes{display:flex;flex-direction:column;gap:.45rem;margin-bottom:.85rem}
.sondage-check-row{display:flex;align-items:center;gap:.6rem;cursor:pointer;padding:.35rem .5rem;border-radius:8px;transition:background .15s}
.sondage-check-row:hover{background:rgba(255,214,0,.06)}
.sondage-check-row input[type=checkbox]{width:1rem;height:1rem;accent-color:#FFD600;cursor:pointer;flex-shrink:0}
.sondage-check-label{font-family:'Barlow',sans-serif;font-size:.8rem;color:rgba(255,255,255,.8);cursor:pointer;flex:1}
.sondage-results{margin-top:1rem;border-top:1px solid rgba(255,255,255,.06);padding-top:.9rem;display:flex;flex-direction:column;gap:.65rem}
.sondage-row-label{font-family:'Oswald',sans-serif;font-size:.65rem;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.06em}
.sondage-row-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:.2rem}
.sondage-row-count{font-family:'Oswald',sans-serif;font-size:.65rem;font-weight:700;color:#FFD600}
.sondage-bar{height:3px;background:rgba(255,214,0,.12);border-radius:2px;margin-bottom:.25rem}
.sondage-bar-fill{height:100%;background:#FFD600;border-radius:2px;transition:width .5s}
.sondage-names{font-family:'Barlow',sans-serif;font-size:.65rem;color:rgba(255,255,255,.35);line-height:1.5;min-height:.8rem}"""

anchor = '.ins-locked-label{font-family:\'Oswald\',sans-serif;font-size:.75rem;font-weight:700;color:rgba(255,255,255,.38);letter-spacing:.12em;text-transform:uppercase;text-align:center}'
assert anchor in content, "Ancre CSS introuvable"
content = content.replace(anchor, anchor + '\n' + CSS, 1)
print("✓ CSS injecté")

# ── 2. Config JS ─────────────────────────────────────────────────────────────
SONDAGE_CONFIG = """
var SONDAGE_JUILLET = {
  dates: [
    { id:'sondage_jul_all', label:'Tout le mois (6→27 juil.)' },
    { id:'sondage_jul_06',  label:'Lundi 6 juillet' },
    { id:'sondage_jul_13',  label:'Lundi 13 juillet' },
    { id:'sondage_jul_20',  label:'Lundi 20 juillet' },
    { id:'sondage_jul_27',  label:'Lundi 27 juillet' },
  ]
};"""

anchor_config = "{ id:'ins_jun_29', label:'Lundi 29 juin 2026',  open:false },\n];"
assert anchor_config in content, "Ancre INSCRIPTION_SLOTS introuvable"
content = content.replace(anchor_config, anchor_config + SONDAGE_CONFIG, 1)
print("✓ Config SONDAGE_JUILLET injecté")

# ── 3. Fonctions JS ──────────────────────────────────────────────────────────
SONDAGE_JS = """
/* ── Sondage Juillet ── */
function _renderSondageHTML(knownPlayers) {
  var opts = knownPlayers.map(function(p){ return '<option value="'+p+'">'+p+'</option>'; }).join('');
  var checks = SONDAGE_JUILLET.dates.map(function(d){
    return '<label class="sondage-check-row"><input type="checkbox" id="sondage-chk-'+d.id+'" value="'+d.id+'"><span class="sondage-check-label">'+d.label+'</span></label>';
  }).join('');
  var rows = SONDAGE_JUILLET.dates.map(function(d){
    return '<div>'
      +'<div class="sondage-row-header"><span class="sondage-row-label">'+d.label+'</span><span class="sondage-row-count" id="sondage-count-'+d.id+'">0</span></div>'
      +'<div class="sondage-bar"><div class="sondage-bar-fill" id="sondage-bar-'+d.id+'" style="width:0%"></div></div>'
      +'<div class="sondage-names" id="sondage-names-'+d.id+'"></div>'
      +'</div>';
  }).join('');
  return '<div class="sondage-section-label">— Juillet 2026 —</div>'
    +'<div class="sondage-card">'
    +'<div class="sondage-title">🗓️ Sondage Juillet</div>'
    +'<div class="sondage-desc">Tu seras dispo cet été ?</div>'
    +'<select class="ins-select" id="sondage-name-select" style="width:100%;margin-bottom:.7rem"><option value="">— Ton prénom —</option>'+opts+'</select>'
    +'<div class="sondage-checkboxes">'+checks+'</div>'
    +'<button class="ins-btn" id="sondage-submit-btn" onclick="doSondageSubmit()" style="width:100%">Je réponds ✓</button>'
    +'<div class="sondage-results">'+rows+'</div>'
    +'</div>';
}

function loadSondageJuillet() {
  var promises = SONDAGE_JUILLET.dates.map(function(d){ return sbGetRegistrations(d.id); });
  Promise.all(promises).then(function(results) {
    var maxCount = Math.max(1, Math.max.apply(null, results.map(function(r){ return r.length; })));
    SONDAGE_JUILLET.dates.forEach(function(d, i) {
      var regs = results[i];
      var countEl  = document.getElementById('sondage-count-'+d.id);
      var barEl    = document.getElementById('sondage-bar-'+d.id);
      var namesEl  = document.getElementById('sondage-names-'+d.id);
      if(countEl) countEl.textContent = regs.length;
      if(barEl)   barEl.style.width   = Math.round(regs.length / maxCount * 100) + '%';
      if(namesEl) namesEl.textContent = regs.map(function(r){ return r.player_name; }).join(', ');
    });
    var myName = localStorage.getItem('presence_name') || '';
    var sel = document.getElementById('sondage-name-select');
    if(myName && sel) sel.value = myName;
    SONDAGE_JUILLET.dates.forEach(function(d, i) {
      var chk = document.getElementById('sondage-chk-'+d.id);
      if(chk && myName) chk.checked = results[i].some(function(r){ return r.player_name === myName; });
    });
  }).catch(function(){});
}

function doSondageSubmit() {
  var name = (document.getElementById('sondage-name-select').value || '').trim();
  if(!name) { alert('Choisis ton prénom'); return; }
  localStorage.setItem('presence_name', name);
  var btn = document.getElementById('sondage-submit-btn');
  if(btn) { btn.disabled = true; btn.textContent = '…'; }
  var promises = SONDAGE_JUILLET.dates.map(function(d) {
    var chk = document.getElementById('sondage-chk-'+d.id);
    return (chk && chk.checked) ? sbRegister(d.id, name) : sbUnregister(d.id, name);
  });
  Promise.all(promises).then(function() {
    if(btn) { btn.disabled = false; btn.textContent = 'Réponse enregistrée ✓'; }
    loadSondageJuillet();
  }).catch(function() {
    if(btn) { btn.disabled = false; btn.textContent = 'Erreur — réessaie'; }
  });
}"""

anchor_js = "async function sbUnregister(slotId, name) {\n  var r = await fetch(SB_URL + '/rest/v1/registrations?slot_id=eq.' + encodeURIComponent(slotId) + '&player_name=eq.' + encodeURIComponent(name), {\n    method: 'DELETE', headers: sbHeaders()\n  });\n  if (!r.ok) throw new Error('sbUnregister ' + r.status);\n}"
assert anchor_js in content, "Ancre sbUnregister introuvable"
content = content.replace(anchor_js, anchor_js + SONDAGE_JS, 1)
print("✓ Fonctions JS injectées")

# ── 4. Appel dans renderInscriptions() ───────────────────────────────────────
# Avant wrap.innerHTML=html : ajouter le bloc sondage
OLD_WRAP = "  wrap.innerHTML=html;\n\n  INSCRIPTION_SLOTS.forEach(function(slot){"
NEW_WRAP = "  html+=_renderSondageHTML(knownPlayers);\n  wrap.innerHTML=html;\n\n  loadSondageJuillet();\n\n  INSCRIPTION_SLOTS.forEach(function(slot){"
assert OLD_WRAP in content, "Ancre wrap.innerHTML introuvable"
content = content.replace(OLD_WRAP, NEW_WRAP, 1)
print("✓ renderInscriptions() mis à jour")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ index.html mis à jour avec succès")
