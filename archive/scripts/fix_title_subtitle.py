#!/usr/bin/env python3
"""Ajoute 'five lundi' comme sous-titre visible sous 'vestiaire' dans le header."""
import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# ── CSS : ajouter la classe .title-sub ──────────────────────────────────────
OLD_CSS = ".meta-sub{font-size:.62rem;color:rgba(255,255,255,.28);margin-top:.35rem;letter-spacing:.22em;text-transform:uppercase}"
NEW_CSS = (OLD_CSS +
           ".title-sub{font-family:'Oswald',sans-serif;font-size:clamp(.8rem,2.2vw,1rem);"
           "font-weight:400;color:rgba(255,255,255,.45);letter-spacing:.25em;"
           "text-transform:uppercase;margin-top:.3rem}")

if OLD_CSS not in content:
    print('ERREUR : CSS .meta-sub non trouvé')
    sys.exit(1)

content = content.replace(OLD_CSS, NEW_CSS, 1)
print('✓ CSS .title-sub ajouté')

# ── HTML : insérer le sous-titre entre .title et .meta-sub ──────────────────
OLD_HTML = '  <div class="title">vestiaire</div>\n  <div class="meta-sub">'
NEW_HTML = '  <div class="title">vestiaire</div>\n  <div class="title-sub">five lundi</div>\n  <div class="meta-sub">'

if OLD_HTML not in content:
    print('ERREUR : structure header non trouvée')
    sys.exit(1)

content = content.replace(OLD_HTML, NEW_HTML, 1)
print('✓ Sous-titre "five lundi" inséré dans le header')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('✓ index.html mis à jour')
