/* Puja Map 2026 - Home tab: greeting, live weather hero, Puja calendar rail, Mahalaya card, carousels */
(function (PM) {
  'use strict';
  var T = function (k, v) { return PM.t(k, v); };

  /* ---------- Puja calendar ---------- */
  PM.PUJA_DAYS = [
    { day: 10, key: 'd_mahalaya', crowd: 0 },
    { day: 17, key: 'd_shashthi', crowd: 1 },
    { day: 18, key: 'd_saptami', crowd: 2 },
    { day: 19, key: 'd_ashtami', crowd: 3 },
    { day: 20, key: 'd_navami', crowd: 2 },
    { day: 21, key: 'd_dashami', crowd: 1 }
  ];
  PM.crowdKey = ['', 'crowd_light', 'crowd_busy', 'crowd_peak'];

  /* what is happening now: before / on Mahalaya / waiting for Shashthi / Puja day / after */
  PM.pujaPhase = function () {
    var n = Date.now(), maha = PM.dayMs(10), s = PM.dayMs(17), end = PM.dayMs(22);
    if (n < maha) return { phase: 'pre', target: maha, key: 'cd_to_maha' };
    if (n < maha + 864e5) return { phase: 'maha', key: 'cd_maha_today' };
    if (n < s) return { phase: 'wait', target: s, key: 'cd_to_shashthi' };
    if (n < end) { var k = Math.floor((n - s) / 864e5); return { phase: 'puja', idx: k + 1, key: 'cd_puja_day', dayKey: PM.PUJA_DAYS[k + 1].key }; }
    return { phase: 'done', key: 'cd_done' };
  };
  PM.countdownText = function () {
    var ph = PM.pujaPhase();
    if (ph.target) {
      var d = ph.target - Date.now(), days = Math.floor(d / 864e5), h = Math.floor(d % 864e5 / 36e5), m = Math.floor(d % 36e5 / 6e4);
      return T(ph.key, { d: PM.nf(days), h: PM.nf(h), m: PM.nf(m) });
    }
    if (ph.dayKey) return T(ph.key, { day: T(ph.dayKey) });
    return T(ph.key);
  };
  function greeting() {
    var ph = PM.pujaPhase();
    if (ph.phase === 'maha') return T('hi_maha');
    if (ph.phase === 'puja') return T('hi_puja', { day: T(ph.dayKey) });
    var h = PM.ist().getUTCHours();
    return T(h >= 5 && h < 12 ? 'hi_morning' : h < 16 ? 'hi_noon' : h < 20 ? 'hi_evening' : 'hi_night');
  }

  /* ---------- small shared pieces ---------- */
  PM.langSwitch = function () {
    var bn = PM.st.lang === 'bn';
    return '<div class="seg lang" role="group" aria-label="' + T('language') + '">' +
      '<button class="' + (bn ? 'on' : '') + '" data-act="lang" data-l="bn" lang="bn" aria-pressed="' + bn + '">বাং</button>' +
      '<button class="' + (!bn ? 'on' : '') + '" data-act="lang" data-l="en" lang="en" aria-pressed="' + !bn + '">EN</button></div>';
  };
  PM.wxPill = function () {
    var w = PM.wx.data;
    if (!w) return '<button class="wx-pill" data-act="wx-open" aria-label="' + T('weather') + '">' + PM.ic('cloud') + '<span>' + T('weather') + '</span></button>';
    return '<button class="wx-pill" data-act="wx-open" aria-label="' + T('weather') + '">' + PM.wxIcon(PM.wxKind(w.now.code, w.now.isDay), 22) + '<span>' + PM.degree(w.now.temp) + '</span></button>';
  };
  PM.vhead = function (title, extra) {
    return '<header class="vhead"><div class="vh-row"><h1>' + title + '</h1><div class="vh-r">' + (extra || '') + PM.wxPill() + '</div></div>';
  };

  /* ---------- weather hero ---------- */
  function updatedLabel(w) {
    var s = PM.wx.status;
    if (s === 'stale') return T('wx_offline', { time: PM.fmtTime(w.fetched) });
    return T('wx_updated', { time: PM.fmtTime(w.fetched) });
  }
  function wxHero() {
    var w = PM.wx.data, st = PM.wx.status;
    if (!w) {
      if (st === 'error') {
        return '<section class="wx-hero sky-night"><div class="wx-fail">' + PM.ic('cloud') + '<div><b>' + T('wx_fail_t') + '</b><span>' + T('wx_fail_d') + '</span></div>' +
          '<button class="btn sm" data-act="wx-retry">' + PM.ic('refresh') + T('retry') + '</button></div></section>';
      }
      return '<section class="wx-hero sky-night" aria-busy="true"><div class="sk sk-l"></div><div class="sk sk-xl"></div><div class="sk sk-m"></div></section>';
    }
    var n = w.now, kind = PM.wxKind(n.code, n.isDay), adv = PM.wxAdvice();
    var hours = w.hours.slice(0, 8).map(function (h, k) {
      var hk = PM.wxKind(h.code, PM.ist(h.ts).getUTCHours() >= 6 && PM.ist(h.ts).getUTCHours() < 18);
      return '<li><span class="h-t">' + (k === 0 ? T('now') : PM.fmtHour(h.ts)) + '</span>' + PM.wxIcon(hk, 28) + '<b>' + PM.degree(h.temp) + '</b>' +
        '<span class="h-p">' + (h.pop != null ? PM.ic('drop') + PM.nf(h.pop) + '%' : '') + '</span></li>';
    }).join('');
    var aqi = w.aqi ? PM.aqiInfo(w.aqi.us) : null;
    return '<section class="wx-hero ' + PM.wxSky(n.code, n.isDay) + '" data-act="wx-open" role="button" tabindex="0" aria-label="' + T('weather_details') + '">' +
      '<div class="wx-top"><span class="wx-loc">' + PM.ic('pin') + T('kolkata') + '</span><span class="wx-upd' + (PM.wx.status === 'stale' ? ' off' : '') + '">' + updatedLabel(w) + '</span></div>' +
      '<div class="wx-main">' + PM.wxIcon(kind, 76) + '<div class="wx-temp">' + PM.degree(n.temp) + '</div>' +
      '<div class="wx-cond"><b>' + T(PM.wxLabelKey(n.code)) + '</b><span>' + T('feels_like', { t: PM.degree(n.feels) }) + '</span></div></div>' +
      (adv ? '<p class="wx-adv tone-' + adv.tone + '">' + T(adv.key, adv.vars) + '</p>' : '') +
      '<ul class="wx-hours">' + hours + '</ul>' +
      '<ul class="wx-chips"><li>' + PM.ic('drop') + T('humidity') + ' <b>' + PM.nf(Math.round(n.hum)) + '%</b></li>' +
      '<li>' + PM.ic('wind') + T('wind') + ' <b>' + PM.nf(Math.round(n.wind)) + ' ' + T('kmh') + '</b></li>' +
      (aqi ? '<li><i class="dotc" style="background:' + aqi.c + '"></i>' + T('aqi') + ' <b>' + PM.nf(w.aqi.us) + '</b> ' + T(aqi.key) + '</li>' : '') + '</ul></section>';
  }

  /* ---------- Puja calendar rail ---------- */
  function rail() {
    var ph = PM.pujaPhase(), wd = PM.wx.data, nowTs = Date.now();
    var items = PM.PUJA_DAYS.map(function (d, k) {
      var ts = PM.dayMs(d.day), isNow = (ph.phase === 'maha' && k === 0) || (ph.phase === 'puja' && ph.idx === k);
      var isNext = (ph.phase === 'pre' && k === 0) || (ph.phase === 'wait' && k === 1);
      var f = wd && wd.days.find(function (x) { return x.date === '2026-10-' + (d.day < 10 ? '0' : '') + d.day; });
      var wxh = f ? '<div class="rl-wx">' + PM.wxIcon(PM.wxKind(f.code, true), 22) + '<span>' + PM.degree(f.max) + '</span>' + (f.pop != null ? '<em>' + PM.ic('drop') + PM.nf(f.pop) + '%</em>' : '') + '</div>'
        : '<div class="rl-wx none">' + T('wx_soon') + '</div>';
      var crowd = d.crowd ? '<div class="rl-crowd lv' + d.crowd + '" title="' + T(PM.crowdKey[d.crowd]) + '"><i></i><i></i><i></i></div><span class="rl-cl">' + T(PM.crowdKey[d.crowd]) + '</span>' : '<span class="rl-cl">' + T('live_audio') + '</span>';
      return '<li class="rl' + (isNow ? ' now' : '') + (isNext ? ' next' : '') + (ts + 864e5 <= nowTs ? ' past' : '') + '">' +
        '<div class="rl-top">' + (isNow ? '<span class="rl-flag">' + T('today') + '</span>' : isNext ? '<span class="rl-flag soft">' + T('next') + '</span>' : '') + '</div>' +
        '<div class="rl-date">' + PM.fmtDay(ts) + '</div><div class="rl-name">' + T(d.key) + '</div>' + crowd + wxh + '</li>';
    }).join('');
    return '<section class="block"><div class="block-h stack"><h2>' + T('puja_calendar') + '</h2><span class="cd" id="cdText">' + PM.countdownText() + '</span></div>' +
      '<ol class="rail">' + items + '</ol><p class="fine">' + T('crowd_disclaimer') + '</p></section>';
  }

  /* ---------- Mahalaya live card ---------- */
  function mahalaya() {
    var s = PM.mahalayaState(), stream = PM.mhHasStream(), playing = PM.audio && !PM.audio.paused, armed = PM.mhArmed(), page = PM.CFG.MAHALAYA_PAGE_URL;
    var label = s === 'soon' ? T('mh_scheduled') : s === 'live' ? T('mh_live') : T('mh_replay');
    var line = s === 'soon' ? T('mh_starts_in', { t: PM.mahalayaCountdown() }) : s === 'live' ? T('mh_live_hint') : T('mh_replay_d');
    var listen = stream
      ? '<button class="btn ' + (s !== 'soon' ? 'primary' : '') + '" data-act="mh-play">' + PM.ic(playing ? 'pause' : 'play') + (playing ? T('pause') : T('listen')) + '</button>'
      : (page ? '<a class="btn ' + (s !== 'soon' ? 'primary' : '') + '" href="' + PM.esc(page) + '" target="_blank" rel="noopener">' + PM.ic('play') + T('mh_listen_page') + '</a>' : '');
    var arm = s === 'soon' ? '<button class="btn ' + (armed ? 'on' : 'ghost') + '" data-act="mh-arm" aria-pressed="' + armed + '">' + PM.ic('bell') + (armed ? T('mh_alert_set') : T('mh_alert_me')) + '</button>' : '';
    return '<section class="mh ' + (s === 'live' ? 'live' : '') + '" id="mhCard">' +
      '<div class="mh-ic">' + PM.ic('radio') + '</div>' +
      '<div class="mh-txt"><div class="mh-st"><i class="live-dot"></i><span>' + label + '</span></div><h3>' + T('mh_title') + '</h3>' +
      '<p>' + T('mh_when') + '</p><p class="mh-line" id="mhLine">' + line + '</p></div>' +
      '<div class="mh-act">' + listen + arm + '<button class="btn ghost" data-act="mh-cal">' + PM.ic('calendar') + T('add_cal') + '</button></div>' +
      (s === 'soon' && armed ? '<p class="fine mh-fine">' + T(stream ? 'mh_armed_stream' : 'mh_armed_page') + '</p>' : '') + '</section>';
  }
  PM.mahalayaCountdown = function () {
    var d = PM.mhStart() - Date.now(); if (d < 0) return '';
    var days = Math.floor(d / 864e5), h = Math.floor(d % 864e5 / 36e5), m = Math.floor(d % 36e5 / 6e4), s = Math.floor(d % 6e4 / 1e3);
    return (days ? PM.nf(days) + T('u_d') + ' ' : '') + PM.nf(h) + T('u_h') + ' ' + PM.nf(m) + T('u_m') + ' ' + PM.nf(s < 10 ? '0' + s : s) + T('u_s');
  };

  /* ---------- carousels ---------- */
  function mustSee() {
    var idx = PM.P.map(function (p, i) { return i; }).filter(function (i) { return PM.P[i][6]; });
    var cards = idx.map(function (i) {
      var p = PM.P[i];
      return '<button class="fcard" data-act="open-pandal" data-i="' + i + '" style="--c:' + PM.zc(p[1]) + '">' +
        '<span class="num">' + (PM.st.vs.has(i) ? '✓' : PM.nf(i + 1)) + '</span><b>' + PM.esc(PM.pn(i)) + '</b>' +
        '<span class="fc-m">' + PM.ic('metro') + PM.esc(PM.sn(p[2])) + '</span><span class="fc-z">' + PM.esc(PM.zn(p[1])) + '</span></button>';
    }).join('');
    return '<section class="block"><div class="block-h"><h2>' + T('must_see') + '</h2><button class="link" data-act="goto" data-tab="explore" data-star="1">' + T('see_all') + PM.ic('chev') + '</button></div><div class="hscroll">' + cards + '</div></section>';
  }
  function plansBlock() {
    var cards = PM.PL.map(function (pl, k) {
      var z = PM.P[pl[1][0]][1];
      return '<button class="plcard" data-act="plan-load" data-k="' + k + '" style="--c:' + PM.zc(z) + '"><b>' + PM.esc(PM.planName(k)) + '</b>' +
        '<span>' + T('n_stops', { n: PM.nf(pl[1].length) }) + ' · ' + PM.esc(PM.rn(pl[2])) + '</span><em>' + T('start_plan') + PM.ic('chev') + '</em></button>';
    }).join('');
    return '<section class="block"><div class="block-h"><h2>' + T('quick_plans') + '</h2></div><div class="hscroll">' + cards + '</div></section>';
  }
  PM.chatCard = function () {
    var info = PM.chat && PM.chat.info, free = info && info.free_open && info.free_until ? T('chat_card_free', { d: PM.fmtDay(Date.parse(info.free_until)) }) : '';
    return '<section class="chatcard" data-act="chat-open" role="button" tabindex="0"><span class="cc-ic">' + PM.ic('chat') + '</span><span class="cc-t"><b>' + T('chat_card_t') + '</b><span>' + T('chat_card_d') + '</span>' +
      (free ? '<span class="badge gold">' + PM.esc(free) + '</span>' : '') + '</span><span class="btn primary sm">' + T('chat_open') + '</span></section>';
  };
  PM.themeBtn = function () {
    var light = PM.st.theme === 'laal';
    return '<button class="theme-btn" data-act="theme-toggle" aria-label="' + PM.esc(T('theme_title')) + '">' + PM.ic(light ? 'moon' : 'sun') + '</button>';
  };
  function quickActions() {
    var a = [
      ['near-me', 'locate', T('qa_near')], ['goto-map', 'map', T('qa_map')], ['traffic', 'car', T('qa_traffic')],
      ['toilets', 'wc', T('qa_toilet')], ['sos', 'alert', T('qa_sos')], ['share-app', 'share', T('qa_share')]
    ];
    return '<section class="block"><div class="block-h"><h2>' + T('quick_actions') + '</h2></div><div class="qa">' +
      a.map(function (x) { return '<button class="qa-b' + (x[0] === 'sos' ? ' sos' : '') + '" data-act="' + x[0] + '">' + PM.ic(x[1]) + '<span>' + x[2] + '</span></button>'; }).join('') + '</div></section>';
  }
  PM.renderHome = function () {
    var el = document.getElementById('v-home'); if (!el) return;
    var scroll = el.scrollTop;
    el.innerHTML = '<header class="vhead home-head"><div class="hh-l"><span class="logo">' + PM.ic('diya') + '</span><div><div class="hh-hi">' + greeting() + '</div>' +
      '<div class="hh-sub">' + PM.fmtDay(Date.now()) + '</div></div></div><div class="hh-r">' + PM.themeBtn() + PM.langSwitch() + '</div></header>' +
      '<div class="pad">' + wxHero() + rail() + mahalaya() + PM.chatCard() + PM.pujaCard() + mustSee() + plansBlock() + quickActions() +
      '<p class="fine foot">' + T('crafted') + ' <b>Sudipta Chatterjee</b></p></div>';
    el.scrollTop = scroll;
  };
  PM.refreshHomeLive = function () {      // lightweight per-second / per-minute updates without re-rendering everything
    var cd = document.getElementById('cdText'); if (cd) cd.textContent = PM.countdownText();
    var ln = document.getElementById('mhLine');
    if (ln && PM.mahalayaState() === 'soon') ln.textContent = T('mh_starts_in', { t: PM.mahalayaCountdown() });
  };

  /* ---------- weather sheet ---------- */
  PM.openWeather = function () {
    var w = PM.wx.data;
    if (!w) { PM.loadWeather(true); PM.sheet.open('<div class="sh-pad"><h2>' + T('weather') + '</h2><p class="muted">' + (PM.wx.status === 'error' ? T('wx_fail_d') : T('loading')) + '</p></div>'); return; }
    var n = w.now, kind = PM.wxKind(n.code, n.isDay), adv = PM.wxAdvice();
    var hourly = w.hours.slice(0, 24).map(function (h, k) {
      var hr = PM.ist(h.ts).getUTCHours();
      return '<li><span class="h-t">' + (k === 0 ? T('now') : PM.fmtHour(h.ts)) + '</span>' + PM.wxIcon(PM.wxKind(h.code, hr >= 6 && hr < 18), 28) + '<b>' + PM.degree(h.temp) + '</b>' +
        '<span class="h-bar"><i style="height:' + Math.max(3, (h.pop || 0)) + '%"></i></span><span class="h-p">' + (h.pop != null ? PM.nf(h.pop) + '%' : '') + '</span></li>';
    }).join('');
    function dayRow(f, tag) {
      return '<li class="dr' + (tag ? ' puja' : '') + '"><div class="dr-d"><b>' + PM.fmtDay(f.ts) + '</b>' + (tag ? '<span class="tag">' + T(tag) + '</span>' : '') + '</div>' +
        PM.wxIcon(PM.wxKind(f.code, true), 28) + '<span class="dr-p">' + (f.pop != null ? PM.ic('drop') + PM.nf(f.pop) + '%' : '') + '</span><span class="dr-t"><b>' + PM.degree(f.max) + '</b> ' + PM.degree(f.min) + '</span></li>';
    }
    var pujaRows = PM.PUJA_DAYS.map(function (d) {
      var key = '2026-10-' + (d.day < 10 ? '0' : '') + d.day, f = w.days.find(function (x) { return x.date === key; });
      if (f) return dayRow(f, d.key);
      var opens = PM.dayMs(d.day) - 15 * 864e5;
      return '<li class="dr puja soon"><div class="dr-d"><b>' + PM.fmtDay(PM.dayMs(d.day)) + '</b><span class="tag">' + T(d.key) + '</span></div><span class="dr-soon">' + T('wx_opens', { date: PM.fmtDateShort(opens) }) + '</span></li>';
    }).join('');
    var days = w.days.slice(0, 10).map(function (f) { return dayRow(f); }).join('');
    var today = w.days[0], aqi = w.aqi ? PM.aqiInfo(w.aqi.us) : null;
    PM.sheet.open('<div class="sh-pad wxs">' +
      '<div class="wxs-top ' + PM.wxSky(n.code, n.isDay) + '"><div class="wx-top"><span class="wx-loc">' + PM.ic('pin') + T('kolkata') + '</span><span class="wx-upd">' + updatedLabel(w) + '</span></div>' +
      '<div class="wx-main">' + PM.wxIcon(kind, 76) + '<div class="wx-temp">' + PM.degree(n.temp) + '</div><div class="wx-cond"><b>' + T(PM.wxLabelKey(n.code)) + '</b><span>' + T('feels_like', { t: PM.degree(n.feels) }) + '</span></div></div>' +
      (adv ? '<p class="wx-adv tone-' + adv.tone + '">' + T(adv.key, adv.vars) + '</p>' : '') + '</div>' +
      '<h3>' + T('next_24h') + '</h3><ul class="hourly">' + hourly + '</ul>' +
      '<div class="stat-row"><div><span>' + T('humidity') + '</span><b>' + PM.nf(Math.round(n.hum)) + '%</b></div><div><span>' + T('wind') + '</span><b>' + PM.nf(Math.round(n.wind)) + ' ' + T('kmh') + '</b></div>' +
      (today && today.sunrise ? '<div><span>' + T('sunrise') + '</span><b>' + PM.fmtTime(today.sunrise) + '</b></div><div><span>' + T('sunset') + '</span><b>' + PM.fmtTime(today.sunset) + '</b></div>' : '') + '</div>' +
      (aqi ? '<div class="aqi-card"><i class="dotc lg" style="background:' + aqi.c + '"></i><div><b>' + T('aqi') + ' ' + PM.nf(w.aqi.us) + ' · ' + T(aqi.key) + '</b><span>' + T('aqi_note') + '</span></div></div>' : '') +
      '<h3>' + T('puja_days') + '</h3><ul class="daylist">' + pujaRows + '</ul>' +
      '<h3>' + T('next_days') + '</h3><ul class="daylist">' + days + '</ul>' +
      '<p class="fine">' + T('wx_credit') + '</p></div>', { tall: true });
  };
  PM.acts['wx-open'] = function () { PM.openWeather(); };
  PM.acts['wx-retry'] = function (el, e) { e.stopPropagation(); PM.loadWeather(true); };
})(window.PM = window.PM || {});
