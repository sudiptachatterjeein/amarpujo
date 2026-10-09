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

  /* ================= Dhaak Jam =================
     Uses real recordings if you add them (assets/dhaak.mp3 = one dhaak hit, assets/dhaak-loop.mp3 = a recorded rhythm loop);
     otherwise it synthesises a Bengali-style dhaak: deep boom, fast stick rolls on the cane head, steady kansor, in a pandal-like reverb. */
  var ctx = null, nbuf = null, OUT = null, SAMPLE = null, LOOP = null, loopSrc = null, tried = false, sched = null, nextT = 0, step = 0;
  function AC() {
    if (!ctx) {
      var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C();
      var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 6; comp.connect(ctx.destination);
      OUT = ctx.createGain(); OUT.gain.value = 0.9; OUT.connect(comp);
      var len = Math.floor(ctx.sampleRate * 1.3), ir = ctx.createBuffer(2, len, ctx.sampleRate);          // open-air pandal reverb
      for (var c = 0; c < 2; c++) { var d = ir.getChannelData(c); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
      var cv = ctx.createConvolver(); cv.buffer = ir; var wet = ctx.createGain(); wet.gain.value = 0.28; OUT.connect(cv); cv.connect(wet); wet.connect(comp);
    }
    if (ctx.state === 'suspended') ctx.resume();
    if (!tried) {
      tried = true;
      var get = function (u, cb) { fetch(u).then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); }).then(function (b) { return new Promise(function (ok, no) { ctx.decodeAudioData(b, ok, no); }); }).then(cb).catch(function () {}); };
      get('/assets/dhaak.mp3', function (b) { SAMPLE = b; }); get('/assets/dhaak-loop.mp3', function (b) { LOOP = b; });
    }
    return ctx;
  }
  function noise() {
    if (nbuf) return nbuf; var n = ctx.sampleRate * 0.5, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return (nbuf = b);
  }
  function env(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
  function burst(t, type, freq, q, peak, dec) {
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noise(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    env(g, t, 0.001, peak, dec); s.connect(f); f.connect(g); g.connect(OUT); s.start(t, Math.random() * 0.2); s.stop(t + dec + 0.05);
  }
  function tone(t, f0, f1, peak, dec, type) {
    var o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + Math.min(0.12, dec));
    env(g, t, 0.002, peak, dec); o.connect(g); g.connect(OUT); o.start(t); o.stop(t + dec + 0.1);
  }
  var SND = {
    boom: function (t, v) {                          // big bass head: low body + slap + stick click
      if (SAMPLE) { var s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = SAMPLE; g.gain.value = v; s.connect(g); g.connect(OUT); s.start(t); return; }
      [[1, 1, 0.65], [1.58, 0.5, 0.35], [2.2, 0.3, 0.22]].forEach(function (m) { tone(t, 150 * m[0], 84 * m[0], 0.8 * v * m[1], m[2]); });
      burst(t, 'bandpass', 700, 0.9, 0.55 * v, 0.07); burst(t, 'highpass', 3600, 0.7, 0.35 * v, 0.025);
    },
    tak: function (t, v) {                           // thin cane stick on the tight treble head: ring + sharp crack + buzz
      tone(t, 360, 300, 0.32 * v, 0.1); burst(t, 'bandpass', 3300, 1.4, 0.55 * v, 0.055); burst(t, 'highpass', 6500, 0.7, 0.18 * v, 0.08);
    },
    roll: function (t, v) {                          // fast alternating stick roll (the dhaak "tarara")
      for (var i = 0; i < 4; i++) SND.tak(t + i * 0.021, v * (0.45 + i * 0.16));
    },
    kansor: function (t, v) {                        // bright bell-metal "tang"
      [[1480, 1], [2210, 0.7], [3320, 0.5], [4570, 0.3], [5900, 0.2]].forEach(function (p, k) { tone(t, p[0], p[0] * 0.998, 0.1 * p[1] * v, 0.55 - k * 0.07); });
      burst(t, 'highpass', 5000, 0.7, 0.12 * v, 0.03);
    },
    ghonta: function (t, v) {                        // small hand bell
      [[2300, 1], [3470, 0.6], [5200, 0.35]].forEach(function (p) { tone(t, p[0], p[0], 0.1 * p[1] * v, 0.35); });
    },
    shankh: function (t, v) {                        // conch: swelling reed tone with vibrato
      var o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      o.type = o2.type = 'sawtooth'; o.frequency.setValueAtTime(300, t); o.frequency.linearRampToValueAtTime(318, t + 1.9); o2.frequency.value = 302; o2.detune.value = 9;
      f.type = 'lowpass'; f.frequency.setValueAtTime(500, t); f.frequency.linearRampToValueAtTime(1500, t + 0.9); f.Q.value = 3;
      lfo.frequency.value = 5.5; lg.gain.value = 5; lfo.connect(lg); lg.connect(o.frequency);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.3 * v, t + 0.5); g.gain.setValueAtTime(0.3 * v, t + 1.5); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
      o.connect(f); o2.connect(f); f.connect(g); g.connect(OUT); [o, o2, lfo].forEach(function (n) { n.start(t); n.stop(t + 2.5); });
    }
  };
  PM.acts['dj-hit'] = function (el) {
    if (!AC()) return; var k = el.getAttribute('data-k'); SND[k](ctx.currentTime + 0.005, 1);
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    if (navigator.vibrate) try { navigator.vibrate(k === 'boom' ? 25 : 10); } catch (e) {}
  };
  /* aarti-style dhaak groove, 32 steps: B = boom + kansor, R = stick roll, r = single stick, . = rest */
  var PAT = 'BrrRrrRrBrrRrrRrBrRrRrRrBRrRrRRR', STEP = 0.088;
  function flash(k, t) {
    setTimeout(function () { var q = document.querySelector('#djPad .dj-p[data-k="' + k + '"]'); if (q) { q.classList.add('beat'); setTimeout(function () { q.classList.remove('beat'); }, 70); } }, Math.max(0, (t - ctx.currentTime) * 1000));
  }
  function playStep(i, t) {
    var c = PAT.charAt(i % PAT.length);
    if (c === 'B') { SND.boom(t, 1); SND.kansor(t, 0.7); flash('boom', t); }
    else if (c === 'R') { SND.roll(t, 0.85); flash('roll', t); }
    else if (c === 'r') { SND.tak(t, 0.7); flash('tak', t); }
    if (c !== 'B' && i % 4 === 2) SND.kansor(t, 0.35);
  }
  function stopLoop(btn) {
    clearInterval(sched); sched = null; if (loopSrc) { try { loopSrc.stop(); } catch (e) {} loopSrc = null; }
    if (btn) { btn.classList.remove('on'); btn.textContent = X('▶ Auto rhythm', '▶ অটো তাল'); }
  }
  PM.acts['dj-loop'] = function (el) {
    if (!AC()) return;
    if (sched || loopSrc) { stopLoop(el); return; }
    el.classList.add('on'); el.textContent = X('■ Stop rhythm', '■ তাল থামান');
    if (LOOP) { loopSrc = ctx.createBufferSource(); loopSrc.buffer = LOOP; loopSrc.loop = true; loopSrc.connect(OUT); loopSrc.start(); return; }
    step = 0; nextT = ctx.currentTime + 0.08;
    sched = setInterval(function () {
      if (!document.getElementById('djPad')) { stopLoop(); return; }
      while (nextT < ctx.currentTime + 0.15) { playStep(step, nextT); step++; nextT += STEP; }
    }, 25);
  };
  PM.acts['dj-open'] = function () {
    var pads = [['boom', '🥁', X('Dhaak', 'ঢাক')], ['roll', '🪘', X('Roll', 'রোল')], ['tak', '🥢', X('Kathi', 'কাঠি')], ['kansor', '🔔', X('Kansor', 'কাঁসর')], ['ghonta', '🛎️', X('Ghonta', 'ঘণ্টা')], ['shankh', '🐚', X('Shankh', 'শঙ্খ')]];
    PM.sheet.open('<div class="sh-pad center" id="djPad"><h2>' + X('Dhaak Jam 🥁', 'ঢাক জ্যাম 🥁') + '</h2><p class="muted">' + X('Tap the pads, or start the auto rhythm and play along.', 'প্যাডে ট্যাপ করুন, অথবা অটো তাল চালিয়ে সঙ্গে বাজান।') + '</p>' +
      '<div class="dj-g">' + pads.map(function (p) { return '<button class="dj-p" data-act="dj-hit" data-k="' + p[0] + '"><span>' + p[1] + '</span><b>' + p[2] + '</b></button>'; }).join('') + '</div>' +
      '<button class="btn primary wide" data-act="dj-loop">' + X('▶ Auto rhythm', '▶ অটো তাল') + '</button></div>');
    AC();
  };
  PM.jamCard = function () {
    return '<section class="rl"><div class="rl-t"><b>' + X('Dhaak Jam 🥁', 'ঢাক জ্যাম 🥁') + '</b><span>' + X('Play dhaak, kansor and shankh right on your phone.', 'ফোনেই বাজান ঢাক, কাঁসর আর শঙ্খ।') + '</span></div><button class="btn primary" data-act="dj-open">' + X('Play', 'বাজান') + '</button></section>';
  };
})(window.PM = window.PM || {});
