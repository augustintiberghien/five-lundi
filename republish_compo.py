#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Force la régénération de la compo publiée d'un créneau (table Supabase slot_sessions).

Pourquoi ça existe : `syncSharedTeams` (front) et `lock_session.py` reprennent la ligne
`slot_sessions` **telle quelle** dès que `roster_key` correspond aux dix titulaires
effectifs. Un changement de règle qui ne touche pas le roster — une contrainte `together`
ajoutée, une note de PLAYER_NOTES corrigée — n'a donc **aucun effet** : plus personne ne
recalcule. Il faut republier explicitement, c'est ce que fait ce script.

    python3 republish_compo.py ins_sep_21 --dry-run
    python3 republish_compo.py ins_sep_21
    python3 republish_compo.py ins_sep_21 --blue Spy

Le roster est recalculé exactement comme le lock (inscrits dans l'ordre, banc trié par
`benchPriority`, absents de la feuille de match retirés, dix premiers), l'algo du site est
rejoué dans node à partir d'index.html, et les couleurs sont réancrées sur la compo
annoncée (`_anchorColors`) pour ne retourner personne sans raison.

`--blue <joueur>` impose la couleur de l'équipe de ce joueur. La consigne est
appliquée **après** le réancrage, qu'elle prime : c'est une décision du groupe, pas
une orientation calculée. ⚠️ Rien de tout ça n'est exprimable dans
`_genBalancedTeams`, qui ne connaît que `together` — si le roster bouge ensuite, la
couleur ne tient que par `_anchorColors`, à la majorité des rescapés.

