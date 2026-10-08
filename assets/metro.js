/* Puja Map 2026 - Puja special metro: card at the top of Home + line-by-line timetable sheet.
   Source: Metro Railway Kolkata Puja timings (Panchami to Dashami). Times are 24h [hour, minute]. */
(function (PM) {
  'use strict';
  var L = window.PUJA_I18N;

  /* ---------- strings (merged into the app dictionary) ---------- */
  var EN = {
    mt_title: 'Puja special metro', mt_badge: 'Special',
    mt_hl: 'Metro runs all night', mt_hl_d: 'Blue Line and Green Line run through the night from 17 to 20 Oct, with last trains around 4:00 AM.',
    mt_p1: 'Panchami & Shashthi', mt_p1_dt: '15–16 Oct', mt_p1_h: '6 AM – 11 PM',
    mt_p2: 'Saptami to Navami', mt_p2_dt: '17–20 Oct', mt_p2_h: '1 PM – 4 AM',
    mt_p3: 'Dashami', mt_p3_dt: '21 Oct', mt_p3_h: '1 PM – 10:30 PM',
    mt_cap: 'Hours shown are for the Blue and Green lines. Other lines stop earlier.',
    mt_open: 'All lines & last trains', mt_sheet_d: 'Special Puja timetable, line by line. Pick a day group below.',
    mt_sap2: 'Saptami spans two days this year (17 and 18 Oct), then Ashtami on 19 and Navami on 20 Oct.',
    mt_night: 'Runs all night', mt_no_night: 'No all-night service',
    mt_from: 'From {s}', mt_none: 'No metro service on this line on these days.',
    mt_first: 'First {t}', mt_last: 'Last {t}', mt_fl: 'First {f} · Last {l}', mt_every: 'Every {m} min',
    mt_svc: 'Service hours', mt_trains: '{n} trains in total · every {m} min at peak', mt_fewer: 'Fewer trains than usual',
    mt_first_from: 'First trains at {t} from {list}', mt_first_rng: 'First trains {t} from {list}',
    mt_short: 'The {t} train from {a} runs only up to {b}.',
    mt_note: 'Timings as announced for Puja. Metro Railway can revise them, so check the notice at your station before you leave.',
    mt_blue: 'Blue Line', mt_green: 'Green Line', mt_yellow: 'Yellow Line', mt_purple: 'Purple Line', mt_orange: 'Orange Line'
  };
  var BN = {
    mt_title: 'পুজোর স্পেশাল মেট্রো', mt_badge: 'বিশেষ',
    mt_hl: 'সারারাত চলবে মেট্রো', mt_hl_d: 'নীল ও সবুজ লাইনে ১৭ থেকে ২০ অক্টোবর সারারাত মেট্রো চলবে, শেষ ট্রেন প্রায় ভোর ৪টায়।',
    mt_p1: 'পঞ্চমী ও ষষ্ঠী', mt_p1_dt: '১৫–১৬ অক্টো', mt_p1_h: 'ভোর ৬টা – রাত ১১টা',
    mt_p2: 'সপ্তমী থেকে নবমী', mt_p2_dt: '১৭–২০ অক্টো', mt_p2_h: 'দুপুর ১টা – ভোর ৪টা',
    mt_p3: 'দশমী', mt_p3_dt: '২১ অক্টো', mt_p3_h: 'দুপুর ১টা – রাত ১০:৩০',
    mt_cap: 'সময়গুলো নীল ও সবুজ লাইনের। অন্য লাইনে ট্রেন আগে বন্ধ হবে।',
    mt_open: 'সব লাইন ও শেষ ট্রেন', mt_sheet_d: 'লাইন ধরে পুজোর বিশেষ সময়সূচি। নিচে থেকে দিন বেছে নিন।',
    mt_sap2: 'এ বছর সপ্তমী দু’দিন (১৭ ও ১৮ অক্টো), তারপর ১৯ অক্টো অষ্টমী ও ২০ অক্টো নবমী।',
    mt_night: 'সারারাত চলবে', mt_no_night: 'সারারাত পরিষেবা নেই',
    mt_from: '{s} থেকে', mt_none: 'এই কয়েকদিন এই লাইনে মেট্রো চলবে না।',
    mt_first: 'প্রথম {t}', mt_last: 'শেষ {t}', mt_fl: 'প্রথম {f} · শেষ {l}', mt_every: 'প্রতি {m} মিনিট অন্তর',
    mt_svc: 'পরিষেবার সময়', mt_trains: 'মোট {n}টি ট্রেন · ব্যস্ত সময়ে প্রতি {m} মিনিটে', mt_fewer: 'ট্রেনের সংখ্যা তুলনায় কম',
    mt_first_from: '{list} থেকে প্রথম ট্রেন {t}', mt_first_rng: '{list} থেকে প্রথম ট্রেন {t}',
    mt_short: '{a} থেকে {t}-এর ট্রেন শুধু {b} পর্যন্ত যাবে।',
    mt_note: 'পুজোর জন্য ঘোষিত সময়সূচি। মেট্রো রেল বদলাতে পারে, বেরোনোর আগে স্টেশনের বিজ্ঞপ্তি দেখে নিন।',
    mt_blue: 'নীল লাইন', mt_green: 'সবুজ লাইন', mt_yellow: 'হলুদ লাইন', mt_purple: 'বেগুনি লাইন', mt_orange: 'কমলা লাইন',
    g_metro_4: 'পুজোর বিশেষ মেট্রোর সময়সূচি হোম ট্যাবের উপরে আছে। শেষে mtp.indianrailways.gov.in-এ মিলিয়ে নিন।'
  };
  EN.g_metro_4 = 'Special Puja metro timings are at the top of the Home tab. Confirm on mtp.indianrailways.gov.in before you travel.';
  Object.keys(EN).forEach(function (k) { L.ui.en[k] = EN[k]; });
  Object.keys(BN).forEach(function (k) { L.ui.bn[k] = BN[k]; });
  [['Tollygunge', 'টালিগঞ্জ'], ['Jai Hind Airport', 'জয় হিন্দ বিমানবন্দর'], ['Joka', 'জোকা'], ['Beleghata', 'বেলেঘাটা'], ['Shyambazar', 'শ্যামবাজার']]
    .forEach(function (p) { if (!L.data[p[0]]) L.data[p[0]] = p[1]; });

  var T = function (k, v) { return PM.t(k, v); };
  var S = function (n) { return PM.sn(n); };

  /* ---------- formatting ---------- */
  function tm(h, m, approx) {                       // [h, m] -> "10:48 PM" / "রাত ১০:৪৮"
    var h12 = h % 12 || 12, mm = (m < 10 ? '0' : '') + m, s;
    s = PM.st.lang === 'bn' ? PM.bnPeriod(h) + ' ' + PM.nf(h12) + ':' + PM.nf(mm) : h12 + ':' + mm + ' ' + (h < 12 ? 'AM' : 'PM');
    return (approx ? '~' : '') + s;
  }
  function t(a) { return tm(a[0], a[1], a[2]); }
  function rng(a, b) { return t(a) + ' – ' + t(b); }
  function arrow(a, b) { return S(a) + ' → ' + S(b); }
  function list(a) { return a.map(S).join(', '); }
  function first(f) { return T('mt_first', { t: t(f) }); }
  function last(l) { return T('mt_last', { t: t(l) }); }
  function fl(f, l) { return T('mt_fl', { f: t(f), l: t(l) }); }

  /* ---------- data ---------- */
  var LINES = [
    { id: 'blue', c: '#3B82F6', a: 'Dakshineswar', b: 'Shahid Khudiram' },
    { id: 'green', c: '#22C55E', a: 'Howrah Maidan', b: 'Salt Lake Sector V' },
    { id: 'yellow', c: '#EAB308', a: 'Noapara', b: 'Jai Hind Airport' },
    { id: 'purple', c: '#A855F7', a: 'Joka', b: 'Majerhat' },
    { id: 'orange', c: '#F97316', a: 'Kavi Subhash', b: 'Beleghata' }
  ];
  /* day groups: from/to = Puja-day dates in Oct 2026 */
  var PERIODS = [{ id: 0, from: 15, to: 16 }, { id: 1, from: 17, to: 20 }, { id: 2, from: 21, to: 21 }];

  /* each row: { l: label, v: value }  |  { n: note text }  |  { none: true } ; night: runs past midnight */
  function rows(line, p) {
    var r = [], R = function (l, v) { r.push({ l: l, v: v }); }, N = function (s) { r.push({ n: s }); };
    switch (line + p) {
      case 'blue0':
        R(T('mt_svc'), rng([6, 0], [23, 0]));
        N(T('mt_trains', { n: PM.nf(284), m: PM.nf(6) }));
        R(arrow('Dakshineswar', 'Shahid Khudiram'), last([22, 48]));
        R(arrow('Shahid Khudiram', 'Dakshineswar'), last([22, 50]));
        R(arrow('Dakshineswar', 'Tollygunge'), last([23, 0]));
        R(arrow('Shahid Khudiram', 'Dum Dum'), last([23, 0]));
        break;
      case 'blue1':
        R(T('mt_svc'), rng([13, 0], [4, 0]));
        N(T('mt_first_from', { t: t([13, 0]), list: list(['Dum Dum', 'Dakshineswar', 'Shahid Khudiram', 'Tollygunge', 'Gitanjali', 'Shyambazar', 'Noapara']) }));
        R(arrow('Dakshineswar', 'Shahid Khudiram'), last([3, 46, 1]));
        R(arrow('Shahid Khudiram', 'Dakshineswar'), last([3, 48]));
        N(T('mt_short', { t: t([4, 0]), a: S('Dakshineswar'), b: S('Tollygunge') }));
        N(T('mt_short', { t: t([4, 0]), a: S('Shahid Khudiram'), b: S('Dum Dum') }));
        break;
      case 'blue2':
        N(T('mt_fewer'));
        N(T('mt_first_rng', { t: rng([13, 0], [13, 5]), list: list(['Shahid Khudiram', 'Dakshineswar', 'Dum Dum', 'Noapara', 'Tollygunge']) }));
        R(arrow('Dakshineswar', 'Shahid Khudiram'), last([22, 20]));
        R(arrow('Dakshineswar', 'Tollygunge'), last([22, 30]));
        R(T('mt_from', { s: S('Shahid Khudiram') }), last([22, 20]));
        R(T('mt_from', { s: S('Dum Dum') }), last([22, 30]));
        break;
      case 'green0':
        R(T('mt_svc'), rng([6, 0], [23, 0]));
        break;
      case 'green1':
        R(T('mt_svc'), rng([13, 30], [4, 0]));
        R(arrow('Howrah Maidan', 'Salt Lake Sector V'), fl([13, 30], [3, 52]));
        R(arrow('Salt Lake Sector V', 'Howrah Maidan'), fl([13, 34], [3, 59]));
        break;
      case 'green2':
        R(T('mt_svc'), first([13, 30]));
        R(arrow('Howrah Maidan', 'Salt Lake Sector V'), last([22, 30]));
        R(arrow('Salt Lake Sector V', 'Howrah Maidan'), last([22, 30]));
        break;
      case 'yellow0':
        R(arrow('Noapara', 'Jai Hind Airport'), fl([7, 18], [21, 0]));
        R(arrow('Jai Hind Airport', 'Noapara'), fl([7, 40], [21, 20]));
        break;
      case 'yellow1':
        R(arrow('Noapara', 'Jai Hind Airport'), fl([15, 0], [22, 30]));
        R(arrow('Jai Hind Airport', 'Noapara'), fl([15, 24], [22, 53]));
        break;
      case 'yellow2':
        R(arrow('Noapara', 'Jai Hind Airport'), fl([15, 0], [21, 14]));
        R(arrow('Jai Hind Airport', 'Noapara'), last([21, 38]));
        break;
      case 'purple0':
        R(T('mt_svc'), T('mt_every', { m: PM.nf(21) }));
        R(arrow('Joka', 'Majerhat'), fl([6, 40], [21, 5]));
        R(arrow('Majerhat', 'Joka'), fl([7, 3], [21, 26]));
        break;
      case 'purple1': case 'purple2':
        R(T('mt_svc'), T('mt_every', { m: PM.nf(25) }));
        R(arrow('Joka', 'Majerhat'), fl([15, 0], [22, 30]));
        R(arrow('Majerhat', 'Joka'), fl([15, 25], [22, 55]));
        break;
      case 'orange0':
        R(T('mt_svc'), T('mt_every', { m: PM.nf(25) }));
        R(arrow('Kavi Subhash', 'Beleghata'), fl([7, 40], [20, 20]));
        R(arrow('Beleghata', 'Kavi Subhash'), fl([8, 10], [20, 45]));
        break;
      default:                                       // orange1, orange2
        r.push({ none: true });
    }
    return r;
  }
  function lineNight(line, p) { return p === 1 && (line === 'blue' || line === 'green'); }

  /* ---------- which day group is it now? (night service after midnight counts for the previous day) ---------- */
  function currentPeriod() {
    var d = PM.ist(Date.now() - 4 * 36e5);
    if (d.getUTCFullYear() !== 2026 || d.getUTCMonth() !== 9) return -1;
    var day = d.getUTCDate();
    for (var i = 0; i < PERIODS.length; i++) if (day >= PERIODS[i].from && day <= PERIODS[i].to) return i;
    return -1;
  }
  function nextPeriod() {
    for (var i = 0; i < PERIODS.length; i++) if (PM.dayMs(PERIODS[i].from) > Date.now()) return i;
    return -1;
  }
  PM.metroActive = function () { return Date.now() < PM.dayMs(22) + 4 * 36e5; };

  /* ---------- Home card ---------- */
  PM.metroCard = function () {
    if (!PM.metroActive()) return '';
    var cur = currentPeriod(), nxt = cur < 0 ? nextPeriod() : -1;
    var tiles = PERIODS.map(function (p, i) {
      var flag = i === cur ? '<em class="mt-flag">' + T('today') + '</em>' : i === nxt ? '<em class="mt-flag soft">' + T('next') + '</em>' : '';
      return '<li class="mt-tile' + (i === cur ? ' now' : '') + (i === 1 ? ' night' : '') + '">' + flag + '<span class="mt-pn">' + T('mt_p' + (i + 1)) + '</span><b>' + T('mt_p' + (i + 1) + '_dt') + '</b><span class="mt-ph">' + T('mt_p' + (i + 1) + '_h') + '</span></li>';
    }).join('');
    return '<section class="mtc" aria-label="' + PM.esc(T('mt_title')) + '">' +
      '<div class="mtc-h"><span class="mtc-ic">' + PM.ic('metro') + '</span><div class="mtc-t"><span class="mtc-b">' + T('mt_badge') + '</span><h2>' + T('mt_title') + '</h2></div></div>' +
      '<p class="mtc-hl"><b>' + PM.ic('moon') + T('mt_hl') + '</b><span>' + T('mt_hl_d') + '</span></p>' +
      '<ul class="mt-tiles">' + tiles + '</ul><p class="fine mtc-cap">' + T('mt_cap') + '</p>' +
      '<button class="btn primary" data-act="mt-open">' + T('mt_open') + PM.ic('chev') + '</button></section>';
  };

  /* ---------- detail sheet ---------- */
  var tab = 0;
  function body(p) {
    return LINES.map(function (ln) {
      var rs = rows(ln.id, p), night = lineNight(ln.id, p), none = rs.length === 1 && rs[0].none;
      var tag = night ? '<span class="mt-tag on">' + PM.ic('moon') + T('mt_night') + '</span>' : (p === 1 && !none ? '<span class="mt-tag">' + T('mt_no_night') + '</span>' : '');
      var inner = none ? '<p class="mt-none">' + T('mt_none') + '</p>' : '<ul class="mt-rows">' + rs.map(function (x) {
        return x.n ? '<li class="mt-n">' + PM.esc(x.n) + '</li>' : '<li><span>' + PM.esc(x.l) + '</span><b>' + PM.esc(x.v) + '</b></li>';
      }).join('') + '</ul>';
      return '<article class="mt-line" style="--lc:' + ln.c + '"><header><i></i><div><h3>' + T('mt_' + ln.id) + '</h3><span>' + S(ln.a) + ' ⇄ ' + S(ln.b) + '</span></div>' + tag + '</header>' + inner + '</article>';
    }).join('');
  }
  function sheetHtml() {
    var cur = currentPeriod();
    var tabs = PERIODS.map(function (p, i) {
      return '<button class="' + (i === tab ? 'on' : '') + '" data-act="mt-tab" data-p="' + i + '" aria-pressed="' + (i === tab) + '"><b>' + T('mt_p' + (i + 1)) + '</b><span>' + T('mt_p' + (i + 1) + '_dt') + (i === cur ? ' · ' + T('today') : '') + '</span></button>';
    }).join('');
    return '<div class="sh-pad mts"><h2>' + PM.ic('metro') + T('mt_title') + '</h2><p class="muted">' + T('mt_sheet_d') + '</p>' +
      '<div class="mt-tabs" role="group">' + tabs + '</div>' +
      '<p class="fine mt-sap" ' + (tab === 1 ? '' : 'hidden') + '>' + T('mt_sap2') + '</p>' +
      '<div class="mt-body">' + body(tab) + '</div><p class="fine">' + T('mt_note') + '</p></div>';
  }
  PM.acts['mt-open'] = function () {
    var c = currentPeriod(), n = nextPeriod();
    tab = c >= 0 ? c : n >= 0 ? n : 1;
    PM.sheet.open(sheetHtml(), { tall: true });
  };
  PM.acts['mt-tab'] = function (el) {
    tab = +el.getAttribute('data-p') || 0;
    var b = PM.sheet.body(), top = b.scrollTop;
    PM.sheet.set(sheetHtml()); b.scrollTop = top;
  };
})(window.PM = window.PM || {});
