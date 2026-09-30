#!/usr/bin/env python3
"""Ajoute ⚽ dans la liste match pour les joueurs aussi inscrits au five."""

with open('index.html', 'r') as f:
    c = f.read()

# Find and replace _updateMatchUI — pass fiveRegs to it
# Change signature to accept fiveRegs
old_sig = "function _updateMatchUI(matchEvent, matchRegs, fiveOpen){"
new_sig = "function _updateMatchUI(matchEvent, matchRegs, fiveOpen, fiveRegs){\n  var fiveNames=(fiveRegs||[]).map(function(r){return r.player_name;});"

if old_sig in c:
    c = c.replace(old_sig, new_sig, 1)
    print("✅ Signature _updateMatchUI mise à jour")
else:
    print("❌ Signature non trouvée")

# Replace the row rendering inside _updateMatchUI to add ⚽ badge
old_row = """    matchRegs.forEach(function(r){
      var nameHtml=fiveOpen
        ?'<span class="ins-name ins-name-tap" onclick="insConfirmMatch(\''+matchEvent.id+'\',\''+r.player_name+'\')">'+r.player_name+'</span>'
        :'<span class="ins-name">'+r.player_name+'</span>';
      html+='<div class="ins-item starter" style="background:rgba(0,35,90,.25)">'+nameHtml+'</div>';
    });"""

new_row = """    matchRegs.forEach(function(r){
      var alsoFive=fiveNames.indexOf(r.player_name)!==-1;
      var badge=alsoFive?'<span style="font-size:.8rem;margin-right:.3rem">⚽</span>':'';
      var nameHtml=fiveOpen
        ?'<span class="ins-name ins-name-tap" onclick="insConfirmMatch(\''+matchEvent.id+'\',\''+r.player_name+'\')">'+r.player_name+'</span>'
        :'<span class="ins-name">'+r.player_name+'</span>';
      html+='<div class="ins-item starter" style="background:rgba(0,35,90,.25)">'+badge+nameHtml+'<span style="font-size:.8rem;margin-left:.3rem">🇫🇷🇮🇶</span></div>';
    });"""

if old_row in c:
    c = c.replace(old_row, new_row, 1)
    print("✅ Badge ⚽ ajouté dans la liste match")
else:
    print("❌ Ancre row non trouvée")

# Pass fiveRegs when calling _updateMatchUI from _updateSlotUI
old_call = "    _updateMatchUI(slot.matchEvent, matchRegs, slot.open);"
new_call = "    _updateMatchUI(slot.matchEvent, matchRegs, slot.open, regs);"

if old_call in c:
    c = c.replace(old_call, new_call, 1)
    print("✅ fiveRegs passé à _updateMatchUI")
else:
    print("❌ Ancre call non trouvée")

# Also pass fiveRegs in doRegisterMatch and insConfirmMatch callbacks
old_reload1 = "        _updateSlotUI(parentSlot, fiveRegs, '', regs);\n      });\n    } else {\n      _updateMatchUI({id:matchSlotId,label:''}, regs, true);\n    }\n  }).catch(function(e){ console.error(e); });\n}\n\nfunction insConfirmMatch"
new_reload1 = "        _updateSlotUI(parentSlot, fiveRegs, '', regs);\n      });\n    } else {\n      _updateMatchUI({id:matchSlotId,label:''}, regs, true, []);\n    }\n  }).catch(function(e){ console.error(e); });\n}\n\nfunction insConfirmMatch"

if old_reload1 in c:
    c = c.replace(old_reload1, new_reload1, 1)
    print("✅ fallback doRegisterMatch mis à jour")
else:
    print("❌ Ancre reload1 non trouvée")

with open('index.html', 'w') as f:
    f.write(c)

print("\nDone.")
