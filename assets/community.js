/* Puja Map 2026 - community (check-ins, tips, photos) + anonymous visitor heartbeat.
   Talks to Supabase through validated database functions using the PUBLIC anon key only. */
(function (PM) {
  'use strict';
  var CFG = PM.CFG;
  PM.commError = '';

  function sbHeaders(extra) {
    var h = { apikey: CFG.SUPABASE_ANON_KEY };
    if (String(CFG.SUPABASE_ANON_KEY).indexOf('eyJ') === 0) h.Authorization = 'Bearer ' + CFG.SUPABASE_ANON_KEY;
    return Object.assign(h, extra || {});
  }
  function rpc(name, args) {
    return fetch(CFG.SUPABASE_URL + '/rest/v1/rpc/' + name, {
      method: 'POST', headers: sbHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(args || {})
    }).then(function (r) {
      return r.text().then(function (t) {
        var d = null; try { d = t ? JSON.parse(t) : null; } catch (e) {}
        if (!r.ok) throw new Error('HTTP ' + r.status + (d && (d.message || d.error) ? ': ' + (d.message || d.error) : ''));
        return d;
      });
    });
  }
  PM.rpc = rpc;

  /* Shrink a chosen photo to a small JPEG before upload (bucket limit is 3 MB). */
  function resizeToBlob(file, maxDim, quality) {
    return new Promise(function (res, rej) {
      var rd = new FileReader();
      rd.onerror = function () { rej(new Error('Could not read the photo')); };
      rd.onload = function () {
        var img = new Image();
        img.onload = function () {
          var k = Math.min(1, maxDim / Math.max(img.width, img.height));
          var c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          c.toBlob(function (b) { b ? res(b) : rej(new Error('Could not process the photo')); }, 'image/jpeg', quality);
        };
        img.onerror = function () { rej(new Error('Could not read the photo')); };
        img.src = rd.result;
      };
      rd.readAsDataURL(file);
    });
  }

  PM.clientId = function () {
    var x = PM.store.get('puja26_client_id', '');
    if (!x) {
      x = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'c' + Date.now() + Math.random().toString(36).slice(2);
      PM.store.set('puja26_client_id', x);
    }
    return x;
  };

  /* API used by the views. Every call resolves to data or null (and sets PM.commError). */
  function wrap(p) {
    return p.then(function (d) { PM.commError = ''; return d; }, function (e) { PM.commError = String(e && e.message || e); return null; });
  }
  PM.comm = {
    pulse: function (pid) { return wrap(rpc('puja_pulse', { p_pandal: pid }).then(function (n) { return Number(n) || 0; })); },
    checkin: function (pid) { return wrap(rpc('puja_checkin', { p_pandal: pid, p_client: PM.clientId() }).then(function () { return true; })); },
    checkout: function (pid) { return wrap(rpc('puja_checkout', { p_pandal: pid, p_client: PM.clientId() }).then(function () { return true; })); },
    feed: function (pid) { return wrap(rpc('puja_feed', { p_pandal: pid })); },
    tip: function (pid, text) { return wrap(rpc('puja_add_tip', { p_pandal: pid, p_text: text, p_client: PM.clientId() })); },
    photo: function (pid, file) {
      return wrap(resizeToBlob(file, 1600, 0.82).then(function (blob) {
        var path = 'community/' + pid + '/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.jpg';
        return fetch(CFG.SUPABASE_URL + '/storage/v1/object/puja-photos/' + path, {
          method: 'POST', headers: sbHeaders({ 'Content-Type': 'image/jpeg', 'x-upsert': 'false' }), body: blob
        }).then(function (up) {
          if (!up.ok) return up.json().catch(function () { return {}; }).then(function (j) { throw new Error('Upload failed (HTTP ' + up.status + (j.message ? ': ' + j.message : '') + ')'); });
          return rpc('puja_add_photo', { p_pandal: pid, p_url: CFG.SUPABASE_URL + '/storage/v1/object/public/puja-photos/' + path, p_client: PM.clientId() });
        });
      }));
    }
  };

  /* ---------- anonymous visitor code + heartbeat (shown in More > Privacy) ---------- */
  PM.visitorCode = function () {
    var id = PM.store.get('puja26_visitor_code', '');
    if (!id) {
      id = ((window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'v-' + Date.now() + '-' + Math.random().toString(36).slice(2)).replace(/-/g, '').slice(0, 12).toUpperCase();
      PM.store.set('puja26_visitor_code', id);
    }
    return id;
  };
  PM.heartbeat = function () {
    var lat = PM.store.get('puja26_lat', ''), lon = PM.store.get('puja26_lon', '');
    var hasLoc = lat !== '' && lon !== '';
    var audio = !!(PM.audio && !PM.audio.paused);
    return rpc('puja_heartbeat', {
      p_code: PM.visitorCode(), p_page: '/#' + PM.st.tab, p_audio: audio,
      p_lat: hasLoc ? Number(lat) : null, p_lon: hasLoc ? Number(lon) : null, p_loc: hasLoc, p_ua: navigator.userAgent
    }).catch(function () {});
  };
})(window.PM = window.PM || {});
