#!/usr/bin/env python3
"""s10 : échange les GK — Rémi → Bleue(50,92), Michael → Blanche(50,8)"""

with open('index.html', 'r') as f:
    c = f.read()

s10_start = c.find("id:'s10'")
s9_start  = c.find("id:'s9'")

def swap(content, s10_s, s9_s, name, ox, oy, ot, nx, ny, nt):
    old = '{x:%d,y:%d,name:"%s",teamA:%s,' % (ox, oy, name, ot)
    new = '{x:%d,y:%d,name:"%s",teamA:%s,' % (nx, ny, name, nt)
    pos = content.find(old, s10_s)
    if pos < 0 or pos > s9_s:
        print(f"  ❌ {name} non trouvé"); return content
    content = content[:pos] + new + content[pos+len(old):]
    s9_s2 = content.find("id:'s9'")
    old_cls = 'class="card team-a"' if ot == 'true' else 'class="card team-b"'
    new_cls = 'class="card team-a"' if nt == 'true' else 'class="card team-b"'
    cp = content.find(old_cls, pos)
    if 0 < cp < s9_s2:
        content = content[:cp] + new_cls + content[cp+len(old_cls):]
    print(f"  ✅ {name} ({ox},{oy},{ot}) → ({nx},{ny},{nt})")
    return content

c = swap(c, s10_start, s9_start, 'Rémi',    50,  8, 'true',  50, 92, 'false')
s10_start = c.find("id:'s10'"); s9_start = c.find("id:'s9'")
c = swap(c, s10_start, s9_start, 'Michael', 50, 92, 'false', 50,  8, 'true')

with open('index.html', 'w') as f:
    f.write(c)
