import os, datetime, sys, re

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

# Paris offset (CEST = UTC+2 en été, CET = UTC+1 en hiver)
utc_offset = 2 if 4 <= match_date.month <= 10 else 1

# Vote ouvre à 22h30 Paris le soir du match
open_utc  = match_date + datetime.timedelta(hours=22 - utc_offset, minutes=30)
# Switch autorisé à partir de open + 3h (= 01h30 Paris)
switch_from = open_utc + datetime.timedelta(hours=3)
# Deadline : le lendemain 22h30 + 3h
deadline_utc    = match_date + datetime.timedelta(days=1, hours=22 - utc_offset, minutes=30)
switch_deadline = deadline_utc + datetime.timedelta(hours=3)

now_utc = datetime.datetime.now(datetime.timezone.utc)

print(f"Date match       : {date_str}")
print(f"Ouverture vote   : {open_utc} UTC")
print(f"Switch possible  : {switch_from} UTC  (ouverture +3h)")
print(f"Switch deadline  : {switch_deadline} UTC  (deadline +3h)")
print(f"Maintenant       : {now_utc}")

# Bascule si on est passé open+3h (et donc que le vote a pu atteindre 10 votes)
# OU si la deadline+3h est dépassée
if now_utc < switch_from:
    print(f"Trop tôt — attendre {switch_from}")
    sys.exit(0)

# Vérifier que la session a bien un scoreWinner (match joué)
m_winner = re.search(rf"id:'{current_id}'[^{{]*?scoreWinner:'([^']*)'", content, re.DOTALL)
has_score = m_winner and m_winner.group(1) in ('A', 'B')
if not has_score:
    print("Pas de score enregistré pour cette session — on ne bascule pas")
    sys.exit(0)

print("Conditions OK — bascule vers la session suivante")

# Find all session ids in order (newest first)
session_ids = re.findall(r"id:'(s\d+)'", content)
print(f"Sessions : {session_ids}")

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
    new_val = 'true' if value else 'false'
    return html[:cur_pos + 8] + new_val + html[cur_pos + 8 + len(old):]

content = set_current(content, current_id, False)
content = set_current(content, next_id, True)

with open('index.html', 'w') as f:
    f.write(content)

# Update CLAUDE.md session table
with open('CLAUDE.md', 'r') as f:
    md = f.read()

md = re.sub(rf'(\| {current_id} \|[^|]*\|[^|]*\|) ✅ \|', r'\1  |', md)
md = re.sub(rf'(\| {next_id} \|[^|]*\|[^|]*\|)  \|', r'\1 ✅ |', md)

with open('CLAUDE.md', 'w') as f:
    f.write(md)

print(f"OK : session active → {next_id}")
