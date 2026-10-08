/* Puja Map 2026 service worker: app shell works offline; live APIs are never cached. Bump VERSION on each release. */
const VERSION = 'puja26-v9';
const SHELL = ['/', '/index.html', '/assets/app.css?v=9', '/assets/data.js?v=9', '/assets/config.js?v=9', '/assets/i18n.js?v=9', '/assets/core.js?v=9', '/assets/weather.js?v=9',
  '/assets/community.js?v=9', '/assets/mahalaya.js?v=9', '/assets/metro.js?v=9', '/assets/chat.js?v=9', '/assets/pujas.js?v=9', '/assets/support-qr.png', '/assets/map.js?v=9', '/assets/views-home.js?v=9', '/assets/views-explore.js?v=9', '/assets/views-route.js?v=9', '/assets/views-more.js?v=9', '/assets/main.js?v=9',
  '/assets/favicon.svg', '/manifest.webmanifest'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION && k.startsWith('puja26-')).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  // Never cache live data: weather, Supabase, our API.
  if (url.hostname.endsWith('open-meteo.com') || url.hostname.endsWith('supabase.co') || url.pathname.startsWith('/api/')) return;
  // Fonts: cache-first.
  if (url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com')) {
    e.respondWith(caches.open(VERSION).then((c) => c.match(req).then((hit) => hit || fetch(req).then((r) => { c.put(req, r.clone()); return r; }).catch(() => hit))));
    return;
  }
  if (url.origin !== location.origin) return;
  // Same-origin: network first (so a new deploy shows up immediately), cached copy when offline.
  e.respondWith(fetch(req).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); } return r; })
    .catch(() => caches.open(VERSION).then((c) => c.match(req).then((hit) => hit || (req.mode === 'navigate' ? c.match('/index.html') : Response.error())))));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
    for (const c of cs) { if ('focus' in c) return c.focus(); }
    return self.clients.openWindow((e.notification.data && e.notification.data.url) || '/');
  }));
});
