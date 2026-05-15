#!/usr/bin/env python3
"""Remplace le système CallMeBot par Web Push dans index.html."""

with open('index.html', 'r') as f:
    c = f.read()

errors = []

# ── 1. Ajouter VAPID_PUBLIC_KEY après SB_KEY ─────────────────────────────────

OLD_SB = "var SB_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
NEW_SB  = OLD_SB  # keep unchanged, just add after

VAPID_LINE = "\nvar VAPID_PUBLIC_KEY = '';" # filled in after keygen

SB_KEY_END = c.find("';\n", c.find(OLD_SB)) + 3  # end of the SB_KEY line
if SB_KEY_END < 3:
    errors.append("❌ SB_KEY non trouvé")
elif VAPID_LINE.strip() in c:
    print("⚠️  VAPID_PUBLIC_KEY déjà présent")
else:
    c = c[:SB_KEY_END] + VAPID_LINE + c[SB_KEY_END:]
    print("✅ VAPID_PUBLIC_KEY ajouté")

# ── 2. Remplacer notifySubstituteIfNeeded (CallMeBot) par version Web Push ───

OLD_NOTIFY = """async function notifySubstituteIfNeeded(s, absentName) {
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
}"""

NEW_NOTIFY = """function urlBase64ToUint8Array(b64) {
  var pad = '='.repeat((4 - b64.length % 4) % 4);
  var s = (b64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  var raw = atob(s);
  return Uint8Array.from(Array.from(raw).map(function(c){ return c.charCodeAt(0); }));
}

async function registerPushSubscription(playerName) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  if (!VAPID_PUBLIC_KEY) return;
  try {
    var reg = await navigator.serviceWorker.register('./sw.js');
    var perm = await Notification.requestPermission();
    if (perm !== 'granted') return;
    var sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    await fetch(SB_URL + '/rest/v1/push_subscriptions', {
      method: 'POST',
      headers: Object.assign({}, sbHeaders(), {'Content-Type':'application/json','Prefer':'resolution=merge-duplicates'}),
      body: JSON.stringify({name: playerName, subscription: sub.toJSON(), updated_at: new Date().toISOString()})
    });
  } catch(e) {
    console.warn('registerPushSubscription:', e);
  }
}

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
    if (absentIdx < 0) return;

    var bi = 0;
    for (var slot = 0; slot <= absentIdx; slot++) {
      while (bi < bench.length && byName[bench[bi]] === 'absent') bi++;
      if (bi >= bench.length) return;
      if (slot === absentIdx) {
        var substitute = bench[bi];
        await fetch(SB_URL + '/functions/v1/notify-substitute', {
          method: 'POST',
          headers: Object.assign({}, sbHeaders(), {'Content-Type': 'application/json'}),
          body: JSON.stringify({substitute: substitute, absentPlayer: absentName, sessionDate: s.date})
        });
      }
      bi++;
    }
  } catch(e) {
    console.warn('notifySubstituteIfNeeded:', e);
  }
}"""

if OLD_NOTIFY in c:
    c = c.replace(OLD_NOTIFY, NEW_NOTIFY, 1)
    print("✅ notifySubstituteIfNeeded remplacé + Web Push helpers ajoutés")
else:
    errors.append("❌ notifySubstituteIfNeeded (ancienne version) non trouvé")

# ── 3. Appeler registerPushSubscription dans setPresence ─────────────────────

OLD_SETPRESENCE_TOP = """function setPresence(sessionId, name, clickedStatus) {
  localStorage.setItem('presence_name', name);"""

NEW_SETPRESENCE_TOP = """function setPresence(sessionId, name, clickedStatus) {
  var prevName = localStorage.getItem('presence_name');
  localStorage.setItem('presence_name', name);
  if (name !== prevName) registerPushSubscription(name);"""

if OLD_SETPRESENCE_TOP in c:
    c = c.replace(OLD_SETPRESENCE_TOP, NEW_SETPRESENCE_TOP, 1)
    print("✅ registerPushSubscription appelé dans setPresence")
elif NEW_SETPRESENCE_TOP in c:
    print("⚠️  registerPushSubscription déjà présent dans setPresence")
else:
    errors.append("❌ Ancre setPresence non trouvée")

# ── 4. Nettoyer le commentaire WhatsApp dans promise.then ────────────────────

OLD_COMMENT = "    // Notification WhatsApp si un titulaire passe absent\n"
NEW_COMMENT = "    // Notification push si un titulaire passe absent\n"
if OLD_COMMENT in c:
    c = c.replace(OLD_COMMENT, NEW_COMMENT, 1)
    print("✅ Commentaire mis à jour")

# ── Résumé ────────────────────────────────────────────────────────────────────

with open('index.html', 'w') as f:
    f.write(c)

if errors:
    for e in errors:
        print(e)
else:
    print("\n✅ Patch Web Push terminé.")