⚠️ À lancer **avant 21h30**. Après le lock le créneau passe `open:false` et la compo est
figée dans `SESSIONS` : republier ne servirait plus à rien.
"""
import argparse, json, re, subprocess, sys, tempfile, urllib.request, urllib.error
from datetime import datetime, timezone

SB_URL = 'https://fewbqcbzlmanmidvrxhs.supabase.co'
SB_KEY = ('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZld2'
          'JxY2J6bG1hbm1pZHZyeGhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NTkyNDAsImV4cCI6'
          'MjA5MzUzNTI0MH0.UnLqDjHSG4NwDOYmKfBW55uruEQeL6q_cijrddFQDYM')


def _req(path, method='GET', body=None, extra=None):
    headers = {'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY}
    if extra:
        headers.update(extra)
    data = json.dumps(body, ensure_ascii=False).encode() if body is not None else None
    req = urllib.request.Request(SB_URL + path, method=method, data=data, headers=headers)
    try:
        with urllib.request.urlopen(req) as r:
            return r.read().decode()
    except urllib.error.HTTPError as e:
        print('❌ HTTP %s — %s' % (e.code, e.read().decode()[:400]))
        sys.exit(1)


def _show(label, players, note_a, note_b):
    print('%s ⚪ %s' % (label, ', '.join(sorted(p['name'] for p in players if p['teamA']))))
    print('%s 🔵 %s' % (' ' * len(label), ', '.join(sorted(p['name'] for p in players if not p['teamA']))))
    print('%s    équilibrage %s – %s' % (' ' * len(label), note_a, note_b))


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('slot_id')
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--blue', metavar='JOUEUR',
                    help="force l'équipe de ce joueur à porter le bleu 🔵")
    args = ap.parse_args()

    html = open('index.html', encoding='utf-8').read()

    m_slot = re.search(r"\{ id:'%s'.*" % re.escape(args.slot_id), html)
    if not m_slot:
        print('❌ Créneau %s introuvable dans index.html' % args.slot_id)
        sys.exit(1)
    line = m_slot.group(0)
    m_tog = re.search(r"together:\[([^\]]*)\]", line)
    together = re.findall(r"'([^']+)'", m_tog.group(1)) if m_tog else []

    sid = urllib.parse.quote(args.slot_id)
    regs = json.loads(_req('/rest/v1/registrations?slot_id=eq.%s&order=registered_at.asc'
                           '&select=player_name' % sid))
    pres = json.loads(_req('/rest/v1/presences?session_id=eq.%s&select=name,status' % sid))
    absents = {p['name'] for p in pres if p['status'] == 'absent'}

    names = [r['player_name'] for r in regs]
    starters, bench = names[:10], names[10:]
    m_bp = re.search(r"benchPriority:\[([^\]]*)\]", line)
    if m_bp:
        prio = re.findall(r"'([^']+)'", m_bp.group(1))
        bench.sort(key=lambda n: (prio.index(n) if n in prio else len(prio)))
    effective = [n for n in starters + bench if n not in absents][:10]

    print('Inscrits  :', ', '.join(names))
    print('Absents   :', ', '.join(sorted(absents)) or '—')
    print('Titulaires:', ', '.join(effective))
    print('Contrainte together :', ', '.join(together) or '—')
    if len(effective) < 10:
        print('❌ Seulement %d titulaires effectifs — on ne republie pas.' % len(effective))
        sys.exit(1)

    rows = json.loads(_req('/rest/v1/slot_sessions?slot_id=eq.%s&select=*' % sid))
    row = rows[0] if rows else {}
    announced = row.get('players') or []
    if announced:
        _show('\nAVANT ', announced, row.get('note_a'), row.get('note_b'))

    def sl(a, b):
        i = html.index(a)
        return html[i:html.index(b, i)]

    js = '\n'.join([
        sl('var SESSIONS = [', '\nvar CRITERIA'),
        sl("var _MN = ['janvier'", '\n'),
        sl('function _seasonOfDate(dateStr){', '\n/* Toutes les rencontres'),
        sl('var PLAYER_NOTES = {', '\nvar PAIR_STATS'),
        sl('var PAIR_STATS = [', '\nfunction'),
        sl('var PLAYER_ROLES = {', '\nfunction'),
        sl('function getPairWinRate(n1, n2) {', '\nfunction '),
        sl('/* ── AUTO-TEAM BALANCING ── */', 'function _genTournamentTeams'),
        sl('function _assignPositions', 'var PLAYER_PHOTOS'),
        sl('function _anchorColors(raw, ref){', 'var _SLOTS_A='),
        sl('var _SLOTS_A=[', 'function _applySharedCompo'),
    ])
    js += (
        '\nvar res=_genBalancedTeams(%s,%s);'
        '\nif(!res){console.log("null");process.exit(0);}'
        '\nvar raw=_assignPositions(res.teamA,true).concat(_assignPositions(res.teamB,false))'
        '.map(function(p){return {x:p.x,y:p.y,name:p.name,teamA:p.teamA};});'
        '\nvar nA=res.noteA,nB=res.noteB,ref=%s;'
        '\nif(ref.length){ if(_anchorColors(raw,ref)){var t=nA;nA=nB;nB=t;} _anchorPositions(raw,ref); }'
        '\nconsole.log(JSON.stringify({players:raw,note_a:nA,note_b:nB}));'
    ) % (json.dumps(effective, ensure_ascii=False), json.dumps(together, ensure_ascii=False),
         json.dumps(announced, ensure_ascii=False))

    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f:
        f.write(js)
        path = f.name
    out = subprocess.run(['node', path], capture_output=True, text=True)
    if out.returncode != 0:
        print('❌ Régénération node échouée :', out.stderr[:500])
        sys.exit(1)
    gen = json.loads(out.stdout.strip().split('\n')[-1])
    players, note_a, note_b = gen['players'], gen['note_a'], gen['note_b']

    # Couleur imposée. Vient APRÈS _anchorColors, qui sinon la contredirait : une
    # consigne explicite du groupe prime sur le réancrage automatique.
    if args.blue:
        if args.blue not in effective:
            print("❌ %s n'est pas dans les titulaires effectifs." % args.blue)
            sys.exit(1)
        if any(p['teamA'] for p in players if p['name'] == args.blue):
            for p in players:
                p['teamA'] = not p['teamA']
                p['y'] = 100 - p['y']
            note_a, note_b = note_b, note_a
            print("↔️  Couleurs orientées pour mettre %s en bleu" % args.blue)

    _show('APRÈS ', players, note_a, note_b)
    if together:
        white = {p['name'] for p in players if p['teamA']}
        ok = all((n in white) for n in together) or all((n not in white) for n in together)
        present = [n for n in together if n in effective]
        print('   contrainte together respectée : %s (présents : %s)'
              % (ok, ', '.join(present) or '—'))
        if not ok:
            print('⚠️ contrainte non respectée — on ne publie pas.')
            sys.exit(1)

    if args.blue and any(p['teamA'] for p in players if p['name'] == args.blue):
        print('⚠️ %s est toujours en blanc — on ne publie pas.' % args.blue)
        sys.exit(1)

    roster_key = ','.join(sorted(effective))
    if args.dry_run:
        print('\n(dry-run : rien n\'a été écrit — roster_key aurait été « %s »)' % roster_key)
        return

    _req('/rest/v1/slot_sessions?on_conflict=slot_id', 'POST',
         {'slot_id': args.slot_id, 'roster_key': roster_key, 'players': players,
          'note_a': note_a, 'note_b': note_b,
          'updated_at': datetime.now(timezone.utc).isoformat()},
         {'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates'})

    new = json.loads(_req('/rest/v1/slot_sessions?slot_id=eq.%s&select=*' % sid))[0]
    same = {p['name'] for p in new['players']} == set(effective)
    sides_ok = not [p for p in new['players']
                    if (p['teamA'] and p['y'] > 50) or (not p['teamA'] and p['y'] < 50)]
    print('\n✅ publié — roster correct:%s  côtés cohérents:%s  roster_key:%s'
          % (same, sides_ok, new['roster_key'] == roster_key))
    if not (same and sides_ok):
        sys.exit(1)


if __name__ == '__main__':
    import urllib.parse
    main()
