const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GITHUB_PAT = Deno.env.get('GITHUB_PAT')!

Deno.serve(async (req) => {
  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return new Response('invalid json', { status: 400 })
  }

  // Supabase DB webhook sends { record: { session_id, ... } }
  const sessionId = (payload.record as Record<string, string>)?.session_id
  if (!sessionId) {
    return new Response('no session_id in payload', { status: 400 })
  }

  // Count votes for this session (service role key bypasses all restrictions)
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/votes?session_id=eq.${sessionId}&select=id`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  )

  if (!res.ok) {
    const text = await res.text()
    console.error(`Supabase error: ${text}`)
    return new Response(`supabase error: ${text}`, { status: 500 })
  }

  const votes = await res.json() as unknown[]
  const count = votes.length
  console.log(`Session ${sessionId}: ${count} votes`)

  if (count !== 10) {
    return new Response(`${count}/10 — not triggering`, { status: 200 })
  }

  // 10 votes reached — trigger GitHub Action
  const gh = await fetch(
    'https://api.github.com/repos/augustintiberghien/five-lundi/actions/workflows/switch-session.yml/dispatches',
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

  // GitHub répond 204 No Content à un workflow_dispatch réussi. Renvoyer ce statut tel
  // quel avec un corps fait lever `new Response` (« null body status » : 204 interdit un
  // corps), l'exception remonte non attrapée et le webhook DB reçoit un 500 alors que le
  // dispatch, lui, est bien parti — il le rejoue donc, et chaque rejeu relance un run qui
  // dort 3h. On répond 200 sur tout succès, et on ne relaie que le statut d'erreur.
  if (gh.ok) {
    console.log('GitHub Action triggered')
    return new Response('GitHub Action triggered', { status: 200 })
  }
  const msg = await gh.text()
  console.error(`GitHub dispatch failed (${gh.status}): ${msg}`)
  return new Response(msg, { status: 502 })
})
