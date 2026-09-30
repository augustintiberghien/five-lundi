#!/usr/bin/env python3
# Met a jour PLAYER_STATS et PAIR_STATS avec le tournoi du 22 juin.
# Comptage par match : +3 played pour tous ; wins = matchs gagnes par l'equipe.
# Bleu/Jaune/Rouge : 2 victoires ; Blanc : 0. Invites (Cyriaque, Matteo) exclus.
import io, re, itertools

teams = {
    'bleu':  (['Michael','Rémi','Alex','Flo','Dylan'], 2),
    'jaune': (['Gugu','Samy','Quentin'], 2),          # Cyriaque/Matteo (invites) exclus
    'rouge': (['Ibrahima','Théo','Edouard','Henri','Khalid'], 2),
    'blanc': (['Landry','Spy','Hugo','Cyril','Tim'], 0),
}
DPLAYED = 3

html = io.open("index.html", encoding="utf-8").read()

# ── PLAYER_STATS ──
ps_start = html.index("var PLAYER_STATS = {")
ps_block = html[ps_start:html.index("};", ps_start)]
player_dw = {}
for names, w in teams.values():
    for n in names:
        player_dw[n] = w
changed_players = 0
for name, dw in player_dw.items():
    m = re.search(r"'%s': \{played:(\d+), wins:(\d+)\}" % re.escape(name), ps_block)
    assert m, "PLAYER_STATS: joueur absent -> %s" % name
    old = m.group(0)
    new = "'%s': {played:%d, wins:%d}" % (name, int(m.group(1)) + DPLAYED, int(m.group(2)) + dw)
    assert html.count(old) == 1, "PLAYER_STATS ambigu: %s (%d)" % (name, html.count(old))
    html = html.replace(old, new)
    changed_players += 1

# ── PAIR_STATS ──
pp_start = html.index("var PAIR_STATS = [")
pp_end = html.index("\n];", pp_start)
pp_block = html[pp_start:pp_end]
entries = re.findall(r"\{p1:'([^']+)', p2:'([^']+)', together:(\d+), wins:(\d+)\}", pp_block)
existing = {}
for p1, p2, t, w in entries:
    existing[frozenset((p1, p2))] = (p1, p2, int(t), int(w))

pair_dw = {}
for names, w in teams.values():
    for a, b in itertools.combinations(names, 2):
        pair_dw[frozenset((a, b))] = w

updated_pairs = 0
new_lines = []
for key, dw in sorted(pair_dw.items(), key=lambda kv: sorted(kv[0])):
    if key in existing:
        p1, p2, t, w = existing[key]
        old = "{p1:'%s', p2:'%s', together:%d, wins:%d}" % (p1, p2, t, w)
        new = "{p1:'%s', p2:'%s', together:%d, wins:%d}" % (p1, p2, t + DPLAYED, w + dw)
        assert html.count(old) == 1, "PAIR_STATS ambigu: %s/%s" % (p1, p2)
        html = html.replace(old, new)
        updated_pairs += 1
    else:
        a, b = sorted(key)
        new_lines.append("  {p1:'%s', p2:'%s', together:%d, wins:%d}," % (a, b, DPLAYED, dw))

insert_at = html.index("\n];", html.index("var PAIR_STATS = ["))
html = html[:insert_at] + "\n" + "\n".join(new_lines) + html[insert_at:]

io.open("index.html", "w", encoding="utf-8").write(html)
print("PLAYER_STATS maj : %d joueurs" % changed_players)
print("PAIR_STATS : %d duos incrementes, %d nouveaux duos" % (updated_pairs, len(new_lines)))
