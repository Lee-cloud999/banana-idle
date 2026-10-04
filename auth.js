/* 로그인 화면과 클라우드 저장 동기화
 * 게스트로도 플레이할 수 있고, 로그인하면 기록이 Firebase(Firestore)에 저장돼요. */
(function () {
  'use strict';
  var G = window.BananaGame;
  var cfg = window.BANANA_CONFIG || {};
  var configured = !!(cfg.FIREBASE_API_KEY && cfg.FIREBASE_PROJECT_ID && window.BananaCloud);
  var cloud = configured ? window.BananaCloud.create({ apiKey: cfg.FIREBASE_API_KEY, projectId: cfg.FIREBASE_PROJECT_ID }) : null;
  var $ = function (id) { return document.getElementById(id); };
  var btn = $('acctBtn'), dot = $('acctDot'), label = $('acctLabel');
  if (!G || !btn) return;

  var PUSH_GAP = 20000;          // 클라우드 저장은 20초에 한 번만
  var PULL_GAP = 5 * 60 * 1000;  // 앱으로 돌아왔을 때 5분이 지났으면 다시 확인
  var sync = { state: 'guest', at: 0 };
  var locked = false;            // 기록 선택 중에는 클라우드에 쓰지 않아요
  var pulling = false, lastPull = 0, lastPush = 0, lastPushedKey = '', pushTimer = 0;
  var pendingConflict = null, manualOut = false;
  var modal = null, view = '', busy = false;

  /* ---------- 도우미 ---------- */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function isNet(e) { return !e || !e.status || e instanceof TypeError || /failed to fetch|networkerror|load failed/i.test(e.message || ''); }
  function errText(e) {
    var c = (e && e.code) || '', m = (e && e.message) || '';
    if (c === 'INVALID_LOGIN_CREDENTIALS' || c === 'INVALID_PASSWORD' || c === 'EMAIL_NOT_FOUND') return '이메일 또는 비밀번호가 맞지 않아요.';
    if (c === 'EMAIL_EXISTS') return '이미 가입된 이메일이에요. 로그인해 주세요.';
    if (c === 'WEAK_PASSWORD') return '비밀번호가 너무 약해요. 8자 이상으로 더 복잡하게 만들어 주세요.';
    if (c === 'INVALID_EMAIL' || c === 'MISSING_EMAIL') return '이메일 주소를 확인해 주세요.';
    if (c === 'TOO_MANY_ATTEMPTS_TRY_LATER') return '시도가 너무 많았어요. 잠시 뒤에 다시 해 주세요.';
    if (c === 'USER_DISABLED') return '사용할 수 없는 계정이에요.';
    if (c === 'OPERATION_NOT_ALLOWED') return '이메일 로그인이 아직 꺼져 있어요. (만든 사람용: Firebase 콘솔에서 이메일/비밀번호 로그인을 켜 주세요.)';
    if (c === 'PERMISSION_DENIED') return '저장 권한이 없어요. (만든 사람용: Firestore 보안 규칙을 확인해 주세요.)';
    if (c === 'INVALID_ARGUMENT' && /api key/i.test(m)) return 'Firebase 키가 맞지 않아요. (만든 사람용: config.js를 확인해 주세요.)';
    if (isNet(e)) return '인터넷 연결을 확인해 주세요.';
    return '문제가 생겼어요. 잠시 뒤에 다시 해 주세요. (' + (m || '오류') + ')';
  }
  function shortName(u) {
    var n = (u && u.email ? u.email.split('@')[0] : '') || '내 계정';
    return n.length > 8 ? n.slice(0, 8) + '…' : n;
  }
  function when(ts) {
    try { return new Date(ts).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; }
  }
  var reported = {};
  function reportOnce(e) {   // 설정이 잘못됐을 때 한 번만 알려 줘요 (만든 사람용)
    var c = e && e.code;
    if ((c === 'PERMISSION_DENIED' || c === 'OPERATION_NOT_ALLOWED' || c === 'INVALID_ARGUMENT') && !reported[c]) { reported[c] = 1; G.toast(errText(e)); }
  }
  function stateKey(st) { return Math.floor(st.total) + '|' + Object.keys(st.levels).map(function (k) { return st.levels[k]; }).join(','); }

  /* 이 기기가 마지막으로 클라우드와 맞춘 기록(계정별) */
  function syncedKey() { var u = cloud && cloud.user(); return u ? 'banana-ssuk-synced-' + u.id : null; }
  function getSynced() {
    try { var k = syncedKey(), v = k && JSON.parse(localStorage.getItem(k)); return v && typeof v.total === 'number' ? v : null; } catch (e) { return null; }
  }
  function setSynced(total) { try { var k = syncedKey(); if (k) localStorage.setItem(k, JSON.stringify({ total: total, at: Date.now() })); } catch (e) {} }

  /* ---------- 상태 표시 ---------- */
  var SYNC_TEXT = {
    guest: '게스트예요. 기록은 이 기기에만 저장돼요.',
    ok: '클라우드에 저장됨',
    saving: '저장하는 중…',
    pending: '저장 대기 중',
    offline: '오프라인이에요. 연결되면 저장해요.',
    error: '저장하지 못했어요. 다시 시도할게요.',
    choose: '클라우드와 기록이 달라요. 눌러서 정해 주세요.'
  };
  function syncText() {
    if (sync.state === 'ok' && sync.at) return SYNC_TEXT.ok + ' · ' + new Date(sync.at).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
    return SYNC_TEXT[sync.state] || '';
  }
  function setSync(s) {
    sync.state = s;
    var cls = { guest: 'guest', ok: 'ok', saving: 'busy', pending: 'busy', offline: 'bad', error: 'bad', choose: 'bad' }[s] || 'guest';
    dot.className = 'dot ' + cls;
    var st = $('syncText'); if (st) st.textContent = syncText();
    var sd = $('syncDot'); if (sd) sd.className = 'dot ' + cls;
  }
  function refreshButton() {
    var u = cloud && cloud.user();
    G.cloudOn = !!u;
    label.textContent = u ? shortName(u) : '로그인';
    btn.setAttribute('aria-label', u ? '내 계정 (' + (u.email || '') + ')' : '로그인 또는 회원가입');
    if (!u) setSync('guest');
  }

  /* ---------- 클라우드 저장 ---------- */
  function finishSynced(st) {
    lastPushedKey = stateKey(st); lastPush = Date.now();
    setSynced(st.total); sync.at = Date.now(); pulling = false; setSync('ok');
  }
  function push(o) {
    o = o || {};
    if (!cloud || !cloud.user() || locked || pulling) return Promise.resolve(false);
    var st = G.getState(), key = stateKey(st);
    if (!o.force && key === lastPushedKey) { if (sync.state === 'pending') setSync('ok'); return Promise.resolve(false); }
    setSync('saving');
    return cloud.saveGame(st, Math.floor(st.total), { keepalive: o.keepalive }).then(function () {
      lastPushedKey = key; lastPush = Date.now(); setSynced(st.total); sync.at = Date.now(); setSync('ok');
      return true;
    }).catch(function (e) {
      setSync(isNet(e) ? 'offline' : 'error'); reportOnce(e);
      return false;
    });
  }
  function flush() { clearTimeout(pushTimer); pushTimer = 0; push({ keepalive: true }); }

  window.addEventListener('banana:saved', function () {
    if (!cloud || !cloud.user() || locked || pulling) return;
    if (stateKey(G.getState()) === lastPushedKey) return;
    if (sync.state === 'ok') setSync('pending');
    var wait = PUSH_GAP - (Date.now() - lastPush);
    if (wait <= 0) push();
    else if (!pushTimer) pushTimer = setTimeout(function () { pushTimer = 0; push(); }, wait);
  });
  window.addEventListener('banana:reset', function () {
    if (!cloud || !cloud.user()) return;
    locked = false; pendingConflict = null; closeModal();
    lastPushedKey = '';
    push({ force: true }).then(function (ok) { if (ok) G.toast('클라우드 기록도 새로 시작했어요'); });
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) flush();
    else if (cloud && cloud.user() && Date.now() - lastPull > PULL_GAP) pull();
  });
  window.addEventListener('pagehide', flush);
  window.addEventListener('online', function () { if (cloud && cloud.user() && (sync.state === 'offline' || sync.state === 'error')) pull(); });

  function useCloud(data, msg) {
    G.adopt(data);
    finishSynced(G.getState());
    if (msg) G.toast(msg);
  }

  function pull() {
    if (!cloud || !cloud.user() || pulling) return Promise.resolve();
    pulling = true; setSync('saving');
    return cloud.loadSave().then(function (row) {
      lastPull = Date.now();
      var local = G.getState(), synced = getSynced();
      if (!row) {
        pulling = false;
        return push({ force: true }).then(function (ok) { if (ok) G.toast('이 기기 기록을 클라우드에 저장했어요'); });
      }
      var sum = G.summarize(row.data || {});
      var cTotal = Math.max(+row.total || 0, sum.total), EPS = 1;
      if (local.total <= 0 && cTotal > 0) { useCloud(row.data, '클라우드 기록을 불러왔어요'); return; }
      if (synced && cTotal <= synced.total + EPS) {            // 클라우드는 마지막으로 본 그대로 → 이 기기가 최신
        if (Math.floor(local.total) === Math.floor(synced.total)) { finishSynced(local); return; }
        pulling = false; setSync('pending'); return push();
      }
      if (synced && local.total <= synced.total + EPS) { useCloud(row.data, '다른 기기에서 이어진 기록을 불러왔어요'); return; }
      if (Math.abs(cTotal - local.total) <= EPS) { finishSynced(local); return; }
      pulling = false;
      askConflict(local, row, sum);                             // 둘 다 진행이 달라졌을 때만 물어봐요
    }).catch(function (e) {
      pulling = false;
      setSync(isNet(e) ? 'offline' : 'error'); reportOnce(e);
    });
  }

  /* ---------- 대화상자 ---------- */
  function closeModal() {
    if (!modal) return;
    document.removeEventListener('keydown', onKey);
    if (modal.parentNode) modal.parentNode.removeChild(modal);
    modal = null; view = ''; busy = false;
    try { btn.focus(); } catch (e) {}
  }
  function onKey(e) { if (e.key === 'Escape' && view !== 'choose') closeModal(); }
  function openModal(v, data) {
    view = v;
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal auth';
      modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true');
      modal.addEventListener('pointerdown', function (e) { if (e.target === modal && view !== 'choose') closeModal(); });
      document.body.appendChild(modal);
      document.addEventListener('keydown', onKey);
    }
    modal.innerHTML = '<div class="card auth-card">' + render(v, data) + '</div>';
    wire(v, data);
    var first = modal.querySelector('input, button.primary');
    if (first) { try { first.focus(); } catch (e) {} }
    setSync(sync.state);
  }
  function installRow() {
    var s = window.BananaPWA ? window.BananaPWA.state() : 'none';
    if (s === 'prompt') return '<div class="inst"><p>홈 화면에 설치하면 앱처럼 열려요.</p><button type="button" class="ghost" id="instBtn">앱 설치하기</button></div>';
    if (s === 'ios') return '<div class="inst"><p>사파리 아래의 공유 버튼에서 "홈 화면에 추가"를 누르면 앱처럼 쓸 수 있어요.</p></div>';
    return '';
  }
  function field(id, text, type, ac, extra) {
    return '<label class="fld" for="' + id + '"><span>' + text + '</span><input id="' + id + '" name="' + id + '" type="' + type + '" autocomplete="' + ac + '" required ' + (extra || '') + '></label>';
  }
  function render(v, data) {
    if (!cloud) {
      return '<h2>로그인 준비 중이에요</h2><p class="lead">이 게임은 아직 Firebase와 연결되지 않았어요. 게스트로 계속 플레이할 수 있고, 기록은 이 기기에 저장돼요.</p>' +
        '<p class="note">만든 사람용 안내: config.js에 Firebase 설정값을 넣으면 로그인이 켜져요.</p>' + installRow() +
        '<button type="button" class="ghost" data-act="close">닫기</button>';
    }
    if (v === 'login') {
      return '<h2>로그인</h2><p class="lead">로그인하면 기록이 클라우드에 저장돼요. 다른 기기에서도 이어서 할 수 있어요.</p>' +
        '<form id="fm" novalidate>' + field('aEmail', '이메일', 'email', 'email', 'inputmode="email" autocapitalize="off" spellcheck="false"') +
        field('aPass', '비밀번호', 'password', 'current-password') +
        '<p class="form-err" id="aErr" role="alert"></p><button class="primary" type="submit">로그인</button></form>' +
        '<div class="links"><button type="button" class="link" data-go="forgot">비밀번호를 잊었어요</button><button type="button" class="link" data-go="signup">회원가입</button></div>' +
        '<p class="note">로그인하지 않아도 이 기기에서 계속 플레이할 수 있어요.</p>' + installRow() +
        '<button type="button" class="ghost" data-act="close">닫기</button>';
    }
    if (v === 'signup') {
      return '<h2>회원가입</h2><p class="lead">이메일과 비밀번호만 있으면 돼요.</p>' +
        '<form id="fm" novalidate>' + field('aEmail', '이메일', 'email', 'email', 'inputmode="email" autocapitalize="off" spellcheck="false"') +
        field('aPass', '비밀번호 (8자 이상)', 'password', 'new-password', 'minlength="8"') +
        field('aPass2', '비밀번호 한 번 더', 'password', 'new-password', 'minlength="8"') +
        '<p class="form-err" id="aErr" role="alert"></p><button class="primary" type="submit">가입하기</button></form>' +
        '<div class="links"><button type="button" class="link" data-go="login">이미 계정이 있어요</button></div>' +
        '<button type="button" class="ghost" data-act="close">닫기</button>';
    }
    if (v === 'forgot') {
      return '<h2>비밀번호 찾기</h2><p class="lead">가입한 이메일로 재설정 링크를 보내 드려요.</p>' +
        '<form id="fm" novalidate>' + field('aEmail', '이메일', 'email', 'email', 'inputmode="email" autocapitalize="off" spellcheck="false"') +
        '<p class="form-err" id="aErr" role="alert"></p><button class="primary" type="submit">메일 보내기</button></form>' +
        '<div class="links"><button type="button" class="link" data-go="login">로그인으로 돌아가기</button></div>';
    }
    if (v === 'notice') {
      return '<h2>' + esc(data.title) + '</h2><p class="lead">' + esc(data.text) + '</p>' + (data.sub ? '<p class="note">' + esc(data.sub) + '</p>' : '') +
        '<button type="button" class="primary" data-act="close">확인</button>';
    }
    if (v === 'account') {
      var u = cloud.user();
      return '<h2>내 계정</h2><p class="acct-mail">' + esc(u && u.email || '') + '</p>' +
        '<p class="sync-line"><span class="dot" id="syncDot"></span><span id="syncText"></span></p>' +
        '<div class="btn-row"><button type="button" class="primary" data-act="saveNow">지금 저장하기</button><button type="button" class="ghost" data-act="logout">로그아웃</button></div>' +
        '<p class="note">로그아웃해도 이 기기의 기록은 그대로 남아요.</p>' + installRow() +
        '<button type="button" class="ghost" data-act="close">닫기</button>';
    }
    if (v === 'choose') {
      var l = data.local, c = data.cloud;
      function card(t, s, extra, tag) {
        return '<div class="pick"><b>' + t + '</b>' + (tag ? '<i>더 많이 진행했어요</i>' : '') + '<span>바나나 ' + esc(G.fmt(s.total)) + '개 · ' + esc(s.stage) + '</span><span class="muted">' + extra + '</span></div>';
      }
      var lBig = l.sum.total >= c.sum.total;
      return '<h2>어느 기록으로 할까요?</h2><p class="lead">이 기기와 클라우드에 서로 다른 기록이 있어요. 선택하지 않은 쪽은 사라져요.</p>' +
        card('이 기기', l.sum, '마지막 플레이 ' + esc(when(l.sum.lastSeen)), lBig) +
        card('클라우드', c.sum, '마지막 저장 ' + esc(when(c.at)), !lBig) +
        '<div class="btn-row"><button type="button" class="primary" data-act="useLocal">이 기기 기록으로</button><button type="button" class="primary alt" data-act="useCloud">클라우드 기록으로</button></div>' +
        '<button type="button" class="ghost" data-act="later">나중에 정할게요</button>';
    }
    return '';
  }

  function setBusy(on, text) {
    busy = on;
    var b = modal && modal.querySelector('form .primary'); if (!b) return;
    b.disabled = on;
    if (on) { b.dataset.t = b.textContent; b.textContent = text || '잠시만요…'; } else if (b.dataset.t) { b.textContent = b.dataset.t; }
  }
  function showErr(msg) { var e = $('aErr'); if (e) e.textContent = msg; }
  function emailOk(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  function wire(v, data) {
    var fm = $('fm');
    if (fm) fm.addEventListener('submit', function (ev) { ev.preventDefault(); if (!busy) submit(v); });
    Array.prototype.forEach.call(modal.querySelectorAll('[data-go]'), function (b) { b.addEventListener('click', function () { openModal(b.dataset.go); }); });
    Array.prototype.forEach.call(modal.querySelectorAll('[data-act]'), function (b) { b.addEventListener('click', function () { act(b.dataset.act, data); }); });
    var ib = $('instBtn'); if (ib) ib.addEventListener('click', function () { window.BananaPWA.install().then(function () { if (modal && view !== 'choose') openModal(view, data); }); });
  }

  function act(name, data) {
    if (name === 'close') { closeModal(); return; }
    if (name === 'saveNow') {
      setSync('saving');
      push({ force: true }).then(function (ok) { if (ok) G.toast('클라우드에 저장했어요'); });
      return;
    }
    if (name === 'logout') {
      manualOut = true;
      push().then(function () { return cloud.signOut(); }).then(function () {
        manualOut = false; lastPushedKey = ''; closeModal(); G.toast('로그아웃했어요. 이 기기 기록은 그대로 남아 있어요.');
      });
      return;
    }
    if (name === 'useLocal') {
      locked = false; pendingConflict = null; closeModal();
      lastPushedKey = '';
      push({ force: true }).then(function (ok) { if (ok) G.toast('이 기기 기록을 클라우드에 저장했어요'); });
      return;
    }
    if (name === 'useCloud') {
      locked = false; pendingConflict = null; closeModal();
      useCloud(data.cloud.row.data, '클라우드 기록을 불러왔어요');
      return;
    }
    if (name === 'later') { closeModal(); setSync('choose'); }
  }

  function askConflict(local, row, sum) {
    locked = true;
    pendingConflict = { local: { st: local, sum: G.summarize(local) }, cloud: { row: row, sum: sum, at: row.updated_at } };
    pendingConflict.local.sum = G.summarize(local);
    setSync('choose');
    openModal('choose', pendingConflict);
  }

  function submit(v) {
    var email = ($('aEmail') && $('aEmail').value || '').trim();
    var pw = $('aPass') ? $('aPass').value : '';
    var pw2 = $('aPass2') ? $('aPass2').value : '';
    showErr('');
    if (v === 'login') {
      if (!emailOk(email)) return showErr('이메일 주소를 확인해 주세요.');
      if (!pw) return showErr('비밀번호를 입력해 주세요.');
      setBusy(true, '로그인하는 중…');
      cloud.signIn(email, pw).then(function () {
        closeModal(); refreshButton(); G.toast('로그인했어요!'); return pull();
      }).catch(function (e) { setBusy(false); showErr(errText(e)); });
    } else if (v === 'signup') {
      if (!emailOk(email)) return showErr('이메일 주소를 확인해 주세요.');
      if (pw.length < 8) return showErr('비밀번호는 8자 이상으로 만들어 주세요.');
      if (pw !== pw2) return showErr('비밀번호가 서로 달라요.');
      setBusy(true, '가입하는 중…');
      cloud.signUp(email, pw).then(function () {
        closeModal(); refreshButton(); G.toast('가입했어요! 환영해요.'); return pull();
      }).catch(function (e) { setBusy(false); showErr(errText(e)); });
    } else if (v === 'forgot') {
      if (!emailOk(email)) return showErr('이메일 주소를 확인해 주세요.');
      setBusy(true, '보내는 중…');
      cloud.recover(email).then(function () {
        openModal('notice', { title: '메일을 보냈어요', text: '재설정 링크가 도착할 거예요. 링크를 누르면 열리는 페이지에서 새 비밀번호를 정할 수 있어요. 정한 뒤에는 여기로 돌아와 로그인해 주세요.', sub: '메일이 안 보이면 스팸함도 확인해 주세요.' });
      }).catch(function (e) { setBusy(false); showErr(e && e.code === 'EMAIL_NOT_FOUND' ? '가입되지 않은 이메일이에요.' : errText(e)); });
    }
  }

  /* ---------- 시작 ---------- */
  btn.addEventListener('click', function () {
    if (!cloud) { openModal('login'); return; }
    if (pendingConflict) { openModal('choose', pendingConflict); return; }
    openModal(cloud.user() ? 'account' : 'login');
  });
  window.addEventListener('banana:pwa', function () { if (modal && (view === 'login' || view === 'account')) openModal(view); });

  if (!cloud) { refreshButton(); return; }

  cloud.onChange(function (ev) {
    refreshButton();
    if (ev === 'SIGNED_OUT' && !manualOut) {
      locked = false; pendingConflict = null; lastPushedKey = '';
      G.toast('로그인이 만료됐어요. 다시 로그인해 주세요.');
    }
  });
  refreshButton();

  if (cloud.user()) pull();
})();
