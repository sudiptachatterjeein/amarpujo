/* Puja Map 2026 - extras: Pandal Passport (badges + shareable card), Pujo Roulette, Shubho Mahalaya celebration. */
(function (PM) {
  'use strict';
  var X = function (en, bn) { return PM.st.lang === 'bn' ? bn : en; };
  PM.X = X;

  /* ---------- Pandal Passport ---------- */
  var LEVELS = [
    [0, '🌱', 'Pujo Newbie', 'পুজোর নতুন সদস্য'], [1, '🪔', 'Pandal Starter', 'প্যান্ডেল শুরুয়াত'], [5, '🥁', 'Pandal Hopper', 'প্যান্ডেল হপার'],
    [10, '🔥', 'Pujo Pagol', 'পুজো পাগল'], [20, '👑', 'Pandal Champion', 'প্যান্ডেল চ্যাম্পিয়ন'], [30, '🏆', 'Maha Pandal-Wallah', 'মহা প্যান্ডেলওয়ালা']
  ];
  function level(n) { var k = 0; LEVELS.forEach(function (l, i) { if (n >= l[0]) k = i; }); return k; }
  PM.passportInfo = function () {
    var n = PM.st.vs.size, total = PM.P.length, k = level(n), nx = LEVELS[k + 1];
    return { n: n, total: total, lv: LEVELS[k], next: nx, left: nx ? nx[0] - n : 0, pct: Math.min(100, Math.round(n / Math.max(1, total) * 100)) };
  };
  function passportCard() {
    var I = PM.passportInfo();
    var hint = I.next ? X('Visit ' + I.left + ' more to become ' + I.next[2] + ' ' + I.next[1], I.next[3] + ' হতে আরও ' + PM.nf(I.left) + 'টি বাকি ' + I.next[1]) : X('Top badge unlocked. Shubho Bijoya! 🙏', 'সর্বোচ্চ ব্যাজ জিতেছেন। শুভ বিজয়া! 🙏');
    return '<section class="pp"><div class="pp-h"><span class="pp-badge">' + I.lv[1] + '</span><div class="pp-t"><b>' + X('Pandal Passport', 'প্যান্ডেল পাসপোর্ট') + '</b><span>' + X(I.lv[2], I.lv[3]) + '</span></div>' +
      '<span class="pp-n">' + PM.nf(I.n) + '<small>/' + PM.nf(I.total) + '</small></span></div><div class="pp-bar"><i style="width:' + I.pct + '%"></i></div><p class="fine">' + hint + '</p>' +
      '<div class="pp-act"><button class="btn sm" data-act="pp-share">' + PM.ic('share') + X('Share my Puja card', 'আমার পুজো কার্ড শেয়ার') + '</button>' +
      '<button class="btn ghost sm" data-act="goto" data-tab="explore">' + X('Mark visited', 'ঘোরা হয়েছে চিহ্ন দিন') + '</button></div></section>';
  }
  PM.acts['pp-share'] = function () {
    var I = PM.passportInfo(), W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
    var g = c.getContext('2d'), F = '"Anek Bangla","Hind Siliguri","Noto Sans Bengali",system-ui,sans-serif';
    var bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#120E2B'); bg.addColorStop(1, '#31287A'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.globalAlpha = .12; g.strokeStyle = '#fff'; g.lineWidth = 2;
    for (var r = 120; r < 1400; r += 90) { g.beginPath(); g.arc(W / 2, 470, r, 0, Math.PI * 2); g.stroke(); }
    g.globalAlpha = 1; g.textAlign = 'center';
    g.fillStyle = '#F6B93B'; g.font = '700 54px ' + F; g.fillText('Durga Puja 2026', W / 2, 150);
    g.fillStyle = '#F7F0E1'; g.font = '800 92px ' + F; g.fillText(X('My Pandal Passport', 'আমার প্যান্ডেল পাসপোর্ট'), W / 2, 260);
    g.font = '220px ' + F; g.fillText(I.lv[1], W / 2, 520);
    g.fillStyle = '#F6B93B'; g.font = '800 150px ' + F; g.fillText(PM.nf(I.n) + ' / ' + PM.nf(I.total), W / 2, 700);
    g.fillStyle = '#F7F0E1'; g.font = '700 64px ' + F; g.fillText(X(I.lv[2], I.lv[3]), W / 2, 790);
    g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(140, 840, 800, 26); g.fillStyle = '#F05A47'; g.fillRect(140, 840, 800 * I.pct / 100, 26);
    var names = Array.from(PM.st.vs).slice(-5).reverse().map(function (i) { return PM.pn(i); });
    g.fillStyle = '#B7AEDC'; g.font = '500 44px ' + F;
    names.forEach(function (n, k) { g.fillText('✓ ' + (n.length > 34 ? n.slice(0, 33) + '…' : n), W / 2, 950 + k * 64); });
    g.fillStyle = '#F6B93B'; g.font = '600 42px ' + F; g.fillText(PM.site().replace(/^https?:\/\//, ''), W / 2, 1270);
    g.fillStyle = '#B7AEDC'; g.font = '500 32px ' + F; g.fillText('Puja Map 2026 · Sudipta Chatterjee', W / 2, 1318);
    c.toBlob(function (b) {
      if (!b) return;
      var f = new File([b], 'my-puja-card.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [f] })) navigator.share({ files: [f], text: X('My Puja 2026 pandal count. Plan yours: ', 'আমার পুজো ২০২৬ প্যান্ডেল ঘোরা। আপনিও প্ল্যান করুন: ') + PM.site() }).catch(function () {});
      else { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'my-puja-card.png'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800); PM.toast(X('Card saved. Share it on WhatsApp!', 'কার্ড সেভ হয়েছে। হোয়াটসঅ্যাপে শেয়ার করুন!')); }
    }, 'image/png');
  };

  /* ---------- Pujo Roulette ---------- */
  var spinning = false;
  function rouletteCard() {
    return '<section class="rl"><div class="rl-t"><b>' + X('Pujo Roulette 🎲', 'পুজো রুলেট 🎲') + '</b><span>' + X("Can't decide? Let fate pick your next pandal.", 'কোথায় যাবেন ঠিক করতে পারছেন না? ভাগ্যই বেছে দিক।') + '</span></div>' +
      '<button class="btn primary" data-act="roulette"><span id="rlTxt">' + X('Spin', 'ঘোরান') + '</span></button></section>';
  }
  PM.acts.roulette = function () {
    if (spinning) return;
    var all = PM.P.map(function (p, i) { return i; }), un = all.filter(function (i) { return !PM.st.vs.has(i); });
    var inR = un.filter(function (i) { return PM.reg && PM.reg(i) === PM.st.rg; });
    var pool = inR.length ? inR : (un.length ? un : all), el = document.getElementById('rlTxt'), n = 0, last = pool[0];
    if (!el) return; spinning = true;
    var t = setInterval(function () {
      last = pool[Math.floor(Math.random() * pool.length)]; el.textContent = PM.pn(last); n++;
      if (n > 22) { clearInterval(t); el.textContent = '🎉 ' + PM.pn(last); setTimeout(function () { spinning = false; el.textContent = X('Spin again', 'আবার ঘোরান'); PM.openPandal(last); }, 650); }
    }, 75);
  };
  PM.extrasCards = function () { return passportCard() + rouletteCard(); };

  /* ---------- Shubho Mahalaya celebration ---------- */
  PM.celebrate = function () {
    var K = 'puja26_mh_celeb';
    if (PM.store.get(K, '') === PM.CFG.MAHALAYA_START || document.getElementById('mhCel')) return;
    PM.store.set(K, PM.CFG.MAHALAYA_START);
    var d = document.createElement('div'); d.id = 'mhCel'; d.setAttribute('role', 'dialog');
    var petals = '', E = ['🪷', '🪔', '🌺', '✨', '🌼'];
    for (var i = 0; i < 26; i++) petals += '<i style="left:' + Math.round(Math.random() * 100) + '%;animation-delay:' + (Math.random() * 4).toFixed(2) + 's;animation-duration:' + (5 + Math.random() * 5).toFixed(1) + 's;font-size:' + (18 + Math.round(Math.random() * 20)) + 'px">' + E[i % E.length] + '</i>';
    d.innerHTML = petals + '<div class="cel-box"><div class="cel-bn">শুভ মহালয়া</div><div class="cel-en">Shubho Mahalaya 2026</div><p>' + X('Maa is coming. The sacred chant has begun.', 'মা আসছেন। মহিষাসুরমর্দিনী শুরু হয়েছে।') + '</p><small>' + X('Tap to close', 'বন্ধ করতে ট্যাপ করুন') + '</small></div>';
    d.onclick = function () { d.remove(); }; document.body.appendChild(d); setTimeout(function () { if (d.parentNode) d.remove(); }, 12000);
  };
})(window.PM = window.PM || {});
