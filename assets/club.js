/* Puja Map 2026 - Pujo Club: daily streak + XP + levels, Puja Day guide, Daily quiz, Pujo Bingo. All data stays on the device. */
(function (PM) {
  'use strict';
  var X = function (a, b) { return PM.X ? PM.X(a, b) : a; }, KEY = 'puja26_club', esc = function (s) { return PM.esc ? PM.esc(s) : String(s); };
  var DAY = 864e5;
  function today() { return new Date(Date.now() + 19800000).toISOString().slice(0, 10); }   // IST date
  function dnum(k) { return Math.round(Date.parse(k) / DAY); }

  /* ---------- state ---------- */
  var LV = [[0, '🌱', 'Pujo Rookie', 'পুজো নবিশ'], [50, '🪔', 'Dhunuchi Dancer', 'ধুনুচি নৃত্যশিল্পী'], [120, '🧭', 'Pandal Scout', 'প্যান্ডেল স্কাউট'], [220, '🍲', 'Bhog Hunter', 'ভোগ শিকারি'],
    [350, '🔥', 'Pujo Pagol', 'পুজো পাগল'], [520, '🥁', 'Pandal Pro', 'প্যান্ডেল প্রো'], [750, '👑', "Maa's Favourite", 'মায়ের আদরের'], [1000, '🏆', 'Pujo Legend', 'পুজো কিংবদন্তি']];
  function load() { var s = PM.store.json(KEY, null); if (!s || typeof s !== 'object') s = {}; s.xp = +s.xp || 0; s.streak = +s.streak || 0; s.best = +s.best || 0; s.last = s.last || ''; s.aw = s.aw || {}; s.bg = s.bg || [0, 0, 0, 0, 0, 0, 0, 0, 0]; s.quiz = s.quiz || {}; return s; }
  function save(s) { PM.store.set(KEY, JSON.stringify(s)); }
  function lvl(xp) { var k = 0; LV.forEach(function (l, i) { if (xp >= l[0]) k = i; }); return k; }
  function refresh() { if (PM.st && PM.st.tab === 'home' && PM.renderHome && !(PM.sheet && PM.sheet.isOpen && PM.sheet.isOpen())) PM.renderHome(); }

  var club = PM.club = {
    add: function (n, key) {
      var s = load(); if (key) { if (s.aw[key]) return false; s.aw[key] = 1; }
      var a = lvl(s.xp); s.xp += n; save(s); var b = lvl(s.xp);
      if (PM.toast) PM.toast(b > a ? X('🎉 Level up! ' + LV[b][2], '🎉 লেভেল আপ! ' + LV[b][3]) : '+' + n + ' XP');
      refresh(); return true;
    },
    touch: function () {                       // daily check-in: keeps the streak alive
      var s = load(), t = today(); if (s.last === t) return;
      s.streak = (s.last && dnum(t) - dnum(s.last) === 1) ? s.streak + 1 : 1; s.best = Math.max(s.best, s.streak); s.last = t;
      var bonus = 10 + 5 * Math.min(s.streak, 5); s.xp += bonus; save(s);
      if (PM.toast) PM.toast(X('🔥 Day ' + s.streak + ' streak! +' + bonus + ' XP', '🔥 টানা ' + s.streak + ' দিন! +' + bonus + ' XP'));
      refresh();
    }
  };

  /* ---------- Puja Day guide (dates: Drik Panchang for Kolkata) ---------- */
  var DAYS = [
    ['2026-10-17', 'Maha Shashthi', 'মহাষষ্ঠী', 'Bodhon: Maa is welcomed and the awakening ritual begins. Pandals open their doors.', 'বোধন: মায়ের আবাহন, উদ্বোধনের আচার শুরু। প্যান্ডেলের দরজা খুলছে।', 'Queues are shorter on Shashthi and Saptami than on Ashtami. Start your pandal trail today.', 'ষষ্ঠী-সপ্তমীতে অষ্টমীর চেয়ে লাইন ছোট। আজই প্যান্ডেল ঘোরা শুরু করুন।'],
    ['2026-10-18', 'Maha Saptami', 'মহাসপ্তমী', 'Nabapatrika Snan: the Kola Bou is bathed and the main puja begins.', 'নবপত্রিকা স্নান: কলা বউ স্নান, মূল পুজো শুরু।', 'Great day for the big North Kolkata pandals before the Ashtami rush.', 'অষ্টমীর ভিড়ের আগে উত্তর কলকাতার বড় প্যান্ডেল দেখার সেরা দিন।'],
    ['2026-10-19', 'Maha Ashtami', 'মহাঅষ্টমী', 'Pushpanjali, Kumari Puja and Sandhi Puja, the most important day for many devotees.', 'পুষ্পাঞ্জলি, কুমারী পুজো ও সন্ধি পুজো, অনেকের কাছে সবচেয়ে গুরুত্বপূর্ণ দিন।', 'Heaviest crowds. Go very early, late at night, or pick smaller para pujas.', 'সবচেয়ে ভিড়। খুব ভোরে, গভীর রাতে, বা ছোট পাড়ার পুজোয় যান।'],
    ['2026-10-20', 'Maha Navami', 'মহানবমী', 'The last full day of the puja. Evenings glow with dhunuchi aarti.', 'পুজোর শেষ পূর্ণ দিন। সন্ধ্যায় ধুনুচি আরতির আলো।', 'Plan a South Kolkata route and finish with a bhog or a street-food stop.', 'দক্ষিণ কলকাতার রুট ধরুন, শেষে ভোগ বা স্ট্রিট ফুড।'],
    ['2026-10-21', 'Bijoya Dashami', 'বিজয়া দশমী', 'Sindoor Khela and the farewell to Maa, with immersion processions towards the Hooghly.', 'সিঁদুর খেলা আর মায়ের বিদায়, হুগলির দিকে বিসর্জনের শোভাযাত্রা।', 'Share Bijoya greetings and visit family. Roads near the river get blocked in the evening.', 'বিজয়ার শুভেচ্ছা জানান, আত্মীয়দের বাড়ি যান। সন্ধ্যায় নদীর কাছের রাস্তা আটকে যায়।']
  ];
  var MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function guideCard() {
    var t = today(), idx = -1; DAYS.forEach(function (d, i) { if (d[0] === t) idx = i; });
    var head, body, tip, ic = '📅';
    if (idx >= 0) { var d = DAYS[idx]; head = X(d[1], d[2]) + ' · ' + X('Today', 'আজ'); body = X(d[3], d[4]); tip = X(d[5], d[6]); ic = ['🔔', '🌿', '🌸', '🎊', '🙏'][idx]; }
    else if (t < DAYS[0][0]) { var n = dnum(DAYS[0][0]) - dnum(t); head = X('Maha Shashthi in ' + n + (n === 1 ? ' day' : ' days'), 'মহাষষ্ঠীর আর ' + PM.nf(n) + ' দিন'); body = X('The countdown has started. Save your must-see pandals and pick a route now.', 'কাউন্টডাউন শুরু। দেখতে চাওয়া প্যান্ডেলগুলো সেভ করে রুট বেছে নিন।'); tip = X('Come back every day for a new quiz and to keep your streak.', 'রোজ ফিরে আসুন নতুন কুইজ আর স্ট্রিকের জন্য।'); }
    else { head = X('Shubho Bijoya! 🙏', 'শুভ বিজয়া! 🙏'); body = X('The puja is over until next year. Thank you for walking the pandals with us.', 'এ বছরের মতো পুজো শেষ। আমাদের সঙ্গে প্যান্ডেল ঘোরার জন্য ধন্যবাদ।'); tip = X('Share your Puja card with friends.', 'বন্ধুদের সঙ্গে আপনার পুজো কার্ড শেয়ার করুন।'); }
    var strip = DAYS.map(function (d, i) { var dd = +d[0].slice(8); return '<span class="gd-c' + (i === idx ? ' on' : (t > d[0] ? ' past' : '')) + '"><b>' + dd + '</b><small>' + MONTH[+d[0].slice(5, 7) - 1] + '</small></span>'; }).join('');
    return '<section class="gd"><div class="gd-h"><span class="gd-i">' + ic + '</span><div><b>' + head + '</b></div></div><p>' + body + '</p><p class="gd-tip">💡 ' + tip + '</p><div class="gd-s">' + strip + '</div><p class="fine">' + X('Dates for Kolkata, per Drik Panchang. Check your local committee for exact timings.', 'কলকাতার তারিখ, দৃক পঞ্চাঙ্গ অনুযায়ী। সঠিক সময় স্থানীয় কমিটিতে মিলিয়ে নিন।') + '</p></section>';
  }

  /* ---------- Club card ---------- */
  function quizDone() { var s = load(); return !!s.quiz[today()]; }
  function clubCard() {
    var s = load(), k = lvl(s.xp), cur = LV[k], nx = LV[k + 1], pct = nx ? Math.round((s.xp - cur[0]) / (nx[0] - cur[0]) * 100) : 100;
    var dots = '', w = Math.min(7, s.streak || 0); for (var i = 1; i <= 7; i++) dots += '<i class="' + (i <= w ? 'on' : '') + '"></i>';
    var hint = nx ? X((nx[0] - s.xp) + ' XP to ' + nx[2], nx[3] + '-এ পৌঁছতে ' + PM.nf(nx[0] - s.xp) + ' XP বাকি') : X('Top level reached!', 'সর্বোচ্চ লেভেলে পৌঁছেছেন!');
    return '<section class="cb"><div class="cb-h"><span class="pp-badge">' + cur[1] + '</span><div class="pp-t"><b>' + X('Pujo Club · Level ' + (k + 1), 'পুজো ক্লাব · লেভেল ' + PM.nf(k + 1)) + '</b><span>' + X(cur[2], cur[3]) + '</span></div><span class="cb-f">🔥 ' + PM.nf(s.streak || 0) + '</span></div>' +
      '<div class="pp-bar"><i style="width:' + pct + '%"></i></div><p class="fine">' + PM.nf(s.xp) + ' XP · ' + hint + '</p><div class="cb-d">' + dots + '<small>' + X('7-day streak', '৭ দিনের স্ট্রিক') + '</small></div>' +
      '<div class="pp-act"><button class="btn sm" data-act="qz-open">' + X(quizDone() ? 'Quiz done ✓' : 'Daily quiz +45 XP', quizDone() ? 'কুইজ শেষ ✓' : 'আজকের কুইজ +৪৫ XP') + '</button><button class="btn ghost sm" data-act="bg-open">' + X('Pujo Bingo', 'পুজো বিঙ্গো') + '</button></div>' +
      '<p class="fine">' + X('Earn XP: daily visit, pandals visited (+20), quiz, bingo, Roulette, Dhaak Jam.', 'XP পাবেন: রোজ আসা, প্যান্ডেল ঘোরা (+২০), কুইজ, বিঙ্গো, রুলেট, ঢাক জ্যাম।') + '</p></section>';
  }
  PM.clubCards = function () { return guideCard() + clubCard(); };

  /* ---------- Daily quiz ---------- */
  var QB = [
    ['In which year did UNESCO list Durga Puja in Kolkata as Intangible Cultural Heritage?', '২০২১ সালে ইউনেস্কো কলকাতার দুর্গাপুজোকে অঙ্গীকৃত সংস্কৃতির তালিকাভুক্ত করে। কোন সাল?', ['2008', '2014', '2021', '2023'], ['২০০৮', '২০১৪', '২০২১', '২০২৩'], 2, 'It was inscribed in December 2021.', 'ডিসেম্বর ২০২১-এ এই স্বীকৃতি আসে।'],
    ['Who recited the Chandi Path in the iconic Mahalaya radio programme?', 'মহালয়ার বিখ্যাত বেতার অনুষ্ঠানে চণ্ডীপাঠ করেছিলেন কে?', ['Hemanta Mukherjee', 'Birendra Krishna Bhadra', 'Kishore Kumar', 'Salil Chowdhury'], ['হেমন্ত মুখোপাধ্যায়', 'বীরেন্দ্রকৃষ্ণ ভদ্র', 'কিশোর কুমার', 'সলিল চৌধুরী'], 1, 'Birendra Krishna Bhadra, with music by Pankaj Kumar Mullick.', 'বীরেন্দ্রকৃষ্ণ ভদ্র, সুর পঙ্কজ কুমার মল্লিকের।'],
    ['Which North Kolkata neighbourhood is famous for making the idols?', 'উত্তর কলকাতার কোন পাড়া প্রতিমা গড়ার জন্য বিখ্যাত?', ['Kumartuli', 'Salt Lake', 'Behala', 'Dum Dum'], ['কুমারটুলি', 'সল্টলেক', 'বেহালা', 'দমদম'], 0, 'Kumartuli, home to generations of potters.', 'কুমারটুলি, কয়েক প্রজন্মের মৃৎশিল্পীদের পাড়া।'],
    ['What is the ritual dance done with a clay incense burner called?', 'মাটির পাত্রে ধুনো জ্বালিয়ে যে নাচ হয় তার নাম কী?', ['Dhunuchi Naach', 'Garba', 'Bihu', 'Chhau'], ['ধুনুচি নাচ', 'গরবা', 'বিহু', 'ছৌ'], 0, 'Dhunuchi Naach, usually during aarti, to the beat of the dhak.', 'ধুনুচি নাচ, সাধারণত আরতির সময় ঢাকের তালে।'],
    ['What happens during Sindoor Khela?', 'সিঁদুর খেলায় কী হয়?', ['Idols are painted', 'Women smear vermilion on each other', 'Lamps float on the river', 'Kids get new clothes'], ['প্রতিমা রং করা হয়', 'মহিলারা একে অপরকে সিঁদুর মাখান', 'নদীতে প্রদীপ ভাসে', 'বাচ্চারা নতুন জামা পায়'], 1, 'It is held on Bijoya Dashami as Maa is bid farewell.', 'বিজয়া দশমীতে মাকে বিদায় জানানোর সময় হয়।'],
    ['Which instrument is the signature drum of Bengal\'s Durga Puja?', 'বাংলার দুর্গাপুজোর প্রতীকী ঢোল কোনটি?', ['Tabla', 'Mridanga', 'Dhak', 'Khanjira'], ['তবলা', 'মৃদঙ্গ', 'ঢাক', 'খঞ্জনি'], 2, 'The dhak, a large barrel drum played with two thin sticks.', 'ঢাক, দুটি সরু কাঠি দিয়ে বাজানো বড় পিপে আকারের ঢোল।'],
    ['Sandhi Puja is held at the junction of which two days?', 'সন্ধি পুজো কোন দুই তিথির সন্ধিক্ষণে হয়?', ['Shashthi and Saptami', 'Saptami and Ashtami', 'Ashtami and Navami', 'Navami and Dashami'], ['ষষ্ঠী ও সপ্তমী', 'সপ্তমী ও অষ্টমী', 'অষ্টমী ও নবমী', 'নবমী ও দশমী'], 2, 'It marks the turn from Ashtami to Navami.', 'অষ্টমী থেকে নবমীতে যাওয়ার সন্ধিক্ষণে।'],
    ['The Kola Bou (Nabapatrika) is ritually bathed on which day?', 'কলা বউকে (নবপত্রিকা) কোন দিন স্নান করানো হয়?', ['Shashthi', 'Saptami', 'Navami', 'Dashami'], ['ষষ্ঠী', 'সপ্তমী', 'নবমী', 'দশমী'], 1, 'On Maha Saptami morning, Nabapatrika Snan.', 'মহাসপ্তমীর ভোরে নবপত্রিকা স্নান।'],
    ['What traditionally happens to the idol on Dashami?', 'দশমীতে প্রতিমার সঙ্গে ঐতিহ্যগতভাবে কী করা হয়?', ['It is sold', 'It is immersed in a river', 'It is buried', 'It is kept for a year'], ['বিক্রি হয়', 'নদীতে বিসর্জন হয়', 'মাটিতে পোঁতা হয়', 'এক বছর রাখা হয়'], 1, 'Visarjan, the immersion, with processions towards the Hooghly in Kolkata.', 'বিসর্জন, কলকাতায় হুগলির দিকে শোভাযাত্রা সহ।'],
    ['Pushpanjali, offering flowers to Maa, is a highlight of which day?', 'মাকে ফুল নিবেদন, পুষ্পাঞ্জলি, কোন দিনের প্রধান আকর্ষণ?', ['Shashthi', 'Saptami', 'Ashtami', 'Dashami'], ['ষষ্ঠী', 'সপ্তমী', 'অষ্টমী', 'দশমী'], 2, 'Maha Ashtami morning is the big Pushpanjali.', 'মহাঅষ্টমীর সকালে সবচেয়ে বড় পুষ্পাঞ্জলি।'],
    ['On which date did Mahalaya fall in 2026?', '২০২৬ সালে মহালয়া কবে ছিল?', ['10 October', '17 October', '26 September', '21 October'], ['১০ অক্টোবর', '১৭ অক্টোবর', '২৬ সেপ্টেম্বর', '২১ অক্টোবর'], 0, 'Saturday, 10 October 2026, a week before Maha Shashthi.', 'শনিবার, ১০ অক্টোবর ২০২৬, মহাষষ্ঠীর এক সপ্তাহ আগে।']
  ];
  var Q = null;
  function pick() { var b = dnum(today()) * 3, r = []; for (var k = 0; k < 3; k++) r.push(QB[(b + k) % QB.length]); return r; }
  function qHtml(ans) {
    var q = Q.qs[Q.i], opts = X(q[2], q[3]);
    var o = opts.map(function (t, j) {
      var cl = ans == null ? '' : (j === q[4] ? ' ok' : (j === ans ? ' bad' : ''));
      return '<button class="qz-o' + cl + '" data-act="qz-ans" data-i="' + j + '"' + (ans != null ? ' disabled' : '') + '>' + esc(t) + '</button>';
    }).join('');
    var ex = ans == null ? '' : '<p class="qz-ex">' + (ans === q[4] ? '✅ ' : '❌ ') + esc(X(q[5], q[6])) + '</p><button class="btn primary wide" data-act="qz-next">' + (Q.i < 2 ? X('Next', 'পরের প্রশ্ন') : X('See result', 'ফলাফল দেখুন')) + '</button>';
    return '<div class="sh-pad"><h2>' + X('Daily Quiz', 'আজকের কুইজ') + ' · ' + (Q.i + 1) + '/3</h2><p class="qz-q">' + esc(X(q[0], q[1])) + '</p><div class="qz-l">' + o + '</div>' + ex + '</div>';
  }
  function resHtml(done) {
    var s = load(), r = s.quiz[today()] || { s: Q ? Q.score : 0 };
    return '<div class="sh-pad center"><h2>' + X('Quiz complete 🎉', 'কুইজ শেষ 🎉') + '</h2><div class="qz-sc">' + PM.nf(r.s) + '/3</div><p>' + (r.s === 3 ? X('Perfect score! Bonus XP added.', 'পুরো নম্বর! বোনাস XP যোগ হয়েছে।') : X('Nice try. Come back tomorrow for 3 new questions.', 'ভালো চেষ্টা। কাল তিনটি নতুন প্রশ্নে ফিরে আসুন।')) + '</p>' +
      (done ? '<p class="fine">' + X('You already played today.', 'আজ আপনি খেলে ফেলেছেন।') + '</p>' : '') + '<button class="btn primary wide" data-act="sheet-close">' + X('Done', 'ঠিক আছে') + '</button></div>';
  }
  PM.acts['qz-open'] = function () {
    if (quizDone()) { PM.sheet.open(resHtml(true)); return; }
    Q = { qs: pick(), i: 0, score: 0 }; PM.sheet.open(qHtml(null));
  };
  PM.acts['qz-ans'] = function (el) {
    if (!Q || Q.ans != null) return; var j = +el.getAttribute('data-i'); Q.ans = j;
    if (j === Q.qs[Q.i][4]) { Q.score++; club.add(10, 'quiz:' + today() + ':' + Q.i); }
    PM.sheet.set(qHtml(j));
  };
  PM.acts['qz-next'] = function () {
    if (!Q) return; Q.ans = null;
    if (Q.i < 2) { Q.i++; PM.sheet.set(qHtml(null)); return; }
    var s = load(); s.quiz[today()] = { s: Q.score }; save(s);
    if (Q.score === 3) club.add(15, 'quizperfect:' + today());
    PM.sheet.set(resHtml(false)); refresh();
  };

  /* ---------- Pujo Bingo ---------- */
  var BG = [['🥟', 'Eat puchka', 'পুচকা খেলাম'], ['🤳', 'Selfie with an idol', 'প্রতিমার সঙ্গে সেলফি'], ['🚇', 'Ride the Metro', 'মেট্রোয় চড়লাম'], ['🍲', 'Try bhog khichuri', 'ভোগের খিচুড়ি'], ['🪔', 'See a dhunuchi aarti', 'ধুনুচি আরতি দেখলাম'],
    ['🏘️', 'Visit a North Kolkata pandal', 'উত্তর কলকাতার প্যান্ডেল'], ['🌆', 'Visit a South Kolkata pandal', 'দক্ষিণ কলকাতার প্যান্ডেল'], ['🥁', 'Hear the dhaak live', 'সামনে ঢাক শুনলাম'], ['☕', 'Cha in a bhaar', 'ভাঁড়ে চা']];
  var LN = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  function lines(bg) { return LN.map(function (l, i) { return l.every(function (c) { return bg[c]; }) ? i : -1; }).filter(function (i) { return i >= 0; }); }
  function bgHtml() {
    var s = load(), L = lines(s.bg), n = s.bg.reduce(function (a, b) { return a + (b ? 1 : 0); }, 0);
    var cells = BG.map(function (c, i) { return '<button class="bg-c' + (s.bg[i] ? ' on' : '') + '" data-act="bg-tog" data-i="' + i + '"><span>' + c[0] + '</span><b>' + esc(X(c[1], c[2])) + '</b></button>'; }).join('');
    return '<div class="sh-pad center"><h2>' + X('Pujo Bingo 🎯', 'পুজো বিঙ্গো 🎯') + '</h2><p class="muted">' + X('Tick what you have done. Each line is +25 XP, a full card is +100 XP.', 'যা করেছেন ট্যাপ করে টিক দিন। প্রতি লাইন +২৫ XP, পুরো কার্ড +১০০ XP।') + '</p><div class="bg-g">' + cells + '</div><p class="fine">' + X(n + '/9 done · ' + L.length + ' lines', PM.nf(n) + '/৯ হয়েছে · ' + PM.nf(L.length) + 'টি লাইন') + '</p></div>';
  }
  PM.acts['bg-open'] = function () { PM.sheet.open(bgHtml()); };
  PM.acts['bg-tog'] = function (el) {
    var i = +el.getAttribute('data-i'), s = load(); s.bg[i] = s.bg[i] ? 0 : 1; save(s);
    lines(s.bg).forEach(function (l) { club.add(25, 'bingo:line:' + l); });
    if (s.bg.every(function (v) { return v; })) club.add(100, 'bingo:full');
    PM.sheet.set(bgHtml());
  };

  /* ---------- hooks: XP for things people already do ---------- */
  if (PM.toggleVisited) { var tv = PM.toggleVisited; PM.toggleVisited = function (i) { var had = PM.st.vs.has(i); tv(i); if (!had && PM.st.vs.has(i)) club.add(20, 'visit:' + i); }; }
  ['roulette', 'dj-open', 'imm-open'].forEach(function (a) { var f = PM.acts[a]; if (f) PM.acts[a] = function (el, e) { club.add(5, a + ':' + today()); return f(el, e); }; });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') club.touch(); });
  setTimeout(function () { club.touch(); }, 1500);
})(window.PM = window.PM || {});
