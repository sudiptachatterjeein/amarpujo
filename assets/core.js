/* Puja Map 2026 - core: config, state, language, formatting, bottom sheet, toast, click routing */
(function (PM) {
  'use strict';
  var D = window.PUJA_D, L = window.PUJA_I18N;
  PM.CFG = Object.assign({
    SUPABASE_URL: '', SUPABASE_ANON_KEY: '', MAHALAYA_STREAM_URL: '', MAHALAYA_PAGE_URL: '', MAHALAYA_START: '2026-10-10T04:00:00+05:30',
    SUPPORT_URL: '', SUPPORT_QR: '', WEATHER_LAT: 22.5726, WEATHER_LON: 88.3639, AI_ENDPOINT: ''
  }, window.PUJA_CONFIG || {});
  PM.D = D; PM.Z = D.Z; PM.P = D.P; PM.ST = D.ST; PM.SS = D.S; PM.F = D.F; PM.M = D.M; PM.RG = D.RG; PM.PL = D.PL;

  /* ---------- storage ---------- */
  PM.store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    json: function (k, d) { try { return JSON.parse(localStorage.getItem(k) || ''); } catch (e) { return d; } }
  };

  /* ---------- app state ---------- */
  var savedLang = PM.store.get('puja26_lang', '');
  PM.st = {
    tab: 'home',
    lang: savedLang === 'en' || savedLang === 'bn' ? savedLang : 'en',
    rg: 'N', zf: 'all', star: false, q: '',
    sel: PM.store.json('puja26_route', []).filter(function (i) { return Number.isInteger(i) && i >= 0 && i < D.P.length; }),
    vs: new Set(PM.store.json('puja26', [])),
    from: '',               // metro station used as the start for metro-route links
    cur: -1,                // pandal shown in the detail sheet
    mapSel: -1,             // pandal selected on the map
    routeTab: 'route', ex: 'official',
    theme: PM.store.get('puja26_theme', 'night') === 'laal' ? 'laal' : 'night',
    big: PM.store.get('puja26_big', '0') === '1',
    checked: PM.store.json('puja26_checked', {})
  };
  PM.saveRoute = function () { PM.store.set('puja26_route', JSON.stringify(PM.st.sel)); };
  PM.saveVisited = function () { PM.store.set('puja26', JSON.stringify(Array.from(PM.st.vs))); };

  /* ---------- zone colours (brightened for the dark map) ---------- */
  var ZC = { A: '#FF6B86', B: '#FFA24C', C: '#B49BFF', D: '#35D6C0', E: '#FF7FC0', F: '#58C8FF', G: '#B4E94A', H: '#F2BE62', I: '#9AA2FF' };
  PM.zc = function (k) { return ZC[k] || '#cccccc'; };

  /* ---------- language ---------- */
  var BD = '০১২৩৪৫৬৭৮৯';
  PM.nf = function (n) {
    var s = String(n);
    return PM.st.lang === 'bn' ? s.replace(/\d/g, function (d) { return BD[d]; }) : s;
  };
  PM.t = function (key, vars) {
    var lang = PM.st.lang, d = L.ui[lang], s = d && d[key] != null ? d[key] : (L.ui.en[key] != null ? L.ui.en[key] : key);
    if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
    return s;
  };
  PM.tr = function (s) { return PM.st.lang === 'bn' && L.data[s] ? L.data[s] : s; };
  PM.bn = function (s) { return L.data[s] || s; };               // Bengali form regardless of UI language (used for search)
  PM.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  PM.pn = function (i) { return PM.tr(D.P[i][0]); };           // pandal name
  PM.zn = function (k) { return PM.tr(D.Z[k][0]); };           // zone name
  PM.rn = function (k) { return PM.tr(D.RG[k][0]); };          // region name
  PM.sn = function (n) { return PM.tr(n); };                   // station name
  PM.planName = function (k) { return PM.tr(D.PL[k][0]).replace(/^[^A-Za-z\u0980-\u09FF0-9]+/, ''); };
  PM.reg = function (i) { return D.Z[D.P[i][1]][2]; };
  PM.setLang = function (lang) {
    PM.st.lang = lang; PM.store.set('puja26_lang', lang);
    document.documentElement.lang = lang === 'bn' ? 'bn' : 'en';
    document.title = PM.t('app_title');
  };

  /* ---------- theme: Pujo Night (dark, default) and Laal Paar (light) ---------- */
  PM.applyTheme = function (t) {
    PM.st.theme = t === 'laal' ? 'laal' : 'night';
    if (PM.st.theme === 'laal') document.documentElement.setAttribute('data-theme', 'laal'); else document.documentElement.removeAttribute('data-theme');
    var light = PM.st.theme === 'laal', m = document.querySelector('meta[name="theme-color"]'), cs = document.querySelector('meta[name="color-scheme"]');
    if (m) m.setAttribute('content', light ? '#FBF4E8' : '#120E2B'); if (cs) cs.setAttribute('content', light ? 'light' : 'dark');
    try { if (window.PujaNative && window.PujaNative.setTheme) window.PujaNative.setTheme(light); } catch (e) {}
  };
  PM.setTheme = function (t) { PM.store.set('puja26_theme', t === 'laal' ? 'laal' : 'night'); PM.applyTheme(t); };

  /* ---------- icons ---------- */
  PM.ic = function (name, cls) {
    return '<svg class="ic' + (cls ? ' ' + cls : '') + '" aria-hidden="true" focusable="false"><use href="#i-' + name + '"/></svg>';
  };

  /* ---------- IST date & time ---------- */
  var WD = { en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], bn: ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'] };
  var MO = {
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    bn: ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে']
  };
  PM.ist = function (ts) { return new Date((ts == null ? Date.now() : ts) + 19800000); };   // read with getUTC*
  PM.fmtDay = function (ts) {            // "Sat 17 Oct" / "শনি ১৭ অক্টো"
    var d = PM.ist(ts), l = PM.st.lang;
    return WD[l][d.getUTCDay()] + ' ' + PM.nf(d.getUTCDate()) + ' ' + MO[l][d.getUTCMonth()];
  };
  PM.fmtWeekday = function (ts) { return WD[PM.st.lang][PM.ist(ts).getUTCDay()]; };
  PM.fmtDateShort = function (ts) { var d = PM.ist(ts); return PM.nf(d.getUTCDate()) + ' ' + MO[PM.st.lang][d.getUTCMonth()]; };
  PM.fmtTime = function (ts) {           // "9:30 PM" / "রাত ৯:৩০"
    var d = PM.ist(ts), h = d.getUTCHours(), m = d.getUTCMinutes(), h12 = h % 12 || 12, mm = (m < 10 ? '0' : '') + m;
    if (PM.st.lang === 'bn') return PM.bnPeriod(h) + ' ' + PM.nf(h12) + ':' + PM.nf(mm);
    return h12 + ':' + mm + ' ' + (h < 12 ? 'AM' : 'PM');
  };
  PM.fmtHour = function (ts) {           // "9 PM" / "রাত ৯টা"
    var h = PM.ist(ts).getUTCHours(), h12 = h % 12 || 12;
    if (PM.st.lang === 'bn') return PM.bnPeriod(h) + ' ' + PM.nf(h12) + 'টা';
    return h12 + ' ' + (h < 12 ? 'AM' : 'PM');
  };
  PM.bnPeriod = function (h) {
    return h < 4 ? 'রাত' : h < 6 ? 'ভোর' : h < 12 ? 'সকাল' : h < 15 ? 'দুপুর' : h < 18 ? 'বিকেল' : h < 20 ? 'সন্ধ্যা' : 'রাত';
  };
  PM.dayMs = function (day) { return Date.parse('2026-10-' + (day < 10 ? '0' : '') + day + 'T00:00:00+05:30'); };

  /* ---------- Google Maps / WhatsApp links ---------- */
  var G = 'https://www.google.com/maps/';
  PM.G = G;
  PM.q = function (t) { return encodeURIComponent(t + ', Kolkata'); };
  PM.wa = function (text) { return 'https://wa.me/?text=' + encodeURIComponent(text); };
  PM.site = function () { return location.href.split('#')[0]; };

  /* ---------- toast ---------- */
  var toastTimer;
  PM.toast = function (msg) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2600);
  };

  /* ---------- bottom sheet ---------- */
  var wrap, sheetEl, bodyEl, onClose = null;
  PM.sheet = {
    init: function () {
      wrap = document.getElementById('sheetWrap'); sheetEl = wrap.querySelector('.sheet'); bodyEl = document.getElementById('sheetBody');
      var startY = 0, dy = 0, dragging = false;
      var grab = wrap.querySelector('.grab');
      grab.addEventListener('touchstart', function (e) { dragging = true; startY = e.touches[0].clientY; dy = 0; sheetEl.style.transition = 'none'; }, { passive: true });
      grab.addEventListener('touchmove', function (e) { if (!dragging) return; dy = Math.max(0, e.touches[0].clientY - startY); sheetEl.style.transform = 'translateY(' + dy + 'px)'; }, { passive: true });
      grab.addEventListener('touchend', function () {
        if (!dragging) return; dragging = false; sheetEl.style.transition = '';
        if (dy > 90) PM.sheet.close(); else sheetEl.style.transform = '';
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !wrap.hidden) PM.sheet.close(); });
    },
    open: function (html, opts) {
      opts = opts || {};
      bodyEl.innerHTML = html; bodyEl.scrollTop = 0;
      sheetEl.classList.toggle('tall', !!opts.tall);
      onClose = opts.onClose || null;
      wrap.hidden = false;
      void wrap.offsetWidth;
      wrap.classList.add('open'); sheetEl.style.transform = '';
      document.body.classList.add('sheet-open');
      sheetEl.focus({ preventScroll: true });
    },
    set: function (html) { bodyEl.innerHTML = html; },
    isOpen: function () { return !wrap.hidden && wrap.classList.contains('open'); },
    close: function () {
      if (wrap.hidden) return;
      wrap.classList.remove('open'); sheetEl.style.transform = '';
      document.body.classList.remove('sheet-open');
      var cb = onClose; onClose = null;
      setTimeout(function () { if (!wrap.classList.contains('open')) { wrap.hidden = true; bodyEl.innerHTML = ''; } }, 260);
      if (cb) cb();
    },
    body: function () { return bodyEl; }
  };

  /* ---------- click routing: any element with data-act="name" ---------- */
  PM.acts = {};
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el) return;
    var fn = PM.acts[el.getAttribute('data-act')];
    if (fn) fn(el, e);
  });
  PM.acts['sheet-close'] = function () { PM.sheet.close(); };
})(window.PM = window.PM || {});
