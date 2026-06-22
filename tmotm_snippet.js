/* ══════════════════════════════════════════
   VOTE — HOMME DU TOURNOI (4 équipes)
   Règle : on ne peut pas voter pour un joueur de sa propre équipe.
   Réutilise la table Supabase `votes` (session_id = <slotId>_motm).
   ══════════════════════════════════════════ */
var _tmotmSelected = {};
var _tmotmTeams = {};

function tmotmTeamOf(name, teams) {
  for (var i = 0; i < teams.length; i++) {
    if ((teams[i].names || []).indexOf(name) !== -1) return teams[i].color;
  }
  return null;
}

function tmotmDeadline(slot) {
  var close = slot && slot.tournament && slot.tournament.motm && slot.tournament.motm.close;
  if (!close) return null;
  var p = close.split('-'); // YYYY-MM-DD -> clôture ce jour à 22h30 Paris
  var approx = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]), 22, 30, 0);
  var offsetMs = new Date(approx.toLocaleString('en-US')) - new Date(approx.toLocaleString('en-US', {timeZone: 'Europe/Paris'}));
  return new Date(approx.getTime() + offsetMs);
}

function _tmotmFindSession(sid) {
  if (window._cur && window._cur.id === sid) return window._cur;
  if (typeof _INS_SESSIONS !== 'undefined') {
    var f = _INS_SESSIONS.find(function(x){ return x.id === sid; });
    if (f) return f;
  }
  return null;
}

function tmotmSelectCard(sid, name) {
  var voterEl = document.getElementById('tmotm-voter-' + sid);
  var voter = voterEl ? voterEl.value : '';
  var teams = _tmotmTeams[sid] || [];
  if (voter) {
    var vteam = tmotmTeamOf(voter, teams), nteam = tmotmTeamOf(name, teams);
    if (vteam && nteam === vteam) { alert('Tu ne peux pas voter pour un joueur de ton équipe !'); return; }
  }
  _tmotmSelected[sid] = name;
  document.querySelectorAll('#tmotm-cards-' + sid + ' .mvp-card').forEach(function(c) {
    c.classList.toggle('selected', c.dataset.name === name);
  });
}

function tmotmRefreshCards(sid) {
  var voterEl = document.getElementById('tmotm-voter-' + sid);
  var voter = voterEl ? voterEl.value : '';
  var teams = _tmotmTeams[sid] || [];
  var vteam = voter ? tmotmTeamOf(voter, teams) : null;
  if (_tmotmSelected[sid] && vteam && tmotmTeamOf(_tmotmSelected[sid], teams) === vteam) {
    _tmotmSelected[sid] = null;
  }
  document.querySelectorAll('#tmotm-cards-' + sid + ' .mvp-card').forEach(function(c) {
    var blocked = vteam && c.dataset.team === vteam;
    c.style.opacity = blocked ? '0.2' : '';
    c.style.pointerEvents = blocked ? 'none' : '';
    c.classList.toggle('selected', c.dataset.name === _tmotmSelected[sid]);
  });
}

function renderTournamentMvp(s) {
  var wrap = document.getElementById('tmotm-section');
  if (!wrap) return;
  if (!s.tournamentResults || !s.tournamentResults.length) { wrap.style.display = 'none'; return; }
  _tmotmTeams[s.id] = s.tournamentTeams || [];
  wrap.style.display = 'block';
  wrap.innerHTML = '<div class="mvp-title" style="margin-top:.4rem">🏅 Homme du tournoi</div><div id="tmotm-inner" style="text-align:center;color:rgba(255,255,255,.3);font-size:.72rem;padding:.5rem 0">Chargement…</div>';
  var tid = s.id + '_motm';
  sbGetVotes(tid).then(function(votes) { _renderTmotmInner(s, votes); });
}

