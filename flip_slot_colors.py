#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Retourne les couleurs de la compo publiée d'un créneau (table Supabase slot_sessions).

À utiliser quand le groupe veut jouer les mêmes deux équipes mais avec les couleurs
échangées. On ne touche pas à la répartition : les deux moitiés restent identiques,
seul `teamA` bascule (et `y`, pour que chaque équipe reste du bon côté du terrain).
`roster_key` est laissé tel quel — le modifier ferait croire au lock que la compo est
périmée, et il regénérerait tout.

    python3 flip_slot_colors.py ins_sep_21 --dry-run
    python3 flip_slot_colors.py ins_sep_21

⚠️ Ce que ça garantit, et ce que ça ne garantit pas
   La ligne slot_sessions devient la référence : le site l'affiche telle quelle tant que
   `roster_key` correspond, et `lock_session.py` la reprend telle quelle à 21h30. En cas de
   désistement, le front régénère puis réancre les couleurs sur cette référence
   (`_anchorColors`), qui tranche à la majorité des rescapés. Cette majorité peut être à
   égalité : l'orientation retombe alors sur `_halfHash` et peut repasser à l'endroit.
   Mesuré sur le banc du 21 septembre 2026 (Henri, Dylan, Thibault) : 100 % sans
   remplacement, ~90 % sur 1 à 3 remplacements. Ce n'est pas un défaut introduit ici —
   c'est le même taux auquel la couleur *annoncée* peut déjà se retourner aujourd'hui.
"""
import argparse, json, sys, urllib.request, urllib.error
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
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        print('❌ HTTP %s — %s' % (e.code, e.read().decode()[:400]))
        sys.exit(1)


def _show(label, players, note_a, note_b):
    white = sorted(p['name'] for p in players if p['teamA'])
    blue = sorted(p['name'] for p in players if not p['teamA'])
    print('%s ⚪ %s' % (label, ', '.join(white)))
    print('%s 🔵 %s' % (' ' * len(label), ', '.join(blue)))
    print('%s    équilibrage %s – %s' % (' ' * len(label), note_a, note_b))


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('slot_id', help="id du créneau, ex. ins_sep_21")
    ap.add_argument('--dry-run', action='store_true', help="affiche sans écrire")
    args = ap.parse_args()

    rows = json.loads(_req('/rest/v1/slot_sessions?slot_id=eq.%s&select=*' % args.slot_id)[1])
    if not rows:
        print('❌ Aucune compo publiée pour %s — rien à retourner.' % args.slot_id)
        sys.exit(1)
    row = rows[0]
    players = row.get('players') or []
    if len(players) != 10:
        print('❌ Compo à %d joueurs — inattendu, on ne touche à rien.' % len(players))
        sys.exit(1)

    _show('AVANT ', players, row['note_a'], row['note_b'])

    flipped = [{'x': p['x'], 'y': 100 - p['y'], 'name': p['name'], 'teamA': not p['teamA']}
               for p in players]
    _show('APRÈS ', flipped, row['note_b'], row['note_a'])

    if args.dry_run:
        print('\n(dry-run : rien n\'a été écrit)')
        return

    _req('/rest/v1/slot_sessions?on_conflict=slot_id', 'POST',
         {'slot_id': args.slot_id, 'roster_key': row['roster_key'], 'players': flipped,
          'note_a': row['note_b'], 'note_b': row['note_a'],
          'updated_at': datetime.now(timezone.utc).isoformat()},
         {'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates'})

    # Relecture : la moitié des équipes doit être inchangée, seule la couleur bascule
    new = json.loads(_req('/rest/v1/slot_sessions?slot_id=eq.%s&select=*' % args.slot_id)[1])[0]
    halves = lambda ps: {frozenset(p['name'] for p in ps if p['teamA']),
                         frozenset(p['name'] for p in ps if not p['teamA'])}
    same_halves = halves(players) == halves(new['players'])
    flipped_ok = all(a['teamA'] != b['teamA']
                     for a, b in zip(sorted(players, key=lambda p: p['name']),
                                     sorted(new['players'], key=lambda p: p['name'])))
    sides_ok = not [p for p in new['players']
                    if (p['teamA'] and p['y'] > 50) or (not p['teamA'] and p['y'] < 50)]
    key_ok = new['roster_key'] == row['roster_key']
    print('\n✅ écrit — mêmes moitiés:%s  couleurs inversées:%s  côtés cohérents:%s  roster_key intact:%s'
          % (same_halves, flipped_ok, sides_ok, key_ok))
    if not (same_halves and flipped_ok and sides_ok and key_ok):
        print('⚠️ relecture inattendue — vérifier la ligne slot_sessions à la main.')
        sys.exit(1)


if __name__ == '__main__':
    main()
