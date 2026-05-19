"""
Injecte le formulaire de saisie du score dans index.html.
"""
import re, sys

with open('index.html', 'r') as f:
    content = f.read()

# ── 1. CSS ────────────────────────────────────────────────────────────────────

CSS = """
/* ── FORMULAIRE SCORE ── */
#score-form-wrap{margin:.8rem auto 0;text-align:center;max-width:320px}
.score-inputs{display:flex;align-items:center;justify-content:center;gap:.6rem;margin-bottom:.6rem}
.score-input{width:3.2rem;text-align:center;font-family:'Oswald',sans-serif;font-size:1.6rem;font-weight:700;
  background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.25);border-radius:.5rem;
  color:#fff;padding:.3rem .2rem;-moz-appearance:textfield}
.score-input::-webkit-outer-spin-button,.score-input::-webkit-inner-spin-button{-webkit-appearance:none}
.score-input:focus{outline:none;border-color:rgba(255,255,255,.6)}
.score-sep{font-family:'Oswald',sans-serif;font-size:1.2rem;color:rgba(255,255,255,.5)}
.score-submit-btn{font-family:'Oswald',sans-serif;font-size:.85rem;font-weight:700;letter-spacing:.08em;
  text-transform:uppercase;padding:.45rem 1.2rem;border-radius:2rem;border:none;cursor:pointer;
  background:#FFD600;color:#111;transition:opacity .2s}
.score-submit-btn:disabled{opacity:.45;cursor:not-allowed}
#score-form-status{font-size:.75rem;color:rgba(255,255,255,.6);margin-top:.4rem;min-height:1.1rem}
"""

# Inject CSS before </style>
if '#score-form-wrap' not in content:
    content = content.replace('</style>', CSS + '</style>', 1)
    print("CSS injecté")
else:
    print("CSS déjà présent, skip")

# ── 2. HTML : formulaire après le score-block ─────────────────────────────────

FORM_HTML = '<div id="score-form-wrap" style="display:none"></div>'

target = '<div class="mvp-section" id="mvp-section"'
if 'score-form-wrap' not in content:
    content = content.replace(target, FORM_HTML + '\n\n' + target, 1)
    print("HTML formulaire injecté")
else:
    print("HTML formulaire déjà présent, skip")

# ── 3. JS : fonctions renderScoreForm + submitScore ───────────────────────────

JS = r"""
function _matchDateParis(dateStr) {
  var months={janvier:0,février:1,mars:2,avril:3,mai:4,juin:5,juillet:6,août:7,septembre:8,octobre:9,novembre:10,décembre:11};
  var p=dateStr.split(' ');
  return new Date(Date.UTC(+p[2], months[p[1]], +p[0], 22-2, 30)); // 22h30 Paris CEST = 20h30 UTC
}

function renderScoreForm(s) {
  var wrap = document.getElementById('score-form-wrap');
  if (!wrap) return;

  // Cacher si score déjà rentré
  if (s.scoreWinner) { wrap.style.display = 'none'; return; }

  // Afficher seulement après 22h30 Paris le soir du match
  var matchOpen = _matchDateParis(s.date);
  if (Date.now() < matchOpen.getTime()) { wrap.style.display = 'none'; return; }

  var aLabel = (s.nameA || 'Blanche').replace(/[⚪🔵]/g,'').trim();
  var bLabel = (s.nameB || 'Bleue').replace(/[⚪🔵]/g,'').trim();

  wrap.style.display = 'block';
  wrap.innerHTML =
    '<div class="score-inputs">' +
      '<span style="font-size:.7rem;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.1em">' + aLabel + '</span>' +
      '<input class="score-input" id="sc-a" type="number" min="0" max="30" placeholder="0">' +
      '<span class="score-sep">–</span>' +
      '<input class="score-input" id="sc-b" type="number" min="0" max="30" placeholder="0">' +
      '<span style="font-size:.7rem;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.1em">' + bLabel + '</span>' +
    '</div>' +
    '<button class="score-submit-btn" id="sc-btn">Valider le score</button>' +
    '<div id="score-form-status"></div>';

  document.getElementById('sc-btn').addEventListener('click', function() {
    _submitScore(s.id);
  });
}

async function _submitScore(sessionId) {
  var a = parseInt(document.getElementById('sc-a').value, 10);
  var b = parseInt(document.getElementById('sc-b').value, 10);
  var status = document.getElementById('score-form-status');
  var btn = document.getElementById('sc-btn');

  if (isNaN(a) || isNaN(b) || a < 0 || b < 0) { status.textContent = 'Saisis les deux scores.'; return; }
  if (a === b) { status.textContent = 'Match nul impossible.'; return; }

  btn.disabled = true;
  status.textContent = 'Envoi en cours…';

  try {
    var res = await fetch(SB_URL + '/functions/v1/submit-score', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + SB_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({session_id: sessionId, score_a: a, score_b: b})
    });
    var text = await res.text();
    if (res.ok) {
      status.textContent = '✓ Score enregistré — le site se met à jour dans ~1 min';
      document.getElementById('score-form-wrap').style.display = 'none';
    } else {
      status.textContent = 'Erreur : ' + text;
      btn.disabled = false;
    }
  } catch(e) {
    status.textContent = 'Erreur réseau.';
    btn.disabled = false;
  }
}
"""

if '_submitScore' not in content:
    # Inject before the closing </script> of the main script block
    # Find renderScore function to inject right after
    target_js = 'function renderScore(s){'
    if target_js in content:
        content = content.replace(target_js, JS + '\nfunction renderScore(s){', 1)
        print("JS injecté")
    else:
        print("ERREUR : point d'injection JS introuvable")
        sys.exit(1)
else:
    print("JS déjà présent, skip")

# ── 4. Appel dans renderSession ───────────────────────────────────────────────

call = 'renderScoreForm(s);'
if call not in content:
    content = content.replace('renderScore(s);', 'renderScore(s);\n  renderScoreForm(s);', 1)
    print("Appel renderScoreForm ajouté dans renderSession")
else:
    print("Appel déjà présent, skip")

with open('index.html', 'w') as f:
    f.write(content)

print("Injection terminée")
