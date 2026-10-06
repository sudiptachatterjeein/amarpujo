/* Puja Map 2026 - Explore tab + pandal detail sheet (directions, food, live check-ins, tips, photos) */
(function (PM) {
  'use strict';
  var T = function (k, v) { return PM.t(k, v); };

  /* ---------- filtering ---------- */
  PM.matches = function (i) {
    var st = PM.st, p = PM.P[i];
    if (PM.reg(i) !== st.rg) return false;
    if (st.zf !== 'all' && st.zf !== p[1]) return false;
    if (st.star && !p[6]) return false;
    if (st.q) {
      var f = PM.F[i];
      var hay = [p[0], PM.bn(p[0]), p[2], PM.bn(p[2]), f[0], PM.bn(f[0]), f[1], PM.bn(f[1]), PM.Z[p[1]][0], PM.bn(PM.Z[p[1]][0])].join(' ').toLowerCase();
      if (hay.indexOf(st.q) < 0) return false;
    }
    return true;
  };

  /* ---------- list pieces ---------- */
  function pcard(i) {
    var p = PM.P[i], f = PM.F[i], inR = PM.st.sel.indexOf(i) >= 0, vis = PM.st.vs.has(i);
    var shop = /stalls/i.test(f[0]) ? PM.tr(f[0]) : PM.tr(f[0]);
    return '<article class="pcard' + (vis ? ' vis' : '') + '" data-act="open-pandal" data-i="' + i + '" role="button" tabindex="0" style="--c:' + PM.zc(p[1]) + '">' +
      '<span class="num">' + (vis ? PM.ic('check') : PM.nf(i + 1)) + '</span>' +
      '<div class="pc-main"><div class="pc-name">' + PM.esc(PM.pn(i)) + (p[6] ? '<span class="star" title="' + T('famous') + '">' + PM.ic('star') + '</span>' : '') + '</div>' +
      '<div class="pc-meta">' + PM.ic('metro') + '<span>' + PM.esc(PM.sn(p[2])) + '</span></div>' +
      '<div class="pc-food">' + PM.ic('food') + '<span>' + PM.esc(shop) + ' – ' + PM.esc(PM.tr(f[1])) + '</span></div></div>' +
      '<button class="pc-add' + (inR ? ' on' : '') + '" data-act="route-toggle" data-i="' + i + '" aria-label="' + (inR ? T('remove_route') : T('add_route')) + '">' + PM.ic(inR ? 'check' : 'plus') + '</button></article>';
  }
  function regionPills() {
    return Object.keys(PM.RG).map(function (k) {
      var n = PM.P.filter(function (p, i) { return PM.reg(i) === k; }).length;
      return '<button class="pill' + (k === PM.st.rg ? ' on' : '') + '" data-act="ex-region" data-r="' + k + '">' + PM.esc(PM.rn(k)) + ' <i>' + PM.nf(n) + '</i></button>';
    }).join('');
  }
  function zonePills() {
    var st = PM.st;
    return '<button class="chip' + (st.zf === 'all' && !st.star ? ' on' : '') + '" data-act="ex-zone" data-z="all">' + T('all_zones') + '</button>' +
      '<button class="chip gold' + (st.star ? ' on' : '') + '" data-act="ex-star">' + PM.ic('star') + T('famous') + '</button>' +
      Object.keys(PM.Z).filter(function (k) { return PM.Z[k][2] === st.rg; }).map(function (k) {
        return '<button class="chip' + (st.zf === k ? ' on' : '') + '" data-act="ex-zone" data-z="' + k + '" style="--c:' + PM.zc(k) + '"><i class="dotc" style="background:' + PM.zc(k) + '"></i>' + PM.esc(PM.zn(k)) + '</button>';
      }).join('');
  }
  PM.renderExploreList = function () {
    var box = document.getElementById('exList'); if (!box) return;
    var ids = PM.P.map(function (p, i) { return i; }).filter(PM.matches);
    var visited = PM.st.vs.size, total = PM.P.length;
    var prog = document.getElementById('exProg');
    if (prog) prog.innerHTML = '<div class="bar"><i style="width:' + Math.round(visited / total * 100) + '%"></i></div><span>' + T('visited_of', { a: PM.nf(visited), b: PM.nf(total) }) + '</span>';
    var cnt = document.getElementById('exCount'); if (cnt) cnt.textContent = T('n_pandals', { n: PM.nf(ids.length) });
    box.innerHTML = ids.length ? ids.map(pcard).join('') :
      '<div class="empty">' + PM.ic('search') + '<b>' + T('no_match') + '</b><span>' + T('no_match_d') + '</span><button class="btn" data-act="ex-clear">' + T('clear_filters') + '</button></div>';
  };
  PM.renderExplore = function () {
    var el = document.getElementById('v-explore'); if (!el) return;
    el.innerHTML = '<header class="vhead"><div class="search-row"><div class="search">' + PM.ic('search') + '<input id="sq" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" placeholder="' + PM.esc(T('search_ph')) + '" value="' + PM.esc(PM.st.q) + '" aria-label="' + PM.esc(T('search_ph')) + '"></div>' + PM.wxPill() + '</div>' +
      '<div class="seg ex-mode" role="tablist"><button role="tab" data-act="ex-mode" data-m="official" class="' + (PM.st.ex === 'official' ? 'on' : '') + '">' + T('ex_official') + '</button>' +
      '<button role="tab" data-act="ex-mode" data-m="community" id="exModeC" class="' + (PM.st.ex === 'community' ? 'on' : '') + '">' + T('ex_community') + (PM.pujas && PM.pujas.list ? ' <i>' + PM.nf(PM.pujas.list.length) + '</i>' : '') + '</button></div>' +
      '<div id="exOfficialHead"><div class="pill-row" id="exRegions">' + regionPills() + '</div><div class="pill-row chips" id="exZones">' + zonePills() + '</div></div>' +
      '</header><div id="exOfficial"><div class="ex-meta"><span id="exCount"></span><div id="exProg" class="prog"></div></div><div class="list" id="exList"></div></div><div id="exCommunity" hidden></div>';
    var sq = document.getElementById('sq');
    sq.addEventListener('input', function (e) { PM.st.q = e.target.value.trim().toLowerCase(); PM.renderExploreList(); if (PM.st.ex === 'community') PM.renderCommunity(); });
    PM.renderExploreList();
    if (PM.applyExploreMode) PM.applyExploreMode();
  };
  PM.refreshExploreChips = function () {
    var a = document.getElementById('exRegions'), b = document.getElementById('exZones');
    if (a) a.innerHTML = regionPills(); if (b) b.innerHTML = zonePills();
  };

  PM.acts['ex-region'] = function (el) { PM.st.rg = el.getAttribute('data-r'); PM.st.zf = 'all'; PM.st.star = false; PM.st.mapSel = -1; PM.refreshExploreChips(); PM.renderExploreList(); if (PM.map) PM.map.redraw(); };
  PM.acts['ex-zone'] = function (el) { PM.st.zf = el.getAttribute('data-z'); PM.st.star = false; PM.refreshExploreChips(); PM.renderExploreList(); };
  PM.acts['ex-star'] = function () { PM.st.star = !PM.st.star; if (PM.st.star) PM.st.zf = 'all'; PM.refreshExploreChips(); PM.renderExploreList(); };
  PM.acts['ex-clear'] = function () {
    PM.st.q = ''; PM.st.zf = 'all'; PM.st.star = false; var sq = document.getElementById('sq'); if (sq) sq.value = '';
    PM.refreshExploreChips(); PM.renderExploreList();
  };

  /* ---------- route / visited toggles (used everywhere) ---------- */
  PM.toggleRoute = function (i) {
    var st = PM.st, k = st.sel.indexOf(i);
    if (k >= 0) { st.sel.splice(k, 1); PM.toast(T('removed_route')); }
    else {
      if (st.sel.length >= 11) { PM.toast(T('route_max')); return; }
      st.sel.push(i); PM.toast(T('added_route', { name: PM.pn(i) }));
    }
    PM.saveRoute(); PM.afterChange();
  };
  PM.toggleVisited = function (i) {
    var st = PM.st; if (st.vs.has(i)) st.vs.delete(i); else { st.vs.add(i); PM.toast(T('marked_visited')); }
    PM.saveVisited(); PM.afterChange();
  };
  PM.acts['route-toggle'] = function (el, e) { e.stopPropagation(); PM.toggleRoute(+el.getAttribute('data-i')); };
  PM.acts['visit-toggle'] = function (el, e) { e.stopPropagation(); PM.toggleVisited(+el.getAttribute('data-i')); };

  /* ---------- pandal sheet ---------- */
  function linkBtn(href, icon, label, cls) {
    return '<a class="' + (cls || 'tile') + '" target="_blank" rel="noopener" href="' + href + '">' + PM.ic(icon) + '<span>' + label + '</span></a>';
  }
  function sheetHtml(i) {
    var p = PM.P[i], f = PM.F[i], G = PM.G, q = PM.q, en = p[0], fr = PM.st.from;
    var origin = fr ? '&origin=' + q(fr + ' Metro Station') : '';
    var inR = PM.st.sel.indexOf(i) >= 0, vis = PM.st.vs.has(i);
    var waText = '🪔 ' + en + ' – Durga Puja 2026, Kolkata\n🚇 ' + PM.tr(p[2]) + '\n🍽 ' + PM.tr(f[0]) + ' (' + PM.tr(f[1]) + ')\n📍 ' + G + 'search/?api=1&query=' + q(en) + '\n\n' + PM.site();
    var dest = encodeURIComponent(en + ', Kolkata');
    var meta = PM.metaFor(i);
    var food = /stalls/i.test(f[0]) ? '' : ' <a class="mlink" target="_blank" rel="noopener" href="' + G + 'search/?api=1&query=' + q(f[0]) + '">' + T('on_map') + '</a>';
    return '<div class="ps" style="--c:' + PM.zc(p[1]) + '">' +
      '<div class="ps-head"><span class="num lg">' + PM.nf(i + 1) + '</span><div class="ps-title"><h2>' + PM.esc(PM.pn(i)) + '</h2>' +
      subHtml(i) + '</div>' +
      '<button class="icon-btn sm" data-act="sheet-close" aria-label="' + T('close') + '">' + PM.ic('x') + '</button></div>' +
      '<div class="ps-metro">' + PM.ic('metro') + '<div><b>' + PM.esc(PM.sn(p[2])) + '</b><span>' + T('nearest_metro') + (p[5] ? ' · ' + PM.esc(PM.tr(p[5])) : '') + '</span></div></div>' +
      '<div class="ps-primary">' +
      linkBtn(G + 'dir/?api=1&travelmode=walking&destination=' + q(en), 'nav', T('directions'), 'btn primary') +
      linkBtn(G + 'dir/?api=1&travelmode=transit&destination=' + q(en) + origin, 'metro', T('metro_route'), 'btn') + '</div>' +
      '<div class="tiles">' +
      linkBtn(G + 'dir/?api=1&travelmode=walking&origin=' + q(p[2] + ' Metro Station') + '&destination=' + q(en), 'walk', T('from_metro')) +
      linkBtn(G + 'search/?api=1&query=' + q(en), 'users', T('live_crowd')) +
      linkBtn(G + 'search/?api=1&query=' + q('public toilet near ' + en), 'wc', T('toilets')) +
      linkBtn(G + 'search/?api=1&query=' + q('parking near ' + en), 'parking', T('parking')) +
      linkBtn('https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=' + dest, 'car', 'Uber') +
      linkBtn(PM.wa(waText), 'share', T('share')) + '</div>' +
      '<button class="btn wide ghost" data-act="show-on-map" data-i="' + i + '">' + PM.ic('map') + T('show_on_map') + '</button>' +
      '<div class="ps-food">' + PM.ic('food') + '<div><span class="lbl">' + T('eat_nearby') + '</span><b>' + PM.esc(PM.tr(f[0])) + '</b> – ' + PM.esc(PM.tr(f[1])) + food + '<small>' + PM.esc(PM.tr(f[2])) + '</small></div></div>' +
      '<section class="ps-sec" id="psLive"><div class="sec-h"><h3>' + T('people_here') + '</h3><span class="live-tag"><i class="live-dot"></i>' + T('community') + '</span></div>' +
      '<div class="live-row"><div class="live-n" id="liveN">—</div><div class="live-btns" id="liveBtns"></div></div><p class="fine" id="liveSt">' + T('pulse_note') + '</p></section>' +
      '<section class="ps-sec"><div class="sec-h"><h3>' + T('live_tips') + '</h3><button class="link" data-act="tip-form">' + PM.ic('plus') + T('add_tip') + '</button></div>' +
      '<div id="tipForm" hidden><textarea id="tipText" rows="2" maxlength="220" placeholder="' + PM.esc(T('tip_ph')) + '"></textarea><div class="row-end"><button class="btn ghost sm" data-act="tip-form">' + T('cancel') + '</button><button class="btn primary sm" data-act="tip-post">' + T('post_tip') + '</button></div></div>' +
      '<ul class="tips" id="tipFeed"><li class="muted">' + T('loading') + '</li></ul></section>' +
      '<section class="ps-sec"><div class="sec-h"><h3>' + T('photos') + '</h3><label class="link" for="photoFile">' + PM.ic('camera') + T('add_photo') + '</label></div>' +
      '<input id="photoFile" type="file" accept="image/*" hidden><div class="photos" id="photoGrid"><span class="muted">' + T('loading') + '</span></div></section>' +
      '<section class="ps-sec info"><div class="sec-h"><h3>' + T('good_to_know') + '</h3></div><ul class="notes">' +
      meta.access.map(function (a) { return '<li>' + PM.ic('info') + T(a) + '</li>'; }).join('') + '<li>' + PM.ic('parking') + T(meta.parking) + '</li></ul>' +
      '<p class="fine">' + T('checked_on', { d: PM.fmtDateShort(Date.parse(meta.lastChecked + 'T00:00:00+05:30')) }) + '</p></section>' +
      footHtml(i) + '</div>';
  }
  function subHtml(i) {
    var p = PM.P[i], vis = PM.st.vs.has(i);
    return '<div class="ps-sub"><span>' + PM.esc(PM.zn(p[1])) + '</span>' + (p[6] ? '<span class="badge gold">' + PM.ic('star') + T('famous') + '</span>' : '') + (vis ? '<span class="badge ok">' + PM.ic('check') + T('visited') + '</span>' : '') + '</div>';
  }
  function footHtml(i) {
    var inR = PM.st.sel.indexOf(i) >= 0, vis = PM.st.vs.has(i);
    return '<div class="ps-foot"><button class="btn ' + (inR ? 'on' : 'primary') + '" data-act="route-toggle" data-i="' + i + '">' + PM.ic(inR ? 'check' : 'plus') + (inR ? T('in_route') : T('add_route')) + '</button>' +
      '<button class="btn ' + (vis ? 'on' : '') + '" data-act="visit-toggle" data-i="' + i + '">' + PM.ic('check') + (vis ? T('visited') : T('mark_visited')) + '</button></div>';
  }
  /* called after route/visited changes: refresh only the parts of the open sheet that depend on them */
  PM.updateSheetState = function () {
    var i = PM.st.cur; if (i < 0 || !PM.sheet.isOpen()) return;
    var foot = document.querySelector('.ps-foot'), sub = document.querySelector('.ps-sub');
    if (foot) foot.outerHTML = footHtml(i);
    if (sub) sub.outerHTML = subHtml(i);
  };

  /* Accessibility / parking notes (guidance only; keys map to translated strings) */
  var META = {
    0: { a: ['n_ramp', 'n_seat'], p: 'p_street' }, 1: { a: ['n_stepfree', 'n_family'], p: 'p_paid' }, 14: { a: ['n_ramp', 'n_gates'], p: 'p_restrict' },
    21: { a: ['n_ramp', 'n_seat'], p: 'p_deshapriya' }, 24: { a: ['n_ramp', 'n_flow'], p: 'p_peak' }, 25: { a: ['n_stepfree', 'n_seat'], p: 'p_gariahat' }, 26: { a: ['n_access', 'n_entry'], p: 'p_hindustan' }
  };
  PM.metaFor = function (i) {
    var m = META[i] || { a: ['n_verify', 'n_seat'], p: 'p_default' };
    return { access: m.a, parking: m.p, lastChecked: '2026-09-29' };
  };

  PM.openPandal = function (i) {
    PM.st.cur = i;
    PM.sheet.open(sheetHtml(i), { tall: true, onClose: function () { PM.st.cur = -1; } });
    document.getElementById('photoFile').addEventListener('change', onPhoto);
    renderLiveBtns(i); loadCommunity(i);
  };
  PM.acts['open-pandal'] = function (el) { PM.openPandal(+el.getAttribute('data-i')); };
  PM.acts['show-on-map'] = function (el) { var i = +el.getAttribute('data-i'); PM.sheet.close(); PM.go('map'); setTimeout(function () { PM.map.focus(i); }, 60); };

  /* ---------- community inside the sheet ---------- */
  function renderLiveBtns(i) {
    var box = document.getElementById('liveBtns'); if (!box) return;
    var here = !!PM.st.checked[i];
    box.innerHTML = here
      ? '<button class="btn on" data-act="checkout" data-i="' + i + '">' + PM.ic('check') + T('you_here') + '</button><button class="btn ghost sm" data-act="checkout" data-i="' + i + '">' + T('leave') + '</button>'
      : '<button class="btn" data-act="checkin" data-i="' + i + '">' + PM.ic('pin') + T('im_here') + '</button>';
  }
  function commStatus(msg, bad) { var s = document.getElementById('liveSt'); if (s) { s.textContent = msg; s.classList.toggle('bad', !!bad); } }
  function loadCommunity(i) {
    PM.comm.pulse(i).then(function (n) {
      if (PM.st.cur !== i) return;
      var el = document.getElementById('liveN'); if (!el) return;
      if (n == null) { el.textContent = '—'; commStatus(T('comm_off'), true); } else { el.textContent = PM.nf(n); commStatus(T('pulse_note')); }
    });
    PM.comm.feed(i).then(function (d) {
      if (PM.st.cur !== i) return;
      var tf = document.getElementById('tipFeed'), pg = document.getElementById('photoGrid');
      if (!d) { if (tf) tf.innerHTML = '<li class="muted">' + T('comm_off') + '</li>'; if (pg) pg.innerHTML = '<span class="muted">' + T('comm_off') + '</span>'; return; }
      var tips = d.tips || [], photos = d.photos || [];
      if (tf) tf.innerHTML = tips.length ? tips.map(function (t) {
        return '<li><span>' + PM.esc(t.text) + '</span><time>' + PM.fmtTime(Date.parse(t.created_at)) + '</time></li>';
      }).join('') : '<li class="muted">' + T('no_tips') + '</li>';
      if (pg) pg.innerHTML = photos.length ? photos.map(function (ph) {
        return '<a href="' + PM.esc(ph.url) + '" target="_blank" rel="noopener"><img loading="lazy" alt="' + PM.esc(T('photo_alt', { name: PM.pn(i) })) + '" src="' + PM.esc(ph.url) + '"></a>';
      }).join('') : '<span class="muted">' + T('no_photos') + '</span>';
    });
  }
  PM.acts.checkin = function (el) {
    var i = +el.getAttribute('data-i'); el.setAttribute('disabled', '');
    PM.comm.checkin(i).then(function (ok) {
      if (ok) { PM.st.checked[i] = Date.now(); PM.store.set('puja26_checked', JSON.stringify(PM.st.checked)); PM.toast(T('checked_in')); }
      else PM.toast(T('comm_fail'));
      renderLiveBtns(i); loadCommunity(i);
    });
  };
  PM.acts.checkout = function (el) {
    var i = +el.getAttribute('data-i');
    PM.comm.checkout(i).then(function () { delete PM.st.checked[i]; PM.store.set('puja26_checked', JSON.stringify(PM.st.checked)); renderLiveBtns(i); loadCommunity(i); });
  };
  PM.acts['tip-form'] = function () { var f = document.getElementById('tipForm'); if (f) { f.hidden = !f.hidden; if (!f.hidden) document.getElementById('tipText').focus(); } };
  PM.acts['tip-post'] = function (el) {
    var i = PM.st.cur, ta = document.getElementById('tipText'), text = ta.value.trim();
    if (!text) { PM.toast(T('tip_empty')); return; }
    el.setAttribute('disabled', '');
    PM.comm.tip(i, text).then(function (r) {
      el.removeAttribute('disabled');
      if (!r) { PM.toast(T('tip_fail') + (PM.commError ? ' (' + PM.commError.slice(0, 80) + ')' : '')); return; }
      ta.value = ''; document.getElementById('tipForm').hidden = true; PM.toast(T('tip_posted')); loadCommunity(i);
    });
  };
  function onPhoto(e) {
    var f = e.target.files && e.target.files[0], i = PM.st.cur; if (!f) return;
    if (f.size > 12 * 1024 * 1024) { PM.toast(T('photo_big')); return; }
    PM.toast(T('uploading'));
    PM.comm.photo(i, f).then(function (r) {
      e.target.value = '';
      if (!r) { PM.toast(T('photo_fail') + (PM.commError ? ' (' + PM.commError.slice(0, 80) + ')' : '')); return; }
      PM.toast(T('photo_ok')); loadCommunity(i);
    });
  }
  setInterval(function () {      // keep an active check-in alive (counts expire after 2 hours)
    Object.keys(PM.st.checked).forEach(function (k) { if (Date.now() - PM.st.checked[k] < 2 * 36e5) { PM.comm.checkin(+k); PM.st.checked[k] = Date.now(); } else delete PM.st.checked[k]; });
    PM.store.set('puja26_checked', JSON.stringify(PM.st.checked));
  }, 10 * 60 * 1000);
})(window.PM = window.PM || {});
