#!/usr/bin/env python3
"""Calcul détaillé du split s9 (18/05) avec notes ajustées, critères et positions."""
import re, itertools

# ── Données ──────────────────────────────────────────────────────────────────
NOTES = {
    'Michael':  {'note':13,'sm':40},
    'LM':       {'note':11,'sm':31},
    'Khalid':   {'note':15,'sm':44},
    'Edouard':  {'note':12,'sm':32},
    'Jack':     {'note':20,'sm':52},
    'Ibrahima': {'note':13,'sm':39},
    'Henri':    {'note':12,'sm':33},
    'Hugo':     {'note':16,'sm':47},
    'Flo':      {'note':14,'sm':40},
    'Tim':      {'note':13,'sm':40},
}

ROLES = {
    'Michael':  'Gardien',  # joue GK en pratique
    'Ibrahima': 'Défenseur',
    'Jack':     'Game changer',
    'Khalid':   'Récupérateur',
    'Hugo':     'Attaquant',
    'Flo':      'Distributeur',
    'Tim':      'Pressing',
    'Edouard':  'Piston',
    'LM':       'Piston',
    'Henri':    'Piston',
}

# Sessions complètes (newest first): id, scoreWinner, {player: teamA}
# Extraire depuis index.html
with open('index.html') as f:
    content = f.read()

def get_session_players(sid):
    """Retourne {name: teamA(bool)} pour une session."""
    pat = r"id:'%s'.*?players:\[(.+?)\](?:,\s*\}|\})" % sid
    m = re.search(pat, content, re.DOTALL)
    if not m: return {}
    block = m.group(1)
    players = {}
    for pm in re.finditer(r'\{x:\d+,y:\d+,name:"(\w+)",teamA:(true|false)', block):
        players[pm.group(1)] = pm.group(2) == 'true'
    return players

def get_session_winner(sid):
    m = re.search(r"id:'%s'.*?scoreWinner:'([AB]?)'" % sid, content, re.DOTALL)
    if m: return m.group(1)
    return ''

# Construire l'historique des sessions complètes
SESSION_IDS = ['s8','s7','s6','s5','s4','s3','s2','s1']
COMPLETED = []
for sid in SESSION_IDS:
    w = get_session_winner(sid)
    if w:
        COMPLETED.append({'id': sid, 'winner': w, 'players': get_session_players(sid)})

print("Sessions complètes trouvées:", [s['id'] for s in COMPLETED])
print()

# ── Calcul de la forme (_getPlayerForm) ──────────────────────────────────────
def get_form(name):
    last3 = COMPLETED[:3]
    played_in_last3 = any(name in s['players'] for s in last3)
    if not played_in_last3 and len(last3) >= 3:
        return 0

    results = []
    for s in COMPLETED:
        if name not in s['players']:
            continue
        team_a = s['players'][name]
        won = (team_a and s['winner'] == 'A') or (not team_a and s['winner'] == 'B')
        results.append(won)
        if len(results) >= 3:
            break

    if not results: return 0
    if len(results) >= 3 and all(results): return 1.0
    if len(results) >= 3 and not any(results): return -1.0
    return 0.5 if results[0] else -0.5

def adj_note(name):
    return NOTES[name]['note'] + get_form(name)

def sm(name):
    return NOTES[name]['sm']

# ── Affichage des notes par joueur ────────────────────────────────────────────
PLAYERS = list(NOTES.keys())

print("─" * 65)
print(f"{'Joueur':<12} {'Note':>5} {'Forme':>6} {'Adj':>5} {'SM':>5}  {'3 derniers résultats'}")
print("─" * 65)

for name in sorted(PLAYERS, key=lambda n: -adj_note(n)):
    form_val = get_form(name)
    form_str = f"+{form_val}" if form_val > 0 else str(form_val)
    adj = adj_note(name)

    # Reconstruire l'historique lisible
    history = []
    for s in COMPLETED[:3]:
        if name in s['players']:
            team_a = s['players'][name]
            won = (team_a and s['winner'] == 'A') or (not team_a and s['winner'] == 'B')
            history.append('✅' if won else '❌')
        else:
            history.append('—')
    hist_str = ' '.join(history)

    print(f"{name:<12} {NOTES[name]['note']:>5} {form_str:>6} {adj:>5.1f} {sm(name):>5}  {hist_str}")

print()

# ── Top 2 (séparation obligatoire) ───────────────────────────────────────────
sorted_players = sorted(PLAYERS, key=lambda n: -adj_note(n))
top2 = sorted_players[:2]
print(f"Top 2 (doivent être séparés) : {top2[0]} ({adj_note(top2[0]):.1f}) + {top2[1]} ({adj_note(top2[1]):.1f})")
print()

# ── Brute force C(10,5) ───────────────────────────────────────────────────────
best = None
best_score = float('inf')
best_details = None

