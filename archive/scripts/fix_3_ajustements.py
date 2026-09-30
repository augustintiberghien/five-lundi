#!/usr/bin/env python3
"""3 ajustements UI inscriptions."""

with open('index.html', 'r') as f:
    c = f.read()

fixes = 0

# ── 1. Supprimer "(21h30)" du shortDate dans les onglets ──
OLD1 = "      shortDate=shortDate.trim();"
NEW1 = "      shortDate=shortDate.replace(/\\s*\\([^)]*\\)/g,'').trim();"
if OLD1 in c:
    c = c.replace(OLD1, NEW1, 1)
    print("✅ Fix 1 : (21h30) retiré des onglets")
    fixes += 1
else:
    print("❌ Fix 1 : ancre non trouvée")

# ── 2a. Griser les joueurs déjà inscrits dans le dropdown Five ──
OLD2 = """  var players=Object.keys(Object.assign({},PLAYER_STATS,PLAYER_NOTES)).sort();
  var opts=players.map(function(n){ return '<option value="'+n+'">'+n+'</option>'; }).join('');
  formEl.innerHTML=`<div class="ins-register"><select class="ins-select" id="ins-input-${slot.id}"><option value="">— Ton prénom —</option>${opts}</select><button class="ins-btn" onclick="doRegister('${slot.id}')">S'inscrire</button></div>`;"""
NEW2 = """  var players=Object.keys(Object.assign({},PLAYER_STATS,PLAYER_NOTES)).sort();
  var regNames=regs.map(function(r){return r.player_name;});
  var opts=players.map(function(n){var d=regNames.indexOf(n)!==-1;return '<option value="'+n+'"'+(d?' disabled':'')+'>'+(d?'✓ ':'')+n+'</option>';}).join('');
  formEl.innerHTML=`<div class="ins-register"><select class="ins-select" id="ins-input-${slot.id}"><option value="">— Ton prénom —</option>${opts}</select><button class="ins-btn" onclick="doRegister('${slot.id}')">S'inscrire</button></div>`;"""
if OLD2 in c:
    c = c.replace(OLD2, NEW2, 1)
    print("✅ Fix 2a : dropdown Five — joueurs déjà inscrits grisés")
    fixes += 1
else:
    print("❌ Fix 2a : ancre non trouvée")

# ── 2b. Griser les joueurs déjà inscrits dans le dropdown Match ──
OLD3 = """  var players=Object.keys(Object.assign({},PLAYER_STATS,PLAYER_NOTES)).sort();
  var opts=players.map(function(n){ return '<option value="'+n+'">'+n+'</option>'; }).join('');
  formEl.innerHTML=`<div class="ins-register" style="margin-top:.5rem"><select class="ins-select" id="ins-match-input-${matchEvent.id}"><option value="">— Ton prénom —</option>${opts}</select><button class="ins-btn" style="background:rgba(0,50,150,.6);border-color:rgba(100,150,255,.4)" onclick="doRegisterMatch('${matchEvent.id}')">Je regarde 🇫🇷🇮🇶</button></div>`;"""
NEW3 = """  var players=Object.keys(Object.assign({},PLAYER_STATS,PLAYER_NOTES)).sort();
  var matchRegNames=matchRegs.map(function(r){return r.player_name;});
  var opts=players.map(function(n){var d=matchRegNames.indexOf(n)!==-1;return '<option value="'+n+'"'+(d?' disabled':'')+'>'+(d?'✓ ':'')+n+'</option>';}).join('');
  formEl.innerHTML=`<div class="ins-register" style="margin-top:.5rem"><select class="ins-select" id="ins-match-input-${matchEvent.id}"><option value="">— Ton prénom —</option>${opts}</select><button class="ins-btn" style="background:rgba(0,50,150,.6);border-color:rgba(100,150,255,.4);color:#fff" onclick="doRegisterMatch('${matchEvent.id}')">Je regarde 🇫🇷🇮🇶</button></div>`;"""
if OLD3 in c:
    c = c.replace(OLD3, NEW3, 1)
    print("✅ Fix 2b+3 : dropdown Match grisé + texte 'Je regarde' en blanc")
    fixes += 1
else:
    print("❌ Fix 2b+3 : ancre non trouvée")

print(f"\n{fixes}/3 fixes appliqués")

with open('index.html', 'w') as f:
    f.write(c)
