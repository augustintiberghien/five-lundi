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
names = [r['player_name'] for r in regs]

# Titulaires effectifs : ordre d'inscription, banc trié par priorité, absents (feuille de match) exclus
try:
    pres = sb_get(f'/rest/v1/presences?session_id=eq.{sid_q}&select=name,status')
except Exception:
    pres = []
absents = {p['name'] for p in pres if p.get('status') == 'absent'}

starters, bench_raw = names[:10], names[10:]
bp = re.search(r"benchPriority:\[([^\]]*)\]", today_slot['line'])
if bp:
    prio = re.findall(r"'([^']+)'", bp.group(1))
    bench_raw.sort(key=lambda n: (prio.index(n) if n in prio else len(prio)))
effective = [n for n in starters + bench_raw if n not in absents][:10]
print('Inscrits :', ', '.join(names))
print('Absents  :', ', '.join(sorted(absents)) or '—')
print('Titulaires effectifs :', ', '.join(effective))

if len(effective) < 10:
    print(f'Seulement {len(effective)} titulaires effectifs — match incomplet, pas de lock')
    sys.exit(0)


def generate_compo(html, roster, together):
    """Rejoue l'algo d'équilibrage du site (fonctions extraites de index.html) via node."""
    import subprocess
    import tempfile

    def sl(a, b):
        i = html.index(a)
        return html[i:html.index(b, i)]

    js = '\n'.join([
        sl('var SESSIONS = [', '\nvar CRITERIA'),
        # _MN + _seasonOfDate : _getPlayerForm borne la forme à la saison en cours
        sl("var _MN = ['janvier'", '\n'),
        sl('function _seasonOfDate(dateStr){', '\n/* Toutes les rencontres'),
        sl('var PLAYER_NOTES = {', '\nvar PAIR_STATS'),
        sl('var PAIR_STATS = [', '\nfunction'),
        sl('var PLAYER_ROLES = {', '\nfunction'),
        sl('function getPairWinRate(n1, n2) {', '\nfunction '),
        sl('/* ── AUTO-TEAM BALANCING ── */', 'function _genTournamentTeams'),
        sl('function _assignPositions', 'var PLAYER_PHOTOS'),
    ])
    js += (
        '\nvar res=_genBalancedTeams(' + json.dumps(roster, ensure_ascii=False)
        + ',' + json.dumps(together, ensure_ascii=False) + ');'
        '\nif(!res){console.log("null");process.exit(0);}'
        '\nvar raw=_assignPositions(res.teamA,true).concat(_assignPositions(res.teamB,false))'
        '.map(function(p){return {x:p.x,y:p.y,name:p.name,teamA:p.teamA};});'
        '\nconsole.log(JSON.stringify({players:raw,note_a:res.noteA,note_b:res.noteB}));'
    )
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f:
        f.write(js)
        path = f.name
    out = subprocess.run(['node', path], capture_output=True, text=True)
    if out.returncode != 0:
        print('❌ Régénération node échouée :', out.stderr[:500])
        sys.exit(1)
    data = json.loads(out.stdout.strip().split('\n')[-1])
    if not data:
        print('❌ _genBalancedTeams n\'a pas trouvé de compo')
        sys.exit(1)
    return data


# Compo : la ligne slot_sessions si elle correspond aux 10 effectifs, sinon régénération
rows = sb_get(f'/rest/v1/slot_sessions?slot_id=eq.{sid_q}')
row = rows[0] if rows else {}
players = row.get('players') or []
note_a, note_b = row.get('note_a'), row.get('note_b')

if {p['name'] for p in players} != set(effective):
    print('Compo publiée absente ou périmée — régénération avec l\'algo du site')
    m_tog = re.search(r"together:\[([^\]]*)\]", today_slot['line'])
    together = re.findall(r"'([^']+)'", m_tog.group(1)) if m_tog else []
    if together:
        print('Contrainte together :', ', '.join(together))
    gen = generate_compo(content, effective, together)
    players, note_a, note_b = gen['players'], gen['note_a'], gen['note_b']

# ── Ancrage des couleurs sur la compo annoncée (slot_sessions) ──
# La couleur annoncée avant 21h30 fait foi. teamA=true → Blanche ⚪, teamA=false → Bleue 🔵.
# La régénération attribue teamA/teamB arbitrairement (ordre d'énumération C(10,5)) et peut
# donc retourner l'orientation des couleurs. Si la moitié « bleue » finale recoupe surtout la
# moitié « blanche » annoncée, on échange les deux équipes (couleur + côté du terrain) pour
# que chaque joueur conserve la couleur sous laquelle il a été annoncé.
announced = row.get('players') or []
if announced:
    announced_blue = {p['name'] for p in announced if not p['teamA']}
    announced_white = {p['name'] for p in announced if p['teamA']}
    final_blue = {p['name'] for p in players if not p['teamA']}
    keep = len(final_blue & announced_blue)
    flip = len(final_blue & announced_white)
    if flip > keep:
        print('↔️  Couleurs inversées par la régénération — réalignement sur l\'annonce '
              '(bleu annoncé : %s)' % ', '.join(sorted(announced_blue)))
        for p in players:
            p['teamA'] = not p['teamA']
            p['y'] = 100 - p['y']
        note_a, note_b = note_b, note_a

# ── Ancrage des positions sur la compo annoncée ──
# Aucun joueur actif n'a le rôle 'Gardien' : _assignPositions retombe alors sur
# « premier Défenseur/Récupérateur, sinon premier de la liste », donc le gardien dépend
# de l'ordre du roster. Une régénération peut ainsi déplacer un joueur déjà annoncé, y
# compris le sortir des buts. On restitue à chacun la place qu'il occupait dans la compo
# annoncée ; seuls les nouveaux venus prennent les emplacements restés libres.
SLOTS_A = [(50, 8), (12, 24), (88, 24), (35, 38), (65, 38)]
SLOTS_B = [(50, 92), (12, 76), (88, 76), (35, 62), (65, 62)]
if announced:
    ref_pos = {p['name']: (p['x'], p['y']) for p in announced if p.get('x') is not None}
    moved = []
    for side, slots in ((True, SLOTS_A), (False, SLOTS_B)):
        team = [p for p in players if bool(p['teamA']) == side]
        taken, pending = set(), []
        for p in team:
            rp = ref_pos.get(p['name'])
            if rp and rp in slots and rp not in taken:
                if (p['x'], p['y']) != rp:
                    moved.append(p['name'])
                p['x'], p['y'] = rp
                taken.add(rp)
            else:
                pending.append(p)
        for p, sl in zip(pending, [s for s in slots if s not in taken]):
            p['x'], p['y'] = sl
    if moved:
        print('📍 Positions réancrées sur la compo annoncée : ' + ', '.join(sorted(moved)))

# Banc = inscrits hors compo et non absents, dans l'ordre
compo_names = {p['name'] for p in players}
bench = [n for n in starters + bench_raw if n not in compo_names and n not in absents]

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
