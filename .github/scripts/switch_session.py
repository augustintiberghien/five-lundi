import os, json, urllib.request, datetime, sys, re

SB_URL = os.environ['SUPABASE_URL']
SB_KEY = os.environ['SUPABASE_KEY']

with open('index.html', 'r') as f:
    content = f.read()

# Find current session id
m = re.search(r"id:'(s\d+)'[^{]*?current:true", content, re.DOTALL)
if not m:
    print("Aucune session active trouvée")
    sys.exit(0)

current_id = m.group(1)
print(f"Session active : {current_id}")

# Find match date of current session
m_date = re.search(rf"id:'{current_id}'[^{{]*?date:'([^']+)'", content, re.DOTALL)
if not m_date:
    print("Date de session introuvable")
    sys.exit(1)

date_str = m_date.group(1)  # ex: "18 mai 2026"
MONTHS = {
    'janvier':1,'février':2,'mars':3,'avril':4,'mai':5,'juin':6,
    'juillet':7,'août':8,'septembre':9,'octobre':10,'novembre':11,'décembre':12
}
parts = date_str.split()
match_date = datetime.datetime(int(parts[2]), MONTHS[parts[1]], int(parts[0]),
                               tzinfo=datetime.timezone.utc)

# Deadline = lendemain 22h30 Paris (CEST = UTC+2 en été, CET = UTC+1 en hiver)
# Approximation : UTC+2 pour les mois d'avril à octobre
month = match_date.month
utc_offset = 2 if 4 <= month <= 10 else 1
deadline_utc = match_date + datetime.timedelta(days=1, hours=22-utc_offset, minutes=30)
switch_after_utc = deadline_utc + datetime.timedelta(hours=3)

now_utc = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)

print(f"Date match : {date_str}")
print(f"Clôture max (UTC) : {deadline_utc}")
print(f"Bascule au plus tard (UTC) : {switch_after_utc}")
print(f"Maintenant (UTC) : {now_utc}")

# Check vote count in Supabase
vote_count = 0
try:
    req = urllib.request.Request(
        f"{SB_URL}/rest/v1/votes?session_id=eq.{current_id}&select=id",
        headers={
            'apikey': SB_KEY,
            'Authorization': f'Bearer {SB_KEY}',
        }
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        votes = json.loads(resp.read())
        vote_count = len(votes)
        print(f"Votes : {vote_count}/10")
except Exception as e:
    print(f"Erreur Supabase : {e} — on se base uniquement sur l'heure")

# Vote clos si : 10 votes atteints ET +3h, OU deadline+3h passée
vote_threshold_met = vote_count >= 10

if vote_threshold_met:
    # Vote clos par count — vérifier que +3h sont passées depuis l'ouverture
    # (ouverture = 22h30 le soir du match)
    open_utc = match_date + datetime.timedelta(hours=22-utc_offset, minutes=30)
    open_plus3 = open_utc + datetime.timedelta(hours=3)
    vote_closed = now_utc >= open_plus3
    if vote_closed:
        print("Vote clos : 10 votes atteints et +3h depuis l'ouverture")
    else:
        print(f"10 votes atteints mais +3h pas encore écoulées (attendre {open_plus3})")
elif now_utc >= switch_after_utc:
    vote_closed = True
    print("Vote clos : deadline +3h dépassée")
else:
    vote_closed = False
    print("Vote pas encore clos, rien à faire")

if not vote_closed:
    sys.exit(0)

# Find all session ids in order (newest first in the array)
session_ids = re.findall(r"id:'(s\d+)'", content)
print(f"Sessions : {session_ids}")

if current_id not in session_ids:
    print(f"Session {current_id} introuvable dans la liste")
    sys.exit(1)

idx = session_ids.index(current_id)
if idx == 0:
    print("Déjà sur la session la plus récente, rien à faire")
    sys.exit(0)

next_id = session_ids[idx - 1]
print(f"Bascule : {current_id} → {next_id}")

def set_current(html, session_id, value):
    pos = html.find(f"id:'{session_id}'")
    if pos == -1:
        raise ValueError(f"Session {session_id} introuvable")
    cur_pos = html.find('current:', pos)
    if cur_pos == -1:
        raise ValueError(f"current: introuvable pour {session_id}")
    after = html[cur_pos + 8:]
    if after.startswith('true'):
        old = 'true'
    elif after.startswith('false'):
        old = 'false'
    else:
        raise ValueError(f"Valeur inattendue : {after[:10]}")
    new = 'true' if value else 'false'
    return html[:cur_pos + 8] + new + html[cur_pos + 8 + len(old):]

content = set_current(content, current_id, False)
content = set_current(content, next_id, True)

with open('index.html', 'w') as f:
    f.write(content)

# Update CLAUDE.md session table
with open('CLAUDE.md', 'r') as f:
    md = f.read()

md = re.sub(
    rf"(\| {current_id} \|[^|]*\|[^|]*\|) ✅ \|",
    r'\1  |',
    md
)
md = re.sub(
    rf"(\| {next_id} \|[^|]*\|[^|]*\|)  \|",
    r'\1 ✅ |',
    md
)

with open('CLAUDE.md', 'w') as f:
    f.write(md)

print(f"OK : session active → {next_id}")
