/* Puja Map 2026 - interactive dark street map (SVG). Pan, pinch-zoom, tap a pandal. */
(function (PM) {
  'use strict';
  var W = 1000, H = 1440, V = { x: 0, y: 0, w: 1000, h: 1440 }, minW = 1000;
  var root, wrap, svg, baseG, routeG, mkG, ptrs = new Map(), lastDist = 0, moved = 0, downMk = null, legendOpen = false;

  function pl(points, color, width, dash) {
    return '<polyline fill="none" stroke="' + color + '" stroke-width="' + width + '" stroke-linejoin="round" stroke-linecap="round"' +
      (dash ? ' stroke-dasharray="' + dash + '"' : '') + ' points="' + points.join(' ') + '"/>';
  }
  function clamp() { V.x = Math.max(0, Math.min(W - V.w, V.x)); V.y = Math.max(0, Math.min(H - V.h, V.y)); }
  function labelClasses() {
    svg.classList.toggle('z-pl', V.w <= 560);          // all pandal labels
    svg.classList.toggle('z-fam', V.w <= 840);         // famous pandal labels
    svg.classList.toggle('z-sl', V.w <= 700);          // station labels
  }
  function apply() { clamp(); svg.setAttribute('viewBox', V.x.toFixed(1) + ' ' + V.y.toFixed(1) + ' ' + V.w.toFixed(1) + ' ' + V.h.toFixed(1)); labelClasses(); }
  function fit() {
    if (!wrap) return;
    var r = wrap.getBoundingClientRect(); if (!r.width || !r.height) return;
    var a = r.height / r.width, w = W, h = w * a;
    if (h > H) { h = H; w = h / a; }
    minW = w; V = { w: w, h: h, x: (W - w) / 2, y: 0 }; apply();
  }
  function toS(cx, cy) {
    var r = svg.getBoundingClientRect();
    return [V.x + (cx - r.left) / r.width * V.w, V.y + (cy - r.top) / r.height * V.h];
  }
  function zoomAt(f, sx, sy) {
    var asp = V.h / V.w, w = Math.min(minW, Math.max(220, V.w * f)), k = w / V.w;
    V.x = sx - (sx - V.x) * k; V.y = sy - (sy - V.y) * k; V.w = w; V.h = w * asp; apply();
  }
  function dist() { var a = Array.from(ptrs.values()); return a.length === 2 ? Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]) : 0; }

  /* ---------- drawing ---------- */
  function drawBase() {
    var B = PM.M[PM.st.rg], h = B.x.replace(/>([^<>]+)<\/text>/g, function (m, txt) {
      var raw = txt.replace(/&amp;/g, '&'); return '>' + PM.esc(PM.tr(raw)) + '</text>';
    });
    B.R.forEach(function (r) { h += pl(r[1], 'var(--rdo)', r[0] + 5); });
    B.R.forEach(function (r) { h += pl(r[1], 'var(--rd)', r[0]); });
    B.L.forEach(function (l) {
      h += '<text class="rlab" transform="translate(' + l[1] + ',' + l[2] + ') rotate(' + l[3] + ')" text-anchor="middle">' + PM.esc(PM.tr(l[0])) + '</text>';
    });
    if (B.BL.length) h += '<g class="mline">' + pl(B.BL, 'var(--blue)', 10) + '</g>';
    if (B.GL.length) h += '<g class="mline">' + pl(B.GL, 'var(--green)', 10) + '</g>';
    PM.SS.filter(function (s) { return s[4] === PM.st.rg; }).forEach(function (s) {
      var col = s[3] === 'g' ? 'var(--green)' : 'var(--blue)';
      h += '<g class="stn"><rect x="' + (s[1] - 11) + '" y="' + (s[2] - 11) + '" width="22" height="22" rx="6" fill="var(--map-bg)" stroke="' + col + '" stroke-width="4.5"/>' +
        '<text x="' + s[1] + '" y="' + (s[2] + 5) + '" text-anchor="middle" class="stn-m">M</text>' +
        '<text class="slab" x="' + (s[1] + 17) + '" y="' + (s[2] + 33) + '">' + PM.esc(PM.sn(s[0])) + '</text></g>';
    });
    baseG.innerHTML = h;
  }
  function station(name, rg) { return PM.SS.find(function (s) { return s[0] === name && s[4] === rg; }); }
  function drawMarkers() {
    var st = PM.st, rg = st.rg, h = '', rh = '';
    // selected pandal: dashed link to its nearest metro station
    if (st.mapSel >= 0 && PM.reg(st.mapSel) === rg) {
      var sp = PM.P[st.mapSel], s = station(sp[2], rg);
      if (s) rh += pl([[sp[3], sp[4]], [s[1], s[2]]], PM.zc(sp[1]), 3.5, '7 6');
    }
    // route line through selected stops (this region only)
    var pts = st.sel.filter(function (i) { return PM.reg(i) === rg; }).map(function (i) { return [PM.P[i][3], PM.P[i][4]]; });
    if (pts.length > 1) rh += '<g class="rline">' + pl(pts, 'var(--zari)', 5, '2 11') + '</g>';
    routeG.innerHTML = rh;
    PM.P.forEach(function (p, i) {
      if (PM.reg(i) !== rg) return;
      var sel = st.sel.indexOf(i), isSel = st.mapSel === i, vis = st.vs.has(i), fam = !!p[6];
      h += '<g class="mk' + (isSel ? ' on' : '') + (vis ? ' vis' : '') + '" data-i="' + i + '" tabindex="0" role="button" aria-label="' + PM.esc(PM.pn(i)) + '">' +
        (isSel ? '<circle cx="' + p[3] + '" cy="' + p[4] + '" r="38" class="halo"/>' : '') +
        '<circle class="hit" cx="' + p[3] + '" cy="' + p[4] + '" r="34" fill="transparent"/>' +
        '<circle class="dot" cx="' + p[3] + '" cy="' + p[4] + '" r="' + (isSel ? 26 : 21) + '" fill="' + PM.zc(p[1]) + '"/>' +
        '<text class="mn" x="' + p[3] + '" y="' + (p[4] + 7) + '" text-anchor="middle">' + (vis ? '✓' : PM.nf(i + 1)) + '</text>' +
        (fam ? '<circle class="fam" cx="' + (p[3] + 17) + '" cy="' + (p[4] - 17) + '" r="7.5"/>' : '') +
        (sel >= 0 ? '<g class="ord"><circle cx="' + (p[3] - 16) + '" cy="' + (p[4] + 16) + '" r="10"/><text x="' + (p[3] - 16) + '" y="' + (p[4] + 20.5) + '" text-anchor="middle">' + PM.nf(sel + 1) + '</text></g>' : '') +
        '<text class="plab' + (fam ? ' fam' : '') + (isSel ? ' always' : '') + '" x="' + (p[3] + 27) + '" y="' + (p[4] + 5) + '">' + PM.esc(PM.pn(i)) + '</text></g>';
    });
    mkG.innerHTML = h;
  }

  /* ---------- UI overlay (rebuilt on language / region / selection change) ---------- */
  function regionPills() {
    return Object.keys(PM.RG).map(function (k) {
      var n = PM.P.filter(function (p, i) { return PM.reg(i) === k; }).length;
      return '<button class="pill' + (k === PM.st.rg ? ' on' : '') + '" data-act="map-region" data-r="' + k + '">' + PM.esc(PM.rn(k)) + ' <i>' + PM.nf(n) + '</i></button>';
    }).join('');
  }
  function legendHtml() {
    var zones = Object.keys(PM.Z).filter(function (k) { return PM.Z[k][2] === PM.st.rg; }).map(function (k) {
      return '<li><i class="dotc" style="background:' + PM.zc(k) + '"></i>' + PM.esc(PM.zn(k)) + '</li>';
    }).join('');
    return '<ul>' +
      '<li><i class="bar" style="background:var(--blue)"></i>' + PM.t('lg_blue') + '</li>' +
      '<li><i class="bar" style="background:var(--green)"></i>' + PM.t('lg_green') + '</li>' +
      '<li><i class="sq"></i>' + PM.t('lg_station') + '</li>' +
      '<li><i class="bar gold"></i>' + PM.t('lg_route') + '</li>' + zones + '</ul><p>' + PM.t('lg_note') + '</p>';
  }
  function cardHtml() {
    var i = PM.st.mapSel; if (i < 0) return '';
    var p = PM.P[i], inR = PM.st.sel.indexOf(i) >= 0;
    return '<div class="mc-head"><span class="num" style="--c:' + PM.zc(p[1]) + '">' + PM.nf(i + 1) + '</span>' +
      '<div class="mc-txt"><b>' + PM.esc(PM.pn(i)) + '</b><span>' + PM.ic('metro') + PM.esc(PM.sn(p[2])) + (p[5] ? ' · ' + PM.esc(PM.tr(p[5])) : '') + '</span></div>' +
      '<button class="icon-btn sm" data-act="map-card-close" aria-label="' + PM.t('close') + '">' + PM.ic('x') + '</button></div>' +
      '<div class="mc-acts"><button class="btn primary" data-act="open-pandal" data-i="' + i + '">' + PM.t('details') + '</button>' +
      '<button class="btn ' + (inR ? 'on' : 'ghost') + '" data-act="route-toggle" data-i="' + i + '">' + PM.ic(inR ? 'check' : 'plus') + (inR ? PM.t('in_route') : PM.t('add_route')) + '</button></div>';
  }
  PM.map = {
    mount: function (container) {
      root = container;
      root.innerHTML = '<div class="map-wrap" id="mapWrap"><svg id="map" role="img" aria-label="' + PM.esc(PM.t('map_aria')) + '" preserveAspectRatio="xMidYMid meet" viewBox="0 0 1000 1440">' +
        '<defs><filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
        '<g id="mBase"></g><g id="mRoute"></g><g id="mMk"></g></svg></div>' +
        '<div class="map-top" id="mapTop"></div><div class="map-ctrl" id="mapCtrl"></div><div class="map-legend" id="mapLegend" hidden></div><div class="map-card" id="mapCard" hidden></div>';
      wrap = root.querySelector('#mapWrap'); svg = root.querySelector('#map');
      baseG = svg.querySelector('#mBase'); routeG = svg.querySelector('#mRoute'); mkG = svg.querySelector('#mMk');
      bind(); PM.map.renderUI(); drawBase(); drawMarkers();
      if (window.ResizeObserver) new ResizeObserver(function () { if (!root.closest('.view') || root.closest('.view').classList.contains('active')) fit(); }).observe(wrap);
    },
    renderUI: function () {
      if (!root) return;
      root.querySelector('#mapTop').innerHTML = regionPills();
      root.querySelector('#mapCtrl').innerHTML =
        '<button class="icon-btn" data-act="map-zin" aria-label="' + PM.t('zoom_in') + '">' + PM.ic('plus') + '</button>' +
        '<button class="icon-btn" data-act="map-zout" aria-label="' + PM.t('zoom_out') + '">' + PM.ic('minus') + '</button>' +
        '<button class="icon-btn" data-act="map-reset" aria-label="' + PM.t('reset_view') + '">' + PM.ic('refresh') + '</button>' +
        '<button class="icon-btn' + (legendOpen ? ' on' : '') + '" data-act="map-legend" aria-label="' + PM.t('legend') + '">' + PM.ic('layers') + '</button>' +
        '<button class="icon-btn" data-act="near-me" aria-label="' + PM.t('near_me') + '">' + PM.ic('locate') + '</button>';
      var lg = root.querySelector('#mapLegend'); lg.hidden = !legendOpen; lg.innerHTML = legendOpen ? legendHtml() : '';
      var cd = root.querySelector('#mapCard'), h = cardHtml(); cd.hidden = !h; cd.innerHTML = h;
      root.querySelector('#map').setAttribute('aria-label', PM.t('map_aria'));
    },
    redraw: function () { if (!root) return; drawBase(); drawMarkers(); PM.map.renderUI(); },
    markers: function () { if (!root) return; drawMarkers(); PM.map.renderUI(); },
    fit: fit,
    onShow: function () { if (root) setTimeout(fit, 0); },
    setRegion: function (k) {
      PM.st.rg = k; PM.st.mapSel = -1; drawBase(); drawMarkers(); PM.map.renderUI(); fit();
      if (PM.onRegionChange) PM.onRegionChange();
    },
    select: function (i) {
      PM.st.mapSel = i; PM.st.cur = i;
      if (i >= 0) {
        var p = PM.P[i], sy = p[4];
        // keep the marker above the bottom card
        var topLimit = V.y + V.h * 0.12, botLimit = V.y + V.h * 0.58;
        if (sy > botLimit) V.y += sy - botLimit; else if (sy < topLimit) V.y -= topLimit - sy;
        if (p[3] < V.x + V.w * 0.1 || p[3] > V.x + V.w * 0.9) V.x = p[3] - V.w / 2;
        apply();
      }
      drawMarkers(); PM.map.renderUI();
    },
    focus: function (i) {          // jump to a pandal from elsewhere in the app
      var p = PM.P[i], r = PM.reg(i);
      if (PM.st.rg !== r) { PM.st.rg = r; drawBase(); }
      PM.st.mapSel = i; PM.st.cur = i;
      fit(); var w = Math.min(minW, 420), asp = V.h / V.w;
      V.w = w; V.h = w * asp; V.x = p[3] - w / 2; V.y = p[4] - V.h * 0.38; apply();
      drawMarkers(); PM.map.renderUI();
    },
    toggleLegend: function () { legendOpen = !legendOpen; PM.map.renderUI(); },
    zoom: function (f) { var c = [V.x + V.w / 2, V.y + V.h / 2]; zoomAt(f, c[0], c[1]); }
  };

  /* ---------- gestures ---------- */
  function bind() {
    wrap.addEventListener('pointerdown', function (e) {
      ptrs.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; lastDist = dist();
      downMk = ptrs.size === 1 ? e.target.closest('.mk') : null;
      try { wrap.setPointerCapture(e.pointerId); } catch (x) {}
    });
    wrap.addEventListener('pointermove', function (e) {
      var o = ptrs.get(e.pointerId); if (!o) return;
      var dx = e.clientX - o[0], dy = e.clientY - o[1]; ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      var r = svg.getBoundingClientRect();
      if (ptrs.size === 1) {
        moved += Math.abs(dx) + Math.abs(dy);
        if (moved > 8) { V.x -= dx / r.width * V.w; V.y -= dy / r.height * V.h; apply(); }
      } else if (ptrs.size === 2) {
        var d = dist(), a = Array.from(ptrs.values()), c = toS((a[0][0] + a[1][0]) / 2, (a[0][1] + a[1][1]) / 2);
        if (lastDist && d) zoomAt(lastDist / d, c[0], c[1]);
        lastDist = d; moved = 99; downMk = null;
      }
    });
    function up(e) {
      var wasOne = ptrs.size === 1; ptrs.delete(e.pointerId); lastDist = 0;
      if (wasOne && moved <= 8 && downMk) { PM.map.select(+downMk.getAttribute('data-i')); }
      else if (wasOne && moved <= 8 && !downMk && PM.st.mapSel >= 0 && e.type === 'pointerup') { PM.map.select(-1); }
      downMk = null;
    }
    wrap.addEventListener('pointerup', up); wrap.addEventListener('pointercancel', up);
    wrap.addEventListener('wheel', function (e) { e.preventDefault(); var c = toS(e.clientX, e.clientY); zoomAt(e.deltaY > 0 ? 1.15 : 0.87, c[0], c[1]); }, { passive: false });
    wrap.addEventListener('keydown', function (e) {
      var mk = e.target.closest && e.target.closest('.mk');
      if (mk && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); PM.map.select(+mk.getAttribute('data-i')); }
    });
  }

  PM.acts['map-region'] = function (el) { PM.map.setRegion(el.getAttribute('data-r')); };
  PM.acts['map-zin'] = function () { PM.map.zoom(0.7); };
  PM.acts['map-zout'] = function () { PM.map.zoom(1.4); };
  PM.acts['map-reset'] = function () { fit(); };
  PM.acts['map-legend'] = function () { PM.map.toggleLegend(); };
  PM.acts['map-card-close'] = function () { PM.map.select(-1); };
})(window.PM = window.PM || {});
