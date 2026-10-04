/* PWA: 서비스 워커 등록과 "홈 화면에 설치" 안내 */
(function () {
  'use strict';
  var deferred = null;
  var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  function notify() { try { window.dispatchEvent(new Event('banana:pwa')); } catch (e) {} }

  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; notify(); });
  window.addEventListener('appinstalled', function () { deferred = null; standalone = true; notify(); });

  window.BananaPWA = {
    /* 'installed' 이미 앱으로 실행 중 · 'prompt' 설치 버튼 사용 가능 · 'ios' 사파리 수동 안내 · 'none' 해당 없음 */
    state: function () { if (standalone) return 'installed'; if (deferred) return 'prompt'; if (ios) return 'ios'; return 'none'; },
    install: function () {
      if (!deferred) return Promise.resolve(false);
      deferred.prompt();
      return deferred.userChoice.then(function (c) { deferred = null; notify(); return c.outcome === 'accepted'; });
    }
  };

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      var hadCtl = !!navigator.serviceWorker.controller, reloaded = false;
      // 새 버전이 설치되면 한 번 자동으로 새로고침해서 옛 화면이 남지 않게 해요
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (!hadCtl || reloaded) { hadCtl = true; return; }
        reloaded = true; location.reload();
      });
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (r) { try { r.update(); } catch (e) {} }).catch(function () {});
    });
  }
})();
