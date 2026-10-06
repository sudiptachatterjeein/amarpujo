/* Puja Map 2026 - community pujas: visitors add a puja (name, location, photo); it appears after admin approval. */
(function (PM) {
  'use strict';
  var T = function (k, v) { return PM.t(k, v); };
  var S = PM.pujas = { list: null, loading: false, failed: false };
  var F = { lat: null, lon: null, file: null, busy: false };
  var $ = function (id) { return document.getElementById(id); };
  var G = 'https://www.google.com/maps/';

  /* ---------- data ---------- */
  PM.loadPujas = function () {
    if (S.loading) return; S.loading = true;
    return PM.rpc('puja_community_list', {}).then(function (r) { S.list = Array.isArray(r) ? r : []; S.failed = false; }, function () { S.failed = true; if (!S.list) S.list = []; })
      .then(function () { S.loading = false; PM.renderCommunity(); var seg = $('exModeC'); if (seg) seg.innerHTML = T('ex_community') + ' <i>' + PM.nf((S.list || []).length) + '</i>'; });
  };
  function mapsUrl(p) { return G + 'search/?api=1&query=' + p.lat + ',' + p.lon; }
  function dirUrl(p) { return G + 'dir/?api=1&travelmode=walking&destination=' + p.lat + ',' + p.lon; }

  /* ---------- list (inside Explore > Community pujas) ---------- */
  PM.renderCommunity = function () {
    var box = $('exCommunity'); if (!box) return;
    var q = PM.st.q, list = (S.list || []).filter(function (p) { return !q || (p.name + ' ' + (p.address || '') + ' ' + (p.note || '')).toLowerCase().indexOf(q) >= 0; });
    var head = '<button class="btn primary addbtn" data-act="cp-add">' + PM.ic('plus') + T('cp_add') + '</button><p class="fine" style="margin:8px 18px 0">' + T('cp_add_d') + '</p>';
    if (S.list === null) { box.innerHTML = head + '<div class="clist"><div class="sk sk-m"></div><div class="sk sk-m"></div></div>'; return; }
    if (!list.length) { box.innerHTML = head + '<div class="empty">' + PM.ic('pin') + '<b>' + T(S.failed ? 'comm_off' : 'cp_empty') + '</b><span>' + T('cp_empty_d') + '</span></div>'; return; }
    box.innerHTML = head + '<div class="clist">' + list.map(function (p) {
      return '<article class="ccard" data-act="cp-open" data-id="' + PM.esc(p.id) + '" role="button" tabindex="0"><img loading="lazy" alt="" src="' + PM.esc(p.photo_url) + '">' +
        '<div class="cc-main"><b>' + PM.esc(p.name) + '</b>' + (p.address ? '<span>' + PM.ic('pin') + PM.esc(p.address) + '</span>' : '') +
        (p.nickname ? '<em>' + T('cp_by', { n: PM.esc(p.nickname) }) + '</em>' : '') + '</div></article>';
    }).join('') + '</div>';
  };
  PM.acts['cp-open'] = function (el) {
    var id = el.getAttribute('data-id'), p = (S.list || []).filter(function (x) { return x.id === id; })[0]; if (!p) return;
    var wa = PM.wa('🪔 ' + p.name + ' – Durga Puja 2026\n📍 ' + mapsUrl(p) + (PM.site() ? '\n\n' + PM.site() : ''));
    PM.sheet.open('<div class="ps" style="--c:' + PM.zc('F') + '"><div class="ps-head"><div class="ps-title"><h2>' + PM.esc(p.name) + '</h2>' +
      (p.nickname ? '<div class="ps-sub"><span>' + T('cp_by', { n: PM.esc(p.nickname) }) + '</span></div>' : '') + '</div><button class="icon-btn sm" data-act="sheet-close" aria-label="' + PM.esc(T('close')) + '">' + PM.ic('x') + '</button></div>' +
      '<img class="cp-photo" alt="' + PM.esc(p.name) + '" src="' + PM.esc(p.photo_url) + '">' +
      (p.note ? '<p style="margin-bottom:8px">' + PM.esc(p.note) + '</p>' : '') + (p.address ? '<div class="ps-metro">' + PM.ic('pin') + '<div><b>' + PM.esc(p.address) + '</b></div></div>' : '') +
      '<div class="ps-primary"><a class="btn primary" target="_blank" rel="noopener" href="' + dirUrl(p) + '">' + PM.ic('nav') + T('directions') + '</a>' +
      '<a class="btn" target="_blank" rel="noopener" href="' + mapsUrl(p) + '">' + PM.ic('map') + T('cp_open_maps') + '</a></div>' +
      '<a class="btn wide ghost" style="margin-top:10px" target="_blank" rel="noopener" href="' + wa + '">' + PM.ic('share') + T('share') + '</a></div>', { tall: true });
  };

  /* ---------- the "add your puja" form ---------- */
  function parseLatLon(text) {
    var t = String(text || '').trim(); if (!t) return null;
    var m = t.match(/@(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/) || t.match(/!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/) ||
      t.match(/[?&](?:q|ll|query|destination)=(-?\d{1,3}\.\d+)(?:,|%2C)\s*(-?\d{1,3}\.\d+)/i) || t.match(/^\s*(-?\d{1,3}\.\d+)\s*[,;\s]\s*(-?\d{1,3}\.\d+)\s*$/);
    return m ? { lat: parseFloat(m[1]), lon: parseFloat(m[2]) } : null;
  }
  PM.parseLatLon = parseLatLon;
  function locBox() {
    var el = $('apLoc'); if (!el) return;
    if (F.lat == null) { el.className = 'ap-loc'; el.textContent = T('cp_loc_none'); }
    else { el.className = 'ap-loc ok'; el.textContent = T('cp_loc_set', { lat: F.lat.toFixed(5), lon: F.lon.toFixed(5) }); }
  }
  function err(msg) { var e = $('apErr'); if (e) e.textContent = msg || ''; }

  PM.acts['cp-add'] = function () {
    F = { lat: null, lon: null, file: null, busy: false };
    var nick = PM.chat && PM.chat.nick || '';
    PM.sheet.open('<div class="sh-pad apf"><h2>' + PM.ic('plus') + T('cp_add') + '</h2><p class="muted">' + T('cp_form_d') + '</p>' +
      '<label class="l" for="apName">' + T('cp_name') + ' *</label><input id="apName" type="text" maxlength="80" autocomplete="off" placeholder="' + PM.esc(T('cp_name_ph')) + '">' +
      '<label class="l" for="apNote">' + T('cp_note') + '</label><input id="apNote" type="text" maxlength="160" autocomplete="off" placeholder="' + PM.esc(T('cp_note_ph')) + '">' +
      '<label class="l" for="apAddr">' + T('cp_addr') + '</label><input id="apAddr" type="text" maxlength="160" autocomplete="off">' +
      '<label class="l">' + T('cp_loc') + ' *</label><div class="ap-loc" id="apLoc"></div>' +
      '<button class="btn wide" data-act="ap-gps">' + PM.ic('locate') + T('cp_gps') + '</button>' +
      '<input id="apLink" type="text" autocomplete="off" placeholder="' + PM.esc(T('cp_link_ph')) + '">' +
      '<label class="l">' + T('cp_photo') + ' *</label><div class="ap-photo" id="apPhoto">' + T('cp_photo_none') + '</div>' +
      '<label class="btn wide" for="apFile">' + PM.ic('camera') + T('cp_photo_btn') + '</label><input id="apFile" type="file" accept="image/*" hidden>' +
      '<label class="l" for="apNick">' + T('cp_nick') + '</label><input id="apNick" type="text" maxlength="24" autocomplete="off" value="' + PM.esc(nick) + '">' +
      '<p class="cg-err" id="apErr" role="alert"></p><button class="btn primary wide" id="apSubmit" data-act="ap-submit">' + T('cp_submit') + '</button></div>', { tall: true });
    locBox();
    $('apFile').addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0]; if (!f) return;
      if (f.size > 15 * 1024 * 1024) { err(T('photo_big')); return; }
      F.file = f; var box = $('apPhoto'); box.innerHTML = ''; var img = new Image(); img.alt = ''; img.src = URL.createObjectURL(f); box.appendChild(img); err('');
    });
    $('apLink').addEventListener('input', function (e) {
      var v = e.target.value.trim(); if (!v) return; var pt = parseLatLon(v);
      if (pt) { F.lat = pt.lat; F.lon = pt.lon; locBox(); err(''); }
    });
  };
  PM.acts['ap-gps'] = function (el) {
    if (!navigator.geolocation) { err(T('loc_na')); return; }
    el.disabled = true; el.lastChild.textContent = T('cp_gps_wait');
    navigator.geolocation.getCurrentPosition(function (pos) {
      F.lat = pos.coords.latitude; F.lon = pos.coords.longitude; el.disabled = false; el.lastChild.textContent = T('cp_gps'); locBox(); err('');
    }, function () { el.disabled = false; el.lastChild.textContent = T('cp_gps'); err(T('loc_denied')); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 });
  };
  var ERRK = { bad_name: 'cp_e_name', bad_text: 'cp_e_text', bad_location: 'cp_e_far', bad_photo: 'cp_e_generic', too_many: 'cp_e_many', bad_client: 'cp_e_generic' };
  PM.acts['ap-submit'] = function () {
    if (F.busy) return;
    var name = ($('apName').value || '').trim(), note = ($('apNote').value || '').trim(), addr = ($('apAddr').value || '').trim(), nick = ($('apNick').value || '').trim();
    var link = ($('apLink').value || '').trim(); if (F.lat == null && link) { var pt = parseLatLon(link); if (pt) { F.lat = pt.lat; F.lon = pt.lon; locBox(); } else { err(T('cp_link_bad')); return; } }
    if (name.length < 3) { err(T('cp_e_name')); $('apName').focus(); return; }
    if (F.lat == null) { err(T('cp_e_loc')); return; }
    if (!F.file) { err(T('cp_e_photo')); return; }
    err(''); F.busy = true; var btn = $('apSubmit'); btn.disabled = true; btn.textContent = T('cp_uploading');
    var path = 'community/pujas/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.jpg';
    PM.resizeToBlob(F.file, 1600, 0.82).then(function (blob) {
      return fetch(PM.CFG.SUPABASE_URL + '/storage/v1/object/puja-photos/' + path, { method: 'POST', headers: PM.sbHeaders({ 'Content-Type': 'image/jpeg', 'x-upsert': 'false' }), body: blob })
        .then(function (up) { if (!up.ok) throw new Error('upload ' + up.status); });
    }).then(function () {
      return PM.rpc('puja_submit', { p_name: name, p_note: note || null, p_address: addr || null, p_lat: F.lat, p_lon: F.lon,
        p_photo: PM.CFG.SUPABASE_URL + '/storage/v1/object/public/puja-photos/' + path, p_nick: nick || null, p_client: PM.clientId() });
    }).then(function (r) {
      F.busy = false;
      if (r && r.ok) { PM.sheet.open('<div class="sh-pad center"><h2>' + PM.ic('check') + T('cp_thanks') + '</h2><p class="muted">' + T('cp_thanks_d') + '</p><button class="btn primary wide" data-act="sheet-close">' + T('close') + '</button></div>'); return; }
      btn.disabled = false; btn.textContent = T('cp_submit'); err(T(ERRK[r && r.error] || 'cp_e_generic'));
    }).catch(function () { F.busy = false; var b = $('apSubmit'); if (b) { b.disabled = false; b.textContent = T('cp_submit'); } err(T('cp_e_generic')); });
  };

  /* ---------- Explore: Official guide <-> Community pujas ---------- */
  PM.acts['ex-mode'] = function (el) {
    PM.st.ex = el.getAttribute('data-m'); PM.applyExploreMode();
    if (PM.st.ex === 'community') PM.loadPujas();
  };
  PM.applyExploreMode = function () {
    var c = PM.st.ex === 'community';
    var o = $('exOfficial'), oh = $('exOfficialHead'), cm = $('exCommunity'); if (o) o.hidden = c; if (oh) oh.hidden = c; if (cm) cm.hidden = !c;
    Array.prototype.forEach.call(document.querySelectorAll('.ex-mode button'), function (b) { b.classList.toggle('on', b.getAttribute('data-m') === PM.st.ex); });
    if (c) PM.renderCommunity();
  };
  PM.pujaCard = function () {
    return '<section class="addcard" data-act="cp-go" role="button" tabindex="0"><span class="cc-ic">' + PM.ic('pin') + '</span><span class="cc-t"><b>' + T('cp_add') + '</b><span>' + T('cp_card_d') + '</span></span><span class="btn sm">' + PM.ic('plus') + T('cp_add_short') + '</span></section>';
  };
  PM.acts['cp-go'] = function () { PM.st.ex = 'community'; PM.go('explore'); PM.applyExploreMode(); PM.loadPujas(); setTimeout(function () { PM.acts['cp-add'](); }, 120); };
})(window.PM = window.PM || {});
