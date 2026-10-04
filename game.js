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

  /* ---------- 소리 (파일 없이 WebAudio로 만들어요) ---------- */
  var Snd = (function () {
    var KEY = 'banana-ssuk-sound', ctx = null, master = null, on = true, lastTap = 0;
    try { on = localStorage.getItem(KEY) !== '0'; } catch (e) {}
    function ensure() {
      if (!on) return null;
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        try { ctx = new AC(); } catch (e) { return null; }
        master = ctx.createGain(); master.gain.value = 0.45; master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') { try { var p = ctx.resume(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
      return ctx;
    }
    function tone(freq, start, dur, o) {
      o = o || {};
      var t0 = ctx.currentTime + start, osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = o.type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(o.vol == null ? 0.5 : o.vol, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g); g.connect(master);
      osc.start(t0); osc.stop(t0 + dur + 0.05);
    }
    var N = { C5: 523.25, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5, G6: 1568, C7: 2093 };
    var SOUNDS = {
      tap: function (o) { var f = 440 + (o && o.combo ? 160 : 0) + Math.random() * 80; tone(f, 0, 0.09, { to: f * 1.6, vol: 0.42 }); },
      buy: function () { tone(N.E5, 0, 0.12, { type: 'triangle' }); tone(N.A5, 0.08, 0.16, { type: 'triangle' }); },
      deny: function () { tone(180, 0, 0.16, { type: 'square', to: 120, vol: 0.18 }); },
      ping: function () { tone(N.E6, 0, 0.18, { vol: 0.22 }); tone(N.G6, 0.1, 0.2, { vol: 0.18 }); },
      gold: function () { [N.C6, N.E6, N.G6, N.C7].forEach(function (f, i) { tone(f, i * 0.06, 0.22, { type: 'triangle', vol: 0.32 }); }); },
      evolve: function () { [N.C5, N.E5, N.G5, N.C6].forEach(function (f, i) { tone(f, i * 0.12, 0.35, { type: 'triangle', vol: 0.4 }); }); tone(N.E6, 0.5, 0.7, { vol: 0.3 }); },
      daily: function () { [N.G5, N.C6, N.E6, N.G6].forEach(function (f, i) { tone(f, i * 0.09, 0.25, { type: 'triangle', vol: 0.35 }); }); },
      chime: function () { tone(N.A5, 0, 0.3, { vol: 0.3 }); tone(N.E6, 0.12, 0.4, { vol: 0.25 }); },
      angry: function () { tone(150, 0, 0.18, { type: 'sawtooth', to: 110, vol: 0.14 }); },
      cry: function () { tone(520, 0, 0.35, { to: 300, vol: 0.25 }); }
    };
    return {
      isOn: function () { return on; },
      play: function (name, o) {
        if (!on || !SOUNDS[name]) return;
        if (name === 'tap') { var n = Date.now(); if (n - lastTap < 45) return; lastTap = n; }
        if (!ensure()) return;
        try { SOUNDS[name](o); } catch (e) {}
      },
      unlock: function () { ensure(); },
      set: function (v) {
        on = !!v;
        try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
        if (on && ensure()) { try { SOUNDS.buy(); } catch (e) {} }   // 켰을 때 짧게 들려줘요
      }
    };
  })();

  /* ---------- 상태 ---------- */
  var state;
  function freshState() {
    var lv = {}; UPGRADES.forEach(function (u) { lv[u.id] = 0; });
    return { bananas: 0, total: 0, taps: 0, levels: lv, lastSeen: Date.now(), dailyLast: '', dailyStreak: 0 };
  }
  function num(v) { v = +v; return isFinite(v) && v > 0 ? v : 0; }
  function sanitize(s) {
    var base = freshState();
    if (!s || typeof s !== 'object') return base;
    base.bananas = num(s.bananas); base.total = Math.max(num(s.total), base.bananas); base.taps = Math.floor(num(s.taps));
    base.lastSeen = num(s.lastSeen) || Date.now();
    base.dailyLast = /^\d{4}-\d{2}-\d{2}$/.test(s.dailyLast) ? s.dailyLast : '';
    base.dailyStreak = Math.min(7, Math.floor(num(s.dailyStreak)));
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
    Snd.play(wasSleeping ? 'angry' : 'tap', { combo: combo });
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
      Snd.play('evolve');
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
      Snd.play('gold'); setFace('dance', 1800); say('happy');
      if (g.parentNode) g.parentNode.removeChild(g);
      checkEvolution(); render();
    });
    elFx.parentNode.appendChild(g);
    Snd.play('ping'); setFace('surprise', 1500);
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
    if (state.bananas < c) { Snd.play('deny'); setFace('cry', 1000); return; }
    state.bananas -= c; state.levels[u.id]++;
    Snd.play('buy'); setFace('happy', 900);
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
      Snd.play('chime');
      lastAction = Date.now(); setFace('happy', 1200);
      checkEvolution(); render(); save();
    });
  }

  /* ---------- 일일 보상 (7일 출석) ---------- */
  var DAILY_MIN = [10, 15, 20, 30, 45, 60, 120];          // 그날 초당 수익의 몇 분어치를 줄지
  var DAILY_FLOOR = [60, 100, 160, 260, 420, 700, 1500];  // 수익이 적을 때 보장하는 최소 보상
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function dayKey(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function dailyReward(day) { return Math.floor(Math.max(perSecond() * 60 * DAILY_MIN[day - 1], DAILY_FLOOR[day - 1])); }
  function dailyStatus() {
    var now = new Date(), today = dayKey(now), y = new Date(now.getTime());
    y.setDate(y.getDate() - 1);
    if (state.dailyLast >= today) return { claimable: false };   // 오늘 이미 받았거나, 기기 날짜를 과거로 돌린 경우
    var day = state.dailyLast === dayKey(y) ? (state.dailyStreak % 7) + 1 : 1;
    return { claimable: true, day: day, today: today };
  }
  function showDaily() {
    var st = dailyStatus();
    if (!st.claimable || document.querySelector('.modal.daily')) return;
    var cells = '';
    for (var d = 1; d <= 7; d++) {
      var cls = d < st.day ? 'done' : d === st.day ? 'today' : '';
      cells += '<div class="day ' + cls + (d === 7 ? ' big' : '') + '"><b>' + d + '일</b><span>' + (d < st.day ? '받음' : '+' + fmt(dailyReward(d))) + '</span></div>';
    }
    var m = document.createElement('div');
    m.className = 'modal daily'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    m.innerHTML = '<div class="card"><img src="img/happy.png" alt=""><h2>오늘의 출석 선물</h2><p>' +
      (st.day === 1 ? '오늘부터 7일 동안 매일 들어와요' : st.day + '일째 출석이에요') + '</p>' +
      '<div class="days">' + cells + '</div><p class="hint">수익이 늘면 보상도 커져요</p><button type="button" class="ok">받기</button></div>';
    document.body.appendChild(m);
    var ok = m.querySelector('.ok'); ok.focus();
    ok.addEventListener('click', function () {
      var cur = dailyStatus();                     // 그 사이 다른 기기에서 받았다면 다시 주지 않아요
      if (m.parentNode) m.parentNode.removeChild(m);
      if (!cur.claimable) return;
      var gain = dailyReward(cur.day);
      state.bananas += gain; state.total += gain;
      state.dailyLast = cur.today; state.dailyStreak = cur.day;
      var r = elStage.getBoundingClientRect();
      popAt(r.width / 2, r.height * 0.45, '+' + fmt(gain), true);
      Snd.play('daily'); lastAction = Date.now(); setFace('dance', 1800); say('happy');
      toast(cur.day === 7 ? '7일 출석 완료! 내일부터 다시 1일차예요' : cur.day + '일 출석 보상을 받았어요');
      checkEvolution(); render(); save();
    });
  }
  var dailyTries = 0;
  function maybeDaily() {                          // 복귀 보상 같은 다른 팝업이 닫힌 뒤에 보여 줘요
    if (!dailyStatus().claimable) return;
    if (document.querySelector('.modal')) { if (dailyTries++ < 120) setTimeout(maybeDaily, 500); return; }
    dailyTries = 0; showDaily();
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
    var sndBtn = $('sndBtn');
    function paintSnd() {
      sndBtn.setAttribute('aria-pressed', Snd.isOn() ? 'true' : 'false');
      sndBtn.setAttribute('aria-label', Snd.isOn() ? '소리 끄기' : '소리 켜기');
      sndBtn.classList.toggle('off', !Snd.isOn());
    }
    sndBtn.addEventListener('click', function () { Snd.set(!Snd.isOn()); paintSnd(); });
    paintSnd();
    document.addEventListener('pointerdown', function () { Snd.unlock(); }, { once: true, passive: true });
    buildShop();
    applyStage(stageIndex(), false);
    render();
    checkOffline();
    maybeDaily();
    lastTick = Date.now();
    setInterval(tick, 100);
    scheduleGold(true);
    say('normal');
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { save(); }
      else { lastTick = Date.now(); checkOffline(); maybeDaily(); }
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
    Array.prototype.forEach.call(document.querySelectorAll('.modal.offline, .modal.daily'), function (m) { if (m.parentNode) m.parentNode.removeChild(m); });
    state = sanitize(obj);
    shownStage = -1; applyStage(stageIndex(), false);
    render(); checkOffline(); maybeDaily(); save();
  }
  window.BananaGame = {
    cloudOn: false,
    getState: function () { return sanitize(state); },
    summarize: summarize,
    dailyStatus: dailyStatus,
    dailyReward: dailyReward,
    fmt: fmt,
    adopt: adopt,
    toast: toast
  };
  start();
})();
