#!/usr/bin/env python3
with open('index.html', 'rb') as f:
    cb = f.read()

idx = cb.find(b'matchRegs.forEach')
end = cb.find(b'listEl.innerHTML', idx)
target = cb[idx:end]

replacement = (
    b"matchRegs.forEach(function(r){\n"
    b"      var alsoFive=fiveNames.indexOf(r.player_name)!==-1;\n"
    b"      var badge=alsoFive?'<span style=\"font-size:.8rem;margin-right:.3rem\">\xe2\x9a\xbd</span>':'';\n"
    b"      var nameHtml=fiveOpen\n"
    b"        ?'<span class=\"ins-name ins-name-tap\" onclick=\"insConfirmMatch(\\''+matchEvent.id+'\\',"
    b"\\\''+r.player_name+'\\\')\">' +r.player_name+'</span>'\n"
    b"        :'<span class=\"ins-name\">'+r.player_name+'</span>';\n"
    b"      html+='<div class=\"ins-item starter\" style=\"background:rgba(0,35,90,.25)\">'+"
    b"badge+nameHtml+'<span style=\"font-size:.8rem;margin-left:.3rem\">\xf0\x9f\x87\xab\xf0\x9f\x87\xb7\xf0\x9f\x87\xae\xf0\x9f\x87\xb6</span></div>';\n"
    b"    });\n  }\n  "
)

cb2 = cb[:idx] + replacement + cb[end:]
with open('index.html', 'wb') as f:
    f.write(cb2)
print("✅ Badge ⚽ + 🇫🇷🇮🇶 ajoutés dans la liste match")

# Verify
with open('index.html', 'rb') as f:
    verify = f.read()
if b'alsoFive' in verify:
    print("✅ Vérification OK")
else:
    print("❌ Vérification échouée")
