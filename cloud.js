/* Firebase 가벼운 클라이언트 (라이브러리 없이 REST로 직접 호출)
 * - 가입 / 로그인 / 로그아웃 / 비밀번호 재설정 메일 (Firebase Authentication)
 * - 게임 저장 읽기·쓰기 (Firestore, game_saves/{내 uid} 문서 하나)
 * 로그인 정보는 이 기기의 localStorage에 저장돼요. */
(function (root) {
  'use strict';

  function CloudError(message, status, code) {
    var e = new Error(message);
    e.status = status;
    e.code = code;
    return e;
  }

  var DEAD_SESSION = ['TOKEN_EXPIRED', 'INVALID_REFRESH_TOKEN', 'USER_DISABLED', 'USER_NOT_FOUND', 'CREDENTIAL_MISMATCH', 'INVALID_GRANT_TYPE', 'MISSING_REFRESH_TOKEN', 'CREDENTIAL_TOO_OLD_LOGIN_AGAIN'];

  function create(cfg, opts) {
    opts = opts || {};
    var apiKey = cfg.apiKey, projectId = cfg.projectId;
    var storage = opts.storage || root.localStorage;
    var fetchFn = opts.fetch || function () { return root.fetch.apply(root, arguments); };
    var storeKey = opts.storeKey || 'banana-ssuk-auth-v2';
    var hosts = opts.hosts || {
      auth: 'https://identitytoolkit.googleapis.com',
      token: 'https://securetoken.googleapis.com',
      fs: 'https://firestore.googleapis.com'
    };
    var listeners = [];
    var refreshing = null;
    var session = readSession();

    /* ---------- 세션 저장 ---------- */
    function readSession() {
      try {
        var s = JSON.parse(storage.getItem(storeKey));
        return s && s.idToken && s.refreshToken && s.user && s.user.id ? s : null;
      } catch (e) { return null; }
    }
    function writeSession(s) {
      session = s;
      try { if (s) storage.setItem(storeKey, JSON.stringify(s)); else storage.removeItem(storeKey); } catch (e) {}
    }
    function fromAuth(d) {
      if (!d || !d.idToken || !d.localId) return null;
      return {
        idToken: d.idToken,
        refreshToken: d.refreshToken,
        expiresAt: Date.now() + (+d.expiresIn || 3600) * 1000,
        user: { id: d.localId, email: d.email || '' }
      };
    }
    function emit(ev) {
      listeners.slice().forEach(function (fn) { try { fn(ev, session); } catch (e) {} });
    }

    /* ---------- HTTP ---------- */
    function http(url, o) {
      o = o || {};
      var h = {};
      var init = { method: o.method || 'GET', headers: h };
      if (o.form) { h['Content-Type'] = 'application/x-www-form-urlencoded'; init.body = o.form; }
      else if (o.body !== undefined) { h['Content-Type'] = 'application/json'; init.body = JSON.stringify(o.body); }
      if (o.token) h.Authorization = 'Bearer ' + o.token;
      if (o.keepalive) init.keepalive = true;
      return fetchFn(url, init).then(function (r) {
        return r.text().then(function (t) {
          var j = null;
          try { j = t ? JSON.parse(t) : null; } catch (e) {}
          if (!r.ok) {
            var em = j && j.error;
            var msg = (em && em.message) || ('HTTP ' + r.status);
            var m = String(msg).match(/^([A-Z][A-Z_]+)(?:\s*:.*)?$/);   // "EMAIL_EXISTS" 또는 "WEAK_PASSWORD : 설명" 꼴
            var code = m ? m[1] : (em && em.status) || '';
            throw CloudError(msg, r.status, code);
          }
          return j;
        });
      });
    }
    function authUrl(path) { return hosts.auth + '/v1/' + path + '?key=' + encodeURIComponent(apiKey); }

    function refresh() {
      if (refreshing) return refreshing;
      var rt = session && session.refreshToken;
      if (!rt) return Promise.reject(CloudError('로그인이 필요해요', 401, 'NO_SESSION'));
      var email = session.user && session.user.email;
      refreshing = http(hosts.token + '/v1/token?key=' + encodeURIComponent(apiKey), {
        method: 'POST',
        form: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(rt)
      }).then(function (d) {
        if (!d || !d.id_token) throw CloudError('세션을 갱신하지 못했어요', 401, 'BAD_REFRESH');
        var s = {
          idToken: d.id_token,
          refreshToken: d.refresh_token || rt,
          expiresAt: Date.now() + (+d.expires_in || 3600) * 1000,
          user: { id: d.user_id || session.user.id, email: email || '' }
        };
        writeSession(s);
        emit('TOKEN_REFRESHED');
        return s;
      }).catch(function (e) {
        if (DEAD_SESSION.indexOf(e.code) >= 0 || e.code === 'BAD_REFRESH') { writeSession(null); emit('SIGNED_OUT'); }
        throw e;
      }).then(function (s) { refreshing = null; return s; }, function (e) { refreshing = null; throw e; });
      return refreshing;
    }
    function token() {
      if (!session) return Promise.reject(CloudError('로그인이 필요해요', 401, 'NO_SESSION'));
      if (session.expiresAt - Date.now() > 60000) return Promise.resolve(session.idToken);
      return refresh().then(function (s) { return s.idToken; });
    }
    function authed(url, o, retried) {
      o = o || {};
      return token().then(function (t) {
        o.token = t;
        return http(url, o);
      }).catch(function (e) {
        if (e.status === 401 && !retried && session) {
          return refresh().then(function () { return authed(url, o, true); });
        }
        throw e;
      });
    }

    /* ---------- 인증 ---------- */
    function startSession(d) {
      var s = fromAuth(d);
      if (!s) throw CloudError('로그인하지 못했어요', 400, 'BAD_LOGIN');
      writeSession(s);
      emit('SIGNED_IN');
      return s;
    }
    function signUp(email, password) {
      return http(authUrl('accounts:signUp'), { method: 'POST', body: { email: email, password: password, returnSecureToken: true } })
        .then(function (d) { return { session: startSession(d), needsConfirm: false }; });
    }
    function signIn(email, password) {
      return http(authUrl('accounts:signInWithPassword'), { method: 'POST', body: { email: email, password: password, returnSecureToken: true } })
        .then(startSession);
    }
    function signOut() {
      writeSession(null);
      emit('SIGNED_OUT');
      return Promise.resolve();
    }
    function recover(email) {
      return http(authUrl('accounts:sendOobCode'), { method: 'POST', body: { requestType: 'PASSWORD_RESET', email: email } });
    }

    /* ---------- 게임 저장 (Firestore) ---------- */
    function docUrl() {
      return hosts.fs + '/v1/projects/' + encodeURIComponent(projectId) + '/databases/(default)/documents/game_saves/' + encodeURIComponent(session.user.id);
    }
    function loadSave() {
      if (!session) return Promise.reject(CloudError('로그인이 필요해요', 401, 'NO_SESSION'));
      return authed(docUrl()).then(function (doc) {
        var f = (doc && doc.fields) || {};
        var data = null;
        try { data = f.data && f.data.stringValue ? JSON.parse(f.data.stringValue) : null; } catch (e) {}
        var total = f.total ? (f.total.doubleValue !== undefined ? +f.total.doubleValue : +f.total.integerValue) : 0;
        return { data: data || {}, total: isFinite(total) ? total : 0, updated_at: doc.updateTime || '' };
      }).catch(function (e) {
        if (e.status === 404) return null;   // 아직 저장한 적 없음
        throw e;
      });
    }
    function saveGame(data, total, o) {
      if (!session) return Promise.reject(CloudError('로그인이 필요해요', 401, 'NO_SESSION'));
      return authed(docUrl(), {
        method: 'PATCH',
        body: { fields: { uid: { stringValue: session.user.id }, total: { doubleValue: +total || 0 }, data: { stringValue: JSON.stringify(data) } } },
        keepalive: !!(o && o.keepalive)
      });
    }

    return {
      session: function () { return session; },
      user: function () { return session ? session.user : null; },
      onChange: function (fn) {
        listeners.push(fn);
        return function () { listeners = listeners.filter(function (f) { return f !== fn; }); };
      },
      signUp: signUp, signIn: signIn, signOut: signOut, recover: recover,
      loadSave: loadSave, saveGame: saveGame
    };
  }

  var api = { create: create };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BananaCloud = api;
})(typeof window !== 'undefined' ? window : globalThis);
