const GITHUB_PAT = Deno.env.get('GITHUB_PAT')!
const SCORE_PIN   = Deno.env.get('SCORE_PIN')!   // code secret défini dans les secrets Supabase

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  let body: { session_id?: string; score_a?: number; score_b?: number; pin?: string }
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: corsHeaders() })
  }

  const { session_id, score_a, score_b, pin } = body

  // Vérification du PIN
  if (!pin || pin !== SCORE_PIN) {
    return new Response('Code incorrect', { status: 403, headers: corsHeaders() })
  }

  if (!session_id || typeof score_a !== 'number' || typeof score_b !== 'number') {
    return new Response('Champs manquants', { status: 400, headers: corsHeaders() })
  }
  if (score_a < 0 || score_b < 0 || score_a > 30 || score_b > 30) {
    return new Response('Score hors limites (0-30)', { status: 400, headers: corsHeaders() })
  }
  if (score_a === score_b) {
    return new Response('Match nul impossible', { status: 400, headers: corsHeaders() })
  }

  const winner = score_a > score_b ? 'A' : 'B'
  console.log(`Score reçu : ${session_id} — ${score_a} vs ${score_b} (winner=${winner})`)

  const gh = await fetch(
    'https://api.github.com/repos/augustintiberghien/five-lundi/actions/workflows/set-score.yml/dispatches',
    {
      method: 'POST',
      headers: {
        Authorization: `token ${GITHUB_PAT}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          session_id,
          score_a: String(score_a),
          score_b: String(score_b),
          winner,
        },
      }),
    }
  )

  const msg = gh.ok ? 'Score envoyé' : await gh.text()
  return new Response(msg, { status: gh.status, headers: corsHeaders() })
})

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'text/plain',
  }
}
