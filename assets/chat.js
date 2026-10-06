/* Puja Map 2026 - "Puja Adda": members-only community chat.
   Flow: Chat > enter your ID (or "Get your ID" -> pay on the website -> send screenshot -> admin creates the ID) > nickname > chat.
   All traffic goes through validated Supabase functions (chat_login / chat_fetch / chat_send / chat_report / chat_leave). */
(function (PM) {
  'use strict';
  var T = function (k, v) { return PM.t(k, v); };
  var K_CODE = 'puja26_chat_code', K_DEV = 'puja26_chat_dev';
  var ROOMS = [['general', 'room_general'], ['north', 'room_north'], ['south', 'room_south'], ['east', 'room_east'], ['food', 'room_food']];
  var S = PM.chat = { info: null, tier: '', newId: null, existing: false, stage: 'gate', room: 'general', code: '', nick: '', expires: '', last: {}, posts: [], err: '', loading: false, timer: null, sending: false, stick: true };

  function device() {
    var d = PM.store.get(K_DEV, '');
    if (!d) { d = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'd' + Date.now() + Math.random().toString(36).slice(2); PM.store.set(K_DEV, d); }
    return d;
  }
  var $ = function (id) { return document.getElementById(id); };
  var root = function () { return $('v-chat'); };
  var ERR = { invalid_id: 'chat_e_invalid', expired: 'chat_e_expired', blocked: 'chat_e_blocked', device_limit: 'chat_e_device', too_many: 'chat_e_many', rate: 'chat_e_rate',
    free_closed: 'chat_e_free_closed', links: 'chat_e_links', muted: 'chat_e_muted', bad_name: 'chat_e_name', bad_text: 'chat_e_text', need_name: 'chat_e_name', bad_device: 'chat_e_generic', bad_room: 'chat_e_generic', bad_post: 'chat_e_generic' };
  var FATAL = { invalid_id: 1, expired: 1, blocked: 1, device_limit: 1, bad_device: 1 };
  var errText = function (code, tier) { return code === 'expired' && tier === 'free' ? T('chat_e_free_over') : T(ERR[code] || 'chat_e_generic'); };
  var untilText = function (iso) { var t = Date.parse(iso); return PM.fmtDay(t) + ', ' + PM.fmtTime(t); };

  /* free-window info from the server (so a wrong phone clock cannot change it) */
  PM.chatInfo = function () {
    return PM.rpc('chat_info', {}).then(function (r) { if (r && typeof r.free_open === 'boolean') { S.info = r; if (PM.st.tab === 'home') PM.renderHome(); } return S.info; }).catch(function () { return S.info; });
  };

  function call(fn, args) {
    return PM.rpc(fn, Object.assign({ p_code: S.code, p_device: device() }, args)).catch(function (e) {
      return { ok: false, error: 'net', message: String(e && e.message || e) };
    });
  }
  function hue(name) { var h = 0; for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360; return h; }
  function payUrl() { return PM.CFG.CHAT_PAY_URL || PM.CFG.SUPPORT_URL || '#'; }

  /* ---------- screens ---------- */
  function head(extra) {
    return '<header class="vhead chat-head"><button class="icon-btn" data-act="chat-back" aria-label="' + PM.esc(T('back')) + '">' + PM.ic('back') + '</button>' +
      '<div class="ch-title"><h1>' + T('chat_title') + '</h1>' + (S.stage === 'room' ? '<span class="live-tag"><i class="live-dot"></i>' + PM.esc(T('room_' + S.room)) + '</span>' : '') + '</div>' + (extra || '<span class="ch-sp"></span>') + '</header>';
  }
  function gate() {
    var price = PM.CFG.CHAT_PRICE_LABEL ? ' (' + PM.esc(PM.CFG.CHAT_PRICE_LABEL) + ')' : '';
    var free = !!(S.info && S.info.free_open), until = S.info && S.info.free_until ? untilText(S.info.free_until) : '';
    var freeCard = free
      ? '<section class="card cg-free"><span class="badge gold">' + T('chat_free_badge', { d: PM.esc(until) }) + '</span><h3>' + T('chat_free_t') + '</h3><p class="muted">' + T('chat_free_d') + '</p>' +
        '<input id="chatFreeNick" class="cg-input" type="text" maxlength="24" autocomplete="off" placeholder="' + PM.esc(T('chat_free_nick_ph')) + '" value="' + PM.esc(S.nick) + '">' +
        '<p class="cg-err" id="chatFreeErr" role="alert"></p><button class="btn primary wide" data-act="chat-free">' + PM.ic('plus') + T('chat_free_btn') + '</button></section>'
      : (S.info ? '<p class="cg-notice">' + T('chat_free_ended') + '</p>' : '');
    var paid = '<section class="card cg-get"><h3>' + (free ? T('chat_paid_t', { d: PM.esc(until) }) : T('chat_get_id')) + '</h3><ol class="steps"><li>' + T('chat_step1', { price: price }) + '</li><li>' + T('chat_step2') + '</li><li>' + T('chat_step3') + '</li></ol>' +
      '<a class="btn ' + (free ? '' : 'primary ') + 'wide" href="' + PM.esc(payUrl()) + '" target="_blank" rel="noopener">' + PM.ic('heart') + T('chat_get_id') + '</a>' +
      (PM.CFG.CHAT_CONTACT_URL ? '<a class="btn wide" href="' + PM.esc(PM.CFG.CHAT_CONTACT_URL) + '" target="_blank" rel="noopener">' + PM.ic('camera') + T('chat_send_shot') + '</a>' : '') +
      '<p class="fine">' + T('chat_turnaround') + '</p></section>';
    var idBox = '<label class="cg-label" for="chatCode">' + T(free ? 'chat_have_id' : 'chat_id_label') + '</label>' +
      '<input id="chatCode" class="cg-input" type="text" inputmode="text" autocapitalize="characters" autocomplete="off" autocorrect="off" spellcheck="false" maxlength="14" placeholder="' + PM.esc(T('chat_id_ph')) + '" value="' + PM.esc(S.code) + '">' +
      '<p class="cg-err" id="chatErr" role="alert">' + PM.esc(S.err) + '</p><button class="btn ' + (free ? '' : 'primary ') + 'wide" data-act="chat-login">' + (S.loading ? T('loading') : T('chat_start')) + '</button>';
    return head() + '<div class="chat-body"><div class="pad chat-gate">' +
      '<div class="cg-hero"><span class="cc-ic">' + PM.ic('chat') + '</span><h2>' + T('chat_title') + '</h2><p>' + T('chat_hero_d') + '</p></div>' +
      (free ? freeCard + '<div class="cg-or"><span>' + T('chat_or') + '</span></div>' + idBox : idBox + freeCard) +
      (free ? '' : '<div class="cg-or"><span>' + T('chat_no_id') + '</span></div>') + paid +
      '<p class="fine">' + T('chat_privacy') + '</p></div></div>';
  }
  function newIdStage() {
    var n = S.newId || {};
    return head() + '<div class="chat-body"><div class="pad chat-gate"><div class="cg-hero"><span class="cc-ic">' + PM.ic('check') + '</span><h2>' + T('chat_newid_t') + '</h2><p>' + T(S.existing ? 'chat_newid_exist' : 'chat_newid_d') + '</p></div>' +
      '<div class="idshow"><code id="newIdCode">' + PM.esc(n.code || '') + '</code></div>' +
      '<div class="row"><button class="btn" data-act="chat-copy" data-code="' + PM.esc(n.code || '') + '">' + PM.ic('plus') + T('chat_copy') + '</button></div>' +
      '<p class="fine" style="text-align:center">' + T('chat_valid_until', { d: PM.esc(n.expires_at ? untilText(n.expires_at) : '') }) + '</p>' +
      '<button class="btn primary wide" data-act="chat-enter" style="margin-top:14px">' + PM.ic('chat') + T('chat_enter') + '</button></div></div>';
  }
  function nameStage() {
    return head() + '<div class="chat-body"><div class="pad chat-gate"><div class="cg-hero"><h2>' + T('chat_name_t') + '</h2><p>' + T('chat_name_d') + '</p></div>' +
      '<input id="chatNick" class="cg-input" type="text" maxlength="24" autocomplete="off" placeholder="' + PM.esc(T('chat_name_ph')) + '" value="' + PM.esc(S.nick) + '">' +
      '<p class="cg-err" id="chatErr" role="alert">' + PM.esc(S.err) + '</p>' +
      '<button class="btn primary wide" data-act="chat-nick">' + T('chat_continue') + '</button></div></div>';
  }
  function room() {
    var chips = ROOMS.map(function (r) { return '<button class="pill' + (S.room === r[0] ? ' on' : '') + '" data-act="chat-room" data-r="' + r[0] + '">' + PM.esc(T(r[1])) + '</button>'; }).join('');
    return head('<button class="icon-btn" data-act="chat-menu" aria-label="' + PM.esc(T('chat_menu')) + '">' + PM.ic('dots') + '</button>') +
      '<div class="pill-row rooms">' + chips + '</div>' + (S.tier === 'free' && S.expires ? '<p class="free-note">' + PM.ic('info') + T('chat_free_room', { d: PM.esc(untilText(S.expires)) }) + '</p>' : '') +
      '<div class="chat-list" id="chatList" aria-live="polite"></div><button class="chat-new" id="chatNew" data-act="chat-bottom" hidden>' + PM.ic('down') + T('chat_new') + '</button>' +
      '<div class="composer"><input id="chatMsg" type="text" maxlength="300" autocomplete="off" enterkeyhint="send" placeholder="' + PM.esc(T('chat_msg_ph')) + '" aria-label="' + PM.esc(T('chat_msg_ph')) + '">' +
      '<button class="send" id="chatSend" data-act="chat-send" aria-label="' + PM.esc(T('chat_send_btn')) + '">' + PM.ic('send') + '</button></div>';
  }

  PM.renderChat = function () {
    var el = root(); if (!el) return;
    el.innerHTML = S.stage === 'room' ? room() : S.stage === 'name' ? nameStage() : S.stage === 'newid' ? newIdStage() : gate();
    var fn = $('chatFreeNick'); if (fn) fn.addEventListener('keydown', function (e) { if (e.key === 'Enter') PM.acts['chat-free'](); });
    var c = $('chatCode'); if (c) c.addEventListener('keydown', function (e) { if (e.key === 'Enter') PM.acts['chat-login'](); });
    var n = $('chatNick'); if (n) n.addEventListener('keydown', function (e) { if (e.key === 'Enter') PM.acts['chat-nick'](); });
    var m = $('chatMsg'); if (m) m.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); PM.acts['chat-send'](); } });
    var l = $('chatList'); if (l) l.addEventListener('scroll', function () { S.stick = l.scrollHeight - l.scrollTop - l.clientHeight < 80; if (S.stick) $('chatNew').hidden = true; });
    if (S.stage === 'room') drawPosts(true);
  };

  function drawPosts(all) {
    var l = $('chatList'); if (!l) return;
    if (!S.posts.length) { l.innerHTML = '<div class="empty">' + PM.ic('chat') + '<b>' + T('chat_empty') + '</b></div>'; return; }
    var html = '', day = '';
    S.posts.forEach(function (p) {
      var ts = Date.parse(p.at), dk = PM.fmtDay(ts);
      if (dk !== day) { day = dk; html += '<div class="dsep"><span>' + PM.esc(dk) + '</span></div>'; }
      html += '<div class="msg' + (p.mine ? ' mine' : '') + '"' + (p.mine ? '' : ' data-act="chat-msg" data-id="' + p.id + '" role="button" tabindex="0"') + '><div class="mb">' +
        (p.mine ? '' : '<b class="mn" style="color:hsl(' + hue(p.name) + ' 75% 76%)">' + PM.esc(p.name) + '</b>') +
        '<p>' + PM.esc(p.body) + '</p><time>' + PM.fmtTime(ts) + '</time></div></div>';
    });
    l.innerHTML = html;
    if (all || S.stick) l.scrollTop = l.scrollHeight;
  }

  /* ---------- session ---------- */
  function setStage(st, err) { S.stage = st; S.err = err || ''; PM.renderChat(); }
  function logout(keepCode, err) {
    stopPoll(); S.posts = []; S.last = {};
    if (!keepCode) { S.code = ''; PM.store.set(K_CODE, ''); }
    setStage('gate', err);
  }
  function afterLogin(r) {
    if (!r || r.ok === false) {
      var e = r && r.error;
      if (e === 'net') { setStage('gate', T('chat_e_net')); return; }
      var fatal = !!FATAL[e]; if (fatal && e !== 'device_limit') { S.code = ''; PM.store.set(K_CODE, ''); }
      setStage('gate', errText(e, r && r.tier)); return;
    }
    PM.store.set(K_CODE, S.code); S.expires = r.expires_at || S.expires; S.tier = r.tier || S.tier;
    if (r.need_name) { setStage('name'); return; }
    S.nick = r.nickname || S.nick; S.stage = 'room'; S.posts = []; S.last = {}; PM.renderChat(); poll(true); startPoll();
  }
  function login(nick) {
    if (S.loading) return; S.loading = true;
    return PM.rpc('chat_login', { p_code: S.code, p_device: device(), p_nick: nick || null }).catch(function (e) { return { ok: false, error: 'net' }; })
      .then(function (r) { S.loading = false; return r; });
  }
  PM.chatEnter = function () {                  // called when the chat view opens
    var saved = PM.store.get(K_CODE, '');
    if (S.stage === 'room') { PM.renderChat(); poll(true); startPoll(); return; }
    if (saved) { S.code = saved; S.stage = 'gate'; PM.renderChat(); login().then(afterLogin); } else { PM.renderChat(); }
    PM.chatInfo().then(function () { if (S.stage === 'gate' && PM.st.tab === 'chat') { var ci = $('chatCode'), v = ci ? ci.value : ''; PM.renderChat(); var c2 = $('chatCode'); if (c2) c2.value = v; } });
  };
  PM.chatLeave = function () { stopPoll(); };

  /* ---------- polling ---------- */
  function startPoll() { stopPoll(); S.timer = setInterval(function () { if (!document.hidden && PM.st.tab === 'chat') poll(false); }, 5000); }
  function stopPoll() { if (S.timer) { clearInterval(S.timer); S.timer = null; } }
  function poll(first) {
    if (S.stage !== 'room') return;
    var rm = S.room, after = first ? 0 : (S.last[rm] || 0);
    call('chat_fetch', { p_room: rm, p_after: after }).then(function (r) {
      if (rm !== S.room || S.stage !== 'room') return;
      if (!r || r.ok === false) { if (r && r.error === 'net') return; if (r && FATAL[r.error]) logout(r.error === 'device_limit', errText(r.error, r.tier)); return; }
      var posts = r.posts || [];
      if (first || after === 0) S.posts = posts; else if (posts.length) { S.posts = S.posts.concat(posts); }
      if (S.posts.length) S.last[rm] = S.posts[S.posts.length - 1].id;
      if (first || posts.length) {
        drawPosts(first);
        if (!first && !S.stick && posts.length) $('chatNew').hidden = false;
      }
    });
  }

  /* ---------- actions ---------- */
  PM.acts['chat-open'] = function () { PM.go('chat'); };
  PM.acts['chat-back'] = function () { PM.go('home'); };
  PM.acts['chat-login'] = function () {
    var v = ($('chatCode').value || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!/^PJ-[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(v)) { S.code = v; S.err = T('chat_e_invalid'); $('chatErr').textContent = S.err; return; }
    S.code = v; S.err = ''; $('chatErr').textContent = ''; var b = document.querySelector('[data-act=chat-login]'); if (b) { b.disabled = true; b.textContent = T('loading'); }
    login().then(afterLogin);
  };
  PM.acts['chat-free'] = function () {
    var inp = $('chatFreeNick'), v = (inp.value || '').trim(); S.nick = v; var er = $('chatFreeErr');
    if (v.length < 2) { er.textContent = T('chat_e_name'); return; }
    var btn = document.querySelector('[data-act=chat-free]'); if (btn) { btn.disabled = true; btn.textContent = T('loading'); }
    PM.rpc('chat_self_create', { p_device: device(), p_nick: v }).catch(function () { return { ok: false, error: 'net' }; }).then(function (r) {
      if (btn) { btn.disabled = false; btn.textContent = T('chat_free_btn'); }
      if (!r || r.ok === false) {
        var e = r && r.error; if (e === 'free_closed') { S.info = Object.assign({}, S.info || {}, { free_open: false }); PM.renderChat(); }
        var er2 = $('chatFreeErr') || $('chatErr'); if (er2) er2.textContent = e === 'net' ? T('chat_e_net') : errText(e); return;
      }
      S.newId = { code: r.code, expires_at: r.expires_at }; S.existing = !!r.existing; S.code = r.code; S.tier = 'free'; PM.store.set(K_CODE, r.code); setStage('newid');
    });
  };
  PM.acts['chat-copy'] = function (el) {
    var c = el.getAttribute('data-code'), done = function () { PM.toast(T('chat_copied')); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(c).then(done, function () { window.prompt(T('chat_id_label'), c); }); else window.prompt(T('chat_id_label'), c);
  };
  PM.acts['chat-enter'] = function () { login().then(afterLogin); };
  PM.acts['chat-nick'] = function () {
    var v = ($('chatNick').value || '').trim(); S.nick = v;
    if (v.length < 2) { $('chatErr').textContent = T('chat_e_name'); return; }
    login(v).then(afterLogin);
  };
  PM.acts['chat-room'] = function (el) {
    var r = el.getAttribute('data-r'); if (r === S.room) return;
    S.room = r; S.posts = []; S.stick = true; PM.renderChat(); poll(true);
  };
  PM.acts['chat-bottom'] = function () { var l = $('chatList'); if (l) { l.scrollTop = l.scrollHeight; S.stick = true; $('chatNew').hidden = true; } };
  PM.acts['chat-send'] = function () {
    var inp = $('chatMsg'); if (!inp || S.sending) return;
    var t = inp.value.trim(); if (!t) return;
    S.sending = true; $('chatSend').disabled = true;
    call('chat_send', { p_room: S.room, p_body: t }).then(function (r) {
      S.sending = false; var b = $('chatSend'); if (b) b.disabled = false;
      if (r && r.ok) { inp.value = ''; S.stick = true; poll(false); return; }
      var e = r && r.error;
      if (e === 'net') { PM.toast(T('chat_e_net')); return; }
      if (e === 'need_name') { setStage('name'); return; }
      if (FATAL[e]) { logout(e === 'device_limit', errText(e, r && r.tier)); return; }
      PM.toast(errText(e));
    });
  };
  PM.acts['chat-msg'] = function (el) {
    var id = +el.getAttribute('data-id'); if (!id) return;
    var reasons = [['chat_r_rude'], ['chat_r_spam'], ['chat_r_private'], ['chat_r_other']].map(function (r) { return '<button class="btn wide ghost" data-act="chat-report" data-id="' + id + '" data-why="' + r[0] + '">' + T(r[0]) + '</button>'; }).join('');
    PM.sheet.open('<div class="sh-pad"><h2>' + PM.ic('alert') + T('chat_report') + '</h2><p class="muted">' + T('chat_report_d') + '</p><div class="stack">' + reasons + '</div></div>');
  };
  PM.acts['chat-report'] = function (el) {
    var id = +el.getAttribute('data-id'), why = T(el.getAttribute('data-why'));
    PM.sheet.close(); call('chat_report', { p_post: id, p_reason: why }).then(function (r) { PM.toast(r && r.ok ? T('chat_reported') : T('chat_e_generic')); });
  };
  PM.acts['chat-menu'] = function () {
    var until = S.expires ? untilText(S.expires) : '';
    PM.sheet.open('<div class="sh-pad"><h2>' + PM.ic('chat') + T('chat_rules_t') + '</h2><ul class="rules"><li>' + T('chat_rule1') + '</li><li>' + T('chat_rule2') + '</li><li>' + T('chat_rule3') + '</li><li>' + T('chat_rule4') + '</li></ul>' +
      '<div class="idshow sm"><span>' + T('chat_id_label') + '</span><code>' + PM.esc(S.code) + '</code><button class="btn sm" data-act="chat-copy" data-code="' + PM.esc(S.code) + '">' + T('chat_copy') + '</button></div>' +
      (until ? '<p class="fine">' + T('chat_valid_until', { d: PM.esc(until) }) + ' · ' + PM.esc(S.nick) + '</p>' : '') +
      '<button class="btn wide ghost" data-act="chat-leave">' + PM.ic('x') + T('chat_leave') + '</button><p class="fine">' + T('chat_leave_d') + '</p></div>');
  };
  PM.acts['chat-leave'] = function () {
    PM.sheet.close(); call('chat_leave', {}).then(function () { logout(false, ''); });
  };
})(window.PM = window.PM || {});