function _renderTmotmInner(s, votes) {
  var inner = document.getElementById('tmotm-inner');
  if (!inner) return;
  var tid = s.id + '_motm';
  var teams = s.tournamentTeams || [];
  var tBorder = {noir:'#FFD600', bleu:'#3b82f6', rouge:'#ef4444', blanc:'#94a3b8'};
  var players = [];
  teams.forEach(function(t){ (t.names || []).forEach(function(n){ players.push(n); }); });
  var slot = (typeof INSCRIPTION_SLOTS !== 'undefined') ? INSCRIPTION_SLOTS.find(function(sl){ return sl.id === s.id; }) : null;
  var dl = tmotmDeadline(slot);
  var fullVote = votes.length >= players.length;
  var isClosed = fullVote || (dl && new Date() >= dl);
  var isOpen = !isClosed;
  var lsKey = 'tmotm_voted_' + tid;
  var alreadyVotedLocal = !!localStorage.getItem(lsKey);
  var html = '';

  /* ── Résultats (vote clôturé) ── */
  if (isClosed) {
    if (votes.length > 0) {
      var counts = {};
      players.forEach(function(n){ counts[n] = 0; });
      votes.forEach(function(v){ if (counts[v.motm] !== undefined) counts[v.motm]++; });
      var sorted = players.slice().sort(function(a,b){ return counts[b] - counts[a]; });
      var maxV = counts[sorted[0]];
      var winners = sorted.filter(function(n){ return counts[n] === maxV && maxV > 0; });
      var total = votes.length;
      winners.forEach(function(w) {
        var wp = getPlayerPhoto(w);
        var wt = tmotmTeamOf(w, teams);
        html += '<div class="mvp-winner-block">';
        if (wp) html += '<img class="mvp-winner-photo" src="' + wp + '" alt="' + w + '" style="border-color:' + (tBorder[wt] || '#FFD600') + '">';
        html += '<div><div class="mvp-winner-name">⭐ ' + w + '</div>';
        html += '<div class="mvp-winner-sub">' + counts[w] + ' vote' + (counts[w] > 1 ? 's' : '') + ' sur ' + total + (winners.length > 1 ? ' · Égalité' : '') + '</div></div>';
        html += '</div>';
      });
      html += '<div class="mvp-bars">';
      sorted.forEach(function(name) {
        if (!counts[name]) return;
        var pct = total > 0 ? Math.round(counts[name] / total * 100) : 0;
        html += '<div class="mvp-bar-row"><div class="mvp-bar-name">' + name + '</div>';
        html += '<div class="mvp-bar-wrap"><div class="mvp-bar-fill" style="width:' + pct + '%"></div></div>';
        html += '<div class="mvp-bar-count">' + counts[name] + '</div></div>';
      });
      html += '</div>';
      var withComments = votes.filter(function(v){ return v.comment && v.comment.trim(); });
      if (withComments.length) {
        html += '<div class="mvp-comments-list">';
        withComments.forEach(function(v) {
          html += '<div class="mvp-comment-item"><div class="mvp-comment-text">"' + v.comment.trim() + '"</div><div class="mvp-comment-author">— ' + v.voter + ' (pour ' + v.motm + ')</div></div>';
        });
        html += '</div>';
      }
    } else {
      html += '<div class="mvp-closed">Aucun vote enregistré pour le tournoi.</div>';
    }
    inner.innerHTML = html;
    return;
  }

  /* ── Vote ouvert ── */
  if (votes.length > 0 && !alreadyVotedLocal) {
    html += '<div style="text-align:center;font-size:.7rem;color:rgba(255,255,255,.3);margin-bottom:.6rem">' + votes.length + ' vote' + (votes.length > 1 ? 's' : '') + ' enregistré' + (votes.length > 1 ? 's' : '') + ' — résultats après clôture</div>';
  }

  if (!alreadyVotedLocal) {
    html += '<div id="tmotm-form-' + s.id + '">';
    html += '<div class="mvp-voter-row"><label>Je suis</label><select id="tmotm-voter-' + s.id + '" onchange="tmotmRefreshCards(&quot;' + s.id + '&quot;)">';
    html += '<option value="">— choisis ton nom</option>';
    players.forEach(function(p) {
      var av = votes.some(function(v){ return v.voter === p; });
      html += '<option value="' + p + '"' + (av ? ' disabled' : '') + '>' + p + (av ? ' ✓' : '') + '</option>';
    });
    html += '</select></div>';
    html += '<div style="text-align:center;font-family:Oswald,sans-serif;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.45);margin:.6rem 0 .15rem">👇 Le meilleur du tournoi</div>';
    html += '<div style="text-align:center;font-family:Barlow,sans-serif;font-size:.6rem;color:rgba(255,255,255,.35);margin-bottom:.45rem">Pas un joueur de ton équipe — choisis ton nom d\'abord</div>';
    html += '<div class="mvp-cards" id="tmotm-cards-' + s.id + '">';
    players.forEach(function(p) {
      var photo = getPlayerPhoto(p);
      var team = tmotmTeamOf(p, teams);
      var bc = tBorder[team] || 'rgba(255,255,255,.15)';
      var initials = p.slice(0,2).toUpperCase();
      html += '<div class="mvp-card" data-name="' + p + '" data-team="' + team + '" onclick="tmotmSelectCard(&quot;' + s.id + '&quot;,&quot;' + p + '&quot;)">';
      if (photo) {
        html += '<img src="' + photo + '" alt="' + p + '" style="border:2px solid ' + bc + '">';
      } else {
        html += '<div style="width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.1);border:2px solid ' + bc + ';display:flex;align-items:center;justify-content:center;font-family:Oswald,sans-serif;font-size:.75rem;color:rgba(255,255,255,.5)">' + initials + '</div>';
      }
      html += '<div class="mvp-card-name">' + p + '</div></div>';
    });
    html += '</div>';
    html += '<div class="mvp-comment-row"><textarea id="tmotm-comment-' + s.id + '" placeholder="Pourquoi ? (optionnel)"></textarea></div>';
    html += '<div style="text-align:center"><button class="mvp-btn" id="tmotm-submit-' + s.id + '" onclick="submitTmotmVote(&quot;' + s.id + '&quot;)">Voter 🏅</button></div>';
    if (dl) {
      var diffMs = dl - new Date();
      if (diffMs > 0) {
        var diffH = Math.floor(diffMs / 3600000), diffM = Math.floor((diffMs % 3600000) / 60000);
        html += '<div class="mvp-info" style="text-align:center">Vote ouvert encore ~' + diffH + 'h' + String(diffM).padStart(2,'0') + 'min</div>';
      }
    }
    html += '</div>';
  } else {
    var mv = localStorage.getItem(lsKey);
    html += '<div class="mvp-voted-ok">✅ Tu as déjà voté' + (mv ? ' — merci ' + mv + ' !' : ' !') + '</div>';
    if (votes.length > 0) html += '<div class="mvp-info" style="text-align:center">' + votes.length + ' vote' + (votes.length > 1 ? 's' : '') + ' — résultats après clôture</div>';
  }

  inner.innerHTML = html;
}

