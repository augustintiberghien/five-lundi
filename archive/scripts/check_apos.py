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
# Approche robuste : on cherche le motif lettre+'lettre directement dans la ligne,
# mais uniquement à l'intérieur d'une string single-quotée (pas en double-quote).
# On utilise un tokenizer simple plutôt qu'un regex aveugle aux emoji.
for i, line in enumerate(script.split('\n'), 1):
    stripped = line.strip()
    if stripped.startswith('//') or stripped.startswith('*'):
        continue
    # Tokenize: find all single-quoted string spans (ignoring escaped quotes)
    in_sq = False
    in_dq = False
    sq_content = []
    j = 0
    while j < len(line):
        c = line[j]
        if c == '\\':
            j += 2
            continue
        if c == "'" and not in_dq:
            if in_sq:
                # closing quote — check collected content for apostrophes
                segment = ''.join(sq_content)
                if re.search(r"[a-zA-ZÀ-ÿ]'[a-zA-ZÀ-ÿ]", segment):
                    errors.append(f"L{i} apostrophe: {line.strip()[:80]}")
                    break
                # Also check: if next char is a letter, the ' was an apostrophe (not a closing quote)
                next_char = line[j+1] if j+1 < len(line) else ''
                last_char = sq_content[-1] if sq_content else ''
                if re.match(r'[a-zA-ZÀ-ÿ]', next_char) and re.match(r'[a-zA-ZÀ-ÿ]', last_char):
                    errors.append(f"L{i} apostrophe: {line.strip()[:80]}")
                    break
                in_sq = False
                sq_content = []
            else:
                in_sq = True
            j += 1
            continue
        if c == '"' and not in_sq:
            in_dq = not in_dq
            j += 1
            continue
        if in_sq:
            sq_content.append(c)
        j += 1

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
