"""
Met à jour score et scoreWinner d'une session dans index.html.
Appelé par le GitHub Action set-score.yml.
"""
import re, os, sys

session_id = os.environ['SESSION_ID']
score_a    = int(os.environ['SCORE_A'])
score_b    = int(os.environ['SCORE_B'])
winner     = os.environ['WINNER']  # 'A' or 'B'

if winner not in ('A', 'B'):
    print(f"ERREUR : winner invalide '{winner}'")
    sys.exit(1)
if score_a == score_b:
    print("ERREUR : match nul impossible")
    sys.exit(1)

# Format du score affiché : "12 – 7 (A)"
score_display = f"{score_a} – {score_b} ({winner})"

with open('index.html', 'r') as f:
    content = f.read()

# Vérifier que la session existe
if f"id:'{session_id}'" not in content:
    print(f"ERREUR : session {session_id} introuvable")
    sys.exit(1)

# Vérifier qu'il n'y a pas déjà un score
m_existing = re.search(rf"id:'{session_id}'[^{{]*?scoreWinner:'([^']*)'", content, re.DOTALL)
if m_existing and m_existing.group(1) in ('A', 'B'):
    print(f"ATTENTION : {session_id} a déjà un score ({m_existing.group(1)}) — on le remplace quand même")

def replace_field(html, sid, field, new_value):
    """Remplace field:'...' pour la session donnée."""
    pos = html.find(f"id:'{sid}'")
    if pos == -1:
        raise ValueError(f"Session {sid} introuvable")
    # Chercher field:' dans les 500 prochains chars
    field_pos = html.find(f"{field}:'", pos)
    if field_pos == -1 or field_pos > pos + 500:
        raise ValueError(f"Champ {field} introuvable pour {sid}")
    quote_start = field_pos + len(field) + 2  # après field:'
    quote_end   = html.index("'", quote_start)
    return html[:quote_start] + new_value + html[quote_end:]

content = replace_field(content, session_id, 'score', score_display)
content = replace_field(content, session_id, 'scoreWinner', winner)

with open('index.html', 'w') as f:
    f.write(content)

print(f"OK : {session_id} → {score_display} (winner={winner})")