for combo in itertools.combinations(PLAYERS, 5):
    tA = list(combo)
    tB = [p for p in PLAYERS if p not in tA]

    smA = sum(sm(n) for n in tA)
    smB = sum(sm(n) for n in tB)
    nA  = sum(adj_note(n) for n in tA)
    nB  = sum(adj_note(n) for n in tB)
    dSM = abs(smA - smB)
    dN  = abs(nA - nB)

    pen = 0
    # Top 2 séparés
    top2_togetherA = all(t in tA for t in top2)
    top2_togetherB = all(t in tB for t in top2)
    if top2_togetherA or top2_togetherB: pen += 100

    # GK naturel dans chaque équipe
    gkA = any(ROLES.get(n,'') == 'Gardien' for n in tA)
    gkB = any(ROLES.get(n,'') == 'Gardien' for n in tB)
    if not gkA: pen += 20
    if not gkB: pen += 20

    # Michael + Ibrahima pas ensemble (2 profils défensifs/GK)
    mIbrA = 'Michael' in tA and 'Ibrahima' in tA
    mIbrB = 'Michael' in tB and 'Ibrahima' in tB
    if mIbrA or mIbrB: pen += 10

    score = dSM * 1000 + pen * 10 + dN
    if score < best_score:
        best_score = score
        best = (tA, tB)
        best_details = {'smA':smA,'smB':smB,'nA':nA,'nB':nB,'dSM':dSM,'dN':dN,'pen':pen}

tA, tB = best
d = best_details

# ── Positions naturelles (_assignPositions) ───────────────────────────────────
POS_A = [('GK',(50,8)),('DL',(12,24)),('DR',(88,24)),('ML',(35,38)),('MR',(65,38))]
POS_B = [('GK',(50,92)),('DL',(12,76)),('DR',(88,76)),('ML',(35,62)),('MR',(65,62))]

def assign_positions(team, positions):
    rem = list(team)
    result = [None] * 5
    # GK en premier
    gk_idx = next((i for i,n in enumerate(rem) if ROLES.get(n,'') == 'Gardien'), None)
    if gk_idx is not None:
        result[0] = rem.pop(gk_idx)
    else:
        result[0] = rem.pop(0)  # fallback: premier joueur
    # Reste en ordre de note décroissante
    rem.sort(key=lambda n: -adj_note(n))
    for i,n in enumerate(rem):
        result[i+1] = n
    return list(zip([p[0] for p in positions], [p[1] for p in positions], result))

posA = assign_positions(tA, POS_A)
posB = assign_positions(tB, POS_B)

print("─" * 65)
print("SPLIT OPTIMAL")
print("─" * 65)
print(f"\n{'BLANCHE ⚪':<30} {'BLEUE 🔵'}")
print(f"{'─'*28} {'─'*28}")
for i in range(5):
    posA_label, _, nameA = posA[i]
    posB_label, _, nameB = posB[i]
    adjA, adjB = adj_note(nameA), adj_note(nameB)
    smA_v, smB_v = sm(nameA), sm(nameB)
    roleA, roleB = ROLES.get(nameA,'?'), ROLES.get(nameB,'?')
    print(f"  {posA_label:<4} {nameA:<10} note:{adjA:.1f}  sm:{smA_v:<3}   {posB_label:<4} {nameB:<10} note:{adjB:.1f}  sm:{smB_v}")

print(f"\n  {'TOTAL':>18} note:{d['nA']:.1f}  sm:{d['smA']:<7}  {'TOTAL':>8} note:{d['nB']:.1f}  sm:{d['smB']}")
print(f"\n  ΔSM = {d['dSM']}   ΔNote = {d['dN']:.1f}   Pénalités = {d['pen']}")
print(f"  Score algo = {best_score:.2f}")
print()

# Critères appliqués
print("─" * 65)
print("CRITÈRES APPLIQUÉS")
print("─" * 65)
sep = top2[0] in tA and top2[1] in tB or top2[0] in tB and top2[1] in tA
print(f"  ✅ Top 2 séparés : {top2[0]} (Blanche) / {top2[1]} (Bleue)" if sep else f"  ❌ Top 2 ensemble")
gkA_name = next((n for n in tA if ROLES.get(n,'')=='Gardien'), None)
gkB_name = next((n for n in tB if ROLES.get(n,'')=='Gardien'), None)
print(f"  ✅ GK Blanche : {gkA_name}" if gkA_name else "  ❌ Pas de GK Blanche")
print(f"  ✅ GK Bleue : {gkB_name}" if gkB_name else "  ⚠️  Pas de GK naturel Bleue")
together = ('Michael' in tA and 'Ibrahima' in tA) or ('Michael' in tB and 'Ibrahima' in tB)
print(f"  {'❌' if together else '✅'} Michael + Ibrahima {'ensemble' if together else 'séparés'}")
