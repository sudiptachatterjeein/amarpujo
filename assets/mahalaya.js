/* Puja Map 2026 - Mahalaya: schedule, 4:00 AM alert, optional in-app auto-start, calendar reminder.
   Browsers do not let a web page wake itself up: this works while the app/page is open (or via a notification if allowed). */
(function (PM) {
  'use strict';
  var C = PM.CFG, T = function (k, v) { return PM.t(k, v); };
  var ARM = 'puja26_mh_armed', DISMISS = 'puja26_mh_banner_x', lastState = null, tapNeeded = false;

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
  function autoplay() {
    if (!PM.mhHasStream() || !PM.mhArmed()) return;
    var p = PM.audio.play();
    if (p && p.catch) p.catch(function () { tapNeeded = true; banner(); PM.toast(T('mh_tap_again')); });
  }

  /* called every second from main.js */
  PM.mahalayaTick = function () {
    var st = PM.mahalayaState();
    if (lastState === null) { lastState = st; banner(); return; }          // first run: just show the banner if we are inside the live window
    if (st !== lastState) {
      var was = lastState; lastState = st;
      if (was === 'soon' && st === 'live') { banner(); autoplay(); notify(); }
      if (PM.st.tab === 'home') PM.renderHome();
    }
  };

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
    if (PM.mhArmed()) { PM.store.set(ARM, '0'); PM.toast(T('mh_alert_off')); PM.renderHome(); return; }
    PM.store.set(ARM, '1');
    if (PM.mhHasStream()) {                       // unlock audio playback while we have a tap
      try { PM.audio.muted = true; var p = PM.audio.play(); if (p && p.then) p.then(function () { PM.audio.pause(); PM.audio.currentTime = 0; PM.audio.muted = false; }).catch(function () { PM.audio.muted = false; }); } catch (e) { PM.audio.muted = false; }
    }
    if ('Notification' in window && Notification.permission === 'default') { try { Notification.requestPermission(); } catch (e) {} }
    PM.toast(T('mh_alert_on_toast')); PM.renderHome();
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
      if (ev === 'play') { tapNeeded = false; banner(); }
      if (PM.st.tab === 'home') PM.renderHome();
    });
  });
  PM.audio.addEventListener('error', function () { if (PM.audio.src) PM.toast(T('mh_err')); });
  if ('mediaSession' in navigator) { try { navigator.mediaSession.setActionHandler('play', function () { PM.audio.play(); }); navigator.mediaSession.setActionHandler('pause', function () { PM.audio.pause(); }); } catch (e) {} }
})(window.PM = window.PM || {});
