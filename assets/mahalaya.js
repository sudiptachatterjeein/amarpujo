/* Puja Map 2026 - Mahalaya: schedule, 4:00 AM alert, optional in-app auto-start, calendar reminder.
   Browsers do not let a web page wake itself up: this works while the app/page is open (or via a notification if allowed). */
(function (PM) {
  'use strict';
  var C = PM.CFG, T = function (k, v) { return PM.t(k, v); };
  var ARM = 'puja26_mh_armed', DISMISS = 'puja26_mh_banner_x', FIRED = 'puja26_mh_fired';
  var lastState = null, tapNeeded = false, started = false, notified = false, wakeLock = null, timer = null;

  /* Rehearsal: open the app with ?mhtest=2 and Mahalaya "starts" 2 minutes from now (kept for this browser session). */
  try {
    var q = new URLSearchParams(location.search).get('mhtest');
    if (q !== null) sessionStorage.setItem('puja26_mh_test', String(Date.now() + Math.max(0.2, parseFloat(q) || 2) * 6e4));
    var tt = +sessionStorage.getItem('puja26_mh_test');
    if (tt && tt > Date.now() - 4 * 36e5) C.MAHALAYA_START = new Date(tt).toISOString();
  } catch (e) {}

  PM.audio = new Audio(); PM.audio.preload = 'none';
  if (C.MAHALAYA_STREAM_URL) PM.audio.src = C.MAHALAYA_STREAM_URL;
  PM.mhHasStream = function () { return !!C.MAHALAYA_STREAM_URL; };
  PM.mhStart = function () { return new Date(C.MAHALAYA_START).getTime(); };
  PM.mahalayaState = function () {
    var n = Date.now(), s = PM.mhStart();
    return n < s ? 'soon' : n < s + 3 * 36e5 ? 'live' : 'replay';
  };
  PM.mhArmed = function () { return PM.store.get(ARM, '0') === '1'; };

  /* ---------- banner ---------- */
  function banner() {
    var el = document.getElementById('mhBanner'); if (!el) return;
    var st = PM.mahalayaState(), show = st === 'live' && PM.store.get(DISMISS, '') !== C.MAHALAYA_START;
    el.hidden = !show; if (!show) { el.innerHTML = ''; return; }
    var act = PM.mhHasStream()
      ? '<button class="btn primary sm" data-act="mh-play">' + PM.ic('play') + T(tapNeeded ? 'mh_tap_start' : 'listen') + '</button>'
      : '<a class="btn primary sm" href="' + PM.esc(C.MAHALAYA_PAGE_URL) + '" target="_blank" rel="noopener" data-act="mh-banner-close">' + PM.ic('play') + T('mh_listen_page') + '</a>';
    el.innerHTML = '<div class="mhb-t"><b>' + PM.ic('radio') + T('mh_started') + '</b><span>' + T('mh_started_d') + '</span></div>' + act +
      '<button class="icon-btn sm" data-act="mh-banner-close" aria-label="' + PM.esc(T('close')) + '">' + PM.ic('x') + '</button>';
  }
  PM.renderMhBanner = banner;

  function notify() {
    try {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      var opts = { body: T('mh_started_d'), tag: 'mahalaya-2026', icon: '/assets/icon-192.png', data: { url: '/#home' } };
      if (navigator.serviceWorker && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then(function (r) { return r.showNotification(T('mh_started'), opts); }).catch(function () { new Notification(T('mh_started'), opts); });
      else new Notification(T('mh_started'), opts);
    } catch (e) {}
  }
  /* ---------- scheduled auto-start ---------- */
  function wantAuto() {
    return PM.mhHasStream() && PM.mhArmed() && PM.store.get(FIRED, '') !== C.MAHALAYA_START && Date.now() < PM.mhStart() + 3 * 36e5;
  }
  function lock() {                               // keep the screen awake while waiting
    try {
      if (!wakeLock && 'wakeLock' in navigator && PM.mhArmed() && PM.mahalayaState() === 'soon' && document.visibilityState === 'visible') {
        navigator.wakeLock.request('screen').then(function (w) { wakeLock = w; w.addEventListener('release', function () { wakeLock = null; }); }).catch(function () {});
      }
    } catch (e) {}
  }
  function unlock_wake() { if (wakeLock) { wakeLock.release().catch(function () {}); wakeLock = null; } }
  function unlockAudio() {                        // silent play/pause while we have a user tap, so the browser allows playback later
    if (!PM.mhHasStream() || !PM.audio.paused || started) return;
    try {
      PM.audio.preload = 'auto'; PM.audio.muted = true;
      var p = PM.audio.play();
      if (p && p.then) p.then(function () { if (!started) { PM.audio.pause(); try { PM.audio.currentTime = 0; } catch (e) {} } PM.audio.muted = false; }).catch(function () { PM.audio.muted = false; });
    } catch (e) { PM.audio.muted = false; }
  }
  function fire() {
    if (started || !wantAuto()) return;
    started = true; PM.audio.muted = false;
    try { PM.audio.currentTime = 0; } catch (e) {}
    var ok = function () { PM.store.set(FIRED, C.MAHALAYA_START); tapNeeded = false; unlock_wake(); banner(); if (PM.celebrate) PM.celebrate(); };
    var p = PM.audio.play();
    if (p && p.then) p.then(ok).catch(function () { started = false; tapNeeded = true; banner(); PM.toast(T('mh_tap_again')); }); else ok();
    if (!notified) { notified = true; notify(); }
  }
  function schedule() {                           // exact timer for the start moment (the 1 s tick is a backup)
    clearTimeout(timer);
    var d = PM.mhStart() - Date.now();
    if (PM.mhArmed() && d > 0) timer = setTimeout(function () { PM.mahalayaTick(); }, d + 30);
  }

  /* called every second from main.js */
  PM.mahalayaTick = function () {
    var st = PM.mahalayaState();
    if (st !== lastState) {
      var first = lastState === null; lastState = st; banner();
      if (!first && PM.st.tab === 'home') PM.renderHome();
    }
    if (st === 'live' && !tapNeeded) fire();      // also catches "app opened after 4 AM" and a sleeping/throttled phone
  };

  /* the first tap anywhere: start blocked auto-play, or silently re-unlock audio after a page reload */
  document.addEventListener('pointerdown', function (e) {
    if (e.target && e.target.closest && e.target.closest('[data-act="mh-play"]')) return;
    if (!wantAuto()) return;
    if (PM.mahalayaState() === 'live') { started = false; tapNeeded = false; fire(); } else unlockAudio();
  }, true);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') { lock(); PM.mahalayaTick(); } });
  window.addEventListener('pageshow', function () { lock(); PM.mahalayaTick(); });
  window.addEventListener('focus', function () { PM.mahalayaTick(); });
  if (PM.mhArmed() && PM.mahalayaState() === 'soon') { if (PM.mhHasStream()) PM.audio.preload = 'auto'; lock(); schedule(); }

  /* ---------- actions ---------- */
  PM.acts['mh-play'] = function () {
    if (!PM.mhHasStream()) { if (C.MAHALAYA_PAGE_URL) window.open(C.MAHALAYA_PAGE_URL, '_blank', 'noopener'); return; }
    tapNeeded = false;
    if (PM.audio.paused) PM.audio.play().catch(function () { PM.toast(T('mh_err')); }); else PM.audio.pause();
  };
  PM.acts['mh-banner-close'] = function (el, e) {
    if (e && e.target && e.target.closest && e.target.closest('a')) { PM.store.set(DISMISS, C.MAHALAYA_START); setTimeout(banner, 50); return; }
    PM.store.set(DISMISS, C.MAHALAYA_START); banner();
  };
  PM.acts['mh-arm'] = function () {
    if (PM.mhArmed()) { PM.store.set(ARM, '0'); unlock_wake(); clearTimeout(timer); PM.toast(T('mh_alert_off')); PM.renderHome(); return; }
    PM.store.set(ARM, '1');
    unlockAudio();                                // this tap is what lets the browser start sound by itself later
    lock(); schedule();
    if ('Notification' in window && Notification.permission === 'default') { try { Notification.requestPermission(); } catch (e) {} }
    PM.toast(T('mh_alert_on_toast')); PM.renderHome();
  };

  /* ---------- seek bar, +-15 s, jump to live ---------- */
  var seeking = false, KNOWN = 5298;
  function dur() { var d = PM.audio.duration; return isFinite(d) && d > 0 ? d : KNOWN; }
  function mm(s) { s = Math.max(0, Math.floor(s)); var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (x < 10 ? '0' : '') + x; }
  PM.mhSeekUpdate = function () {
    var r = document.getElementById('mhSeek'), t = document.getElementById('mhTime'); if (!r || !t) return;
    var d = dur(), c = PM.audio.currentTime || 0;
    if (!seeking) r.value = Math.round(c / d * 1000);
    t.textContent = mm(seeking ? r.value / 1000 * d : c) + ' / ' + mm(d);
  };
  document.addEventListener('input', function (e) { if (e.target && e.target.id === 'mhSeek') { seeking = true; PM.mhSeekUpdate(); } });
  document.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'mhSeek') { try { PM.audio.currentTime = e.target.value / 1000 * dur(); } catch (x) {} seeking = false; PM.mhSeekUpdate(); }
  });
  PM.acts['mh-skip'] = function (el) { try { PM.audio.currentTime = Math.max(0, Math.min(dur() - 1, (PM.audio.currentTime || 0) + (+el.getAttribute('data-s')))); } catch (e) {} PM.mhSeekUpdate(); };
  PM.acts['mh-sync'] = function () {
    var off = (Date.now() - PM.mhStart()) / 1000; if (off < 0) return;
    try { PM.audio.currentTime = Math.min(dur() - 1, off); } catch (e) {}
    if (PM.audio.paused) PM.audio.play().catch(function () { PM.toast(T('mh_err')); });
    PM.mhSeekUpdate();
  };
  PM.acts['mh-cal'] = function () {
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PujaMap26//EN', 'BEGIN:VEVENT', 'UID:mahalaya-2026@pujamap26', 'DTSTAMP:20261001T000000Z',
      'DTSTART:20261009T223000Z', 'DTEND:20261010T003000Z', 'SUMMARY:Mahalaya 2026 (4:00 AM IST)', 'DESCRIPTION:Mahalaya from 4:00 AM IST. ' + (C.MAHALAYA_PAGE_URL || PM.site()),
      'BEGIN:VALARM', 'TRIGGER:-PT5M', 'ACTION:DISPLAY', 'DESCRIPTION:Mahalaya starts in 5 minutes', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = 'mahalaya-2026.ics';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); PM.toast(T('cal_added'));
  };

  ['play', 'pause', 'ended'].forEach(function (ev) {
    PM.audio.addEventListener(ev, function () {
      if ('mediaSession' in navigator) {
        if (ev === 'play') { try { navigator.mediaSession.metadata = new MediaMetadata({ title: T('mh_title'), artist: T('app_title'), album: T('app_name') }); } catch (e) {} navigator.mediaSession.playbackState = 'playing'; }
        else navigator.mediaSession.playbackState = 'paused';
      }
      if (ev === 'play' && !PM.audio.muted) { tapNeeded = false; if (PM.mahalayaState() !== 'soon') { PM.store.set(FIRED, C.MAHALAYA_START); if (PM.celebrate) PM.celebrate(); } banner(); }
      if (PM.st.tab === 'home') PM.renderHome();
    });
  });
  PM.audio.addEventListener('error', function () { if (PM.audio.src) PM.toast(T('mh_err')); });
  if ('mediaSession' in navigator) { try { navigator.mediaSession.setActionHandler('play', function () { PM.audio.play(); }); navigator.mediaSession.setActionHandler('pause', function () { PM.audio.pause(); }); } catch (e) {} }
})(window.PM = window.PM || {});
