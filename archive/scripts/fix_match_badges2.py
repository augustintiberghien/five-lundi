#!/usr/bin/env python3
with open('index.html', 'r') as f:
    c = f.read()

old = (
    "    matchRegs.forEach(function(r){\n"
    "      var nameHtml=fiveOpen\n"
    "        ?'<span class=\"ins-name ins-name-tap\" onclick=\"insConfirmMatch(\\''+matchEvent.id+'\\',"
    "\\''+r.player_name+'\\')\">' +r.player_name+'</span>'\n"
    "        :'<span class=\"ins-name\">'+r.player_name+'</span>';\n"
    "      html+='<div class=\"ins-item starter\" style=\"background:rgba(0,35,90,.25)\">'+nameHtml+'</div>';\n"
    "    });"
)

# Find the exact text
idx = c.find('matchRegs.forEach(function(r){')
chunk = c[idx:idx+500]
print(repr(chunk))
