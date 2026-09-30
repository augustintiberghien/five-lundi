#!/usr/bin/env python3
with open('index.html', 'rb') as f:
    cb = f.read()

target = b"matchRegs.forEach(function(r){\n      var nameHtml=fiveOpen\n        ?'<span class=\"ins-name ins-name-tap\" onclick=\"insConfirmMatch(\\''+matchEvent.id+'\\',\\''+r.player_name+'\\'\">' +r.player_name+'</span>'\n        :'<span class=\"ins-name\">'+r.player_name+'</span>';\n      html+='<div class=\"ins-item starter\" style=\"background:rgba(0,35,90,.25)\">' +nameHtml+'</div>';\n    });\n  }\n  '"

# Use the exact bytes we found
old = b"matchRegs.forEach(function(r){\n      var nameHtml=fiveOpen\n        ?'<span class=\"ins-name ins-name-tap\" onclick=\"insConfirmMatch(\\''+matchEvent.id+'\\'," + b"\\'" + b"'+r.player_name+'\\'\">' +r.player_name+'</span>'\n        :'<span class=\"ins-name\">'+r.player_name+'</span>';\n      html+='<div class=\"ins-item starter\" style=\"background:rgba(0,35,90,.25)\">' +nameHtml+'</div>';\n    });\n  }\n  '"

new = b"matchRegs.forEach(function(r){\n      var alsoFive=fiveNames.indexOf(r.player_name)!==-1;\n      var badge=alsoFive?'<span style=\"font-size:.8rem;margin-right:.3rem\">\xe2\x9a\xbd</span>':'';\n      var nameHtml=fiveOpen\n        ?'<span class=\"ins-name ins-name-tap\" onclick=\"insConfirmMatch(\\''+matchEvent.id+'\\'," + b"\\'" + b"'+r.player_name+'\\'\">' +r.player_name+'</span>'\n        :'<span class=\"ins-name\">'+r.player_name+'</span>';\n      html+='<div class=\"ins-item starter\" style=\"background:rgba(0,35,90,.25)\">' +badge+nameHtml+'<span style=\"font-size:.8rem;margin-left:.3rem\">\xf0\x9f\x87\xab\xf0\x9f\x87\xb7\xf0\x9f\x87\xae\xf0\x9f\x87\xb6</span></div>';\n    });\n  }\n  '"

if old in cb:
    cb2 = cb.replace(old, new, 1)
    with open('index.html', 'wb') as f:
        f.write(cb2)
    print("✅ Badges ajoutés")
else:
    # Try finding the exact sequence from the file
    idx = cb.find(b'matchRegs.forEach')
    end = cb.find(b'listEl.innerHTML', idx)
    exact = cb[idx:end]
    print("Exact bytes:")
    print(repr(exact))
