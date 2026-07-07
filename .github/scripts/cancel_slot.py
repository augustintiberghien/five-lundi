"""
Annule un créneau d'inscription : supprime les inscriptions/présences/compo
partagée côté Supabase, et retire le créneau de INSCRIPTION_SLOTS.

Appelé par le GitHub Action cancel-slot.yml.
"""
import json
import os
import re
import sys
import urllib.parse
import urllib.request

SLOT_ID = os.environ['SLOT_ID']

with open('index.html', encoding='utf-8') as f:
    content = f.read()

SB_URL = re.search(r"var SB_URL\s*=\s*'([^']+)'", content).group(1)
SB_KEY = re.search(r"var SB_KEY\s*=\s*'([^']+)'", content).group(1)


def sb_delete(path):
    req = urllib.request.Request(
        SB_URL + path,
        headers={'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Prefer': 'return=representation'},
        method='DELETE',
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read() or b'[]')


sid_q = urllib.parse.quote(SLOT_ID)

deleted_regs = sb_delete(f'/rest/v1/registrations?slot_id=eq.{sid_q}')
names = ', '.join(r['player_name'] for r in deleted_regs)
print(f"Inscriptions supprimées : {len(deleted_regs)}" + (f" ({names})" if names else ""))

deleted_pres = sb_delete(f'/rest/v1/presences?session_id=eq.{sid_q}')
print(f"Présences supprimées : {len(deleted_pres)}")

deleted_compo = sb_delete(f'/rest/v1/slot_sessions?slot_id=eq.{sid_q}')
print(f"Compo partagée supprimée : {len(deleted_compo)}")

# ── Retirer le créneau de INSCRIPTION_SLOTS ──
pattern = re.compile(r"\n\s*\{\s*id:'" + re.escape(SLOT_ID) + r"'.*?\},")
m = pattern.search(content)
if not m:
    print(f"⚠️ Créneau {SLOT_ID} introuvable dans INSCRIPTION_SLOTS — rien à retirer côté HTML")
    sys.exit(0)

content = content[:m.start()] + content[m.end():]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"✅ Créneau {SLOT_ID} annulé et retiré du site")