async function submitTmotmVote(sid) {
  var tid = sid + '_motm';
  var voterEl = document.getElementById('tmotm-voter-' + sid);
  var commentEl = document.getElementById('tmotm-comment-' + sid);
  var btn = document.getElementById('tmotm-submit-' + sid);
  var voter = voterEl ? voterEl.value.trim() : '';
  var motm = _tmotmSelected[sid] || '';
  var comment = commentEl ? commentEl.value.trim() : '';
  var teams = _tmotmTeams[sid] || [];

  if (!voter) { alert('Sélectionne ton nom !'); return; }
  if (!motm) { alert('Clique sur un joueur pour voter !'); return; }
  if (voter === motm) { alert('Tu ne peux pas voter pour toi-même !'); return; }
  var vteam = tmotmTeamOf(voter, teams);
  if (vteam && vteam === tmotmTeamOf(motm, teams)) { alert('Tu ne peux pas voter pour un joueur de ton équipe !'); return; }

  var lsKey = 'tmotm_voted_' + tid;
  if (localStorage.getItem(lsKey)) { alert('Tu as déjà voté pour le tournoi !'); return; }

  if (btn) { btn.disabled = true; btn.textContent = 'Envoi…'; }
  try {
    await sbInsertVote(tid, voter, motm, comment);
    localStorage.setItem(lsKey, voter);
    var s = _tmotmFindSession(sid);
    var votes = await sbGetVotes(tid);
    var inner = document.getElementById('tmotm-inner');
    if (inner) {
      inner.innerHTML = '<div class="mvp-voted-ok">✅ Vote enregistré — merci ' + voter + ' !</div>';
      setTimeout(function(){ if (s) _renderTmotmInner(s, votes); }, 1800);
    }
  } catch(e) {
    if (btn) { btn.disabled = false; btn.textContent = 'Voter 🏅'; }
    if (e.message === 'already_voted') { localStorage.setItem(lsKey, voter); alert('Tu as déjà voté pour le tournoi !'); }
    else { alert('Erreur lors du vote. Vérifie ta connexion.'); }
  }
}
