/**
 * ============================================================
 * 婚禮照片牆 — 前端設定檔 config.js
 * ============================================================
 * ⚠️ 這是唯一需要你手動修改的前端檔案。
 * 部署前把下面三個值填好，再 push 到 GitHub。
 *
 * API_URL：GAS 部署後的 Web App 網址（結尾是 /exec）
 * TOKEN  ：三組存取碼，分別給三個頁面用
 *          （投影端 index.html 用 PROJECTOR，控制台用 ADMIN，審核頁用 REVIEWER）
 *
 * 注意：前端檔案是公開的（GitHub Pages），
 * 所以 token 會出現在原始碼裡。這是刻意的取捨：
 * 婚禮只有一天，token 只保護「不要被亂改」，
 * 不是保護機密資料。婚禮結束後把 GAS 部署撤銷即可。
 */

window.APP_CONFIG = {
  // 例：https://script.google.com/macros/s/AKfycbxxxxxxxxxxxx/exec
  API_URL: 'PASTE_YOUR_GAS_WEB_APP_URL_HERE',

  // 投影端（大螢幕、新娘休息室平板）
  TOKEN_PROJECTOR: 'PASTE_PROJECTOR_TOKEN_HERE',

  // 管理端（新郎新娘）
  TOKEN_ADMIN: 'PASTE_ADMIN_TOKEN_HERE',

  // 審核端（伴娘伴郎）
  TOKEN_REVIEWER: 'PASTE_REVIEWER_TOKEN_HERE',

  // 輪詢間隔（秒）。10 秒是安全值，不要低於 10。
  POLL_SECONDS: 10,

  // 每張照片停留秒數
  SLIDE_SECONDS: 8,

  // 新照片插播時，插到第幾張之後（0 = 下一張就播）
  INSERT_AFTER: 0,

  // 婚禮資訊（投影端標題用）
  COUPLE_NAMES: '新郎 & 新娘',
  WEDDING_DATE_TEXT: '2027.05.15'
};
