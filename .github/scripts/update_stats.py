"""
Recalcule PLAYER_STATS et PAIR_STATS entièrement depuis les SESSIONS.
Usage : python3 .github/scripts/update_stats.py
"""
import re, sys
from collections import defaultdict

with open('index.html', 'r') as f:
    content = f.read()

# ── 1. Extraire toutes les sessions avec un scoreWinner ────────────────────────

# Trouver toutes les positions de début de session
session_starts = [(m.group(1), m.start()) for m in re.finditer(r"id:'(s\d+)'", content)]

sessions = []
for i, (session_id, pos) in enumerate(session_starts):
    # Limite : début de la session suivante (ou fin du fichier)
    end = session_starts[i + 1][1] if i + 1 < len(session_starts) else len(content)
    block = content[pos:end]

    # scoreWinner
    sw = re.search(r"scoreWinner:'([^']*)'", block[:400])
    if not sw or sw.group(1) not in ('A', 'B'):
        continue
    winner = sw.group(1)

    # Extraire les joueurs : chercher name:"..." teamA:true/false dans players:[...]
    p_start = block.find('players:[')
    if p_start == -1:
        continue
    players_section = block[p_start:]

    players = []
    for pm in re.finditer(r'name:"([^"]+)",teamA:(true|false)', players_section):
        players.append({'name': pm.group(1), 'teamA': pm.group(2) == 'true'})

    if not players:
        continue

    sessions.append({'id': session_id, 'winner': winner, 'players': players})
    print(f"  {session_id}: winner={winner}, joueurs={[p['name'] for p in players]}")

print(f"\n{len(sessions)} sessions avec score trouvées")

# ── 2. Calculer PLAYER_STATS ──────────────────────────────────────────────────

player_stats = defaultdict(lambda: {'played': 0, 'wins': 0})

for s in sessions:
    for p in s['players']:
        player_stats[p['name']]['played'] += 1
        won = (p['teamA'] and s['winner'] == 'A') or (not p['teamA'] and s['winner'] == 'B')
        if won:
            player_stats[p['name']]['wins'] += 1

# ── 3. Calculer PAIR_STATS ────────────────────────────────────────────────────

pair_stats = defaultdict(lambda: {'together': 0, 'wins': 0})

for s in sessions:
    team_a = [p['name'] for p in s['players'] if p['teamA']]
    team_b = [p['name'] for p in s['players'] if not p['teamA']]

    for team, team_wins in [(team_a, s['winner'] == 'A'), (team_b, s['winner'] == 'B')]:
        for i in range(len(team)):
            for j in range(i + 1, len(team)):
                key = tuple(sorted([team[i], team[j]]))
                pair_stats[key]['together'] += 1
                if team_wins:
                    pair_stats[key]['wins'] += 1

print(f"{len(player_stats)} joueurs, {len(pair_stats)} paires")

# ── 4. Générer le JS de remplacement ─────────────────────────────────────────

def build_player_stats_js(stats):
    lines = ['var PLAYER_STATS = {']
    for name in sorted(stats.keys()):
        s = stats[name]
        lines.append(f"  '{name}': {{played:{s['played']}, wins:{s['wins']}}},")
    lines.append('};')
    return '\n'.join(lines)

def build_pair_stats_js(stats):
    lines = ['var PAIR_STATS = [']
    for (p1, p2), s in sorted(stats.items()):
        lines.append(f"  {{p1:'{p1}', p2:'{p2}', together:{s['together']}, wins:{s['wins']}}},")
    lines.append('];')
    return '\n'.join(lines)

new_player_stats = build_player_stats_js(player_stats)
new_pair_stats   = build_pair_stats_js(pair_stats)

# ── 5. Remplacer dans le HTML ─────────────────────────────────────────────────

def replace_block(html, pattern, replacement):
    m = re.search(pattern, html, re.DOTALL)
    if not m:
        print(f"ERREUR : bloc introuvable — {pattern[:60]}")
        sys.exit(1)
    return html[:m.start()] + replacement + html[m.end():]

content = replace_block(
    content,
    r'var PLAYER_STATS\s*=\s*\{[^;]+\};',
    new_player_stats
)
content = replace_block(
    content,
    r'var PAIR_STATS\s*=\s*\[[^\]]*(?:\[[^\]]*\][^\]]*)*\];',
    new_pair_stats
)

with open('index.html', 'w') as f:
    f.write(content)

print("PLAYER_STATS et PAIR_STATS mis à jour dans index.html")
