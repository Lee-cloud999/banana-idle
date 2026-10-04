(function () {
  'use strict';

  /* ---------- 데이터 ---------- */
  var SAVE_KEY = 'banana-ssuk-v1';
  var OFFLINE_CAP_H = 8;      // 복귀 보상은 최대 8시간
  var OFFLINE_RATE = 0.6;     // 자리를 비운 동안은 초당 수익의 60%
  var STAGES = [
    { name: '아기 바나나', at: 0, mult: 1, scale: 0.74 },
    { name: '바나나', at: 2000, mult: 1.5, scale: 0.88 },
    { name: '황금 바나나', at: 80000, mult: 2, scale: 1.0 },
    { name: '바나나 왕', at: 3000000, mult: 3, scale: 1.06 }
  ];
  var UPGRADES = [
    { id: 'hand', name: '튼튼한 손', base: 10, grow: 1.55, tap: 1 },
    { id: 'monkey', name: '아기 원숭이', base: 15, grow: 1.15, ps: 0.5 },
    { id: 'tree', name: '바나나 나무', base: 130, grow: 1.15, ps: 4 },
    { id: 'farm', name: '바나나 농장', base: 1400, grow: 1.15, ps: 32 },
    { id: 'factory', name: '바나나 공장', base: 16000, grow: 1.15, ps: 260 }
  ];
  var ICONS = {
    hand: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="none" stroke="#f0a500" stroke-width="3" stroke-dasharray="4 4"/><circle cx="20" cy="20" r="9" fill="#ffd23f" stroke="#6a3d1b" stroke-width="3"/><circle cx="20" cy="20" r="2.5" fill="#6a3d1b"/></svg>',
    monkey: '<svg viewBox="0 0 40 40"><circle cx="7" cy="19" r="5" fill="#a8672f" stroke="#6a3d1b" stroke-width="2.5"/><circle cx="33" cy="19" r="5" fill="#a8672f" stroke="#6a3d1b" stroke-width="2.5"/><circle cx="20" cy="20" r="13" fill="#a8672f" stroke="#6a3d1b" stroke-width="2.5"/><ellipse cx="20" cy="24" rx="8" ry="6.5" fill="#f3d3a4"/><circle cx="15.5" cy="18" r="2" fill="#2b1a0c"/><circle cx="24.5" cy="18" r="2" fill="#2b1a0c"/><path d="M17 26q3 2.5 6 0" stroke="#6a3d1b" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
    tree: '<svg viewBox="0 0 40 40"><rect x="17" y="18" width="6" height="18" rx="2" fill="#a8672f" stroke="#6a3d1b" stroke-width="2.5"/><circle cx="12" cy="14" r="8" fill="#4eb35a" stroke="#2c6e36" stroke-width="2.5"/><circle cx="28" cy="14" r="8" fill="#4eb35a" stroke="#2c6e36" stroke-width="2.5"/><circle cx="20" cy="9" r="8" fill="#5cc56a" stroke="#2c6e36" stroke-width="2.5"/><circle cx="14" cy="22" r="2.6" fill="#ffd23f" stroke="#6a3d1b" stroke-width="1.5"/><circle cx="26" cy="21" r="2.6" fill="#ffd23f" stroke="#6a3d1b" stroke-width="1.5"/></svg>',
    farm: '<svg viewBox="0 0 40 40"><path d="M5 36V17L20 6l15 11v19z" fill="#e0603b" stroke="#6a2d17" stroke-width="2.5" stroke-linejoin="round"/><rect x="14" y="22" width="12" height="14" rx="1.5" fill="#fff3d6" stroke="#6a2d17" stroke-width="2.5"/><path d="M14 22l12 14M26 22L14 36" stroke="#6a2d17" stroke-width="2"/><circle cx="20" cy="14" r="2.5" fill="#fff3d6" stroke="#6a2d17" stroke-width="1.5"/></svg>',
    factory: '<svg viewBox="0 0 40 40"><rect x="26" y="5" width="6" height="14" fill="#8a97a3" stroke="#3b4752" stroke-width="2.5"/><path d="M4 36V20l10 6v-6l10 6v-6l12 7v9z" fill="#6aa0d6" stroke="#2f5683" stroke-width="2.5" stroke-linejoin="round"/><rect x="9" y="29" width="5" height="5" fill="#fff3b0"/><rect x="18" y="29" width="5" height="5" fill="#fff3b0"/><rect x="27" y="29" width="5" height="5" fill="#fff3b0"/></svg>'
  };
  var LINES = {
    normal: ['바나나 따자!', '오늘도 쑥쑥 자라는 중', '살짝 눌러 줘~', '노랗게 익어 가요'],
    happy: ['히히 좋아!', '더 눌러도 돼!', '간질간질해~', '바나나 팡팡!'],
    sleep: ['쿨쿨… 바나나 꿈 꾸는 중', 'zzZ…'],
    angry: ['아앗! 자는데 왜 깨워!', '흥! 졸린데…'],
    cry: ['바나나가 모자라… 흑흑', '조금만 더 모아 줘…'],
    surprise: ['앗! 황금 바나나다!', '우와, 뭐가 나타났어!'],
    dance: ['신난다! 콤보 폭발!', '같이 춤춰요~']
  };

  /* ---------- 상태 ---------- */
  var state;
  function freshState() {
    var lv = {}; UPGRADES.forEach(function (u) { lv[u.id] = 0; });
    return { bananas: 0, total: 0, taps: 0, levels: lv, lastSeen: Date.now() };
  }
  function num(v) { v = +v; return isFinite(v) && v > 0 ? v : 0; }
  function sanitize(s) {
    var base = freshState();
    if (!s || typeof s !== 'object') return base;
    base.bananas = num(s.bananas); base.total = Math.max(num(s.total), base.bananas); base.taps = Math.floor(num(s.taps));
    base.lastSeen = num(s.lastSeen) || Date.now();
    UPGRADES.forEach(function (u) { base.levels[u.id] = Math.floor(num(s.levels && s.levels[u.id])); });
    return base;
  }
  function loadSave() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      return raw ? sanitize(JSON.parse(raw)) : null;
    } catch (e) { return null; }
  }
  function save() {
    state.lastSeen = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
    try { window.dispatchEvent(new Event('banana:saved')); } catch (e) {}
  }

  /* ---------- 계산 ---------- */
  function stageIndex() {
    var i = 0;
    for (var k = 0; k < STAGES.length; k++) if (state.total >= STAGES[k].at) i = k;
    return i;
  }
  function stageMult() { return STAGES[stageIndex()].mult; }
  function cost(u) { return Math.floor(u.base * Math.pow(u.grow, state.levels[u.id])); }
  function perSecond() {
    var s = 0;
    UPGRADES.forEach(function (u) { if (u.ps) s += u.ps * state.levels[u.id]; });
    return s * stageMult();
  }
  var comboStamps = [];
  function comboOn() {
    var now = Date.now();
    comboStamps = comboStamps.filter(function (t) { return now - t < 2500; });
    return comboStamps.length >= 10;
  }
  function tapValue(withCombo) {
    var v = (1 + state.levels.hand) * stageMult() + perSecond() * 0.04;
    return withCombo && comboOn() ? v * 1.5 : v;
  }

  /* ---------- 표시 형식 ---------- */
  function fmt(n) {
    n = Math.floor(n);
    if (n < 10000) return n.toLocaleString('ko-KR');
    var units = ['', '만', '억', '조', '경', '해'], i = 0, v = n;
    while (v >= 10000 && i < units.length - 1) { v /= 10000; i++; }
    var d = v >= 100 ? 0 : v >= 10 ? 1 : 2;
    return (+v.toFixed(d)).toLocaleString('ko-KR') + units[i];
  }
  function fmtRate(x) { return x < 10 ? (Math.round(x * 10) / 10).toString() : fmt(x); }
  function fmtDur(ms) {
    var m = Math.floor(ms / 60000), h = Math.floor(m / 60); m = m % 60;
    return h > 0 ? h + '시간 ' + m + '분' : m + '분';
  }

  /* ---------- 화면 요소 ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var elCount = $('count'), elRate = $('rate'), elTap = $('tapv'), elChip = $('chip');
  var elStage = $('stage'), elWrap = $('charWrap'), elBob = $('charBob'), elSquash = $('squash');
  var elFx = $('fx'), elBubble = $('bubble'), elBanner = $('banner'), elCombo = $('combo');
  var elShop = $('shop'), elStats = $('stats'), elReset = $('reset');
  var elEvoName = $('evoName'), elEvoPct = $('evoPct'), elEvoBar = $('evoBar');
  var faceImgs = {};
  Array.prototype.forEach.call(document.querySelectorAll('#faces img'), function (im) { faceImgs[im.dataset.f] = im; });

  /* ---------- 표정 ---------- */
  var faceNow = 'normal', faceTimer = 0, bubbleTimer = 0, lastAction = Date.now();
  function showFace(name) {
    if (name === faceNow) return;
    if (faceImgs[faceNow]) faceImgs[faceNow].classList.remove('on');
    faceImgs[name].classList.add('on');
    faceNow = name;
    elBob.classList.toggle('sleeping', name === 'sleep');
  }
  function baseFace() { return Date.now() - lastAction > 25000 ? 'sleep' : 'normal'; }
  function say(face, force) {
    var arr = LINES[face]; if (!arr) return;
    elBubble.textContent = arr[Math.floor(Math.random() * arr.length)];
    elBubble.classList.add('show');
    clearTimeout(bubbleTimer);
    if (face !== 'sleep' || force) bubbleTimer = setTimeout(function () { elBubble.classList.remove('show'); }, 2200);
  }
  function setFace(name, ms, quiet) {
    showFace(name);
    if (!quiet) say(name);
    clearTimeout(faceTimer);
    faceTimer = setTimeout(function () { var b = baseFace(); showFace(b); if (b === 'sleep') say('sleep', true); }, ms || 800);
  }

  /* ---------- 효과 ---------- */
  function popAt(x, y, text, big) {
    if (elFx.childElementCount > 24) elFx.removeChild(elFx.firstChild);
    var p = document.createElement('div');
    p.className = 'pop' + (big ? ' big' : '');
    p.textContent = text; p.style.left = x + 'px'; p.style.top = y + 'px';
    elFx.appendChild(p);
    setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 950);
  }
  function squash() {
    if (!elSquash.animate) return;
    elSquash.animate([{ transform: 'scale(1,1)' }, { transform: 'scale(1.07,.9)' }, { transform: 'scale(.97,1.04)' }, { transform: 'scale(1,1)' }], { duration: 170, easing: 'ease-out' });
  }
  function showBanner(text) {
    elBanner.textContent = text;
    elBanner.classList.remove('show'); void elBanner.offsetWidth; elBanner.classList.add('show');
  }

  /* ---------- 탭 ---------- */
  function doTap(clientX, clientY) {
    var wasSleeping = faceNow === 'sleep';
    lastAction = Date.now();
    comboStamps.push(lastAction);
    var combo = comboOn();
    var gain = tapValue(true);
    state.bananas += gain; state.total += gain; state.taps++;
    var r = elStage.getBoundingClientRect();
    var x = clientX == null ? r.width / 2 : clientX - r.left;
    var y = clientY == null ? r.height * 0.55 : clientY - r.top;
    popAt(x, y, '+' + fmt(Math.max(gain, 1)) , false);
    squash();
    if (wasSleeping) setFace('angry', 900);
    else if (combo) setFace('dance', 1400, faceNow === 'dance');
    else setFace('happy', 650, faceNow === 'happy' || Math.random() < 0.7);
    elCombo.classList.toggle('show', combo);
    checkEvolution(); render();
  }
  var charBtn = $('charBtn');
  charBtn.addEventListener('pointerdown', function (e) { e.preventDefault(); doTap(e.clientX, e.clientY); });
  charBtn.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doTap(); } });
  charBtn.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  /* ---------- 진화 ---------- */
  var shownStage = -1;
  function applyStage(i, animate) {
    for (var k = 0; k < STAGES.length; k++) elWrap.classList.toggle('stage-' + k, k === i);
    elWrap.style.setProperty('--sc', STAGES[i].scale);
    elChip.textContent = STAGES[i].name;
    if (animate && i > shownStage && shownStage >= 0) {
      showBanner(STAGES[i].name + '(으)로 진화했어요!');
      setFace('surprise', 1000, true); say('surprise');
      setTimeout(function () { setFace('dance', 2400, true); }, 1000);
    }
    shownStage = i;
  }
  function checkEvolution() { var i = stageIndex(); if (i !== shownStage) applyStage(i, true); }

  /* ---------- 황금 바나나 ---------- */
  var goldTimer = 0;
  function scheduleGold(first) {
    clearTimeout(goldTimer);
    goldTimer = setTimeout(spawnGold, (first ? 25 : 50 + Math.random() * 50) * 1000);
  }
  function spawnGold() {
    if (document.hidden) { scheduleGold(false); return; }
    var g = document.createElement('button');
    g.type = 'button'; g.className = 'gold'; g.setAttribute('aria-label', '황금 바나나 잡기');
    g.innerHTML = '<svg viewBox="0 0 64 64"><use href="#i-banana"/></svg>';
    var dur = 7 + Math.random() * 3;
    g.style.setProperty('--dur', dur + 's');
    g.style.setProperty('--y0', (22 + Math.random() * 20) + '%');
    g.style.setProperty('--y1', (40 + Math.random() * 20) + '%');
    g.addEventListener('pointerdown', function (e) {
      e.preventDefault(); e.stopPropagation();
      var bonus = Math.max(perSecond() * 60, tapValue(false) * 30, 100);
      state.bananas += bonus; state.total += bonus;
      var r = elStage.getBoundingClientRect();
      popAt(e.clientX - r.left, e.clientY - r.top, '+' + fmt(bonus), true);
      lastAction = Date.now();
      setFace('dance', 1800); say('happy');
      if (g.parentNode) g.parentNode.removeChild(g);
      checkEvolution(); render();
    });
    elFx.parentNode.appendChild(g);
    setFace('surprise', 1500);
    setTimeout(function () { if (g.parentNode) g.parentNode.removeChild(g); }, dur * 1000 + 200);
    scheduleGold(false);
  }

  /* ---------- 업그레이드 ---------- */
  var rows = {};
  function buildShop() {
    elShop.textContent = '';
    UPGRADES.forEach(function (u) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'item cant';
      b.innerHTML = '<span class="ico">' + ICONS[u.id] + '</span>' +
        '<span><span class="name">' + u.name + ' <span class="lv"></span></span><span class="desc"></span></span>' +
        '<span class="buy"><svg viewBox="0 0 64 64" aria-hidden="true"><use href="#i-banana"/></svg><span class="c"></span></span>';
      b.addEventListener('click', function () { buy(u); });
      elShop.appendChild(b);
      rows[u.id] = { el: b, lv: b.querySelector('.lv'), desc: b.querySelector('.desc'), cost: b.querySelector('.c') };
    });
  }
  function buy(u) {
    var c = cost(u);
    lastAction = Date.now();
    if (state.bananas < c) { setFace('cry', 1000); return; }
    state.bananas -= c; state.levels[u.id]++;
    setFace('happy', 900);
    save(); render();
  }

  /* ---------- 그리기 ---------- */
  function render() {
    elCount.textContent = fmt(state.bananas);
    elRate.textContent = fmtRate(perSecond());
    elTap.textContent = fmtRate(tapValue(false));
    var mult = stageMult();
    UPGRADES.forEach(function (u) {
      var r = rows[u.id], c = cost(u), lv = state.levels[u.id], afford = state.bananas >= c;
      r.lv.textContent = 'Lv.' + lv;
      r.cost.textContent = fmt(c);
      r.el.classList.toggle('cant', !afford);
      r.el.classList.toggle('ready', afford);
      r.el.setAttribute('aria-label', u.name + ' 레벨 ' + lv + ', 가격 ' + fmt(c) + '개' + (afford ? '' : ', 바나나가 부족해요'));
      if (u.tap) r.desc.textContent = '탭당 +' + (u.tap * mult).toString().replace(/(\.\d)\d+/, '$1') + ' (지금 ' + fmtRate((1 + lv) * mult) + ')';
      else r.desc.textContent = '초당 +' + fmtRate(u.ps * mult) + ' (지금 ' + fmtRate(u.ps * lv * mult) + ')';
    });
    var i = stageIndex(), next = STAGES[i + 1];
    if (next) {
      var p = (state.total - STAGES[i].at) / (next.at - STAGES[i].at);
      p = Math.max(0, Math.min(1, p));
      elEvoName.textContent = '다음: ' + next.name;
      elEvoPct.textContent = Math.floor(p * 100) + '%';
      elEvoBar.style.width = (p * 100) + '%';
    } else {
      elEvoName.textContent = '최고 단계예요';
      elEvoPct.textContent = '왕!';
      elEvoBar.style.width = '100%';
    }
    elStats.textContent = '지금까지 ' + fmt(state.total) + '개 수확 · 탭 ' + state.taps.toLocaleString('ko-KR') + '번';
  }

  /* ---------- 시간 흐름 ---------- */
  var lastTick = Date.now(), saveAcc = 0;
  function tick() {
    var now = Date.now(), dt = Math.min((now - lastTick) / 1000, 0.5);
    lastTick = now;
    var g = perSecond() * dt;
    if (g > 0) { state.bananas += g; state.total += g; }
    if (faceNow === 'normal' && baseFace() === 'sleep') { showFace('sleep'); say('sleep', true); }
    if (faceNow === 'sleep' && baseFace() === 'normal') { showFace('normal'); }
    elCombo.classList.toggle('show', comboOn());
    checkEvolution(); render();
    saveAcc += dt;
    if (saveAcc >= 5) { saveAcc = 0; save(); }
  }

  /* ---------- 복귀 보상 ---------- */
  function checkOffline() {
    var now = Date.now(), away = now - state.lastSeen;
    if (away < 60000) { state.lastSeen = now; return; }
    var secs = Math.min(away, OFFLINE_CAP_H * 3600 * 1000) / 1000;
    var gain = perSecond() * secs * OFFLINE_RATE;
    state.lastSeen = now;
    if (gain < 1) return;
    showOffline(gain, away);
  }
  function showOffline(gain, away) {
    var m = document.createElement('div');
    m.className = 'modal offline'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    m.innerHTML = '<div class="card"><img src="img/happy.png" alt="">' +
      '<h2>어서 와요!</h2><p>' + fmtDur(away) + ' 동안 바나나가 익었어요</p>' +
      '<div class="gain"><svg viewBox="0 0 64 64" aria-hidden="true"><use href="#i-banana"/></svg><span>+' + fmt(gain) + '</span></div>' +
      '<p>' + (away > OFFLINE_CAP_H * 3600 * 1000 ? '최대 ' + OFFLINE_CAP_H + '시간까지 쌓여요' : '자리를 비운 동안은 수익의 ' + Math.round(OFFLINE_RATE * 100) + '%가 쌓여요') + '</p>' +
      '<button type="button" class="ok">받기</button></div>';
    document.body.appendChild(m);
    var ok = m.querySelector('.ok'); ok.focus();
    ok.addEventListener('click', function () {
      state.bananas += gain; state.total += gain;
      document.body.removeChild(m);
      lastAction = Date.now(); setFace('happy', 1200);
      checkEvolution(); render(); save();
    });
  }

  /* ---------- 초기화 버튼 (페이지 안에서 확인) ---------- */
  var armTimer = 0;
  elReset.addEventListener('click', function () {
    if (!elReset.classList.contains('arm')) {
      elReset.classList.add('arm'); elReset.textContent = window.BananaGame && window.BananaGame.cloudOn ? '정말? 클라우드 기록도 지워져요' : '정말? 한 번 더 누르면 지워져요';
      armTimer = setTimeout(disarm, 4000); return;
    }
    clearTimeout(armTimer); disarm();
    state = freshState(); shownStage = -1; applyStage(0, false);
    save(); render(); setFace('cry', 1200, true); say('cry'); scheduleGold(true);
    try { window.dispatchEvent(new Event('banana:reset')); } catch (e) {}
  });
  function disarm() { elReset.classList.remove('arm'); elReset.textContent = '처음부터 다시'; }

  /* ---------- 시작 ---------- */
  function start() {
    state = loadSave() || freshState();
    buildShop();
    applyStage(stageIndex(), false);
    render();
    checkOffline();
    lastTick = Date.now();
    setInterval(tick, 100);
    scheduleGold(true);
    say('normal');
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { save(); }
      else { lastTick = Date.now(); checkOffline(); }
    });
    window.addEventListener('pagehide', save);
  }

  /* ---------- 알림 ---------- */
  var toastTimer = 0;
  function toast(msg) {
    var t = $('toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3200);
  }

  /* ---------- 로그인/클라우드 연동용 API ---------- */
  function summarize(obj) {
    var s = sanitize(obj), idx = 0;
    for (var k = 0; k < STAGES.length; k++) if (s.total >= STAGES[k].at) idx = k;
    return { total: s.total, stage: STAGES[idx].name, taps: s.taps, lastSeen: s.lastSeen };
  }
  function adopt(obj) {
    Array.prototype.forEach.call(document.querySelectorAll('.modal.offline'), function (m) { if (m.parentNode) m.parentNode.removeChild(m); });
    state = sanitize(obj);
    shownStage = -1; applyStage(stageIndex(), false);
    render(); checkOffline(); save();
  }
  window.BananaGame = {
    cloudOn: false,
    getState: function () { return sanitize(state); },
    summarize: summarize,
    fmt: fmt,
    adopt: adopt,
    toast: toast
  };
  start();
})();
