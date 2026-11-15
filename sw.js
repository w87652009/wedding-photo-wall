/**
 * ============================================================
 * 婚禮照片牆 — Service Worker（投影端離線快取）
 * ============================================================
 * 作用：
 *   1. 快取投影端頁面本身（index.html / config.js / api.js），
 *      斷網時重新整理也打得開。
 *   2. 快取看過的照片圖檔（Drive 縮圖 / GitHub raw），
 *      斷網時仍能繼續輪播已經播過的照片。
 *
 * 策略：
 *   - 頁面與程式碼：network-first（有網路就用最新版，沒網路用快取）
 *   - 圖片：cache-first（先看快取，沒有才抓網路，抓到就存）
 *
 * 注意：Service Worker 只在 HTTPS 或 localhost 生效，
 * GitHub Pages 是 HTTPS，沒問題。
 */

var VERSION = 'wedding-wall-v1';
var SHELL_CACHE = VERSION + '-shell';
var IMG_CACHE = VERSION + '-img';

// 只快取這些來源的圖片（避免把不相關的東西塞進快取）
var IMG_HOSTS = [
  'lh3.googleusercontent.com',
  'raw.githubusercontent.com',
  'drive.google.com'
];

// 頁面外殼
var SHELL_FILES = [
  './',
  './index.html',
  './config.js',
  './assets/api.js'
];

/* ---------- 安裝：預先快取外殼 ---------- */
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(function (cache) {
      // 個別 add，任何一個失敗都不會讓整個安裝失敗
      return Promise.all(SHELL_FILES.map(function (url) {
        return cache.add(url).catch(function () { /* 忽略單一失敗 */ });
      }));
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

/* ---------- 啟用：清掉舊版快取 ---------- */
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== SHELL_CACHE && k !== IMG_CACHE) return caches.delete(k);
        return null;
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/* ---------- 攔截請求 ---------- */
self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (e) { return; }

  // 1) 圖片：cache-first
  if (IMG_HOSTS.indexOf(url.hostname) >= 0) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // 2) 同源頁面 / 程式碼：network-first
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(req));
    return;
  }

  // 3) 其他（例如 GAS API 的 JSONP）→ 不攔截，直接走網路
});

/* ---------- 策略實作 ---------- */

function cacheFirst(req) {
  return caches.open(IMG_CACHE).then(function (cache) {
    return cache.match(req).then(function (hit) {
      if (hit) return hit;

      return fetch(req).then(function (res) {
        // 只快取成功的圖片
        if (res && res.status === 200) {
          // clone 一份存起來（body 只能讀一次）
          cache.put(req, res.clone()).catch(function () {});
        }
        return res;
      }).catch(function () {
        // 完全沒網路又沒快取 → 回一個透明像素，避免破圖
        return transparentPixel();
      });
    });
  });
}

function networkFirst(req) {
  return fetch(req).then(function (res) {
    if (res && res.status === 200) {
      var copy = res.clone();
      caches.open(SHELL_CACHE).then(function (cache) {
        cache.put(req, copy).catch(function () {});
      });
    }
    return res;
  }).catch(function () {
    return caches.match(req).then(function (hit) {
      if (hit) return hit;
      // 導覽請求失敗時，退回快取的首頁
      if (req.mode === 'navigate') {
        return caches.match('./index.html');
      }
      return new Response('', { status: 504, statusText: 'Offline' });
    });
  });
}

/** 1x1 透明 PNG（斷網且無快取時的替代圖） */
function transparentPixel() {
  var b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  var bin = atob(b64);
  var arr = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Response(arr, { headers: { 'Content-Type': 'image/png' } });
}

/* ---------- 讓頁面可以主動要求清快取 ---------- */
self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'CLEAR_IMG_CACHE') {
    caches.delete(IMG_CACHE).then(function () {
      if (event.source) event.source.postMessage({ type: 'IMG_CACHE_CLEARED' });
    });
  }
});
