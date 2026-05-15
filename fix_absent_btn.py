#!/usr/bin/env python3
with open('index.html', 'r') as f:
    c = f.read()

old = "  if (status === 'absent') {\n    html += '<button class=\"pbtn pbtn-absent active\" onclick=\"setPresence(\\'' + sid + '\\',\\'' + name + '\\',\\'absent\\')" + '" style="opacity:.7">❌ Absent</button>\';\n  } else {'

new = "  if (status === 'absent') {\n    html += '<button class=\"pbtn pbtn-playing\" onclick=\"setPresence(\\'' + sid + '\\',\\'' + name + '\\',\\'playing\\')\">" + "✅ Joue</button>';\n    html += '<button class=\"pbtn pbtn-absent active\" onclick=\"setPresence(\\'' + sid + '\\',\\'' + name + '\\',\\'absent\\')" + '" style="opacity:.7">❌ Absent</button>\';\n  } else {'

c2 = c.replace(old, new, 1)
if c2 == c:
    print('❌ non trouvé, cherche variante...')
    idx = c.find("if (status === 'absent')")
    print(repr(c[idx:idx+300]))
else:
    with open('index.html', 'w') as f:
        f.write(c2)
    print('✅ bouton Joue ajouté pour les absents')
