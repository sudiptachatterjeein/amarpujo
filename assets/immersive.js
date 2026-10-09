/* Puja Map 2026 - Immersive Mahalaya mode (mandala + progress ring + tap-to-light diyas) and Dhaak Jam (synth dhaak, kansor, shankh). */
(function (PM) {
  'use strict';
  var X = function (a, b) { return PM.X ? PM.X(a, b) : a; }, KNOWN = 5298;

  /* ================= Immersive Mahalaya ================= */
  var imm = null, iv = null, wake = null, lit = 0, seeking = false;
  function dur() { var d = PM.audio.duration; return isFinite(d) && d > 0 ? d : KNOWN; }
  function mm(s) { s = Math.max(0, Math.floor(s)); var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (x < 10 ? '0' : '') + x; }
  function mandala() {
    var s = '<svg class="mdl" viewBox="-150 -150 300 300" aria-hidden="true"><g class="spin">';
    for (var k = 0; k < 12; k++) s += '<ellipse cx="0" cy="-92" rx="15" ry="40" transform="rotate(' + k * 30 + ')"/>';
    s += '</g><g class="spin2">';
    for (k = 0; k < 8; k++) s += '<ellipse cx="0" cy="-50" rx="11" ry="26" transform="rotate(' + (k * 45 + 22.5) + ')"/>';
    s += '</g><circle r="22" class="core"/><circle r="124" class="r1"/><circle class="ring" r="140" transform="rotate(-90)" stroke-dasharray="879.6" stroke-dashoffset="879.6"/></svg>';
    return s;
  }
  PM.acts['imm-open'] = function () {
    if (imm) return;
    imm = document.createElement('div'); imm.id = 'imm';
    imm.innerHTML = '<div class="imm-top"><button class="imm-x" data-act="imm-close" aria-label="Close">✕</button><span>' + X('Mahalaya', 'মহালয়া') + '</span><span></span></div>' +
      '<div class="imm-mid">' + mandala() + '<div class="imm-t"><b id="immT">0:00</b><small id="immD"></small></div></div>' +
      '<div class="imm-seek"><input id="immSeek" type="range" min="0" max="1000" value="0" aria-label="Seek"></div>' +
      '<div class="imm-ctl"><button data-act="mh-skip" data-s="-15">-15s</button><button class="big" data-act="mh-play" id="immP">▶</button><button data-act="mh-skip" data-s="15">+15s</button></div>' +
      '<div class="imm-foot"><span id="immN">' + X('Tap anywhere to light a diya 🪔', 'যেকোনো জায়গায় ট্যাপ করে প্রদীপ জ্বালান 🪔') + '</span></div>';
    imm.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button,input')) return;
      if (lit >= 80) return; lit++;
      var d = document.createElement('div'); d.className = 'dy'; d.style.left = e.clientX + 'px'; d.style.top = e.clientY + 'px'; d.innerHTML = '<i></i><b>🪔</b>';
      imm.appendChild(d);
      var n = document.getElementById('immN'); if (n) n.textContent = X(lit + ' diyas lit 🪔', lit + 'টি প্রদীপ জ্বলছে 🪔');
      if (navigator.vibrate) try { navigator.vibrate(12); } catch (x) {}
    });
    imm.addEventListener('input', function (e) { if (e.target.id === 'immSeek') { seeking = true; upd(); } });
    imm.addEventListener('change', function (e) { if (e.target.id === 'immSeek') { try { PM.audio.currentTime = e.target.value / 1000 * dur(); } catch (x) {} seeking = false; upd(); } });
    document.body.appendChild(imm); lit = 0;
    try { if ('wakeLock' in navigator) navigator.wakeLock.request('screen').then(function (w) { wake = w; }).catch(function () {}); } catch (e) {}
    if (!PM.mhHasStream()) document.getElementById('immN').textContent = X('Audio link not added yet.', 'অডিও লিঙ্ক এখনও যোগ হয়নি।');
    iv = setInterval(upd, 400); upd();
  };
  function upd() {
    if (!imm) return;
    var d = dur(), c = PM.audio.currentTime || 0, r = imm.querySelector('.ring'), t = document.getElementById('immT'), dd = document.getElementById('immD'), p = document.getElementById('immP'), sk = document.getElementById('immSeek');
    var playing = !PM.audio.paused; imm.classList.toggle('playing', playing);
    if (r) r.setAttribute('stroke-dashoffset', String(879.6 * (1 - Math.min(1, c / d))));
    if (t) t.textContent = mm(c); if (dd) dd.textContent = '/ ' + mm(d);
    if (p) p.textContent = playing ? '❚❚' : '▶';
    if (sk && !seeking) sk.value = Math.round(c / d * 1000);
  }
  PM.acts['imm-close'] = function () {
    if (!imm) return; clearInterval(iv); imm.remove(); imm = null;
    if (wake) { wake.release().catch(function () {}); wake = null; }
  };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && imm) PM.acts['imm-close'](); });

  /* ================= Dhaak Jam (synthesised, no audio files) ================= */
  var ctx = null, nbuf = null, loopT = null, step = 0;
  function AC() {
    if (!ctx) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); }
    if (ctx.state === 'suspended') ctx.resume(); return ctx;
  }
  function noise() {
    if (nbuf) return nbuf; var n = ctx.sampleRate * 0.4, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return (nbuf = b);
  }
  function env(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
  var SND = {
    dhaak: function (t, v) {                       // deep skin thump + crisp stick crack
      var o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(52, t + 0.22);
      env(g, t, 0.004, 0.95 * v, 0.34); o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.5);
      var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g2 = ctx.createGain(); s.buffer = noise(); f.type = 'bandpass'; f.frequency.value = 2200; f.Q.value = 0.8;
      env(g2, t, 0.002, 0.5 * v, 0.07); s.connect(f).connect(g2).connect(ctx.destination); s.start(t); s.stop(t + 0.15);
    },
    tak: function (t, v) {                         // light stick tap
      var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noise(); f.type = 'highpass'; f.frequency.value = 2800;
      env(g, t, 0.001, 0.55 * v, 0.05); s.connect(f).connect(g).connect(ctx.destination); s.start(t); s.stop(t + 0.1);
      var o = ctx.createOscillator(), g2 = ctx.createGain(); o.frequency.setValueAtTime(260, t); o.frequency.exponentialRampToValueAtTime(150, t + 0.06); env(g2, t, 0.002, 0.3 * v, 0.1); o.connect(g2).connect(ctx.destination); o.start(t); o.stop(t + 0.2);
    },
    kansor: function (t, v) {                      // bell-metal gong: inharmonic partials
      [[820, 1], [1190, .7], [1710, .5], [2390, .35], [3110, .2]].forEach(function (p) {
        var o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = p[0]; env(g, t, 0.002, 0.18 * p[1] * v, 1.1); o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 1.4);
      });
    },
    shankh: function (t, v) {                      // conch: swelling, slightly bending reed tone
      var o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      o.type = o2.type = 'sawtooth'; o.frequency.setValueAtTime(300, t); o.frequency.linearRampToValueAtTime(318, t + 1.9); o2.frequency.value = 302; o2.detune.value = 9;
      f.type = 'lowpass'; f.frequency.setValueAtTime(500, t); f.frequency.linearRampToValueAtTime(1500, t + 0.9); f.Q.value = 3;
      lfo.frequency.value = 5.5; lg.gain.value = 5; lfo.connect(lg); lg.connect(o.frequency);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.32 * v, t + 0.5); g.gain.setValueAtTime(0.32 * v, t + 1.5); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
      o.connect(f); o2.connect(f); f.connect(g).connect(ctx.destination); [o, o2, lfo].forEach(function (n) { n.start(t); n.stop(t + 2.5); });
    }
  };
  function hit(k) { if (!AC()) return; SND[k](ctx.currentTime + 0.005, 1); }
  PM.acts['dj-hit'] = function (el) {
    var k = el.getAttribute('data-k'); hit(k); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    if (navigator.vibrate) try { navigator.vibrate(k === 'dhaak' ? 25 : 12); } catch (e) {}
  };
  /* classic aarti-style dhaak groove: 16 steps */
  var PAT = [['dhaak', 'kansor'], 0, 'tak', 'tak', ['dhaak', 'kansor'], 0, 'tak', 'tak', ['dhaak', 'kansor'], 0, 'tak', 'dhaak', ['dhaak', 'kansor'], 'tak', 'tak', 'tak'];
  function tick() {
    if (!document.getElementById('djPad')) { clearInterval(loopT); loopT = null; return; }
    var s = PAT[step % PAT.length]; step++;
    if (s) [].concat(s).forEach(function (k) { SND[k](ctx.currentTime + 0.01, k === 'kansor' ? 0.7 : 1); });
    var pads = document.querySelectorAll('#djPad .dj-p'); pads.forEach(function (p) { p.classList.remove('beat'); });
    if (s) { var main = [].concat(s)[0]; var q = document.querySelector('#djPad .dj-p[data-k="' + main + '"]'); if (q) q.classList.add('beat'); }
  }
  PM.acts['dj-loop'] = function (el) {
    if (!AC()) return;
    if (loopT) { clearInterval(loopT); loopT = null; el.classList.remove('on'); el.textContent = X('▶ Auto rhythm', '▶ অটো তাল'); return; }
    step = 0; loopT = setInterval(tick, 150); el.classList.add('on'); el.textContent = X('■ Stop rhythm', '■ তাল থামান');
  };
  PM.acts['dj-open'] = function () {
    var pads = [['dhaak', '🥁', X('Dhaak', 'ঢাক')], ['tak', '🪘', X('Kathi', 'কাঠি')], ['kansor', '🔔', X('Kansor', 'কাঁসর')], ['shankh', '🐚', X('Shankh', 'শঙ্খ')]];
    PM.sheet.open('<div class="sh-pad center" id="djPad"><h2>' + X('Dhaak Jam 🥁', 'ঢাক জ্যাম 🥁') + '</h2><p class="muted">' + X('Tap the pads, or start the auto rhythm and play along.', 'প্যাডে ট্যাপ করুন, অথবা অটো তাল চালিয়ে সঙ্গে বাজান।') + '</p>' +
      '<div class="dj-g">' + pads.map(function (p) { return '<button class="dj-p" data-act="dj-hit" data-k="' + p[0] + '"><span>' + p[1] + '</span><b>' + p[2] + '</b></button>'; }).join('') + '</div>' +
      '<button class="btn primary wide" data-act="dj-loop">' + X('▶ Auto rhythm', '▶ অটো তাল') + '</button></div>');
  };
  PM.jamCard = function () {
    return '<section class="rl"><div class="rl-t"><b>' + X('Dhaak Jam 🥁', 'ঢাক জ্যাম 🥁') + '</b><span>' + X('Play dhaak, kansor and shankh right on your phone.', 'ফোনেই বাজান ঢাক, কাঁসর আর শঙ্খ।') + '</span></div><button class="btn primary" data-act="dj-open">' + X('Play', 'বাজান') + '</button></section>';
  };
})(window.PM = window.PM || {});
