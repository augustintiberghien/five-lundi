function _tournamentHofMedal(sl) {
  var t = sl.tournament;
  var winner = t.motm.winner;
  var sid = sl.id;
  var photo = _getPhotoSrc(winner);
  var onclick = "window.scrollTo(0,0);showPitch();var _t=(typeof _INS_SESSIONS!=='undefined')?_INS_SESSIONS.find(function(x){return x.id==='" + sid + "';}):null;if(_t){renderSession(_t);setActiveTab('" + sid + "');}";
  var h = '<div onclick="' + onclick + '" style="display:flex;flex-direction:column;align-items:center;gap:.35rem;cursor:pointer;width:82px">';
  h += '<div style="position:relative">';
  if (photo) {
    h += '<img src="' + photo + '" style="width:58px;height:58px;border-radius:50%;object-fit:cover;object-position:top;border:2px solid #FFD600;box-shadow:0 0 0 2px rgba(255,214,0,.35),0 0 12px rgba(255,214,0,.45)">';
  } else {
    h += '<div style="width:58px;height:58px;border-radius:50%;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-size:.72rem;color:rgba(255,255,255,.4);border:2px solid #FFD600;box-shadow:0 0 0 2px rgba(255,214,0,.35),0 0 12px rgba(255,214,0,.45)">' + winner.slice(0,2).toUpperCase() + '</div>';
  }
  h += '<div style="position:absolute;bottom:-5px;right:-7px;font-size:1rem">🏆</div>';
  h += '</div>';
  h += '<div style="font-family:Oswald,sans-serif;font-size:.62rem;font-weight:700;color:#FFD600;text-transform:uppercase;text-align:center;line-height:1.1">' + winner + '</div>';
  h += '<div style="font-family:Oswald,sans-serif;font-size:.48rem;font-weight:700;color:#000;background:linear-gradient(135deg,#FFD600,#ffe85c);border-radius:999px;padding:.08rem .45rem;text-transform:uppercase;letter-spacing:.04em">🏆 Homme du tournoi</div>';
  return h;
}

