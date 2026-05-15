#!/usr/bin/env python3
with open('index.html', 'r') as f:
    c = f.read()

old = """    matchRegs.forEach(function(r){
      var nameHtml=fiveOpen
        ?'<span class="ins-name ins-name-tap" onclick="insConfirmMatch(\\\''+matchEvent.id+'\\\',' +
'\\\''+r.player_name+'\\\')">'+r.player_name+'</span>'
        :'<span class="ins-name">'+r.player_name+'</span>';
      html+='<div class="ins-item starter" style="background:rgba(0,35,90,.25)">'+nameHtml+'</div>';
    });"""

# Direct byte replacement
target = b"    matchRegs.forEach(function(r){\n      var nameHtml=fiveOpen\n        ?'<span class=\"ins-name ins-name-tap\" onclick=\"insConfirmMatch(\\\''+matchEvent.id+'\\\',\\\''+r.player_name+'\\\')\">' +r.player_name+'</span>'\n        :'<span class=\"ins-name\">'+r.player_name+'</span>';\n      html+='<div class=\"ins-item starter\" style=\"background:rgba(0,35,90,.25)\">'+nameHtml+'</div>';\n    });"

replacement = b"    matchRegs.forEach(function(r){\n      var alsoFive=fiveNames.indexOf(r.player_name)!==-1;\n      var badge=alsoFive?'<span style=\"font-size:.8rem;margin-right:.3rem\">\xe2\x9a\xbd</span>':'';\n      var nameHtml=fiveOpen\n        ?'<span class=\"ins-name ins-name-tap\" onclick=\"insConfirmMatch(\\\''+matchEvent.id+'\\\',\\\''+r.player_name+'\\\')\">' +r.player_name+'</span>'\n        :'<span class=\"ins-name\">'+r.player_name+'</span>';\n      html+='<div class=\"ins-item starter\" style=\"background:rgba(0,35,90,.25)\">'+badge+nameHtml+'<span style=\"font-size:.8rem;margin-left:.3rem\">\xf0\x9f\x87\xab\xf0\x9f\x87\xb7\xf0\x9f\x87\xae\xf0\x9f\x87\xb6</span></div>';\n    });"

cb = c.encode('utf-8')
if target in cb:
    cb2 = cb.replace(target, replacement, 1)
    with open('index.html', 'wb') as f:
        f.write(cb2)
    print("✅ Badge ⚽ + 🇫🇷🇮🇶 ajoutés dans la liste match")
else:
    print("❌ cible non trouvée")
    # Show surrounding context
    idx = cb.find(b'matchRegs.forEach')
    print(repr(cb[idx:idx+300]))
