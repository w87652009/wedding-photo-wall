/**
 * ============================================================
 * 婚禮照片牆 — 共用 API 客戶端 api.js
 * ============================================================
 * 為什麼用 JSONP 而不是 fetch？
 *   GAS Web App 不會回 Access-Control-Allow-Origin，
 *   從 GitHub Pages 直接 fetch 會被瀏覽器擋掉（CORS）。
 *   JSONP 用 <script> 載入，不受 CORS 限制，是 GAS 的標準解法。
 *
 * 所有函式都回傳 Promise，用法與 fetch 類似。
 */

(function (global) {
  'use strict';

  var cfg = global.APP_CONFIG || {};
  var API_URL = cfg.API_URL || '';
  var seq = 0;

  /** 檢查設定是否填好 */
  function isConfigured() {
    return API_URL && API_URL.indexOf('PASTE_') === -1;
  }

  /**
   * 呼叫 GAS API。
   * @param {string} action 動作名稱
   * @param {object} params 額外參數
   * @param {string} token  存取碼
   * @param {number} timeoutMs 逾時（預設 15 秒）
   */
  function call(action, params, token, timeoutMs) {
    return new Promise(function (resolve, reject) {
      if (!isConfigured()) {
        reject(new Error('尚未設定 API_URL，請編輯 config.js'));
        return;
      }

      var cbName = '__gas_cb_' + (++seq) + '_' + Date.now();
      var script = document.createElement('script');
      var timer = null;
      var finished = false;

      function cleanup() {
        if (finished) return;
        finished = true;
        if (timer) clearTimeout(timer);
        try { delete global[cbName]; } catch (e) { global[cbName] = undefined; }
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      global[cbName] = function (data) {
        cleanup();
        if (data && data.ok === false) {
          reject(new Error(data.error || 'API 回傳錯誤'));
        } else {
          resolve(data);
        }
      };

      var qs = ['action=' + encodeURIComponent(action), 'callback=' + cbName];
      if (token) qs.push('token=' + encodeURIComponent(token));
      Object.keys(params || {}).forEach(function (k) {
        var v = params[k];
        if (v === undefined || v === null || v === '') return;
        qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
      });

      // 加時間戳避免瀏覽器快取
      qs.push('_t=' + Date.now());

      script.src = API_URL + (API_URL.indexOf('?') >= 0 ? '&' : '?') + qs.join('&');
      script.async = true;
      script.onerror = function () {
        cleanup();
        reject(new Error('無法連線到後端（請檢查網路或 API_URL）'));
      };

      timer = setTimeout(function () {
        cleanup();
        reject(new Error('後端回應逾時'));
      }, timeoutMs || 15000);

      document.head.appendChild(script);
    });
  }

  /* ---------- 投影端 ---------- */

  function getState(token, includeCounts) {
    return call('state', { includeCounts: includeCounts ? '1' : '' }, token);
  }

  function getPhotos(token, opts) {
    opts = opts || {};
    return call('photos', {
      since: opts.since || '',
      version: opts.version || ''
    }, token, 20000);
  }

  /* ---------- 審核端 / 管理端 ---------- */

  function getPending(token, includeRejected) {
    return call('pending', { includeRejected: includeRejected ? '1' : '' }, token, 20000);
  }

  function review(token, id, decision) {
    return call('review', { id: id, decision: decision }, token);
  }

  function remove(token, id) {
    return call('delete', { id: id }, token);
  }

  /* ---------- 管理端 ---------- */

  function setPlayback(token, value) {
    return call('setPlayback', { value: value }, token);
  }

  function setReviewMode(token, value) {
    return call('setReviewMode', { value: value }, token);
  }

  function setAnnouncement(token, value) {
    return call('setAnnouncement', { value: value }, token);
  }

  function getStats(token) {
    return call('stats', {}, token);
  }

  function ping() {
    return call('ping', {}, '');
  }

  /* ---------- 小工具 ---------- */

  /** 把秒數轉成「3 分鐘前」這種說法 */
  function timeAgo(iso) {
    if (!iso) return '';
    var diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 10) return '剛剛';
    if (diff < 60) return diff + ' 秒前';
    if (diff < 3600) return Math.floor(diff / 60) + ' 分鐘前';
    if (diff < 86400) return Math.floor(diff / 3600) + ' 小時前';
    return Math.floor(diff / 86400) + ' 天前';
  }

  /** 轉義 HTML，避免祝福文字破壞版面 */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  global.WeddingAPI = {
    isConfigured: isConfigured,
    call: call,
    getState: getState,
    getPhotos: getPhotos,
    getPending: getPending,
    review: review,
    remove: remove,
    setPlayback: setPlayback,
    setReviewMode: setReviewMode,
    setAnnouncement: setAnnouncement,
    getStats: getStats,
    ping: ping,
    timeAgo: timeAgo,
    esc: esc
  };
})(window);
