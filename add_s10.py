#!/usr/bin/env python3
"""Crée la session s10 du 25 mai 2026."""
import re

with open('index.html', 'r') as f:
    c = f.read()

def find_card_html(content, player_name):
    """Extrait le HTML de carte d'un joueur depuis les sessions existantes."""
    pattern = r'name:"' + re.escape(player_name) + r'",teamA:(?:true|false),html:`([^`]+)`'
    m = re.search(pattern, content)
    if m:
        return m.group(1)
    return None

def make_card(html, team_a):
    """Ajuste la classe team-a/team-b selon l'équipe."""
    if team_a:
        html = html.replace('class="card team-b"', 'class="card team-a"')
    else:
        html = html.replace('class="card team-a"', 'class="card team-b"')
    return html

# Récupérer les cartes existantes
players_needed = [
    ('Rémi',    True,  50, 8),
    ('Johann',  True,  12, 24),
    ('Hugo',    True,  88, 24),
    ('Flo',     True,  35, 38),
    ('Gugu',    True,  65, 38),
    ('Michael', False, 50, 92),
    ('Théo',    False, 12, 76),
    ('Khalid',  False, 88, 76),
    ('Alex',    False, 35, 62),
    ('Spy',     False, 65, 62),
]

player_entries = []
missing = []
for name, team_a, x, y in players_needed:
    html = find_card_html(c, name)
    if html:
        html = make_card(html, team_a)
        team_str = 'true' if team_a else 'false'
        # Escape backticks in html if any
        html_safe = html.replace('\\`', '`')  # already unescaped
        entry = '{x:%d,y:%d,name:"%s",teamA:%s,html:`%s`}' % (x, y, name, team_str, html_safe)
        player_entries.append(entry)
        print(f"  ✅ {name} ({'Blanche' if team_a else 'Bleue'})")
    else:
        missing.append(name)
        print(f"  ❌ {name} introuvable")

if missing:
    print(f"\n⚠️  Joueurs manquants : {missing}")

players_js = ',\n    '.join(player_entries)

s10 = """{id:'s10',date:'25 mai 2026',score:'— vs —',scoreWinner:'',current:false,
 nameA:'Blanche ⚪',nameB:'Bleue \U0001f535',
 bench:['Édouard','Ibrahima','Henri'],
 players:[
    """ + players_js + """
 ]}"""

# Insérer AVANT s9 dans le tableau SESSIONS (newest first)
anchor = "var SESSIONS = ["
idx = c.find(anchor)
if idx == -1:
    print("❌ SESSIONS array non trouvé")
else:
    insert_at = idx + len(anchor) + 1  # après le [
    # find the first newline after [
    nl = c.find('\n', insert_at - 1)
    c = c[:nl+1] + '  ' + s10 + ',\n' + c[nl+1:]
    print("\n✅ Session s10 insérée")

with open('index.html', 'w') as f:
    f.write(c)
