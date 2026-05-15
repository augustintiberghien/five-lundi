#!/usr/bin/env python3
"""Ajoute le système de notification CallMeBot dans setPresence."""

with open('index.html', 'r') as f:
    c = f.read()

# ── 1. Ajouter la fonction notifySubstituteIfNeeded juste avant setPresence ──

NOTIFY_FN = '''
async function notifySubstituteIfNeeded(s, absentName) {
  try {
    var starterNames = (s._originalPlayers || s.players.map(function(p){ return p.name; }));
    var bench = s.bench || [];
    if (!bench.length || starterNames.indexOf(absentName) === -1) return;

    var presences = await sbGetPresences(s.id);
    var byName = {};
    presences.forEach(function(p){ byName[p.name] = p.status; });

    var absentStarters = starterNames.filter(function(n){ return byName[n] === 'absent'; });
    var absentIdx = absentStarters.indexOf(absentName);
    if (absentIdx < 0) return;  // shouldn't happen

    // Trouver le remplaçant pour ce slot d'absence
    var bi = 0;
    for (var slot = 0; slot <= absentIdx; slot++) {
      while (bi < bench.length && byName[bench[bi]] === 'absent') bi++;
      if (bi >= bench.length) return;  // plus de remplaçant dispo
      if (slot === absentIdx) {
        var substitute = bench[bi];
        await fetch(SB_URL + '/functions/v1/notify-substitute', {
          method: 'POST',
          headers: Object.assign({}, sbHeaders(), {'Content-Type': 'application/json'}),
          body: JSON.stringify({
            substitute: substitute,
            absentPlayer: absentName,
            sessionId: s.id,
            sessionDate: s.date
          })
        });
        console.log('notify sent → ' + substitute + ' (remplace ' + absentName + ')');
      }
      bi++;
    }
  } catch(e) {
    console.warn('notifySubstituteIfNeeded error:', e);
  }
}

'''

ANCHOR = 'function setPresence(sessionId, name, clickedStatus) {'

if NOTIFY_FN.strip() in c:
    print("⚠️  notifySubstituteIfNeeded déjà présent")
elif ANCHOR not in c:
    print("❌ Ancre setPresence non trouvée")
else:
    c = c.replace(ANCHOR, NOTIFY_FN + ANCHOR, 1)
    print("✅ notifySubstituteIfNeeded ajouté")

# ── 2. Appeler la fonction dans setPresence après l'upsert ──

OLD_PROMISE = '''  promise.then(function() {
    // Re-render complet : recalcule les remplaçants, absents, en attente
    if (window._cur) renderPresence(window._cur);
  }).catch(function(e) {
    console.warn('setPresence error:', e);
    if (window._cur) renderPresence(window._cur);
  });'''

NEW_PROMISE = '''  promise.then(function() {
    // Notification WhatsApp si un titulaire passe absent
    if (newStatus === 'absent' && window._cur) {
      notifySubstituteIfNeeded(window._cur, name);
    }
    // Re-render complet : recalcule les remplaçants, absents, en attente
    if (window._cur) renderPresence(window._cur);
  }).catch(function(e) {
    console.warn('setPresence error:', e);
    if (window._cur) renderPresence(window._cur);
  });'''

if NEW_PROMISE.strip() in c:
    print("⚠️  Hook notification déjà présent")
elif OLD_PROMISE not in c:
    print("❌ Ancre promise.then non trouvée")
else:
    c = c.replace(OLD_PROMISE, NEW_PROMISE, 1)
    print("✅ Hook notification ajouté dans setPresence")

with open('index.html', 'w') as f:
    f.write(c)
