#!/usr/bin/env python3
with open('index.html', 'r') as f:
    c = f.read()

OLD = "  renderPresence(s);\n  setActiveTab(s.id);\n}\n\nfunction renderSession(s){"
NEW = "  setActiveTab(s.id);\n}\n\nfunction renderSession(s){"

if OLD in c:
    c = c.replace(OLD, NEW, 1)
    print("✅ renderPresence supprimé de renderInFormation")
else:
    print("❌ Ancre non trouvée")

with open('index.html', 'w') as f:
    f.write(c)
