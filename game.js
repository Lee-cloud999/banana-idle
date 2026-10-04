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
    { name: '바나나 왕', at: 3000000, mult: 3, scale: 1.04 },
    { name: '전설의 바나나', at: 150000000, mult: 4, scale: 1.07 },
    { name: '우주 바나나', at: 10000000000, mult: 6, scale: 1.1 },
    { name: '바나나 신', at: 1000000000000, mult: 10, scale: 1.12 }
  ];
  var MILESTONES = [25, 50, 100, 150, 200, 250];   // 이 레벨에 닿을 때마다 그 업그레이드 효과 ×2
  var SEED_BASE = 100000000;                       // 이번 판에 1억 개를 모으면 씨앗 1개
  var SEED_BONUS = 0.1;                            // 씨앗 하나당 수익 +10%
  var UPGRADES = [
    { id: 'hand', name: '튼튼한 손', base: 10, grow: 1.55, tap: 1 },
    { id: 'monkey', name: '아기 원숭이', base: 15, grow: 1.15, ps: 0.5 },
    { id: 'tree', name: '바나나 나무', base: 130, grow: 1.15, ps: 4 },
    { id: 'farm', name: '바나나 농장', base: 1400, grow: 1.15, ps: 32 },
    { id: 'factory', name: '바나나 공장', base: 16000, grow: 1.15, ps: 260 },
    { id: 'lab', name: '바나나 연구소', base: 200000, grow: 1.15, ps: 2100 },
    { id: 'rocket', name: '바나나 로켓', base: 2400000, grow: 1.15, ps: 17000 },
    { id: 'portal', name: '바나나 차원문', base: 30000000, grow: 1.15, ps: 140000 }
  ];
  var PERKS = [
    { id: 'tap', name: '수확 장인', desc: '탭 수익 +25%', max: 10, cost: function (l) { return 1 + l; } },
    { id: 'grow', name: '특제 비료', desc: '초당 수익 +10%', max: 10, cost: function (l) { return 2 + l * 2; } },
    { id: 'gold', name: '황금 자석', desc: '황금 바나나가 더 자주 오고 보너스 +20%', max: 5, cost: function (l) { return 2 + l * 2; } },
    { id: 'off', name: '푹신한 침대', desc: '복귀 보상 +5%p, 쌓이는 시간 +1시간', max: 5, cost: function (l) { return 3 + l * 2; } },
    { id: 'start', name: '시작 선물', desc: '환생 직후 바나나를 받아요', max: 5, cost: function (l) { return 2 + l * 2; } }
  ];
  var BOSSES = [
    { name: '배고픈 벌레', hp: 500, col: '#7cc04f' },
    { name: '까마귀 대장', hp: 2e4, col: '#4a4f6a' },
    { name: '곰 대왕', hp: 7.5e5, col: '#a8672f' },
    { name: '바나나 도둑 용', hp: 3.75e7, col: '#d9503b' },
    { name: '외계 침략자', hp: 2.5e9, col: '#5fb3e8' },
    { name: '차원의 마왕', hp: 2.5e11, col: '#8a4bd8' }
  ];
  var FIGHT_SECS = 60, REST_WIN = 8, REST_LOSE = 20;
  var BOSS_BONUS = 0.03;                           // 처음 처치한 보스 하나당 수익 +3%
  var FARM_SECS = 6;                               // 다시 이긴 보상: 초당 수익 6초어치
  var ACH_BONUS = 0.01;                            // 업적 하나당 수익 +1%
  function bossCount(s) { var n = 0; for (var k in s.bosses) n++; return n; }
  function lvSum(s) { var t = 0; for (var k in s.levels) t += s.levels[k]; return t; }
  function lvMax(s) { var t = 0; for (var k in s.levels) t = Math.max(t, s.levels[k]); return t; }
  var ACHS = [
    { id: 't100', name: '첫 수확', desc: '바나나를 100번 눌러요', ok: function (s) { return s.taps >= 100; } },
    { id: 't2k', name: '손맛', desc: '2,000번 눌러요', ok: function (s) { return s.taps >= 2000; } },
    { id: 't20k', name: '바나나 장인', desc: '20,000번 눌러요', ok: function (s) { return s.taps >= 20000; } },
    { id: 'c1k', name: '바나나 천 개', desc: '누적 1,000개 수확', ok: function (s) { return s.total >= 1e3; } },
    { id: 'c1m', name: '바나나 백만장자', desc: '누적 100만 개 수확', ok: function (s) { return s.total >= 1e6; } },
    { id: 'c1b', name: '바나나 억만장자', desc: '누적 10억 개 수확', ok: function (s) { return s.total >= 1e9; } },
    { id: 'c1t', name: '바나나 대부호', desc: '누적 1조 개 수확', ok: function (s) { return s.total >= 1e12; } },
    { id: 'lv25', name: '쑥쑥 레벨업', desc: '업그레이드 하나를 Lv.25로', ok: function (s) { return lvMax(s) >= 25; } },
    { id: 'lv100', name: '한 우물', desc: '업그레이드 하나를 Lv.100으로', ok: function (s) { return lvMax(s) >= 100; } },
    { id: 'all', name: '풀 라인업', desc: '업그레이드 8종을 모두 사요', ok: function (s) { return UPGRADES.every(function (u) { return s.levels[u.id] > 0; }); } },
    { id: 'st3', name: '왕의 귀환', desc: '바나나 왕으로 진화', ok: function (s) { return stageIndexFor(s.run) >= 3; } },
    { id: 'st5', name: '우주로!', desc: '우주 바나나로 진화', ok: function (s) { return stageIndexFor(s.run) >= 5; } },
    { id: 'st6', name: '신이 되다', desc: '바나나 신으로 진화', ok: function (s) { return stageIndexFor(s.run) >= 6; } },
    { id: 'r1', name: '새 출발', desc: '처음 환생해요', ok: function (s) { return s.resets >= 1; } },
    { id: 'r10', name: '환생 달인', desc: '10번 환생해요', ok: function (s) { return s.resets >= 10; } },
    { id: 'g1', name: '반짝!', desc: '황금 바나나를 잡아요', ok: function (s) { return s.golds >= 1; } },
    { id: 'g30', name: '황금 사냥꾼', desc: '황금 바나나를 30번 잡아요', ok: function (s) { return s.golds >= 30; } },
    { id: 'k100', name: '사냥 시작', desc: '몬스터 100마리 처치', ok: function (s) { return s.kills >= 100; } },
    { id: 'k3000', name: '몬스터 사냥꾼', desc: '몬스터 3,000마리 처치', ok: function (s) { return s.kills >= 3000; } },
    { id: 'ch1', name: '두근두근', desc: '보물상자를 처음 열어요', ok: function (s) { return s.opened >= 1; } },
    { id: 'ch50', name: '상자 수집가', desc: '보물상자를 50개 열어요', ok: function (s) { return s.opened >= 50; } },
    { id: 'lgd', name: '전설의 장비', desc: '전설 등급 장비를 얻어요', ok: function (s) { return s.items.some(function (it) { return it.r >= 4; }); } },
    { id: 'full', name: '풀 장착', desc: '장비 5칸을 모두 채워요', ok: function (s) { return SLOTS.every(function (x) { return s.eq[x.id]; }); } },
    { id: 'b1', name: '첫 승리', desc: '보스를 처음 물리쳐요', ok: function (s) { return bossCount(s) >= 1; } },
    { id: 'b6', name: '보스 사냥 끝', desc: '보스 6마리를 모두 물리쳐요', ok: function (s) { return bossCount(s) >= BOSSES.length; } },
    { id: 'd7', name: '개근상', desc: '7일 연속 출석', ok: function (s) { return s.dailyStreak >= 7; } }
  ];

  /* ---------- 장비 (보물상자에서 나와요) ---------- */
  var SLOTS = [
    { id: 'weapon', name: '무기', stat: '탭·공격력', f: 1 },
    { id: 'glasses', name: '안경', stat: '몬스터 드롭·보상', f: 1 },
    { id: 'cape', name: '망토', stat: '모든 수익', f: 0.6 },
    { id: 'shield', name: '방패', stat: '보스전 공격력', f: 1 },
    { id: 'wings', name: '날개', stat: '환생 씨앗', f: 0.5 }
  ];
  var RAR = [
    { name: '일반', col: '#8d96a1', v: 0.03 }, { name: '고급', col: '#3fb757', v: 0.08 },
    { name: '희귀', col: '#3b8be8', v: 0.2 }, { name: '영웅', col: '#9a5be0', v: 0.5 }, { name: '전설', col: '#f0a500', v: 1.2 }
  ];
  var ITEM_NAMES = {
    weapon: ['나무 막대', '돌 도끼', '강철 검', '번개 지팡이', '황금 바나나 검'],
    glasses: ['동그란 안경', '선글라스', '하트 안경', '고글', '은하 안경'],
    cape: ['천 망토', '붉은 망토', '푸른 망토', '보라 망토', '무지개 망토'],
    shield: ['나무 방패', '쇠 방패', '푸른 방패', '가시 방패', '황금 방패'],
    wings: ['작은 날개', '흰 날개', '푸른 날개', '박쥐 날개', '천사 날개']
  };
  var PITY_AT = 25;
  var WEIGHTS = [60, 28, 9, 2.5, 0.5], WEIGHTS_BOSS = [38, 36, 18, 6, 2];
  var PLACE = { weapon: 'translate(44 222) rotate(-28)', glasses: '', cape: '', shield: 'translate(266 238) rotate(8)', wings: '' };
  var VB = { glasses: '95 118 160 70', weapon: '-45 -125 90 145', cape: '205 95 150 235', shield: '-40 -48 80 96', wings: '-45 40 150 140' };
  function starPts(cx, cy, ro, ri) { var pts = []; for (var k = 0; k < 10; k++) { var r = k % 2 ? ri : ro, a = -Math.PI / 2 + k * Math.PI / 5; pts.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1)); } return pts.join(' '); }
  var BR = '#6a3d1b';
  var ART = {
    glasses: [
      '<circle cx="142" cy="148" r="21" fill="rgba(190,225,255,.3)" stroke="#4a2b12" stroke-width="4"/><circle cx="207" cy="155" r="21" fill="rgba(190,225,255,.3)" stroke="#4a2b12" stroke-width="4"/><path d="M162 150Q175 142 187 153" fill="none" stroke="#4a2b12" stroke-width="4"/><path d="M121 146L100 140M228 157L250 160" stroke="#4a2b12" stroke-width="4" stroke-linecap="round"/>',
      '<rect x="116" y="132" width="52" height="34" rx="13" fill="#1b1b24" stroke="#000" stroke-width="3"/><rect x="182" y="139" width="52" height="34" rx="13" fill="#1b1b24" stroke="#000" stroke-width="3"/><path d="M168 146L182 150" stroke="#000" stroke-width="5"/><path d="M124 140h14M190 147h14" stroke="rgba(255,255,255,.5)" stroke-width="3" stroke-linecap="round"/><path d="M116 142L100 138M234 150L250 154" stroke="#000" stroke-width="4" stroke-linecap="round"/>',
      '<g transform="translate(142 146) scale(1.2)"><path d="M0 14C-30-6-18-30 0-14 18-30 30-6 0 14Z" fill="#ff6fa3" stroke="#7a1d44" stroke-width="3.5" stroke-linejoin="round"/></g><g transform="translate(207 153) scale(1.2)"><path d="M0 14C-30-6-18-30 0-14 18-30 30-6 0 14Z" fill="#ff6fa3" stroke="#7a1d44" stroke-width="3.5" stroke-linejoin="round"/></g><path d="M164 144Q175 138 186 148" fill="none" stroke="#7a1d44" stroke-width="4"/>',
      '<path d="M96 142Q175 118 256 152" fill="none" stroke="#3b4752" stroke-width="12" stroke-linecap="round"/><circle cx="142" cy="148" r="25" fill="rgba(111,208,255,.55)" stroke="#3b4752" stroke-width="6"/><circle cx="207" cy="155" r="25" fill="rgba(111,208,255,.55)" stroke="#3b4752" stroke-width="6"/><path d="M128 138q8-8 18-6M193 145q8-8 18-6" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>',
      '<polygon points="' + starPts(142, 148, 28, 13) + '" fill="#7a4bd8" stroke="#ffd23f" stroke-width="4" stroke-linejoin="round"/><polygon points="' + starPts(207, 155, 28, 13) + '" fill="#7a4bd8" stroke="#ffd23f" stroke-width="4" stroke-linejoin="round"/><path d="M168 150Q175 146 181 153" fill="none" stroke="#ffd23f" stroke-width="4"/><circle cx="136" cy="142" r="3" fill="#fff"/><circle cx="201" cy="149" r="3" fill="#fff"/>'
    ],
    weapon: [
      '<rect x="-6" y="-96" width="12" height="104" rx="5" fill="#a8672f" stroke="' + BR + '" stroke-width="4"/>',
      '<rect x="-5" y="-90" width="10" height="98" rx="4" fill="#a8672f" stroke="' + BR + '" stroke-width="4"/><path d="M5-92Q38-96 40-66 36-44 5-48Z" fill="#aab4c0" stroke="#3b4752" stroke-width="4" stroke-linejoin="round"/>',
      '<rect x="-17" y="-14" width="34" height="8" rx="3" fill="#c9962a" stroke="' + BR + '" stroke-width="3"/><rect x="-5" y="-6" width="10" height="16" rx="3" fill="#7a4a22" stroke="' + BR + '" stroke-width="3"/><path d="M-8-14L-8-98 0-112 8-98 8-14Z" fill="#e6edf5" stroke="#3b4752" stroke-width="4" stroke-linejoin="round"/>',
      '<rect x="-5" y="-96" width="10" height="106" rx="4" fill="#5b3bb8" stroke="#2a1a5c" stroke-width="4"/><circle cx="0" cy="-104" r="16" fill="#ffe66b" stroke="#c77700" stroke-width="4"/><path d="M4-117L-8-102H0L-4-90 9-107H1Z" fill="#fff" stroke="#c77700" stroke-width="2" stroke-linejoin="round"/>',
      '<rect x="-17" y="-14" width="34" height="8" rx="3" fill="' + BR + '"/><rect x="-5" y="-6" width="10" height="16" rx="3" fill="' + BR + '"/><path d="M-9-14Q-28-62 4-118 4-70 9-14Z" fill="#ffd23f" stroke="' + BR + '" stroke-width="4" stroke-linejoin="round"/><path d="M-4-30Q-13-62 2-96" fill="none" stroke="#fff7c2" stroke-width="3" stroke-linecap="round"/>'
    ],
    cape: (function () {
      var cols = [['#cfc8b4', '#8a8470'], ['#e0503b', '#7a1d12'], ['#3b82e0', '#17407a'], ['#8a4bd8', '#3d1a70']], out = [];
      cols.forEach(function (c, i) {
        out.push('<path d="M236 112Q330 120 342 230 346 300 292 322L216 300Z" fill="' + c[0] + '" stroke="' + c[1] + '" stroke-width="5" stroke-linejoin="round"/><path d="M244 124Q320 134 332 224" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="4" stroke-linecap="round"/>' +
          (i >= 3 ? '<polygon points="' + starPts(300, 250, 9, 4) + '" fill="#ffd23f"/><polygon points="' + starPts(320, 190, 7, 3) + '" fill="#ffd23f"/>' : ''));
      });
      out.push('<defs><linearGradient id="rbw@" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5a5a"/><stop offset=".25" stop-color="#ffd23f"/><stop offset=".5" stop-color="#4fd16a"/><stop offset=".75" stop-color="#3b9be8"/><stop offset="1" stop-color="#b06bff"/></linearGradient></defs><path d="M236 112Q330 120 342 230 346 300 292 322L216 300Z" fill="url(#rbw@)" stroke="#6a3d1b" stroke-width="5" stroke-linejoin="round"/><path d="M244 124Q320 134 332 224" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="4" stroke-linecap="round"/>');
      return out;
    })()
  };

  (function () {
    ART.shield = [
      '<circle r="27" fill="#c58a4a" stroke="' + BR + '" stroke-width="4"/><path d="M-14-24V24M0-27V27M14-24V24" stroke="#8a5a2b" stroke-width="3"/><circle r="8" fill="#aab4c0" stroke="#3b4752" stroke-width="3"/>',
      '<circle r="27" fill="#aab4c0" stroke="#3b4752" stroke-width="4"/><circle r="19" fill="none" stroke="#6f7c89" stroke-width="3"/><circle r="7" fill="#e6edf5" stroke="#3b4752" stroke-width="3"/><circle cx="0" cy="-22" r="2.4" fill="#3b4752"/><circle cx="0" cy="22" r="2.4" fill="#3b4752"/><circle cx="-22" cy="0" r="2.4" fill="#3b4752"/><circle cx="22" cy="0" r="2.4" fill="#3b4752"/>',
      '<path d="M-26-28H26V4Q26 26 0 38-26 26-26 4Z" fill="#3b82e0" stroke="#17407a" stroke-width="4" stroke-linejoin="round"/><path d="M0-28V38M-26 -4H26" stroke="#fff" stroke-width="5"/>',
      '<polygon points="' + starPts(0, 0, 33, 24).replace(/(\d)\s/g, '$1 ') + '" fill="#6b2d2d" stroke="#2b1a0c" stroke-width="4" stroke-linejoin="round"/><circle r="17" fill="#c64a4a" stroke="#2b1a0c" stroke-width="4"/><circle r="6" fill="#ffd23f" stroke="#2b1a0c" stroke-width="3"/>',
      '<path d="M-27-30H27V4Q27 28 0 40-27 28-27 4Z" fill="#ffcf2e" stroke="' + BR + '" stroke-width="4" stroke-linejoin="round"/><path d="M-18-22H18V4Q18 20 0 30-18 20-18 4Z" fill="#f0a500" stroke="' + BR + '" stroke-width="3"/><circle cy="0" r="8" fill="#3aa0e0" stroke="' + BR + '" stroke-width="3"/><polygon points="' + starPts(0, -40, 8, 3.5) + '" fill="#fff7c2" stroke="' + BR + '" stroke-width="2"/>'
    ];
    function wingPath(sc, fill, stroke, lines) {
      return '<g transform="translate(92 168) scale(' + sc + ') translate(-92 -168)"><path d="M92 168C48 160 4 110-18 54 8 62 30 66 46 78 34 94 52 104 62 118 54 134 74 148 92 168Z" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + (4 / sc).toFixed(1) + '" stroke-linejoin="round"/>' + (lines || '') + '</g>';
    }
    var feathers = '<path d="M30 80Q60 110 84 160M46 78Q70 108 62 118" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="3"/>';
    ART.wings = [
      wingPath(0.7, '#eceaf0', '#8d96a1', feathers),
      wingPath(0.95, '#ffffff', '#8d96a1', feathers),
      wingPath(1, '#8fc4ff', '#17407a', feathers),
      wingPath(1, '#5b3bb8', '#2a1a5c', '<path d="M-6 66Q40 100 88 164M30 78Q56 104 58 120M-18 54Q10 96 60 120" fill="none" stroke="#2a1a5c" stroke-width="3"/>'),
      wingPath(1.1, '#fff8c4', '#d99a00', feathers)
    ];
  })();
  var artUid = 0;
  function artOf(slot, tier) { return ART[slot][tier].replace(/@/g, 'u' + (++artUid)); }
  function iconSvg(it) { return '<svg viewBox="' + VB[it.s] + '" aria-hidden="true">' + artOf(it.s, it.r) + '</svg>'; }
  function chestSvg(open) {
    return '<svg viewBox="' + (open ? '0 -22 120 122' : '0 0 120 100') + '" aria-hidden="true">' +
      (open ? '<ellipse cx="60" cy="48" rx="46" ry="26" fill="#fff6a8" opacity=".75"/><path d="M14 46L24 14Q60-2 96 14L106 46Z" fill="#a8672f" stroke="#4a2b12" stroke-width="4" stroke-linejoin="round" transform="rotate(-14 14 46)"/>'
        : '<path d="M12 46Q12 14 60 14T108 46Z" fill="#b8742f" stroke="#4a2b12" stroke-width="4" stroke-linejoin="round"/><path d="M40 16v30M80 16v30" stroke="#f0a500" stroke-width="7"/>') +
      '<rect x="10" y="46" width="100" height="44" rx="6" fill="#9a5f26" stroke="#4a2b12" stroke-width="4"/><path d="M34 46v44M86 46v44" stroke="#f0a500" stroke-width="7"/><rect x="50" y="42" width="20" height="22" rx="5" fill="#ffd23f" stroke="#4a2b12" stroke-width="3.5"/><circle cx="60" cy="52" r="3.2" fill="#4a2b12"/><rect x="58.4" y="52" width="3.2" height="8" rx="1.5" fill="#4a2b12"/></svg>';
  }
  function itemVal(it) { var sl = SLOTS.filter(function (x) { return x.id === it.s; })[0]; return RAR[it.r].v * sl.f; }
  function itemName(it) { return ITEM_NAMES[it.s][it.r]; }
  function slotInfo(id) { return SLOTS.filter(function (x) { return x.id === id; })[0]; }
  function itemById(id) { for (var k = 0; k < state.items.length; k++) if (state.items[k].id === id) return state.items[k]; return null; }
  function eqVal(slot) { var it = itemById(state.eq[slot]); return it ? itemVal(it) : 0; }
  function itemStat(it) { return slotInfo(it.s).stat + ' +' + Math.round(itemVal(it) * 100) + '%'; }

  var ICONS = {
    lab: '<svg viewBox="0 0 40 40"><path d="M15 5h10M17 5v10L8 32a3 3 0 0 0 3 4h18a3 3 0 0 0 3-4L23 15V5" fill="#d7f1ff" stroke="#2f5683" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M11 26h18l3 6a3 3 0 0 1-3 4H11a3 3 0 0 1-3-4z" fill="#ffd23f" stroke="#2f5683" stroke-width="2.5" stroke-linejoin="round"/><circle cx="18" cy="30" r="2" fill="#fff"/><circle cx="24" cy="32" r="1.5" fill="#fff"/></svg>',
    rocket: '<svg viewBox="0 0 40 40"><path d="M20 3c7 5 9 13 8 22H12c-1-9 1-17 8-22z" fill="#f4f6fa" stroke="#3b4752" stroke-width="2.5" stroke-linejoin="round"/><circle cx="20" cy="15" r="4" fill="#6aa0d6" stroke="#3b4752" stroke-width="2.5"/><path d="M12 22l-5 8 6-2M28 22l5 8-6-2" fill="#e0603b" stroke="#6a2d17" stroke-width="2.5" stroke-linejoin="round"/><path d="M16 29h8l-4 8z" fill="#ffd23f" stroke="#c77700" stroke-width="2" stroke-linejoin="round"/></svg>',
    portal: '<svg viewBox="0 0 40 40"><ellipse cx="20" cy="20" rx="12" ry="16" fill="#3a1f6e" stroke="#b58cff" stroke-width="3"/><ellipse cx="20" cy="20" rx="7" ry="11" fill="#7a4bd8" stroke="#d7c0ff" stroke-width="2"/><ellipse cx="20" cy="20" rx="3" ry="6" fill="#ffd23f"/></svg>',
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
    return { bananas: 0, total: 0, run: 0, seeds: 0, resets: 0, chests: 10, pend: null, pity: 0, opened: 0, iid: 0, items: [], eq: { weapon: 0, glasses: 0, cape: 0, shield: 0, wings: 0 }, wave: 1, wk: 0, kills: 0, auto: true, bosses: {}, spent: 0, perks: {}, ach: {}, golds: 0, taps: 0, levels: lv, lastSeen: Date.now(), dailyLast: '', dailyStreak: 0 };
  }
  function num(v) { v = +v; return isFinite(v) && v > 0 ? v : 0; }
  function sanitize(s) {
    var base = freshState();
    if (!s || typeof s !== 'object') return base;
    base.bananas = num(s.bananas); base.total = Math.max(num(s.total), base.bananas);
    base.run = s.run === undefined ? base.total : Math.min(Math.max(num(s.run), base.bananas), base.total);
    base.seeds = Math.floor(num(s.seeds)); base.resets = Math.floor(num(s.resets));
    base.spent = Math.floor(num(s.spent)); base.golds = Math.floor(num(s.golds));
    PERKS.forEach(function (k) { base.perks[k.id] = Math.min(k.max, Math.floor(num(s.perks && s.perks[k.id]))); });
    ACHS.forEach(function (a) { if (s.ach && s.ach[a.id]) base.ach[a.id] = 1; });
    base.chests = Math.min(999, Math.floor(num(s.chests))); base.pity = Math.floor(num(s.pity)); base.opened = Math.floor(num(s.opened));
    if (s.chests === undefined) base.chests = 10;                    // 옛 저장 기록에도 첫 상자 하나를 드려요
    if (s.items instanceof Array) s.items.slice(0, 60).forEach(function (it) {
      if (it && SLOTS.some(function (x) { return x.id === it.s; }) && it.r >= 0 && it.r <= 4 && it.id > 0) base.items.push({ id: Math.floor(it.id), s: it.s, r: Math.floor(it.r) });
    });
    if (s.pend && SLOTS.some(function (x) { return x.id === s.pend.s; }) && s.pend.r >= 0 && s.pend.r <= 4 && s.pend.id > 0) base.pend = { id: Math.floor(s.pend.id), s: s.pend.s, r: Math.floor(s.pend.r) };
    var REMOVED = ['hat', 'boots', 'scarf'];
    base.old = [];
    if (s.items instanceof Array) s.items.forEach(function (it) { if (it && REMOVED.indexOf(it.s) >= 0 && it.r >= 0 && it.r <= 4) base.old.push({ r: Math.floor(it.r) }); });
    if (s.pend && REMOVED.indexOf(s.pend.s) >= 0 && s.pend.r >= 0 && s.pend.r <= 4) base.old.push({ r: Math.floor(s.pend.r) });
    base.iid = Math.max(base.pend ? base.pend.id : 0, Math.floor(num(s.iid)), base.items.reduce(function (m, it) { return Math.max(m, it.id); }, 0));
    SLOTS.forEach(function (x) { var id = s.eq && s.eq[x.id]; base.eq[x.id] = base.items.some(function (it) { return it.id === id && it.s === x.id; }) ? id : 0; });
    base.auto = s.auto !== false;
    base.wave = Math.max(1, Math.floor(num(s.wave))); base.wk = Math.min(9, Math.floor(num(s.wk))); base.kills = Math.floor(num(s.kills));
    BOSSES.forEach(function (b, i) { if (s.bosses && s.bosses[i]) base.bosses[i] = 1; });
    base.taps = Math.floor(num(s.taps));
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
  function stageIndexFor(run) {
    var i = 0;
    for (var k = 0; k < STAGES.length; k++) if (run >= STAGES[k].at) i = k;
    return i;
  }
  function stageIndex() { return stageIndexFor(state.run); }
  function stageMult() { return STAGES[stageIndex()].mult; }
  function msMult(lv) { var m = 1; for (var k = 0; k < MILESTONES.length; k++) if (lv >= MILESTONES[k]) m *= 2; return m; }
  function nextMs(lv) { for (var k = 0; k < MILESTONES.length; k++) if (lv < MILESTONES[k]) return MILESTONES[k]; return 0; }
  function achCount() { var n = 0; for (var k in state.ach) n++; return n; }
  function seedMult() { return (1 + SEED_BONUS * state.seeds) * (1 + ACH_BONUS * achCount()) * (1 + BOSS_BONUS * bossCount(state)) * (1 + eqVal('cape')); }
  function perk(id) { return state.perks[id] || 0; }
  function seedsFree() { return state.seeds - state.spent; }
  function cost(u) { return Math.floor(u.base * Math.pow(u.grow, state.levels[u.id])); }
  function perSecond() {
    var s = 0;
    UPGRADES.forEach(function (u) { if (u.ps) s += u.ps * state.levels[u.id] * msMult(state.levels[u.id]); });
    return s * stageMult() * seedMult() * (1 + 0.1 * perk('grow'));
  }
  function earn(x) { state.bananas += x; state.total += x; state.run += x; }
  function prestigeGain() { return Math.floor(Math.pow(state.run / SEED_BASE, 1 / 3) * (1 + eqVal('wings'))); }
  var comboStamps = [];
  function comboOn() {
    var now = Date.now();
    comboStamps = comboStamps.filter(function (t) { return now - t < 2500; });
    return comboStamps.length >= 10;
  }
  function tapValue(withCombo) {
    var v = (1 + state.levels.hand * msMult(state.levels.hand)) * stageMult() * seedMult() * (1 + 0.25 * perk('tap')) * (1 + eqVal('weapon')) + perSecond() * 0.04;
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
  function baseFace() { return 'normal'; }   // 늘 싸우는 중이라 졸지 않아요
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
    earn(gain); state.taps++;
    hitTarget(tapValue(false), true);
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
  charBtn.addEventListener('pointerdown', function (e) { e.preventDefault(); if (window.__gearEdit) return; doTap(e.clientX, e.clientY); });
  charBtn.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doTap(); } });
  charBtn.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  /* ---------- 진화 ---------- */
  var shownStage = -1;
  function applyStage(i, animate) {
    for (var k = 0; k < STAGES.length; k++) elWrap.classList.toggle('stage-' + k, k === i);
    elWrap.style.setProperty('--sc', STAGES[i].scale);
    for (var rg = 0; rg < STAGES.length; rg++) elStage.classList.toggle('reg-' + rg, rg === i);
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
    goldTimer = setTimeout(spawnGold, (first ? 25 : (50 + Math.random() * 50) * (1 - 0.1 * perk('gold'))) * 1000);
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
      var bonus = Math.max(perSecond() * 60, tapValue(false) * 30, 100) * (1 + 0.2 * perk('gold')) * (1 + eqVal('glasses'));
      earn(bonus); state.golds++;
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
        '<span><span class="name">' + u.name + ' <span class="lv"></span></span><span class="desc"></span><span class="ms"></span></span>' +
        '<span class="buy"><svg viewBox="0 0 64 64" aria-hidden="true"><use href="#i-banana"/></svg><span class="c"></span></span>';
      b.addEventListener('click', function () { buy(u); });
      elShop.appendChild(b);
      rows[u.id] = { el: b, lv: b.querySelector('.lv'), desc: b.querySelector('.desc'), ms: b.querySelector('.ms'), cost: b.querySelector('.c') };
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
    var mult = stageMult() * seedMult(), tp = (1 + 0.25 * perk('tap')) * (1 + eqVal('weapon')), gp = 1 + 0.1 * perk('grow');
    UPGRADES.forEach(function (u) {
      var r = rows[u.id], c = cost(u), lv = state.levels[u.id], afford = state.bananas >= c, mm = msMult(lv), nm = nextMs(lv);
      r.lv.textContent = 'Lv.' + lv;
      r.cost.textContent = fmt(c);
      r.el.classList.toggle('cant', !afford);
      r.el.classList.toggle('ready', afford);
      r.el.setAttribute('aria-label', u.name + ' 레벨 ' + lv + ', 가격 ' + fmt(c) + '개' + (afford ? '' : ', 바나나가 부족해요'));
      if (u.tap) r.desc.textContent = '탭당 +' + fmtRate(u.tap * mult * mm * tp) + ' (지금 ' + fmtRate((1 + lv * mm) * mult * tp) + ')';
      else r.desc.textContent = '초당 +' + fmtRate(u.ps * mult * mm * gp) + ' (지금 ' + fmtRate(u.ps * lv * mm * mult * gp) + ')';
      r.ms.textContent = nm ? 'Lv.' + nm + '에서 효과 ×2' : '효과 최대!';
    });
    renderPrestige(); renderBattle(); renderGear(); renderChestBtn();
    var i = stageIndex(), next = STAGES[i + 1];
    if (next) {
      var p = (state.run - STAGES[i].at) / (next.at - STAGES[i].at);
      p = Math.max(0, Math.min(1, p));
      elEvoName.textContent = '다음: ' + next.name;
      elEvoPct.textContent = Math.floor(p * 100) + '%';
      elEvoBar.style.width = (p * 100) + '%';
    } else {
      elEvoName.textContent = '최고 단계예요';
      elEvoPct.textContent = '신!';
      elEvoBar.style.width = '100%';
    }
    elStats.textContent = '지금까지 ' + fmt(state.total) + '개 수확' + (state.resets ? ' · 환생 ' + state.resets + '번' : '') + ' · 탭 ' + state.taps.toLocaleString('ko-KR') + '번' + ' · v22';
  }

  /* ---------- 환생 (프레스티지) ---------- */
  var elPrest = $('prest'), elPrestTitle = $('prestTitle'), elPrestSub = $('prestSub'), elPrestBtn = $('prestBtn');
  function renderPrestige() {
    var show = state.seeds > 0 || state.resets > 0 || state.run >= SEED_BASE / 20;
    elPerkBtn.hidden = !(state.seeds > 0);
    elAchBtn.textContent = '업적 ' + achCount() + '/' + ACHS.length;
    elPrest.hidden = !show;
    if (!show) return;
    var gain = prestigeGain();
    elPrestTitle.textContent = '바나나 씨앗 ' + fmt(seedsFree()) + '개 · 수익 +' + fmt(Math.round(state.seeds * SEED_BONUS * 100)) + '%';
    elPrestBtn.disabled = gain < 1;
    elPrestBtn.textContent = gain >= 1 ? '환생 +' + fmt(gain) : '환생';
    elPrestSub.textContent = gain >= 1 ? '지금 환생하면 씨앗 ' + fmt(gain) + '개를 얻어요' : '이번 판에 ' + fmt(SEED_BASE) + '개를 모으면 환생할 수 있어요';
  }
  function showPrestige() {
    var gain = prestigeGain();
    if (gain < 1 || document.querySelector('.modal.prestige')) return;
    var after = state.seeds + gain;
    var m = document.createElement('div');
    m.className = 'modal prestige'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    m.innerHTML = '<div class="card"><img src="img/surprise.png" alt=""><h2>환생할까요?</h2>' +
      '<p>씨앗 <b>' + fmt(gain) + '개</b>를 얻어요 (모두 ' + fmt(after) + '개)</p>' +
      '<ul class="plist"><li>수익이 <b>+' + fmt(Math.round(after * SEED_BONUS * 100)) + '%</b>가 돼요 (지금 +' + fmt(Math.round(state.seeds * SEED_BONUS * 100)) + '%)</li>' +
      '<li>바나나, 업그레이드, 진화 단계는 <b>처음으로</b> 돌아가요</li>' +
      '<li>씨앗, 출석 기록, 누적 수확은 <b>그대로</b> 남아요</li></ul>' +
      '<div class="btns"><button type="button" class="no">아직이요</button><button type="button" class="go">환생하기</button></div></div>';
    document.body.appendChild(m);
    var no = m.querySelector('.no'), go = m.querySelector('.go'); no.focus();
    function close() { if (m.parentNode) m.parentNode.removeChild(m); }
    no.addEventListener('click', close);
    go.addEventListener('click', function () {
      close();
      var gg = prestigeGain();                      // 그 사이 바뀌었을 수 있어요
      if (gg < 1) return;
      state.seeds += gg; state.resets++;
      state.bananas = perk('start') ? 500 * Math.pow(8, perk('start')) : 0; state.run = 0;
      UPGRADES.forEach(function (u) { state.levels[u.id] = 0; });
      comboStamps = []; state.wave = 1; state.wk = 0; resetField();
      shownStage = -1; applyStage(0, false);
      Snd.play('evolve'); showBanner('환생! 씨앗 +' + fmt(gg));
      lastAction = Date.now(); setFace('happy', 1500, true); say('happy');
      save(); render();
    });
  }
  elPrestBtn.addEventListener('click', showPrestige);

  /* ---------- 보스전 · 자동전투 ---------- */
  var battle = { on: false, boss: -1, hp: 0, left: 0, rest: 3, note: '', noteT: 0 };
  var elBattle = $('battle'), elBossIco = $('bossIco'), elBossName = $('bossName'), elBossMsg = $('bossMsg'), elBossBar = $('bossBar'), elAutoBtn = $('autoBtn'), elFightBtn = $('fightBtn');
  function bossSvg(i) {
    var c = BOSSES[i].col, horns = i >= 2 ? '<path d="M9 10l4 6M31 10l-4 6" stroke="#2b1a0c" stroke-width="3" stroke-linecap="round"/>' : '';
    var ant = i === 4 ? '<path d="M14 7l-2-4M26 7l2-4" stroke="#2b1a0c" stroke-width="2.5" stroke-linecap="round"/><circle cx="12" cy="3" r="2" fill="#ffd23f"/><circle cx="28" cy="3" r="2" fill="#ffd23f"/>' : '';
    return '<svg viewBox="0 0 40 40" aria-hidden="true">' + horns + ant + '<circle cx="20" cy="22" r="14" fill="' + c + '" stroke="#2b1a0c" stroke-width="3"/>' +
      '<path d="M11 17l6 3M29 17l-6 3" stroke="#2b1a0c" stroke-width="3" stroke-linecap="round"/><circle cx="14.5" cy="22" r="2.4" fill="#fff"/><circle cx="25.5" cy="22" r="2.4" fill="#fff"/>' +
      '<path d="M13 29q7-5 14 0" fill="#fff" stroke="#2b1a0c" stroke-width="2.5" stroke-linejoin="round"/></svg>';
  }
  function bossAvail(i) { return stageIndex() >= i + 1; }
  function pickBoss() {
    var best = -1, k;
    for (k = 0; k < BOSSES.length; k++) if (bossAvail(k)) { if (!state.bosses[k]) return k; best = k; }
    return best;
  }
  function startFight(i) {
    if (i < 0 || !bossAvail(i)) return;
    battle.on = true; battle.boss = i; battle.hp = BOSSES[i].hp; battle.left = FIGHT_SECS; battle.note = ''; battle.noteT = 0;
    clearQueue();
    elMonBody.innerHTML = monSvg(i, true);
    elMon.classList.remove('die'); elMon.classList.add('boss', 'in'); elMon.hidden = false;
  }
  function endFight(won) {
    var i = battle.boss, b = BOSSES[i];
    var pp0 = monPos(); if (won) popAt(pp0.x, pp0.y, '처치!', true);
    battle.on = false; battle.noteT = 4; spawnT = 0.9; elMon.hidden = true; elMon.classList.remove('boss');
    if (won) {
      var first = !state.bosses[i];
      var gain = perSecond() * (first ? 300 : FARM_SECS) * (1 + eqVal('glasses'));
      if (first) { state.bosses[i] = 1; addChest(1); } else if (Math.random() < 0.25) addChest(1);
      earn(gain);
      battle.rest = 0;
      battle.note = first ? b.name + ' 처치! 수익 +' + Math.round(BOSS_BONUS * 100) + '% · +' + fmt(gain) : '승리! +' + fmt(gain);
      Snd.play(first ? 'evolve' : 'gold');
      if (first) showBanner('보스 처치!');
      lastAction = Date.now(); setFace('dance', 1600, true);
      checkAch(); checkEvolution(); save();
    } else {
      battle.rest = REST_LOSE;   // 이 시간 동안은 보스에 다시 도전하지 않아요
      battle.note = '졌어요… 더 키워서 다시 도전!';
      Snd.play('cry');
    }
  }
  /* --- 들판의 몬스터: 최대 3마리가 줄을 서서 와요 --- */
  var ATK_INT = 0.65;                              // 공격 간격(초)
  var MON_SECS = 2.2;                              // 일반 몬스터는 평균 이만큼 걸려 쓰러져요
  var QUEUE_MAX = 3;
  var queue = [];                                  // 앞(0번)이 지금 맞는 몬스터
  var spawnT = 0.3, atkT = 0.5;
  var elMon = $('mon'), elMonBody = $('monBody'), elMonBar = $('monBar'), elMons = $('mons'), elWaveLbl = $('waveLbl'), elFaceWrap = $('lunger');
  var REGIONS = ['풀밭', '숲', '황금 들판', '동굴', '화산', '우주', '신들의 정원'];
  function autoDps() { return perSecond() + tapValue(false) * 1.5; }
  function monSvg(i, boss) {
    var c = boss ? BOSSES[i].col : ['#7cc04f', '#e08a3b', '#7a8fe0', '#d95a8a', '#4fc0b8', '#9a6bdc', '#f2c230'][i % 7];
    var extra = (boss && i >= 2) || (!boss && i >= 3) ? '<path d="M16 14l3 7M44 14l-3 7" stroke="#2b1a0c" stroke-width="3" stroke-linecap="round"/>' : '';
    return '<svg viewBox="0 0 60 52" aria-hidden="true">' + extra + '<path d="M5 46C2 26 14 8 30 8s28 18 25 38z" fill="' + c + '" stroke="#2b1a0c" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M16 22q5-5 10-2" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M17 25l8 3M43 25l-8 3" stroke="#2b1a0c" stroke-width="3" stroke-linecap="round"/><circle cx="21" cy="31" r="3.2" fill="#fff"/><circle cx="39" cy="31" r="3.2" fill="#fff"/>' +
      '<circle cx="21.8" cy="31.4" r="1.5" fill="#2b1a0c"/><circle cx="38.2" cy="31.4" r="1.5" fill="#2b1a0c"/><path d="M23 40q7-5 14 0" fill="#fff" stroke="#2b1a0c" stroke-width="2.5" stroke-linejoin="round"/></svg>';
  }
  function frontBody() { return battle.on ? elMonBody : queue.length ? queue[0].el.querySelector('.mbody') : null; }
  function monPos() {
    var r = elStage.getBoundingClientRect(), body = frontBody();
    if (!body) return { x: r.width * 0.7, y: r.height * 0.6 };
    var m = body.getBoundingClientRect();
    return { x: m.left - r.left + m.width / 2, y: m.top - r.top + m.height * 0.25 };
  }
  function flash() {
    var el = battle.on ? elMon : queue.length ? queue[0].el : null;
    if (!el) return;
    el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit');
  }
  function lunge() { elFaceWrap.classList.remove('atk'); void elFaceWrap.offsetWidth; elFaceWrap.classList.add('atk'); }
  function shoot() {
    var body = frontBody(); if (!body) return;
    var r = elStage.getBoundingClientRect(), f = elFaceWrap.getBoundingClientRect(), m = body.getBoundingClientRect();
    var sx = f.left - r.left + f.width * 0.2, sy = f.top - r.top + f.height * 0.55;
    var ex = m.left - r.left + m.width * 0.65, ey = m.top - r.top + m.height * 0.55;
    var b = document.createElement('div');
    b.className = 'shot'; b.style.left = sx + 'px'; b.style.top = sy + 'px';
    b.style.setProperty('--dx', (ex - sx) + 'px'); b.style.setProperty('--dy', (ey - sy) + 'px');
    b.innerHTML = '<svg viewBox="0 0 64 64"><use href="#i-banana"/></svg>';
    elFx.appendChild(b);
    setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 330);
  }
  function layoutQueue() {
    queue.forEach(function (q, i) { q.el.className = 'mon s' + i + (q.fresh ? ' in' : ''); q.fresh = false; });
  }
  function armFront() {                            // 맨 앞에 선 몬스터는 지금 내 공격력에 맞는 체력이 돼요
    if (!queue.length) return;
    var q = queue[0];
    if (q.armed) return;
    q.armed = true;
    q.max = q.hp = Math.max(3, autoDps() * MON_SECS * (0.85 + Math.random() * 0.3));
  }
  function spawnMon() {
    var si = Math.min(stageIndex(), 6);
    var el = document.createElement('div');
    el.innerHTML = '<div class="mbar"><i></i></div><div class="mbody">' + monSvg(si, false) + '</div>';
    el.hidden = false;
    elMons.appendChild(el);
    queue.push({ el: el, bar: el.querySelector('.mbar i'), hp: 1, max: 1, armed: false, fresh: true });
    armFront(); layoutQueue();
  }
  function clearQueue() {
    queue.forEach(function (q) { if (q.el.parentNode) q.el.parentNode.removeChild(q.el); });
    queue = [];
  }
  function killMon() {
    var q = queue.shift();
    var drop = (perSecond() * 0.5 + tapValue(false) * 2) * (1 + eqVal('glasses'));
    var pp = { x: 0, y: 0 };
    var r = elStage.getBoundingClientRect(), m = q.el.querySelector('.mbody').getBoundingClientRect();
    pp = { x: m.left - r.left + m.width / 2, y: m.top - r.top + m.height * 0.25 };
    earn(drop); state.kills++; state.wk++;
    if (Math.random() < 0.02) addChest(1);
    popAt(pp.x, pp.y, '+' + fmt(Math.max(drop, 1)), false);
    q.el.className = 'mon die s0';
    setTimeout(function () { if (q.el.parentNode) q.el.parentNode.removeChild(q.el); }, 320);
    Snd.play('tap', { combo: true });
    setFace('happy', 500, true);
    armFront(); layoutQueue();
    if (state.wk >= 10) {
      if (state.wave % 5 === 0) addChest(1);
      state.wk = 0; state.wave++;
      if (state.auto && stageIndex() >= 1 && battle.rest <= 0 && pickBoss() >= 0) startFight(pickBoss());
    }
    checkEvolution();
  }
  function hitTarget(dmg, fromTap) {
    var pp;
    if (battle.on) {
      dmg *= (1 + eqVal('shield')); battle.hp -= dmg; flash();
      pp = monPos(); popAt(pp.x + (Math.random() - .5) * 30, pp.y, fmt(Math.max(1, dmg)), false);
      if (battle.hp <= 0) endFight(true);
    } else if (queue.length) {
      queue[0].hp -= dmg; flash();
      if (fromTap) { pp = monPos(); popAt(pp.x + (Math.random() - .5) * 30, pp.y, fmt(Math.max(1, dmg)), false); }
      if (queue[0].hp <= 0) killMon();
    }
  }
  function tickBattle(dt) {
    battle.rest -= dt;
    if (battle.noteT > 0) battle.noteT -= dt;
    if (battle.on) {
      if (!bossAvail(battle.boss)) { battle.on = false; elMon.hidden = true; }
      else { battle.left -= dt; if (battle.left <= 0) endFight(false); }
    }
    if (!battle.on && queue.length < QUEUE_MAX) { spawnT -= dt; if (spawnT <= 0) { spawnT = 0.5; spawnMon(); } }
    atkT -= dt;
    if (atkT <= 0 && (battle.on || queue.length)) {
      atkT = ATK_INT; lunge(); shoot();
      hitTarget(autoDps() * ATK_INT, false);
    }
  }
  function resetField() {
    clearQueue(); battle.on = false; battle.rest = 3; spawnT = 0.4;
    elMon.hidden = true; elMon.classList.remove('boss');
  }
  function renderBattle() {
    elWaveLbl.textContent = '스테이지 ' + state.wave + '-' + (state.wk + 1) + ' · ' + REGIONS[Math.min(stageIndex(), REGIONS.length - 1)];
    queue.forEach(function (q) { q.bar.style.width = Math.max(0, q.hp / q.max * 100) + '%'; });
    if (battle.on) elMonBar.style.width = Math.max(0, battle.hp / BOSSES[battle.boss].hp * 100) + '%';
    var show = stageIndex() >= 1;
    elBattle.hidden = !show;
    if (!show) return;
    var i = battle.on ? battle.boss : pickBoss(), b = BOSSES[i];
    if (elBossIco.getAttribute('data-i') !== String(i)) { elBossIco.innerHTML = bossSvg(i); elBossIco.setAttribute('data-i', String(i)); }
    var cleared = state.bosses[i] ? ' ✓' : '';
    elBossName.textContent = b.name + cleared;
    if (battle.on) {
      elBossBar.style.width = Math.max(0, battle.hp / b.hp * 100) + '%';
      elBossMsg.textContent = '전투 중! ' + Math.ceil(battle.left) + '초 · 탭하면 같이 때려요';
    } else {
      elBossBar.style.width = '100%';
      elBossMsg.textContent = battle.noteT > 0 ? battle.note : state.auto ? (battle.rest > 0 ? '재정비 중 ' + Math.ceil(battle.rest) + '초' : (10 - state.wk) + '마리 더 잡으면 보스전') : '도전 버튼으로 싸워요';
    }
    elFightBtn.disabled = battle.on;
    elFightBtn.textContent = battle.on ? '전투 중' : '도전';
    elAutoBtn.setAttribute('aria-pressed', state.auto ? 'true' : 'false');
    elAutoBtn.textContent = state.auto ? '자동 ON' : '자동 OFF';
    elAutoBtn.classList.toggle('on', state.auto);
  }
  elAutoBtn.addEventListener('click', function () { state.auto = !state.auto; if (state.auto && !battle.on) battle.rest = Math.min(battle.rest, 1); save(); renderBattle(); });
  elFightBtn.addEventListener('click', function () { if (!battle.on) startFight(pickBoss()); renderBattle(); });

  /* ---------- 보물상자 · 장비창 ---------- */
  var elGearUnder = $('gearUnder'), elGearOver = $('gearOver');
  var gearKey = '';
  var elSideChest = $('sideChest'), elSideCnt = $('sideCnt'), elSideMsg = $('sideMsg');
  var elMainChest = $('mainChest'), elMainCnt = $('mainCnt'), elChestMsg = $('chestMsg'), elChestSub = $('chestSub');
  var elPane = $('gearPane'), elGrid = $('gpGrid'), elGpCount = $('gpCount');
  var tab = 'gear', paneKey = '';
  try { tab = localStorage.getItem('banana-ssuk-tab') === 'up' ? 'up' : 'gear'; } catch (e) {}
  $('mainIco').innerHTML = chestSvg(false);
  function setTab(t) {
    tab = t; try { localStorage.setItem('banana-ssuk-tab', t); } catch (e) {}
    elPane.hidden = t !== 'gear'; $('upPane').hidden = t !== 'up';
    $('tabGear').classList.toggle('on', t === 'gear'); $('tabUp').classList.toggle('on', t === 'up');
    paneKey = ''; renderChestBtn();
  }
  function cellHtml(sl) {
    var it = itemById(state.eq[sl.id]);
    if (!it) return '<div class="gcell big empty"><span class="sn">' + sl.name + '</span><span class="em">비어요</span></div>';
    return '<button type="button" class="gcell big" style="--rc:' + RAR[it.r].col + '" data-id="' + it.id + '" aria-label="' + sl.name + ' ' + itemName(it) + ' ' + RAR[it.r].name + '">' + iconSvg(it) +
      '<span class="sn">' + sl.name + '</span><b class="nm">' + itemName(it) + '</b><span class="st">+' + Math.round(itemVal(it) * 100) + '%</span></button>';
  }
  function renderPane() {
    if (tab !== 'gear') return;
    var sig = SLOTS.map(function (x) { return state.eq[x.id]; }).join(',');
    if (sig === paneKey) return;
    paneKey = sig;
    elGrid.innerHTML = SLOTS.map(cellHtml).join('');
    elGpCount.textContent = '같은 종류가 나오면 교체하거나 팔아요';
  }
  elPane.addEventListener('click', function (e) {
    var c = e.target.closest ? e.target.closest('.gcell[data-id]') : null;
    if (!c) return;
    var it = itemById(+c.getAttribute('data-id')); if (it) showItem(it);
  });
  function showItem(it) {
    var m = document.createElement('div');
    m.className = 'modal itemm'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    m.innerHTML = '<div class="card"><div class="rcard" style="--rc:' + RAR[it.r].col + '"><div class="ibig">' + iconSvg(it) + '</div><span class="rtag">' + RAR[it.r].name + ' · ' + slotInfo(it.s).name + '</span><b>' + itemName(it) + '</b><span>' + itemStat(it) + '</span></div>' +
      '<div class="btns"><button type="button" class="no">닫기</button><button type="button" class="sell">팔기 +' + fmt(sellValue(it)) + '</button></div>' +
      '<p class="sub">팔면 이 칸이 비어요. 새 장비는 상자에서 나와요</p></div>';
    document.body.appendChild(m);
    function close() { if (m.parentNode) m.parentNode.removeChild(m); }
    m.querySelector('.no').addEventListener('click', close);
    m.addEventListener('click', function (e) { if (e.target === m) close(); });
    m.querySelector('.sell').addEventListener('click', function () {
      state.bananas += sellValue(it);
      state.items = state.items.filter(function (x) { return x.id !== it.id; });
      state.eq[it.s] = 0; gearKey = ''; renderGear();
      Snd.play('buy'); paneKey = ''; save(); render(); close();
    });
  }
  function migrateBag() {
    if (state.old && state.old.length) {                   // 없어진 칸(모자·신발·목도리)의 장비는 바나나로 바꿔 드려요
      var ot = 0;
      state.old.forEach(function (o) { ot += sellValue({ r: o.r }); });
      state.bananas += ot; toast('없어진 장비 ' + state.old.length + '개를 바나나 ' + fmt(ot) + '개로 바꿨어요');
      state.old = []; save();
    }                          // 예전 가방 장비는 칸마다 가장 좋은 것만 끼고 나머지는 팔아요
    var sold = 0, total = 0;
    SLOTS.forEach(function (x) {
      var mine = state.items.filter(function (it) { return it.s === x.id; }), best = null;
      mine.forEach(function (it) { if (!best || itemVal(it) > itemVal(best)) best = it; });
      if (state.eq[x.id] && itemById(state.eq[x.id]) && best && itemVal(itemById(state.eq[x.id])) >= itemVal(best)) best = itemById(state.eq[x.id]);
      state.eq[x.id] = best ? best.id : 0;
      mine.forEach(function (it) { if (it !== best) { total += sellValue(it); sold++; } });
      state.items = state.items.filter(function (it) { return it.s !== x.id || it === best; });
    });
    if (sold) { state.bananas += total; toast('쓰지 않던 장비 ' + sold + '개를 팔아 바나나 ' + fmt(total) + '개를 받았어요'); save(); }
    gearKey = ''; paneKey = '';
  }
  $('tabGear').addEventListener('click', function () { setTab('gear'); });
  $('tabUp').addEventListener('click', function () { setTab('up'); });
  $('sideIco').innerHTML = chestSvg(false);
  function renderGear() {
    var key = SLOTS.map(function (x) { return x.id + ':' + state.eq[x.id]; }).join('|') + (state.items.length ? '' : '-');
    var ids = SLOTS.map(function (x) { var it = itemById(state.eq[x.id]); return it ? it.s + it.r : ''; }).join('|');
    if (ids === gearKey) return;
    gearKey = ids;
    function layer(slot) {
      var it = itemById(state.eq[slot]); if (!it) return '';
      var a = adjOf(slot), p = PIVOT[slot];
      var sel = editSlot === slot ? 'filter:drop-shadow(0 0 3px #fff) drop-shadow(0 0 5px #2a8cff)' : (it.r >= 3 ? 'filter:drop-shadow(0 0 6px ' + RAR[it.r].col + ')' : '');
      var tf = 'translate(' + (p[0] + a.x) + ' ' + (p[1] + a.y) + ') rotate(' + a.r + ') scale(' + a.s + ') translate(' + (-p[0]) + ' ' + (-p[1]) + ')';
      var hand = slot === 'weapon' ? '<circle cx="44" cy="222" r="12" fill="#ffd23f" stroke="#6a3d1b" stroke-width="4"/>' : '';
      return '<g transform="' + tf + '"' + (sel ? ' style="' + sel + '"' : '') + '><g transform="' + PLACE[slot] + '">' + artOf(slot, it.r) + '</g>' + hand + '</g>';
    }
    elGearUnder.innerHTML = layer('wings') + layer('cape');
    elGearOver.innerHTML = layer('shield') + layer('glasses') + layer('weapon');
  }
  /* ===== 위치 조정 모드 ===== */
  var PIVOT = { weapon: [44, 222], shield: [266, 238], glasses: [175, 153], cape: [280, 212], wings: [30, 110] };
  var ADJ_KEY = 'banana-gear-adj-v1', adj = {}, editSlot = null;
  try { adj = JSON.parse(localStorage.getItem(ADJ_KEY) || '{}') || {}; } catch (e) { adj = {}; }
  function adjOf(slot) { var a = adj[slot] || {}; return { x: +a.x || 0, y: +a.y || 0, r: +a.r || 0, s: +a.s || 1 }; }
  function saveAdj() { try { localStorage.setItem(ADJ_KEY, JSON.stringify(adj)); } catch (e) {} }
  function changeAdj(f) {
    if (!editSlot) return;
    var a = adjOf(editSlot); f(a);
    a.s = Math.max(0.3, Math.min(3, Math.round(a.s * 100) / 100));
    a.r = ((Math.round(a.r) % 360) + 540) % 360 - 180;
    a.x = Math.round(a.x * 10) / 10; a.y = Math.round(a.y * 10) / 10;
    adj[editSlot] = a; saveAdj(); gearKey = ''; renderGear(); editInfo();
  }
  var elEdit = $('gearEdit'), elEditInfo = $('geInfo'), elEditTabs = $('geTabs');
  function editInfo() {
    if (!editSlot) { elEditInfo.textContent = '장비를 먼저 껴 주세요'; return; }
    var a = adjOf(editSlot);
    elEditInfo.textContent = editSlot + ': x ' + a.x + ', y ' + a.y + ', 각도 ' + a.r + '°, 크기 ×' + a.s;
  }
  function editTabs() {
    var html = '';
    SLOTS.forEach(function (x) {
      if (!state.eq[x.id]) return;
      html += '<button type="button" data-slot="' + x.id + '" class="' + (editSlot === x.id ? 'on' : '') + '">' + x.name + '</button>';
    });
    elEditTabs.innerHTML = html || '<span>낀 장비가 없어요</span>';
  }
  function openEdit(on) {
    window.__gearEdit = on; elEdit.hidden = !on; document.body.classList.toggle('gear-editing', on);
    if (on) {
      if (!editSlot || !state.eq[editSlot]) { editSlot = null; SLOTS.some(function (x) { if (state.eq[x.id]) { editSlot = x.id; return true; } }); }
      editTabs(); editInfo();
    } else editSlot = null;
    gearKey = ''; renderGear();
  }
  $('gearEditBtn').addEventListener('click', function () { openEdit(true); });
  $('geDone').addEventListener('click', function () { openEdit(false); });
  elEditTabs.addEventListener('click', function (e) { var b = e.target.closest('button[data-slot]'); if (!b) return; editSlot = b.getAttribute('data-slot'); editTabs(); editInfo(); gearKey = ''; renderGear(); });
  elEdit.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-ge]'); if (!b) return;
    var k = b.getAttribute('data-ge');
    if (k === 'rl') changeAdj(function (a) { a.r -= 5; });
    else if (k === 'rr') changeAdj(function (a) { a.r += 5; });
    else if (k === 'sm') changeAdj(function (a) { a.s -= 0.05; });
    else if (k === 'sp') changeAdj(function (a) { a.s += 0.05; });
    else if (k === 'nl') changeAdj(function (a) { a.x -= 1; });
    else if (k === 'nr') changeAdj(function (a) { a.x += 1; });
    else if (k === 'nu') changeAdj(function (a) { a.y -= 1; });
    else if (k === 'nd') changeAdj(function (a) { a.y += 1; });
    else if (k === 'rs') changeAdj(function (a) { a.x = 0; a.y = 0; a.r = 0; a.s = 1; });
  });
  var dragging = null;
  charBtn.addEventListener('pointerdown', function (e) {
    if (!window.__gearEdit || !editSlot) return;
    dragging = { x: e.clientX, y: e.clientY, a: adjOf(editSlot) };
    try { charBtn.setPointerCapture(e.pointerId); } catch (x) {}
  });
  charBtn.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var w = elGearOver.getBoundingClientRect().width || 360, k = 360 / w;
    var nx = dragging.a.x + (e.clientX - dragging.x) * k, ny = dragging.a.y + (e.clientY - dragging.y) * k;
    changeAdj(function (a) { a.x = nx; a.y = ny; });
  });
  function endDrag() { dragging = null; }
  charBtn.addEventListener('pointerup', endDrag);
  charBtn.addEventListener('pointercancel', endDrag);
  function renderChestBtn() {
    elSideCnt.textContent = state.chests; elSideChest.classList.toggle('none', state.chests < 1);
    elSideMsg.textContent = state.chests > 0 ? '눌러서 열기' : '상자 없음';
    elMainCnt.textContent = state.chests;
    elMainChest.classList.toggle('none', state.chests < 1);
    elChestMsg.textContent = state.chests > 0 ? '눌러서 열어요!' : '상자가 없어요';
    elChestSub.textContent = state.chests > 0 ? '한 번만 누르면 바로 열려요' : '몬스터·보스·5스테이지마다 나와요';
    renderPane();
  }
  function addChest(n) {
    state.chests += n;
    toast('보물상자를 얻었어요! (' + state.chests + '개)');
    Snd.play('ping'); renderChestBtn();
  }
  function rollRarity(boss) {
    var w = boss ? WEIGHTS_BOSS : WEIGHTS, tot = 0, k;
    for (k = 0; k < w.length; k++) tot += w[k];
    var x = Math.random() * tot, r = 0;
    for (k = 0; k < w.length; k++) { x -= w[k]; if (x <= 0) { r = k; break; } r = k; }
    if (state.pity >= PITY_AT - 1 && r < 3) r = 3;           // 영웅 이상이 오래 안 나오면 보장
    state.pity = r >= 3 ? 0 : state.pity + 1;
    return r;
  }
  function sellValue(it) { return Math.floor((perSecond() * 15 + tapValue(false) * 20 + 30) * (1 + it.r * it.r * 2)); }
  function equipItem(it) { state.eq[it.s] = it.id; gearKey = ''; renderGear(); render(); }
  function swapItem(it) {                          // 새 장비를 끼고, 끼고 있던 같은 종류 장비는 팔아요
    var old = itemById(state.eq[it.s]), gain = 0;
    if (old) { gain = sellValue(old); state.bananas += gain; state.items = state.items.filter(function (x) { return x.id !== old.id; }); }
    state.items.push(it); state.pend = null;
    equipItem(it);
    return gain;
  }
  function sellPending(it) {                       // 새 장비를 바로 팔아요
    var gain = sellValue(it);
    state.bananas += gain; state.pend = null;
    return gain;
  }
  function openChest() {
    if (state.chests < 1 || state.pend) return null;
    state.chests--; state.opened++;
    var it = { id: ++state.iid, s: SLOTS[Math.floor(Math.random() * SLOTS.length)].id, r: rollRarity(false) };
    var cur = itemById(state.eq[it.s]);
    var res = { item: it, cur: cur, equipped: false };
    if (!cur) { state.items.push(it); res.equipped = true; equipItem(it); }   // 빈 칸이면 바로 껴요
    else state.pend = it;                                                       // 같은 종류가 있으면 고르게 해요
    paneKey = '';
    Snd.play(it.r >= 3 ? 'evolve' : it.r >= 2 ? 'gold' : 'buy');
    checkAch(); save(); render();
    return res;
  }
  function showChest() {
    var m = document.createElement('div');
    m.className = 'modal chestm'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    document.body.appendChild(m);
    function close() { if (m.parentNode) m.parentNode.removeChild(m); }
    function idle() {
      m.innerHTML = '<div class="card"><h2>보물상자</h2><div class="chestbox">' + chestSvg(false) + '</div>' +
        '<p>' + (state.chests > 0 ? '상자가 ' + state.chests + '개 있어요' : '상자가 없어요') + '</p>' +
        '<p class="sub">몬스터를 잡거나 5스테이지마다, 보스를 이기면, 2시간 이상 자리를 비우면 상자가 나와요</p>' +
        '<div class="btns"><button type="button" class="no">닫기</button><button type="button" class="go"' + (state.chests > 0 ? '' : ' disabled') + '>열기</button></div></div>';
      m.querySelector('.no').addEventListener('click', close);
      m.querySelector('.go').addEventListener('click', openIt);
    }
    function pickCard(it, label, act, glow) {
      return '<button type="button" class="ccard' + (glow ? ' glow' : '') + '" data-act="' + act + '" style="--rc:' + RAR[it.r].col + '">' +
        '<span class="cl">' + label + '</span><span class="ci">' + iconSvg(it) + '</span><b>' + itemName(it) + '</b><span class="cr">' + RAR[it.r].name + '</span><span class="cs">' + slotInfo(it.s).stat + ' +' + Math.round(itemVal(it) * 100) + '%</span></button>';
    }
    function bare() {                               // 누르면 곧바로 흔들리는 상자만 보여 줘요 (버튼·글자 없음)
      m.innerHTML = '<div class="card bare"><div class="chestbox big">' + chestSvg(false) + '</div></div>';
    }
    function view(it, cur, msg) {                   // 결과 화면. 같은 종류가 있으면 두 장비를 비교해서 직접 골라요
      var col = RAR[it.r].col, pending = !!(state.pend && state.pend.id === it.id), q;
      if (pending && cur) {
        var vn = itemVal(it), vc = itemVal(cur), diff = Math.round((vn - vc) * 100);
        m.innerHTML = '<div class="card"><div class="chestbox sm">' + chestSvg(true) + '</div>' +
          '<h2>' + slotInfo(it.s).name + '이(가) 나왔어요!</h2>' +
          '<p>' + (vn > vc ? '새 장비가 +' + diff + '%p 더 좋아요' : vn < vc ? '지금 장비가 ' + (-diff) + '%p 더 좋아요' : '둘의 성능이 같아요') + '</p>' +
          '<div class="cmpwrap">' + pickCard(cur, '지금 장비', 'keep', vc > vn) + pickCard(it, '새 장비', 'swap', vn > vc) + '</div>' +
          '<p class="sub">쓸 장비를 눌러 고르세요. 안 고른 장비는 바나나로 팔려요<br>지금 장비를 고르면 새 장비 +' + fmt(sellValue(it)) + ', 새 장비를 고르면 낡은 장비 +' + fmt(sellValue(cur)) + '</p></div>';
        if ((q = m.querySelector('[data-act="swap"]'))) q.addEventListener('click', function () { var gn = swapItem(it); Snd.play('gold'); paneKey = ''; save(); render(); view(it, null, '교체했어요! 낡은 장비를 ' + fmt(gn) + '개에 팔았어요'); });
        if ((q = m.querySelector('[data-act="keep"]'))) q.addEventListener('click', function () { var gn = sellPending(it); Snd.play('buy'); save(); render(); view(cur, null, itemName(cur) + '을(를) 그대로 써요. 새 장비를 ' + fmt(gn) + '개에 팔았어요'); });
        return;
      }
      var note = msg || (!cur ? '빈 칸이라 바로 장착했어요!' : '');
      m.innerHTML = '<div class="card"><div class="chestbox">' + chestSvg(true) + '</div>' +
        '<div class="rcard" style="--rc:' + col + '"><div class="ibig">' + iconSvg(it) + '</div><span class="rtag">' + RAR[it.r].name + ' · ' + slotInfo(it.s).name + '</span><b>' + itemName(it) + '</b><span>' + itemStat(it) + '</span><span class="cmp">' + note + '</span></div>' +
        '<div class="btns"><button type="button" class="no">닫기</button>' + (state.chests > 0 ? '<button type="button" class="go again">한 번 더 (' + state.chests + ')</button>' : '<button type="button" class="gear">장비 보기</button>') + '</div></div>';
      if ((q = m.querySelector('.no'))) q.addEventListener('click', close);
      if ((q = m.querySelector('.gear'))) q.addEventListener('click', function () { close(); setTab('gear'); });
      if ((q = m.querySelector('.again'))) q.addEventListener('click', function () { bare(); openIt(); });
    }
    function openIt() {
      if (state.chests < 1) return;
      var box = m.querySelector('.chestbox'); box.classList.add('shake');
      Array.prototype.forEach.call(m.querySelectorAll('button'), function (b) { b.disabled = true; });
      setTimeout(function () {
        var res = openChest(); if (!res) { idle(); return; }
        view(res.item, res.cur);
      }, 550);
    }
    if (state.pend) view(state.pend, itemById(state.eq[state.pend.s]));      // 고르던 중 닫았으면 이어서 보여 줘요
    else if (state.chests > 0) { bare(); openIt(); }
    else idle();                          // 한 번 눌러서 바로 열어요
  }
  elSideChest.addEventListener('click', function () { if (state.chests > 0 || state.pend) showChest(); });
  elMainChest.addEventListener('click', function () { if (state.chests > 0 || state.pend) showChest(); });

  /* ---------- 업적 · 씨앗 상점 ---------- */
  var elAchBtn = $('achBtn'), elPerkBtn = $('perkBtn');
  function checkAch() {
    var got = [];
    ACHS.forEach(function (a) { if (!state.ach[a.id] && a.ok(state)) { state.ach[a.id] = 1; got.push(a); } });
    if (!got.length) return;
    Snd.play('daily'); toast('업적 달성: ' + got.map(function (a) { return a.name; }).join(', ') + ' (수익 +' + Math.round(got.length * ACH_BONUS * 100) + '%)');
    save();
  }
  function closeModal(m) { if (m.parentNode) m.parentNode.removeChild(m); }
  function openList(cls, title, body) {
    var old = document.querySelector('.modal.' + cls);
    if (old) closeModal(old);
    var m = document.createElement('div');
    m.className = 'modal ' + cls; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    m.innerHTML = '<div class="card tall"><h2>' + title + '</h2>' + body + '<button type="button" class="ok close">닫기</button></div>';
    document.body.appendChild(m);
    m.querySelector('.close').addEventListener('click', function () { closeModal(m); });
    return m;
  }
  function showAch() {
    var rows = '';
    ACHS.forEach(function (a) {
      var d = !!state.ach[a.id];
      rows += '<div class="lrow' + (d ? ' done' : '') + '"><b>' + (d ? '✓ ' : '') + a.name + '</b><span>' + a.desc + '</span></div>';
    });
    openList('achs', '업적 ' + achCount() + '/' + ACHS.length, '<p>하나 달성할 때마다 모든 수익 +' + Math.round(ACH_BONUS * 100) + '%</p><div class="list">' + rows + '</div>');
  }
  function showPerks() {
    var rows = '';
    PERKS.forEach(function (k) {
      var l = perk(k.id), full = l >= k.max, c = k.cost(l);
      rows += '<div class="lrow"><b>' + k.name + ' <i>Lv.' + l + '/' + k.max + '</i></b><span>' + k.desc + '</span>' +
        '<button type="button" data-k="' + k.id + '"' + (full || seedsFree() < c ? ' disabled' : '') + '>' + (full ? '최대' : '씨앗 ' + c + '개') + '</button></div>';
    });
    var m = openList('perks', '씨앗 상점', '<p>남은 씨앗 <b>' + fmt(seedsFree()) + '개</b> · 환생해도 계속돼요</p><div class="list">' + rows + '</div>');
    Array.prototype.forEach.call(m.querySelectorAll('button[data-k]'), function (b) {
      b.addEventListener('click', function () {
        var k = PERKS.filter(function (x) { return x.id === b.getAttribute('data-k'); })[0];
        var l = perk(k.id), c = k.cost(l);
        if (l >= k.max || seedsFree() < c) { Snd.play('deny'); return; }
        state.spent += c; state.perks[k.id] = l + 1;
        Snd.play('buy'); save(); render(); showPerks();
      });
    });
  }
  elAchBtn.addEventListener('click', showAch);
  elPerkBtn.addEventListener('click', showPerks);

  /* ---------- 시간 흐름 ---------- */
  var lastTick = Date.now(), saveAcc = 0, achAcc = 0;
  function tick() {
    var now = Date.now(), dt = Math.min((now - lastTick) / 1000, 0.5);
    lastTick = now;
    var g = perSecond() * dt;
    if (g > 0) earn(g);
    tickBattle(dt);
    if (faceNow === 'normal' && baseFace() === 'sleep') { showFace('sleep'); say('sleep', true); }
    if (faceNow === 'sleep' && baseFace() === 'normal') { showFace('normal'); }
    elCombo.classList.toggle('show', comboOn());
    checkEvolution(); render();
    achAcc += dt; if (achAcc >= 1) { achAcc = 0; checkAch(); }
    saveAcc += dt;
    if (saveAcc >= 5) { saveAcc = 0; save(); }
  }

  /* ---------- 복귀 보상 ---------- */
  function offCap() { return OFFLINE_CAP_H + perk('off'); }
  function offRate() { return OFFLINE_RATE + 0.05 * perk('off'); }
  function checkOffline() {
    var now = Date.now(), away = now - state.lastSeen;
    if (away < 60000) { state.lastSeen = now; return; }
    var secs = Math.min(away, offCap() * 3600 * 1000) / 1000;
    var gain = perSecond() * secs * offRate();
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
      '<p>' + (away > offCap() * 3600 * 1000 ? '최대 ' + offCap() + '시간까지 쌓여요' : '자리를 비운 동안은 수익의 ' + Math.round(offRate() * 100) + '%가 쌓여요') + '</p>' +
      '<button type="button" class="ok">받기</button></div>';
    document.body.appendChild(m);
    var ok = m.querySelector('.ok'); ok.focus();
    var offChests = Math.min(4, Math.floor(away / 7200000));
    ok.addEventListener('click', function () {
      earn(gain);
      if (offChests > 0) addChest(offChests);
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
      earn(gain);
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
    state = freshState(); resetField(); shownStage = -1; applyStage(0, false);
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
    migrateBag();
    setTab(tab);
    if (state.pend) setTimeout(showChest, 500);
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
    var s = sanitize(obj);
    return { total: s.total, stage: STAGES[stageIndexFor(s.run)].name, seeds: s.seeds, taps: s.taps, lastSeen: s.lastSeen };
  }
  function adopt(obj) {
    Array.prototype.forEach.call(document.querySelectorAll('.modal.offline, .modal.daily, .modal.prestige, .modal.achs, .modal.perks, .modal.chestm, .modal.gearm'), function (m) { if (m.parentNode) m.parentNode.removeChild(m); });
    state = sanitize(obj); resetField(); migrateBag(); gearKey = '';
    if (state.pend) setTimeout(showChest, 500);
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
