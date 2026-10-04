/* 장비 그림 (SVG). 종류마다 5등급: 일반·고급·희귀·영웅·전설
 * '@'는 그릴 때마다 겹치지 않는 번호로 바뀌어요 (그라데이션 이름용). */
(function () {
  var O = '#5a3418';
  function star(cx, cy, ro, ri) { var p = []; for (var k = 0; k < 10; k++) { var r = k % 2 ? ri : ro, a = -Math.PI / 2 + k * Math.PI / 5; p.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1)); } return p.join(' '); }
  function lg(id, a, b, v) { return '<linearGradient id="' + id + '@" x1="0" y1="0" x2="' + (v ? 0 : 1) + '" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient>'; }
  function defs() { return '<defs>' + Array.prototype.join.call(arguments, '') + '</defs>'; }
  function sp(cx, cy, r, f) { return '<polygon points="' + star(cx, cy, r, r * 0.42) + '" fill="' + (f || '#fff') + '" stroke="rgba(0,0,0,.25)" stroke-width="1"/>'; }
  var ART = {};

  /* ---------- 무기 (손잡이가 원점, 끝이 위) ---------- */
  ART.weapon = [
    defs(lg('a', '#e3b074', '#a8692f', 1)) +
    '<path d="M-6-96C-8-60-7-20-6 8H6C7-20 8-60 6-96Q0-102-6-96Z" fill="url(#a@)" stroke="' + O + '" stroke-width="4" stroke-linejoin="round"/>' +
    '<ellipse cx="2" cy="-52" rx="3" ry="5" fill="#8a5426"/><ellipse cx="-2" cy="-24" rx="2.5" ry="4" fill="#8a5426"/><path d="M-2-90V-10" stroke="rgba(255,255,255,.45)" stroke-width="2.5" stroke-linecap="round"/>' +
    '<path d="M0-98C-4-111-18-113-25-107-17-100-8-98 0-98Z" fill="#7bdc58" stroke="#2f7a2a" stroke-width="3" stroke-linejoin="round"/><path d="M2-98C6-113 20-115 27-109 19-100 10-98 2-98Z" fill="#5cc43e" stroke="#2f7a2a" stroke-width="3" stroke-linejoin="round"/>',
    defs(lg('a', '#e3b074', '#a8692f', 1), lg('b', '#e3e8ee', '#8993a0')) +
    '<path d="M-5-100H5L6 8H-6Z" fill="url(#a@)" stroke="' + O + '" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M4-100C30-112 44-92 40-70 37-50 20-42 4-52Z" fill="url(#b@)" stroke="#3b4752" stroke-width="4" stroke-linejoin="round"/><path d="M-5-94L-17-86-5-76Z" fill="#a9b2bd" stroke="#3b4752" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M14-88C26-90 32-80 31-70" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="3" stroke-linecap="round"/><path d="M12-72l8 6M20-80l5 5" stroke="rgba(70,80,90,.45)" stroke-width="2.5" stroke-linecap="round"/>' +
    '<path d="M-7-62H7M-7-57H7M-7-52H7" stroke="#e8c98a" stroke-width="3.5" stroke-linecap="round"/><path d="M-7-90H7M-7-85H7" stroke="#e8c98a" stroke-width="3.5" stroke-linecap="round"/>',
    defs(lg('a', '#ffffff', '#aab6c4'), lg('g', '#ffe27a', '#d9960a', 1), lg('h', '#8a5426', '#5a3418', 1)) +
    '<path d="M0-116L10-102V-30H-10V-102Z" fill="url(#a@)" stroke="#3b4752" stroke-width="4" stroke-linejoin="round"/><path d="M0-104V-34" stroke="rgba(70,90,110,.4)" stroke-width="3" stroke-linecap="round"/><path d="M-5-98V-40" stroke="rgba(255,255,255,.85)" stroke-width="2" stroke-linecap="round"/>' +
    '<rect x="-24" y="-31" width="48" height="10" rx="5" fill="url(#g@)" stroke="' + O + '" stroke-width="3.5"/><circle cx="0" cy="-26" r="3.5" fill="#e0502b" stroke="' + O + '" stroke-width="1.5"/>' +
    '<rect x="-5.5" y="-21" width="11" height="24" rx="3" fill="url(#h@)" stroke="' + O + '" stroke-width="3"/><path d="M-5-16l10 4M-5-9l10 4" stroke="rgba(255,255,255,.35)" stroke-width="2"/><circle cx="0" cy="8" r="6.5" fill="url(#g@)" stroke="' + O + '" stroke-width="3"/>',
    defs(lg('a', '#a47cf0', '#4a2a9a'), lg('o', '#fff7b0', '#ffc233'), lg('g', '#ffe27a', '#d9960a', 1)) +
    '<rect x="-5.5" y="-90" width="11" height="98" rx="5" fill="url(#a@)" stroke="#2a1a5c" stroke-width="4"/><path d="M-1.5-84V2" stroke="rgba(255,255,255,.45)" stroke-width="2.5" stroke-linecap="round"/>' +
    '<rect x="-8" y="-60" width="16" height="7" rx="3" fill="url(#g@)" stroke="' + O + '" stroke-width="2.5"/><rect x="-8" y="-30" width="16" height="7" rx="3" fill="url(#g@)" stroke="' + O + '" stroke-width="2.5"/>' +
    '<path d="M-17-98Q-19-78 0-78 19-78 17-98" fill="none" stroke="#b9820d" stroke-width="5" stroke-linecap="round"/><path d="M-17-98Q-19-78 0-78 19-78 17-98" fill="none" stroke="#ffe27a" stroke-width="2" stroke-linecap="round"/>' +
    '<circle cx="0" cy="-102" r="17" fill="url(#o@)" stroke="#b36b00" stroke-width="4"/><path d="M3-118L-9-101H-1L-5-86 9-105H1Z" fill="#fff" stroke="#c77700" stroke-width="2" stroke-linejoin="round"/><ellipse cx="-8" cy="-110" rx="4" ry="2.5" fill="rgba(255,255,255,.8)" transform="rotate(-30 -8 -110)"/>' + sp(-28, -108, 6, '#fff3a0') + sp(27, -88, 5, '#fff3a0'),
    defs(lg('b', '#fff7b8', '#f0b000'), lg('g', '#ffe27a', '#c98400', 1), lg('h', '#8a5426', '#5a3418', 1)) +
    '<path d="M-7-32C-34-62-30-102 8-122 3-94 14-62 7-32Z" fill="url(#b@)" stroke="#8a5a00" stroke-width="4" stroke-linejoin="round"/><path d="M-14-58C-18-80-8-100 2-110" fill="none" stroke="rgba(255,255,255,.8)" stroke-width="3" stroke-linecap="round"/><path d="M-1-40C6-60 4-84 2-98" fill="none" stroke="rgba(150,90,0,.35)" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M-24-33Q0-44 24-33 22-24 0-22-22-24-24-33Z" fill="url(#g@)" stroke="#6a3d1b" stroke-width="3.5" stroke-linejoin="round"/><circle cx="0" cy="-32" r="4.5" fill="#e0502b" stroke="#6a3d1b" stroke-width="2"/>' +
    '<rect x="-5.5" y="-22" width="11" height="24" rx="3" fill="url(#h@)" stroke="#3a1f0c" stroke-width="3"/><path d="M-5 2L-8 14H8L5 2Z" fill="#6a3d1b" stroke="#3a1f0c" stroke-width="3" stroke-linejoin="round"/>' + sp(-26, -96, 6, '#fff') + sp(24, -64, 5, '#fff3a0') + sp(20, -112, 4, '#fff')
  ];

  /* ---------- 안경 (바나나 눈 위치 기준 좌표) ---------- */
  function lens2(f) { return f(142, 148) + f(207, 155); }
  ART.glasses = [
    defs(lg('l', 'rgba(235,248,255,.7)', 'rgba(150,200,240,.4)')) + lens2(function (x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="21" fill="url(#l@)" stroke="#9a6a2e" stroke-width="4"/><path d="M' + (x - 13) + ' ' + (y - 8) + 'A15 15 0 0 1 ' + (x - 3) + ' ' + (y - 14) + '" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>'; }) +
    '<path d="M162 150Q175 142 187 153" fill="none" stroke="#9a6a2e" stroke-width="4"/><path d="M121 146L100 140M228 157L250 160" stroke="#9a6a2e" stroke-width="4" stroke-linecap="round"/>',
    defs(lg('l', '#4a4a5c', '#0e0e16')) + lens2(function (x, y) { return '<rect x="' + (x - 26) + '" y="' + (y - 16) + '" width="52" height="34" rx="13" fill="url(#l@)" stroke="#000" stroke-width="3.5"/><path d="M' + (x - 16) + ' ' + (y - 6) + 'L' + (x - 6) + ' ' + (y - 11) + 'M' + (x - 8) + ' ' + (y + 2) + 'L' + (x + 4) + ' ' + (y - 5) + '" stroke="rgba(255,255,255,.55)" stroke-width="3" stroke-linecap="round"/>'; }) +
    '<path d="M168 146L182 150" stroke="#000" stroke-width="6" stroke-linecap="round"/><path d="M116 142L100 138M234 150L250 154" stroke="#000" stroke-width="4.5" stroke-linecap="round"/>',
    defs(lg('l', '#ffb3d0', '#ff4f8f', 1)) + lens2(function (x, y) { return '<g transform="translate(' + x + ' ' + (y - 2) + ') scale(1.28)"><path d="M0 15C-31-6-19-31 0-15 19-31 31-6 0 15Z" fill="url(#l@)" stroke="#7a1d44" stroke-width="3.2" stroke-linejoin="round"/><ellipse cx="-11" cy="-9" rx="5" ry="3" fill="rgba(255,255,255,.8)" transform="rotate(-30 -11 -9)"/></g>'; }) +
    '<path d="M164 144Q175 136 186 148" fill="none" stroke="#7a1d44" stroke-width="4" stroke-linecap="round"/><path d="M115 140L100 136M238 152L250 156" stroke="#7a1d44" stroke-width="3.5" stroke-linecap="round"/>',
    defs(lg('l', '#d6f4ff', '#3fa6e6', 1)) + '<path d="M118 150L96 144M232 160L254 164" stroke="#6a3d1b" stroke-width="9" stroke-linecap="round"/><rect x="164" y="146" width="22" height="10" rx="4" fill="#8d96a1" stroke="#3b4752" stroke-width="3"/>' +
    lens2(function (x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="23" fill="url(#l@)" stroke="#59646f" stroke-width="6"/><circle cx="' + x + '" cy="' + y + '" r="23" fill="none" stroke="#c5ccd4" stroke-width="1.5"/><path d="M' + (x - 14) + ' ' + (y - 6) + 'A15 15 0 0 1 ' + (x - 2) + ' ' + (y - 14) + '" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="' + (x - 21) + '" cy="' + (y - 14) + '" r="2.3" fill="#c5ccd4" stroke="#3b4752" stroke-width="1"/><circle cx="' + (x + 21) + '" cy="' + (y + 14) + '" r="2.3" fill="#c5ccd4" stroke="#3b4752" stroke-width="1"/>'; }),
    defs(lg('l', '#b58cff', '#3a1d8a', 1)) + '<path d="M118 142L102 138M236 158L250 162" stroke="#ffd23f" stroke-width="3.5" stroke-linecap="round"/><path d="M168 150Q175 146 181 153" fill="none" stroke="#ffd23f" stroke-width="4"/>' +
    lens2(function (x, y) { return '<polygon points="' + star(x, y, 29, 13) + '" fill="url(#l@)" stroke="#ffd23f" stroke-width="4" stroke-linejoin="round"/>' + sp(x - 5, y - 4, 5, '#fff') + '<circle cx="' + (x + 7) + '" cy="' + (y + 5) + '" r="1.6" fill="#8fe6ff"/><circle cx="' + (x - 8) + '" cy="' + (y + 8) + '" r="1.3" fill="#ffb3d0"/>'; }) + sp(112, 126, 5, '#ffe66b') + sp(252, 140, 4.5, '#8fe6ff')
  ];

  /* ---------- 망토 (바나나 뒤쪽 오른쪽) ---------- */
  var CP = 'M236 112Q330 120 342 230 346 300 292 322L216 300Z';
  function cape(c1, c2, st, trim, extra) {
    return defs(lg('c', c1, c2, 1)) +
      '<path d="' + CP + '" fill="url(#c@)" stroke="' + st + '" stroke-width="5" stroke-linejoin="round"/>' +
      '<path d="M262 134Q318 150 322 226M290 150Q330 190 322 270M250 160Q268 240 250 300" fill="none" stroke="rgba(0,0,0,.14)" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M246 126Q316 134 332 222" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="4.5" stroke-linecap="round"/>' +
      '<path d="M344 262C340 304 292 322 292 322L224 303" fill="none" stroke="' + trim + '" stroke-width="7" stroke-linecap="round"/>' + (extra || '');
  }
  ART.cape = [
    cape('#efe8d2', '#c3b890', '#8a8470', '#b9ad86', '<path d="M276 308L250 296M310 296L336 262" stroke="#8a8470" stroke-width="2.5" stroke-dasharray="5 5" fill="none"/>'),
    cape('#ff8a76', '#c8341f', '#7a1d12', '#ffd23f', '<circle cx="240" cy="122" r="6" fill="#ffd23f" stroke="#7a1d12" stroke-width="2.5"/>'),
    cape('#7cb8ff', '#2a62c0', '#17407a', '#ffffff', '<circle cx="240" cy="122" r="6" fill="#fff" stroke="#17407a" stroke-width="2.5"/><path d="M262 314q8-8 16 0M296 318q8-8 16 0M322 300q8-8 12 0" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>'),
    cape('#c08cf5', '#5a2aa8', '#3d1a70', '#ffd23f', '<circle cx="240" cy="122" r="6" fill="#ffd23f" stroke="#3d1a70" stroke-width="2.5"/>' + sp(300, 250, 11, '#ffd23f') + sp(322, 190, 8, '#ffe66b') + sp(268, 200, 6, '#fff3a0') + sp(290, 290, 6, '#fff')),
    '<defs><linearGradient id="r@" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5a5a"/><stop offset=".25" stop-color="#ffd23f"/><stop offset=".5" stop-color="#4fd16a"/><stop offset=".75" stop-color="#3b9be8"/><stop offset="1" stop-color="#b06bff"/></linearGradient></defs>' +
    '<path d="' + CP + '" fill="url(#r@)" stroke="#6a3d1b" stroke-width="5" stroke-linejoin="round"/><path d="M262 134Q318 150 322 226M290 150Q330 190 322 270M250 160Q268 240 250 300" fill="none" stroke="rgba(0,0,0,.12)" stroke-width="4" stroke-linecap="round"/><path d="M246 126Q316 134 332 222" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="5" stroke-linecap="round"/><path d="M344 262C340 304 292 322 292 322L224 303" fill="none" stroke="#ffd23f" stroke-width="7" stroke-linecap="round"/><circle cx="240" cy="122" r="6.5" fill="#ffd23f" stroke="#6a3d1b" stroke-width="2.5"/>' + sp(302, 244, 11, '#fff') + sp(322, 186, 8, '#fff') + sp(272, 210, 6, '#fff') + sp(296, 292, 6, '#fff')
  ];

  /* ---------- 방패 (가운데가 원점) ---------- */
  var rivets = function (r, n, c) { var s = ''; for (var i = 0; i < n; i++) { var a = i * 2 * Math.PI / n; s += '<circle cx="' + (r * Math.cos(a)).toFixed(1) + '" cy="' + (r * Math.sin(a)).toFixed(1) + '" r="2" fill="' + c + '" stroke="rgba(0,0,0,.4)" stroke-width="1"/>'; } return s; };
  ART.shield = [
    defs(lg('w', '#e0aa6a', '#a8692f', 1), lg('m', '#e3e8ee', '#77818d')) +
    '<circle r="30" fill="url(#w@)" stroke="' + O + '" stroke-width="4"/><path d="M-16-25V25M-6-29V29M6-29V29M16-25V25" stroke="rgba(90,52,24,.55)" stroke-width="2.5"/><circle r="25" fill="none" stroke="#77818d" stroke-width="4" stroke-dasharray="3 5"/>' +
    '<circle r="9" fill="url(#m@)" stroke="#3b4752" stroke-width="3"/><circle cx="-3" cy="-3" r="2.5" fill="#fff"/><path d="M-22-14A24 24 0 0 1 -10-24" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="3" stroke-linecap="round"/>',
    defs(lg('m', '#f1f4f8', '#8993a0', 1), lg('n', '#e3e8ee', '#77818d')) +
    '<circle r="30" fill="url(#m@)" stroke="#3b4752" stroke-width="4"/><circle r="22" fill="none" stroke="#6f7c89" stroke-width="3"/>' + rivets(26, 8, '#c5ccd4') +
    '<circle r="9" fill="url(#n@)" stroke="#3b4752" stroke-width="3"/><circle cx="-3" cy="-3" r="2.6" fill="#fff"/><path d="M-22-14A24 24 0 0 1 -10-24" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="3.5" stroke-linecap="round"/><path d="M12 20A24 24 0 0 0 22 10" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="3" stroke-linecap="round"/>',
    defs(lg('b', '#79b4ff', '#2358b8', 1)) +
    '<path d="M-26-32H26V4Q26 26 0 40-26 26-26 4Z" fill="url(#b@)" stroke="#17407a" stroke-width="4.5" stroke-linejoin="round"/><path d="M-21-27H21V4Q21 22 0 34-21 22-21 4Z" fill="none" stroke="#e8eef5" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<path d="M-5-27H5V-6H21V4H5V30H-5V4H-21V-6H-5Z" fill="#fff" stroke="#17407a" stroke-width="2.5" stroke-linejoin="round"/><circle cy="-1" r="3.5" fill="#ffd23f" stroke="#b36b00" stroke-width="1.5"/><path d="M-19-22Q-12-26-8-24" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="3" stroke-linecap="round"/>',
    defs(lg('s', '#9a3a3a', '#4a1414', 1), lg('i', '#ff7a66', '#a02020', 1), lg('g', '#fff09a', '#d9960a', 1)) +
    '<polygon points="' + star(0, 0, 38, 27) + '" fill="url(#s@)" stroke="#2b1a0c" stroke-width="4" stroke-linejoin="round"/><circle r="22" fill="url(#i@)" stroke="#2b1a0c" stroke-width="3.5"/><circle r="12" fill="none" stroke="rgba(0,0,0,.3)" stroke-width="2"/>' +
    '<circle r="7" fill="url(#g@)" stroke="#6a3d1b" stroke-width="2.5"/><circle cx="-2" cy="-2" r="2" fill="#fff"/><path d="M-16-10A19 19 0 0 1 -8-17" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="3" stroke-linecap="round"/>',
    defs(lg('g', '#fff6b0', '#e0a010', 1), lg('j', '#8fd8ff', '#2a7ad8', 1)) +
    '<path d="M-31-28Q-34 6-26 18-14 34 0 44 14 34 26 18 34 6 31-28 20-22 0-30-20-22-31-28Z" fill="url(#g@)" stroke="#7a4a00" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M-23-19Q-24 6-19 15-10 27 0 35 10 27 19 15 24 6 23-19 14-15 0-22-14-15-23-19Z" fill="none" stroke="rgba(150,90,0,.5)" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<circle cy="2" r="11" fill="url(#j@)" stroke="#7a4a00" stroke-width="3"/><polygon points="' + star(0, 2, 7, 3) + '" fill="#fff" stroke="#2a7ad8" stroke-width="1"/><circle cx="-4" cy="-3" r="2" fill="#fff"/>' +
    '<polygon points="' + star(0, -40, 7, 3) + '" fill="#ffd23f" stroke="#7a4a00" stroke-width="2"/><path d="M-27-20Q-30 0-22 12" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="3" stroke-linecap="round"/>'
  ];

  /* ---------- 날개 (바나나 뒤 왼쪽 위, 뿌리 88,160) ---------- */
  function feather(a, L, W, fill, st) {
    return '<g transform="translate(88 160) rotate(' + a + ')"><path d="M0 0C' + W + ' ' + (-L * .25) + ' ' + (W * 1.1) + ' ' + (-L * .75) + ' 0 ' + (-L) + 'C' + (-W * 1.1) + ' ' + (-L * .75) + ' ' + (-W) + ' ' + (-L * .25) + ' 0 0Z" fill="' + fill + '" stroke="' + st + '" stroke-width="3.2" stroke-linejoin="round"/><path d="M0-8V' + (-L * .78) + '" stroke="rgba(0,0,0,.14)" stroke-width="2.2" stroke-linecap="round"/></g>';
  }
  function wing(sc, g1, g2, st, n) {
    var angs = [-84, -64, -44, -24, -6], lens = [88, 104, 110, 98, 76], s = '';
    for (var i = 0; i < 5; i++) s += feather(angs[i], lens[i] * sc, 15 * sc + 2, i % 2 ? 'url(#f@)' : 'url(#e@)', st);
    return defs(lg('e', g1, g2, 1), lg('f', g2, g1, 1)) + s + '<ellipse cx="88" cy="160" rx="13" ry="9" fill="url(#e@)" stroke="' + st + '" stroke-width="3"/>' + (n || '');
  }
  ART.wings = [
    wing(0.68, '#ffffff', '#d9dde3', '#8d96a1'),
    wing(0.92, '#ffffff', '#e6ebf2', '#8d96a1'),
    wing(1, '#d3ebff', '#5ea4f2', '#17407a'),
    defs(lg('m', '#a47cf0', '#3a1d78', 1)) +
      '<path d="M88 160L-30 96Q-6 112-6 56Q22 84 34 40Q50 76 72 66Q86 92 88 160Z" fill="url(#m@)" stroke="#241552" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M88 160L-30 96M88 160L-6 56M88 160L34 40M88 160L72 66" stroke="#241552" stroke-width="5" stroke-linecap="round"/><path d="M88 160L-30 96M88 160L-6 56M88 160L34 40M88 160L72 66" stroke="#7a56c8" stroke-width="1.8" stroke-linecap="round"/>' +
      '<path d="M-30 96l-8-5 5 9ZM-6 56l-6-8 2 10ZM34 40l-2-9 7 6ZM72 66l3-8 3 8Z" fill="#fff3d6" stroke="#241552" stroke-width="2" stroke-linejoin="round"/><circle cx="88" cy="160" r="9" fill="#5b3bb8" stroke="#241552" stroke-width="3"/>',
    wing(1.12, '#ffffff', '#ffe49a', '#d99a00') + sp(-8, 70, 7, '#ffe66b') + sp(50, 38, 6, '#fff') + sp(-18, 120, 5, '#fff3a0') + sp(76, 56, 4.5, '#ffe66b')
  ];

  /* ---------- 던지는 바나나 (64×64, 오른쪽으로 날아가요) ---------- */
  var BP = 'M9 18C6 42 26 58 54 47 58 45 57 41 52 41 34 45 21 36 21 20 21 14 11 13 9 18Z';
  function ban(a, b, st) { return defs(lg('p', a, b, 1)) + '<path d="' + BP + '" fill="url(#p@)" stroke="' + st + '" stroke-width="3.5" stroke-linejoin="round"/><path d="M12 14l-1-6h8l-1 6Z" fill="#6a3d1b" stroke="' + st + '" stroke-width="2" stroke-linejoin="round"/><path d="M52 41l4.5 5" stroke="' + st + '" stroke-width="4" stroke-linecap="round"/><path d="M13 24C14 38 24 48 40 48" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="3" stroke-linecap="round"/>'; }
  ART.shot = [
    defs(lg('p', '#fff4a8', '#ffc400', 1)) + '<circle cx="32" cy="32" r="21" fill="url(#p@)" stroke="#a9780e" stroke-width="4"/><circle cx="32" cy="32" r="10" fill="#fff8cf" stroke="#c99a1e" stroke-width="2.5"/><circle cx="32" cy="32" r="2.6" fill="#6a3d1b"/><circle cx="26" cy="29" r="1.7" fill="#6a3d1b"/><circle cx="38" cy="29" r="1.7" fill="#6a3d1b"/><circle cx="32" cy="38.5" r="1.7" fill="#6a3d1b"/><path d="M15 26A19 19 0 0 1 26 15" fill="none" stroke="rgba(255,255,255,.8)" stroke-width="3" stroke-linecap="round"/>',
    ban('#fff08a', '#ffc400', '#6a3d1b') + '<path d="M44 12l10 3M46 22l12 2M40 4l8 4" stroke="#aab3bd" stroke-width="3" stroke-linecap="round"/>',
    '<path d="M46 40C37 33 35 25 40 16 44 21 50 21 50 12 59 21 63 34 55 43Z" fill="#ff7a1a" stroke="#b02a00" stroke-width="2.5" stroke-linejoin="round"/>' + ban('#fff08a', '#ffb000', '#b02a00') + '<path d="M51 39C46 35 46 30 48 25 53 30 55 34 51 39Z" fill="#ffe66b"/>',
    ban('#e8f8ff', '#79c4f0', '#2a6ba8') + '<path d="M40 14l5-9 3 10zM50 24l10-3-7 9zM33 7l3-5 3 6z" fill="#e8f6ff" stroke="#2a6ba8" stroke-width="2" stroke-linejoin="round"/>' + sp(56, 8, 4, '#fff'),
    ban('#8a5be0', '#2e1670', '#241552') + sp(15, 30, 4.5, '#ffe66b') + sp(28, 46, 4, '#fff') + sp(44, 45, 3.4, '#8fc4ff') + '<circle cx="46" cy="14" r="2.8" fill="#ff6fa3"/>' + sp(56, 26, 3.4, '#ffe66b')
  ];
  window.BANANA_ART = ART;
})();
