#!/usr/bin/env python3
"""Vérifie les erreurs JS courantes dans index.html."""
import re, sys

with open('index.html', 'r') as f:
    content = f.read()

script_start = content.find('<script>')
script_end = content.rfind('</script>')
script = content[script_start:script_end]

errors = []

# 1. Apostrophes françaises non échappées dans des strings single-quotées
for i, line in enumerate(script.split('\n'), 1):
    stripped = line.strip()
    if stripped.startswith('//') or stripped.startswith('*'):
        continue
    parts = re.findall(r"'([^'\\\n]{3,})'", line)
    for part in parts:
        if re.search(r"[a-zA-ZÀ-ÿ]'[a-zA-ZÀ-ÿ]", part):
            errors.append(f"L{i} apostrophe: '{part}' — {line.strip()[:80]}")

# 2. Virgules manquantes dans les objets JS clés
data_blocks = ['var PLAYER_STATS', 'var PLAYER_NOTES', 'var PLAYER_ROLES',
               'var PAIR_STATS', 'var ARTICLES', 'var INSCRIPTION_SLOTS']
for block_name in data_blocks:
    start = content.find(block_name)
    if start == -1:
        continue
    end = content.find('\n};', start) + 3
    block = content[start:end]
    # Detect: value ending with } followed by newline + whitespace + quote (missing comma)
    for m in re.finditer(r'\}(\s*\n\s+)[\'"]', block):
        ctx = block[max(0,m.start()-40):m.end()+20]
        # Skip the last entry (no comma needed) by checking if } is the closing of the object
        if block[m.end()-1:].startswith(("'", '"')) :
            line_ctx = ctx.replace('\n', '↵')
            errors.append(f"{block_name}: virgule manquante → {line_ctx.strip()[:80]}")
            break  # one error per block is enough

if errors:
    print(f"⚠️  {len(errors)} problème(s) détecté(s) :")
    for e in errors:
        print(f"  {e}")
    sys.exit(1)
else:
    print("✅ Aucun problème détecté (apostrophes + virgules).")
