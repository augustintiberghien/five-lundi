// Filet de sécurité du lock 21h30.
//
// Le trigger `schedule` de GitHub Actions est best-effort. Mesuré sur lock-session.yml :
// 3 min de retard le 17 août, 4 min le 24, mais 111 min le 31 (aucun cron n'a atterri
// près de 21h30, la compo n'a été figée qu'à 23h21 Paris). Le `workflow_dispatch`, lui,
// part en moins d'une seconde — les deux dispatches de test du 4 septembre ont créé leur
// run dans la même seconde. Cette fonction expose donc ce dispatch au site : si un
// visiteur ouvre la page le soir du match après 21h30 et que la compo n'est pas figée,
// c'est la page qui réveille le lock.
//
// Idempotent de bout en bout : lock_session.py sort sans rien faire si la session du jour
// existe déjà, et `concurrency: lock-session` sérialise les runs.

const GITHUB_PAT = Deno.env.get('GITHUB_PAT')!

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    // Le front envoie Authorization (clé anon) en plus de Content-Type. Sans les deux
    // noms ici, le préflight échoue et le navigateur bloque l'appel avant de l'émettre —
    // invisible en curl, qui ne fait pas de préflight. (Le piège du 27 juillet 2026.)
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

/** Heure de Paris, quel que soit le fuseau du serveur. */
function parisNow(): { weekday: number; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(new Date())
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return {
    weekday: days.indexOf(get('weekday')),
    // Intl rend « 24 » pour minuit en hour12:false ; on le ramène à 0.
    hour: parseInt(get('hour'), 10) % 24,
    minute: parseInt(get('minute'), 10),
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { ...corsHeaders(), 'Access-Control-Max-Age': '86400' } })
  }

  // Garde-fou serveur : le lock ne peut rien faire hors du lundi soir. lock_session.py
  // cherche un créneau daté d'aujourd'hui, donc passé minuit il sort de toute façon à
  // vide. On refuse ici pour ne pas dépenser de minutes Actions sur un appel inutile.
  const { weekday, hour, minute } = parisNow()
  const afterLock = hour > 21 || (hour === 21 && minute >= 30)
  if (weekday !== 1 || !afterLock) {
    const hhmm = `${String(hour).padStart(2, '0')}h${String(minute).padStart(2, '0')}`
    return new Response(`Hors fenêtre (lundi ${hhmm} Paris requis ≥ 21h30) — rien à faire`, {
      status: 200,
      headers: corsHeaders(),
    })
  }

  const gh = await fetch(
    'https://api.github.com/repos/augustintiberghien/five-lundi/actions/workflows/lock-session.yml/dispatches',
    {
      method: 'POST',
      headers: {
        Authorization: `token ${GITHUB_PAT}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main' }),
    }
  )

  // Ne jamais relayer gh.status tel quel : GitHub répond 204 No Content à un dispatch
  // réussi, et 204 interdit un corps — `new Response` lèverait, l'exception remonterait
  // non attrapée et l'appelant verrait un 500 alors que le dispatch est bien parti.
  // (Le piège de trigger-switch, corrigé le 4 septembre 2026.)
  if (gh.ok) {
    console.log('Lock déclenché par le site')
    return new Response('Lock déclenché', { status: 200, headers: corsHeaders() })
  }
  const msg = await gh.text()
  console.error(`Dispatch lock-session échoué (${gh.status}): ${msg}`)
  return new Response(msg, { status: 502, headers: corsHeaders() })
})
