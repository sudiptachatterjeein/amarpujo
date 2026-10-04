/* Puja Map 2026 - Route tab: my route, quick plans, "plan my night" builder, visited passport */
(function (PM) {
  'use strict';
  var T = function (k, v) { return PM.t(k, v); };
  var plan = { vibes: new Set(['famous']), hours: 3 };

  function routeUrl() {
    var s = PM.st.sel, N = function (i) { return PM.q(PM.P[i][0]); };
    return PM.G + 'dir/?api=1&travelmode=walking&origin=' + N(s[0]) + '&destination=' + N(s[s.length - 1]) +
      (s.length > 2 ? '&waypoints=' + s.slice(1, -1).map(N).join('%7C') : '');
  }
  function shareText() {
    var names = PM.st.sel.map(function (i, k) { return (k + 1) + '. ' + PM.P[i][0]; }).join('\n');
    return '🪔 Durga Puja 2026 – my pandal route\n' + names + '\n\n' + routeUrl() + '\n\n' + PM.site();
  }
  PM.optimizeOrder = function () {
    var sel = PM.st.sel; if (sel.length < 3) return;
    var rem = sel.slice(1), out = [sel[0]], cur = sel[0];
    while (rem.length) {
      var bi = 0, bd = 1e18;
      rem.forEach(function (j, k) { var dx = PM.P[j][3] - PM.P[cur][3], dy = PM.P[j][4] - PM.P[cur][4], d = dx * dx + dy * dy; if (d < bd) { bd = d; bi = k; } });
      cur = rem.splice(bi, 1)[0]; out.push(cur);
    }
    PM.st.sel = out; PM.saveRoute(); PM.afterChange(); PM.toast(T('optimized'));
  };

  /* ---------- "plan my night" (runs on this device, no AI needed) ---------- */
  function buildPlan() {
    var rg = PM.st.rg, vibes = plan.vibes, n = plan.hours <= 2 ? 4 : plan.hours === 3 ? 5 : 7;
    var cand = PM.P.map(function (p, i) { return i; }).filter(function (i) { return PM.reg(i) === rg; });
    if (vibes.has('famous') && cand.some(function (i) { return PM.P[i][6]; })) cand = cand.filter(function (i) { return PM.P[i][6]; }).length >= 3 ? cand.filter(function (i) { return PM.P[i][6]; }) : cand;
    var score = function (i) {
      var p = PM.P[i], f = PM.F[i], s = p[6] ? 3 : 0;
      if (vibes.has('food') && !/stalls/i.test(f[0])) s += 2;
      if (vibes.has('photos') && p[6]) s += 1.5;
      if (vibes.has('family') && !p[5]) s += 2;            // pandals right at a metro station: easier with kids / elders
      return s + (i % 3) * 0.01;
    };
    cand.sort(function (a, b) { return score(b) - score(a); });
    var seed = cand[0], pick = [seed];
    var pool = cand.slice(1);
    var dist = function (a, b) { var dx = PM.P[a][3] - PM.P[b][3], dy = PM.P[a][4] - PM.P[b][4]; return dx * dx + dy * dy; };
    if (vibes.has('walk')) {                                // compact cluster: nearest neighbours of the best pandal
      pool.sort(function (a, b) { return dist(a, seed) - dist(b, seed); });
      pick = pick.concat(pool.slice(0, n - 1));
    } else pick = pick.concat(pool.slice(0, n - 1));
    var out = [pick.shift()];                               // order by nearest neighbour
    while (pick.length) {
      var cur = out[out.length - 1], bi = 0, bd = 1e18;
      pick.forEach(function (j, k) { var d = dist(cur, j); if (d < bd) { bd = d; bi = k; } });
      out.push(pick.splice(bi, 1)[0]);
    }
    PM.st.sel = out.slice(0, 11); PM.saveRoute(); PM.afterChange();
    PM.toast(T('plan_ready', { n: PM.nf(PM.st.sel.length) }));
  }

  /* ---------- pieces ---------- */
  function stops() {
    return '<ol class="stops">' + PM.st.sel.map(function (i, k) {
      var p = PM.P[i], last = k === PM.st.sel.length - 1;
      return '<li class="stop" style="--c:' + PM.zc(p[1]) + '"><span class="ord">' + PM.nf(k + 1) + '</span>' +
        '<div class="st-main" data-act="open-pandal" data-i="' + i + '" role="button" tabindex="0"><b>' + PM.esc(PM.pn(i)) + '</b><span>' + PM.ic('metro') + PM.esc(PM.sn(p[2])) + '</span></div>' +
        '<div class="st-ctl"><button class="icon-btn sm" data-act="stop-up" data-k="' + k + '" ' + (k === 0 ? 'disabled' : '') + ' aria-label="' + T('move_up') + '">' + PM.ic('up') + '</button>' +
        '<button class="icon-btn sm" data-act="stop-down" data-k="' + k + '" ' + (last ? 'disabled' : '') + ' aria-label="' + T('move_down') + '">' + PM.ic('down') + '</button>' +
        '<button class="icon-btn sm" data-act="stop-del" data-k="' + k + '" aria-label="' + T('remove_route') + '">' + PM.ic('x') + '</button></div></li>';
    }).join('') + '</ol>';
  }
  function plannerCard() {
    var v = plan.vibes, chip = function (k, ic, lab) { return '<button class="chip' + (v.has(k) ? ' on' : '') + '" data-act="vibe" data-v="' + k + '">' + PM.ic(ic) + lab + '</button>'; };
    return '<section class="block planner"><div class="block-h"><h2>' + T('plan_night') + '</h2></div><p class="muted">' + T('plan_night_d', { region: PM.esc(PM.rn(PM.st.rg)) }) + '</p>' +
      '<div class="chips wrap">' + chip('famous', 'star', T('v_famous')) + chip('family', 'users', T('v_family')) + chip('photos', 'camera', T('v_photos')) + chip('food', 'food', T('v_food')) + chip('walk', 'walk', T('v_walk')) + '</div>' +
      '<div class="seg hrs" role="group" aria-label="' + T('how_long') + '">' + [2, 3, 4].map(function (h) { return '<button class="' + (plan.hours === h ? 'on' : '') + '" data-act="hours" data-h="' + h + '">' + T('n_hours', { n: PM.nf(h) }) + '</button>'; }).join('') + '</div>' +
      '<button class="btn primary wide" data-act="plan-build">' + PM.ic('route') + T('build_route') + '</button></section>';
  }
  function plansList() {
    return '<section class="block"><div class="block-h"><h2>' + T('quick_plans') + '</h2></div><div class="plist">' + PM.PL.map(function (pl, k) {
      return '<button class="plrow" data-act="plan-load" data-k="' + k + '" style="--c:' + PM.zc(PM.P[pl[1][0]][1]) + '"><b>' + PM.esc(PM.planName(k)) + '</b><span>' + T('n_stops', { n: PM.nf(pl[1].length) }) + '</span>' + PM.ic('chev') + '</button>';
    }).join('') + '</div></section>';
  }
  function aiCard() {
    if (!PM.CFG.AI_ENDPOINT) return '';
    return '<section class="block ai"><div class="block-h"><h2>' + T('ask_ai') + '</h2><span class="badge">' + T('beta') + '</span></div><p class="muted">' + T('ask_ai_d') + '</p>' +
      '<div class="ai-row"><input id="aiQ" maxlength="400" placeholder="' + PM.esc(T('ai_ph')) + '"><button class="btn primary" data-act="ai-ask">' + T('ask') + '</button></div><div class="ai-out" id="aiOut" hidden></div></section>';
  }
  function routeBody() {
    var n = PM.st.sel.length;
    if (!n) {
      return '<div class="empty big">' + PM.ic('route') + '<b>' + T('route_empty') + '</b><span>' + T('route_empty_d') + '</span>' +
        '<div class="row"><button class="btn primary" data-act="goto" data-tab="explore">' + PM.ic('search') + T('browse') + '</button><button class="btn" data-act="goto" data-tab="map">' + PM.ic('map') + T('open_map') + '</button></div></div>' +
        plannerCard() + plansList() + aiCard();
    }
    var ok = n > 1 && n <= 11;
    return '<section class="block route-card"><div class="block-h"><h2>' + T('n_stops', { n: PM.nf(n) }) + '</h2><button class="link danger" data-act="route-clear">' + PM.ic('trash') + T('clear') + '</button></div>' +
      stops() +
      '<label class="field">' + PM.ic('metro') + '<span>' + T('start_from') + '</span><select id="fromSel" data-act-change="from">' +
      '<option value="">' + T('my_location') + '</option>' + PM.ST.map(function (s) { return '<option value="' + PM.esc(s) + '"' + (PM.st.from === s ? ' selected' : '') + '>' + PM.esc(PM.sn(s)) + '</option>'; }).join('') + '</select></label>' +
      '<div class="route-acts"><a class="btn primary wide' + (ok ? '' : ' off') + '" ' + (ok ? 'href="' + routeUrl() + '" target="_blank" rel="noopener"' : 'aria-disabled="true"') + '>' + PM.ic('nav') + T('open_gmaps') + '</a>' +
      '<div class="row"><button class="btn" data-act="route-opt" ' + (n < 3 ? 'disabled' : '') + '>' + PM.ic('refresh') + T('optimize') + '</button>' +
      '<a class="btn' + (n > 0 ? '' : ' off') + '" href="' + PM.wa(shareText()) + '" target="_blank" rel="noopener">' + PM.ic('share') + T('share') + '</a></div></div>' +
      '<p class="fine">' + (n < 2 ? T('route_need2') : n > 11 ? T('route_max') : T('route_note')) + '</p></section>' + plannerCard() + plansList() + aiCard();
  }
  function visitedBody() {
    var vs = Array.from(PM.st.vs).sort(function (a, b) { return a - b; }), total = PM.P.length, pct = vs.length / total, C = 2 * Math.PI * 38;
    var ring = '<div class="passport"><svg viewBox="0 0 100 100" class="ring" aria-hidden="true"><circle cx="50" cy="50" r="38" class="rb"/><circle cx="50" cy="50" r="38" class="rf" stroke-dasharray="' + (C * pct).toFixed(1) + ' ' + C.toFixed(1) + '" transform="rotate(-90 50 50)"/></svg>' +
      '<div class="pp-t"><b>' + PM.nf(vs.length) + '<small>/' + PM.nf(total) + '</small></b><span>' + T('pandals_visited') + '</span></div></div>';
    if (!vs.length) return ring + '<div class="empty">' + PM.ic('check') + '<b>' + T('visited_empty') + '</b><span>' + T('visited_empty_d') + '</span></div>';
    return ring + '<ul class="vlist">' + vs.map(function (i) {
      var p = PM.P[i];
      return '<li style="--c:' + PM.zc(p[1]) + '"><span class="num">' + PM.ic('check') + '</span><div data-act="open-pandal" data-i="' + i + '" role="button" tabindex="0"><b>' + PM.esc(PM.pn(i)) + '</b><span>' + PM.esc(PM.zn(p[1])) + '</span></div>' +
        '<button class="icon-btn sm" data-act="visit-toggle" data-i="' + i + '" aria-label="' + T('unmark') + '">' + PM.ic('x') + '</button></li>';
    }).join('') + '</ul><button class="btn ghost wide" data-act="visited-reset">' + PM.ic('trash') + T('reset_visited') + '</button>';
  }

  PM.renderRoute = function () {
    var el = document.getElementById('v-route'); if (!el) return;
    var sc = el.scrollTop, tab = PM.st.routeTab;
    el.innerHTML = PM.vhead(T('tab_route')) +
      '<div class="seg wide" role="tablist"><button role="tab" class="' + (tab === 'route' ? 'on' : '') + '" aria-selected="' + (tab === 'route') + '" data-act="rtab" data-t="route">' + T('my_route') + ' <i>' + PM.nf(PM.st.sel.length) + '</i></button>' +
      '<button role="tab" class="' + (tab === 'visited' ? 'on' : '') + '" aria-selected="' + (tab === 'visited') + '" data-act="rtab" data-t="visited">' + T('passport') + ' <i>' + PM.nf(PM.st.vs.size) + '</i></button></div></header>' +
      '<div class="pad">' + (tab === 'route' ? routeBody() : visitedBody()) + '</div>';
    el.scrollTop = sc;
    var fs = document.getElementById('fromSel');
    if (fs) fs.addEventListener('change', function (e) { PM.st.from = e.target.value; });
    var aq = document.getElementById('aiQ'); if (aq) aq.addEventListener('keydown', function (e) { if (e.key === 'Enter') PM.acts['ai-ask'](); });
  };

  PM.acts.rtab = function (el) { PM.st.routeTab = el.getAttribute('data-t'); PM.renderRoute(); };
  PM.acts['stop-up'] = function (el) { var k = +el.getAttribute('data-k'), s = PM.st.sel; if (k > 0) { var t = s[k]; s[k] = s[k - 1]; s[k - 1] = t; PM.saveRoute(); PM.afterChange(); } };
  PM.acts['stop-down'] = function (el) { var k = +el.getAttribute('data-k'), s = PM.st.sel; if (k < s.length - 1) { var t = s[k]; s[k] = s[k + 1]; s[k + 1] = t; PM.saveRoute(); PM.afterChange(); } };
  PM.acts['stop-del'] = function (el) { PM.st.sel.splice(+el.getAttribute('data-k'), 1); PM.saveRoute(); PM.afterChange(); };
  PM.acts['route-clear'] = function () { PM.st.sel = []; PM.saveRoute(); PM.afterChange(); };
  PM.acts['route-opt'] = function () { PM.optimizeOrder(); };
  PM.acts.vibe = function (el) { var v = el.getAttribute('data-v'); plan.vibes.has(v) ? plan.vibes.delete(v) : plan.vibes.add(v); PM.renderRoute(); };
  PM.acts.hours = function (el) { plan.hours = +el.getAttribute('data-h'); PM.renderRoute(); };
  PM.acts['plan-build'] = function () { buildPlan(); };
  PM.acts['plan-load'] = function (el) {
    var k = +el.getAttribute('data-k'); PM.st.sel = PM.PL[k][1].slice(); PM.st.rg = PM.PL[k][2]; PM.st.routeTab = 'route';
    PM.saveRoute(); PM.afterChange(); PM.toast(T('plan_loaded', { name: PM.planName(k) })); PM.go('route');
  };
  PM.acts['visited-reset'] = function () { if (confirm(T('confirm_reset'))) { PM.st.vs.clear(); PM.saveVisited(); PM.afterChange(); } };
  PM.acts['ai-ask'] = function () {
    var q = (document.getElementById('aiQ').value || '').trim(), out = document.getElementById('aiOut'); if (!q) return;
    out.hidden = false; out.textContent = T('thinking');
    var sel = PM.P.map(function (p, i) { return i; }).filter(function (i) { return PM.reg(i) === PM.st.rg; }).slice(0, 25).map(function (i) { return { name: PM.P[i][0], metro: PM.P[i][2], region: PM.Z[PM.P[i][1]][0] }; });
    fetch(PM.CFG.AI_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: q + (PM.st.lang === 'bn' ? '\n(Please answer in Bengali.)' : ''), region: PM.RG[PM.st.rg][0], selected: sel }) })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) { out.textContent = d.answer || T('ai_none'); })
      .catch(function () { out.textContent = T('ai_off'); });
  };
})(window.PM = window.PM || {});
