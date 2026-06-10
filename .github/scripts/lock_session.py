"""Lock du lundi 21h30 : promeut le créneau du jour en entrée SESSIONS figée.

Lit la compo partagée dans la table Supabase slot_sessions (publiée par le
front dès 10 inscrits), construit l'entrée SESSIONS correspondante et
l'insère en tête du tableau dans index.html. La compo devient définitive :
le front ne regénère jamais une entrée SESSIONS.

Cas tournoi (4 équipes) : non géré — promotion manuelle, comme avant.
"""
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime
from zoneinfo import ZoneInfo

TRIGGER = os.environ.get('TRIGGER', 'schedule')
PARIS = ZoneInfo('Europe/Paris')
now = datetime.now(PARIS)

# Le cron tourne en UTC à 19h35 ET 20h35 le lundi pour couvrir été/hiver :
# seule l'exécution qui tombe après 21h30 heure de Paris fait le travail.
if TRIGGER == 'schedule':
    if now.weekday() != 0 or (now.hour, now.minute) < (21, 30):
        print(f"Pas encore lundi 21h30 à Paris ({now:%A %H:%M}) — rien à faire")
        sys.exit(0)

with open('index.html', encoding='utf-8') as f:
    content = f.read()

MONTHS = {
    'janvier': 1, 'février': 2, 'mars': 3, 'avril': 4, 'mai': 5, 'juin': 6,
    'juillet': 7, 'août': 8, 'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12,
}
MONTH_NAMES = {v: k for k, v in MONTHS.items()}

# ── Trouver le créneau du jour dans INSCRIPTION_SLOTS ──
slots_block = re.search(r'var INSCRIPTION_SLOTS = \[(.*?)\n\];', content, re.DOTALL)
if not slots_block:
    print('INSCRIPTION_SLOTS introuvable')
    sys.exit(1)

today_slot = None
for line in slots_block.group(1).split('\n'):
    m = re.search(r"id:'(ins_[a-z0-9_]+)'.*?label:'([^']+)'", line)
    if not m:
        continue
    slot_id, label = m.group(1), m.group(2)
    clean = re.sub(r'\s*\([^)]*\)', '', label)
    clean = re.sub(r'[ᵉʳˢⁱᵒ]+', '', clean)
    d = re.search(r'(\d{1,2})\s+(\S+)\s+(\d{4})', clean)
    if not d or d.group(2).lower() not in MONTHS:
        continue
    slot_date = (int(d.group(3)), MONTHS[d.group(2).lower()], int(d.group(1)))
    if slot_date == (now.year, now.month, now.day):
        today_slot = {'id': slot_id, 'line': line, 'tournament': 'tournament:' in line}
        break

if not today_slot:
    print(f"Aucun créneau d'inscription pour aujourd'hui ({now:%d/%m/%Y}) — rien à faire")
    sys.exit(0)

if today_slot['tournament']:
    print(f"⚠️ {today_slot['id']} est un tournoi (4 équipes) — promotion manuelle requise")
    sys.exit(0)

date_str = f"{now.day} {MONTH_NAMES[now.month]} {now.year}"
if re.search(rf"date:'{re.escape(date_str)}'", content):
    print(f"Une session datée du {date_str} existe déjà dans SESSIONS — rien à faire")
    sys.exit(0)

print(f"Créneau du jour : {today_slot['id']}")

# ── Lire la compo partagée + les inscriptions dans Supabase ──
SB_URL = re.search(r"var SB_URL\s*=\s*'([^']+)'", content).group(1)
SB_KEY = re.search(r"var SB_KEY\s*=\s*'([^']+)'", content).group(1)


def sb_get(path):
    req = urllib.request.Request(
        SB_URL + path,
        headers={'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


sid_q = urllib.parse.quote(today_slot['id'])
regs = sb_get(f'/rest/v1/registrations?slot_id=eq.{sid_q}&order=registered_at.asc&select=player_name')
if len(regs) < 10:
    print(f'Seulement {len(regs)} inscrits — match incomplet, pas de lock')
    sys.exit(0)

rows = sb_get(f'/rest/v1/slot_sessions?slot_id=eq.{sid_q}')
if not rows or not rows[0].get('players') or len(rows[0]['players']) != 10:
    print('❌ 10 inscrits mais aucune compo publiée dans slot_sessions — lock impossible')
    sys.exit(1)

row = rows[0]
players = row['players']

# Banc = inscrits hors compo et non absents (feuille de match)
try:
    pres = sb_get(f'/rest/v1/presences?session_id=eq.{sid_q}&select=name,status')
except Exception:
    pres = []
absents = {p['name'] for p in pres if p.get('status') == 'absent'}
compo_names = {p['name'] for p in players}
bench = [r['player_name'] for r in regs
         if r['player_name'] not in compo_names and r['player_name'] not in absents]

# benchPriority éventuel du slot (ordre de remplacement prioritaire)
bp = re.search(r"benchPriority:\[([^\]]*)\]", today_slot['line'])
if bp:
    prio = re.findall(r"'([^']+)'", bp.group(1))
    bench.sort(key=lambda n: (prio.index(n) if n in prio else len(prio)))

# ── Construire l'entrée SESSIONS (sans html : le front le reconstruit) ──
next_n = max(int(n) for n in re.findall(r"\{id:'s(\d+)'", content)) + 1
players_js = ','.join(
    '{x:%s,y:%s,name:%s,teamA:%s}' % (
        p['x'], p['y'], json.dumps(p['name'], ensure_ascii=False),
        'true' if p['teamA'] else 'false',
    )
    for p in players
)
bench_js = ','.join(json.dumps(b, ensure_ascii=False) for b in bench)
note_a = row.get('note_a') if row.get('note_a') is not None else ''
note_b = row.get('note_b') if row.get('note_b') is not None else ''
entry = (
    "{id:'s%d',date:'%s',score:'',scoreWinner:'',balanceNoteA:%s,balanceNoteB:%s,"
    "current:true,bench:[%s],nameA:'Blanche ⚪',nameB:'Bleue 🔵',players:[%s]},\n"
    % (next_n, date_str, note_a or 0, note_b or 0, bench_js, players_js)
)

content = content.replace('current:true', 'current:false')
content = content.replace('var SESSIONS = [', 'var SESSIONS = [' + entry, 1)

# Fermer les inscriptions du créneau promu
new_line = today_slot['line'].replace('open:true', 'open:false')
content = content.replace(today_slot['line'], new_line, 1)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"✅ Session s{next_n} ({date_str}) figée — compo : "
      + ', '.join(p['name'] for p in players)
      + (f" | banc : {', '.join(bench)}" if bench else ''))
