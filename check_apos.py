#!/usr/bin/env python3
"""Détecte les apostrophes françaises non échappées dans les strings JS single-quotées."""
import re, sys

with open('index.html', 'r') as f:
    content = f.read()

script_start = content.find('<script>')
script_end = content.rfind('</script>')
script = content[script_start:script_end]

risks = []
for i, line in enumerate(script.split('\n'), 1):
    stripped = line.strip()
    if stripped.startswith('//') or stripped.startswith('*'):
        continue
    parts = re.findall(r"'([^'\\\n]{3,})'", line)
    for part in parts:
        if re.search(r"[a-zA-ZÀ-ÿ]'[a-zA-ZÀ-ÿ]", part):
            risks.append((i, part, line.strip()[:100]))

if risks:
    print(f"⚠️  {len(risks)} apostrophe(s) à risque trouvée(s) :")
    for lineno, match, line in risks:
        print(f"  L{lineno}: '{match}' — {line}")
    sys.exit(1)
else:
    print("✅ Aucune apostrophe non échappée détectée.")
