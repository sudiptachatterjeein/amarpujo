/* Puja Map 2026 - More tab, emergency + support sheets, quick actions, Mahalaya audio */
(function (PM) {
  'use strict';
  var T = function (k, v) { return PM.t(k, v); };
  var installEvt = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEvt = e; if (PM.st.tab === 'more') PM.renderMore(); });
  window.addEventListener('appinstalled', function () { installEvt = null; PM.toast(T('installed')); if (PM.st.tab === 'more') PM.renderMore(); });

  var NUMS = [['112', 'sos_all'], ['100', 'sos_police'], ['102', 'sos_amb'], ['101', 'sos_fire'], ['1091', 'sos_women']];
  function sosList() {
    return '<ul class="sos-list">' + NUMS.map(function (n) {
      return '<li><a href="tel:' + n[0] + '">' + PM.ic('phone') + '<span>' + T(n[1]) + '</span><b>' + PM.nf(n[0]) + '</b></a></li>';
    }).join('') + '</ul>';
  }
  function guide(title, keys) {
    return '<details class="acc"><summary>' + title + PM.ic('chev') + '</summary><ul>' + keys.map(function (k) { return '<li>' + T(k) + '</li>'; }).join('') + '</ul></details>';
  }

  PM.renderMore = function () {
    var el = document.getElementById('v-more'); if (!el) return;
    var sc = el.scrollTop, standalone = window.matchMedia && matchMedia('(display-mode: standalone)').matches;
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    el.innerHTML = PM.vhead(T('tab_more')) + '</header><div class="pad">' + PM.chatCard() + PM.pujaCard() +
      '<section class="block card"><div class="block-h"><h2>' + PM.ic('palette') + T('theme_title') + '</h2></div><div class="themes">' +
      ['night', 'laal'].map(function (k) { return '<button class="theme-opt' + (PM.st.theme === k ? ' on' : '') + '" data-act="theme" data-t="' + k + '" aria-pressed="' + (PM.st.theme === k) + '"><span class="sw sw-' + k + '"><i></i><i></i><i></i></span><b>' + T('theme_' + k) + '</b><small>' + T('theme_' + k + '_d') + '</small></button>'; }).join('') + '</div></section>' +
      '<section class="block card"><div class="block-h"><h2>' + PM.ic('globe') + T('language') + '</h2></div>' + PM.langSwitch().replace('seg lang', 'seg lang big') + '<p class="fine">' + T('lang_note') + '</p></section>' +
      '<section class="block card sos"><div class="block-h"><h2>' + PM.ic('alert') + T('emergency') + '</h2></div>' + sosList() + '</section>' +
      '<section class="block"><div class="block-h"><h2>' + T('guides') + '</h2></div>' +
      guide(T('g_metro'), ['g_metro_1', 'g_metro_2', 'g_metro_3', 'g_metro_4', 'g_metro_5']) +
      guide(T('g_crowd'), ['g_crowd_1', 'g_crowd_2', 'g_crowd_3']) +
      guide(T('g_tips'), ['g_tips_1', 'g_tips_2', 'g_tips_3', 'g_tips_4']) + '</section>' +
      '<section class="block card"><div class="block-h"><h2>' + T('app_settings') + '</h2></div>' +
      '<div class="setrow"><span>' + T('text_size') + '</span><div class="seg"><button class="' + (PM.st.big ? '' : 'on') + '" data-act="text-size" data-b="0">' + T('normal') + '</button><button class="' + (PM.st.big ? 'on' : '') + '" data-act="text-size" data-b="1">' + T('large') + '</button></div></div>' +
      (standalone ? '' : installEvt ? '<button class="btn wide" data-act="install">' + PM.ic('download') + T('install_app') + '</button>' : '<p class="fine">' + PM.ic('info') + ' ' + T(ios ? 'install_ios' : 'install_hint') + '</p>') +
      '<button class="btn wide ghost" data-act="share-app">' + PM.ic('share') + T('share_app') + '</button></section>' +
      '<section class="support lg"><div class="sp-ic">' + PM.ic('heart') + '</div><div><b>' + T('support_t') + '</b><span>' + T('support_d') + '</span></div><button class="btn primary sm" data-act="support">' + T('support_btn') + '</button></section>' +
      '<section class="block card"><div class="block-h"><h2>' + PM.ic('lock') + T('privacy') + '</h2></div><p class="fine lg">' + T('privacy_d') + '</p>' +
      '<div class="vcode"><span>' + T('your_code') + '</span><code>PUJA26-' + PM.visitorCode() + '</code></div>' +
      (PM.store.get('puja26_lat', '') ? '<button class="btn ghost wide" data-act="clear-loc">' + PM.ic('x') + T('clear_loc') + '</button>' : '') + '</section>' +
      '<p class="fine note">' + T('map_note') + '</p><p class="fine note">' + T('last_checked') + '</p>' +
      '<p class="fine foot">' + T('crafted') + ' <b>Sudipta Chatterjee</b></p></div>';
    el.scrollTop = sc;
  };

  /* ---------- sheets ---------- */
  PM.acts.sos = function () { PM.sheet.open('<div class="sh-pad"><h2>' + PM.ic('alert') + T('emergency') + '</h2>' + sosList() + '<p class="fine">' + T('sos_note') + '</p></div>'); };
  PM.acts.support = function () {
    var url = PM.CFG.SUPPORT_URL;
    if (url) window.location.assign(url);
  };

  /* ---------- quick actions ---------- */
  PM.acts['near-me'] = function () {
    if (!navigator.geolocation) { PM.toast(T('loc_na')); return; }
    PM.toast(T('locating'));
    navigator.geolocation.getCurrentPosition(function (pos) {
      var lat = pos.coords.latitude.toFixed(6), lon = pos.coords.longitude.toFixed(6);
      PM.store.set('puja26_lat', lat); PM.store.set('puja26_lon', lon); PM.heartbeat();
      var u = PM.G + 'search/?api=1&query=' + encodeURIComponent('Durga Puja pandal near ' + lat + ',' + lon);
      PM.sheet.open('<div class="sh-pad center"><h2>' + PM.ic('locate') + T('loc_found') + '</h2><p class="muted">' + T('loc_found_d') + '</p><a class="btn primary wide" target="_blank" rel="noopener" href="' + u + '">' + PM.ic('nav') + T('open_gmaps_near') + '</a>' +
        '<a class="btn wide" target="_blank" rel="noopener" href="' + PM.G + 'search/?api=1&query=' + encodeURIComponent('public toilet near ' + lat + ',' + lon) + '">' + PM.ic('wc') + T('toilets_near') + '</a></div>');
    }, function () { PM.toast(T('loc_denied')); }, { timeout: 12000, maximumAge: 60000 });
  };
  PM.acts.traffic = function () { window.open(PM.G + '@' + PM.RG[PM.st.rg][1] + ',14z/data=!5m1!1e1', '_blank', 'noopener'); };
  PM.acts.toilets = function () { window.open(PM.G + 'search/?api=1&query=' + encodeURIComponent('public toilet near Kolkata Durga Puja pandal'), '_blank', 'noopener'); };
  PM.acts['share-app'] = function () {
    var text = T('share_msg'), url = PM.site();
    if (navigator.share) navigator.share({ title: T('app_title'), text: text, url: url }).catch(function () {});
    else window.open(PM.wa(text + '\n' + url), '_blank', 'noopener');
  };
  PM.acts['clear-loc'] = function () { PM.store.set('puja26_lat', ''); PM.store.set('puja26_lon', ''); PM.toast(T('loc_cleared')); PM.renderMore(); };
  PM.acts.install = function () { if (installEvt) { installEvt.prompt(); installEvt = null; } };
  PM.acts['text-size'] = function (el) { PM.st.big = el.getAttribute('data-b') === '1'; PM.store.set('puja26_big', PM.st.big ? '1' : '0'); document.documentElement.classList.toggle('big', PM.st.big); PM.renderMore(); };
  PM.acts.theme = function (el) { PM.setTheme(el.getAttribute('data-t')); PM.toast(T('theme_set')); PM.rerenderAll(); };
  PM.acts['theme-toggle'] = function () { PM.setTheme(PM.st.theme === 'laal' ? 'night' : 'laal'); PM.toast(T('theme_set')); PM.rerenderAll(); };
  PM.acts.lang = function (el) { var l = el.getAttribute('data-l'); if (l !== PM.st.lang) { PM.setLang(l); PM.rerenderAll(); } };
  PM.acts.goto = function (el) {
    var tab = el.getAttribute('data-tab');
    if (el.getAttribute('data-star')) { PM.st.star = true; PM.st.zf = 'all'; PM.st.q = ''; PM.renderExplore(); }
    PM.go(tab);
  };
  PM.acts['goto-map'] = function () { PM.go('map'); };

})(window.PM = window.PM || {});
