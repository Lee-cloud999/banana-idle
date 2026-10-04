/* 바나나 쑥쑥 서비스 워커
 * - 앱 껍데기(HTML/JS/이미지)를 미리 저장해서 인터넷이 없어도 열려요.
 * - HTML·JS·CSS는 인터넷이 되면 항상 최신 파일을 받고, 안 되면 저장본을 써요.
 * - Firebase(로그인·저장) 요청은 건드리지 않고 그대로 통과시켜요.
 * - 배포할 때마다 VERSION 숫자를 올리면 옛 저장본이 정리돼요. */
var VERSION = 'v3';
var CORE = 'banana-core-' + VERSION;
var RUNTIME = 'banana-run-' + VERSION;
var PRECACHE = [
  './', 'index.html', 'game.js', 'cloud.js', 'auth.js', 'pwa.js', 'config.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-64.png',
  'img/normal.png', 'img/happy.png', 'img/sleep.png', 'img/angry.png', 'img/cry.png', 'img/surprise.png', 'img/dance.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CORE).then(function (c) { return c.addAll(PRECACHE); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CORE && k !== RUNTIME; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function networkFirst(req, cacheName, timeoutMs) {
  return new Promise(function (resolve) {
    var done = false;
    function fromCache() {
      return caches.match(req, { ignoreSearch: true }).then(function (hit) {
        return hit || (req.mode === 'navigate' ? caches.match('index.html') : undefined);
      });
    }
    var timer = setTimeout(function () {
      fromCache().then(function (hit) { if (hit && !done) { done = true; resolve(hit); } });
    }, timeoutMs);
    fetch(req).then(function (res) {
      clearTimeout(timer);
      if (res && res.ok) { var copy = res.clone(); caches.open(cacheName).then(function (c) { c.put(req, copy); }); }
      if (!done) { done = true; resolve(res); }
    }).catch(function () {
      clearTimeout(timer);
      fromCache().then(function (hit) { if (!done) { done = true; resolve(hit || Response.error()); } });
    });
  });
}

function cacheFirst(req, cacheName) {
  return caches.match(req).then(function (hit) {
    var net = fetch(req).then(function (res) {
      if (res && (res.ok || res.type === 'opaque')) { var copy = res.clone(); caches.open(cacheName).then(function (c) { c.put(req, copy); }); }
      return res;
    });
    if (hit) { net.catch(function () {}); return hit; }
    return net;
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var sameOrigin = url.origin === self.location.origin;
  var isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameOrigin && !isFont) return;           // Firebase 등 다른 서버는 그대로 통과
  if (isFont) { e.respondWith(cacheFirst(req, RUNTIME)); return; }
  var code = req.mode === 'navigate' || req.destination === 'script' || req.destination === 'style' || /\.(webmanifest|json)$/.test(url.pathname);
  e.respondWith(code ? networkFirst(req, CORE, 4000) : cacheFirst(req, CORE));
});
