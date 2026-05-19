import os, datetime, sys, re, time

TRIGGER = os.environ.get('TRIGGER', 'schedule')

with open('index.html', 'r') as f:
    content = f.read()

# Find current session id
m = re.search(r"id:'(s\d+)'[^{]*?current:true", content, re.DOTALL)
if not m:
    print("Aucune session active trouvée")
    sys.exit(0)

current_id = m.group(1)
print(f"Session active : {current_id}")

# Check score exists
m_winner = re.search(rf"id:'{current_id}'[^{{]*?scoreWinner:'([^']*)'", content, re.DOTALL)
has_score = m_winner and m_winner.group(1) in ('A', 'B')
if not has_score:
    print("Pas de scoreWinner — match pas encore joué, on ne bascule pas")
    sys.exit(0)

# Find match date
m_date = re.search(rf"id:'{current_id}'[^{{]*?date:'([^']+)'", content, re.DOTALL)
if not m_date:
    print("Date introuvable")
    sys.exit(1)

date_str = m_date.group(1)
MONTHS = {
    'janvier':1,'février':2,'mars':3,'avril':4,'mai':5,'juin':6,
    'juillet':7,'août':8,'septembre':9,'octobre':10,'novembre':11,'décembre':12
}
parts = date_str.split()
match_date = datetime.datetime(int(parts[2]), MONTHS[parts[1]], int(parts[0]),
                               tzinfo=datetime.timezone.utc)

utc_offset = 2 if 4 <= match_date.month <= 10 else 1
open_utc       = match_date + datetime.timedelta(hours=22 - utc_offset, minutes=30)
switch_from    = open_utc + datetime.timedelta(hours=3)   # 10-vote case : open+3h
deadline_utc   = match_date + datetime.timedelta(days=1, hours=22 - utc_offset, minutes=30)
switch_deadline = deadline_utc + datetime.timedelta(hours=3)  # deadline case

now_utc = datetime.datetime.now(datetime.timezone.utc)

print(f"Date match       : {date_str}")
print(f"Switch open+3h   : {switch_from} UTC")
print(f"Switch deadline  : {switch_deadline} UTC")
print(f"Trigger          : {TRIGGER}")
print(f"Maintenant       : {now_utc}")

if TRIGGER == 'workflow_dispatch':
    # Déclenché par Edge Function = 10 votes atteints
    # Attendre open+3h si on est encore trop tôt
    wait = (switch_from - now_utc).total_seconds()
    if wait > 0:
        print(f"10 votes atteints mais trop tôt — attente {wait/3600:.1f}h ({switch_from} UTC)...")
        time.sleep(wait)
        now_utc = datetime.datetime.now(datetime.timezone.utc)
    print("Conditions OK (10 votes + délai) — bascule")

elif TRIGGER == 'schedule':
    # Déclenché par cron mercredi 01h30 = deadline+3h
    if now_utc < switch_deadline:
        print(f"Deadline pas encore atteinte — attendre {switch_deadline}")
        sys.exit(0)
    print("Deadline+3h dépassée — bascule")

else:
    print(f"Trigger inconnu : {TRIGGER}")
    sys.exit(1)

# Find all session ids (newest first)
session_ids = re.findall(r"id:'(s\d+)'", content)
idx = session_ids.index(current_id)
if idx == 0:
    print("Déjà sur la session la plus récente")
    sys.exit(0)

next_id = session_ids[idx - 1]
print(f"Bascule : {current_id} → {next_id}")

def set_current(html, session_id, value):
    pos = html.find(f"id:'{session_id}'")
    if pos == -1:
        raise ValueError(f"Session {session_id} introuvable")
    cur_pos = html.find('current:', pos)
    after = html[cur_pos + 8:]
    old = 'true' if after.startswith('true') else 'false'
    new_val = 'true' if value else 'false'
    return html[:cur_pos + 8] + new_val + html[cur_pos + 8 + len(old):]

content = set_current(content, current_id, False)
content = set_current(content, next_id, True)

with open('index.html', 'w') as f:
    f.write(content)

# Update CLAUDE.md
with open('CLAUDE.md', 'r') as f:
    md = f.read()
md = re.sub(rf'(\| {current_id} \|[^|]*\|[^|]*\|) ✅ \|', r'\1  |', md)
md = re.sub(rf'(\| {next_id} \|[^|]*\|[^|]*\|)  \|', r'\1 ✅ |', md)
with open('CLAUDE.md', 'w') as f:
    f.write(md)

print(f"OK : session active → {next_id}")
