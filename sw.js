/* 个人工作台 · Service Worker (App Shell + 智能缓存 + 后台同步) */
const CACHE = 'workbench-v48';
const PRE_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/extra.css',
  '/js/sync.js',
  '/js/app.js',
  '/js/charts.js',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/manifest.webmanifest',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRE_CACHE).catch(() => null)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Supabase API 和本地 API 代理始终走网络
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/api/')) return;

  // 跨域资源不缓存
  if (url.origin !== self.location.origin) return;

  // HTML 导航：网络优先，离线兜底；并校验响应有效性，避免冷启动返回的空/损坏页面导致白屏
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then((res) => {
          // 错误状态码（常见于 Render 冷启动被截断）一律回退到已缓存的 index.html
          if (!res || !res.ok) {
            return caches.match('/index.html').then((cached) => cached || res);
          }
          // 二次校验：克隆读取内容，过短（疑似损坏）则丢弃网络响应，用预缓存页面
          return res.clone().text().then((txt) => {
            if (txt.trim().length < 300) {
              return caches.match('/index.html').then((cached) => cached || res);
            }
            return res;
          });
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // 静态资源：网络优先（保证每次部署都拿到最新代码，根除旧缓存导致的"手机端不更新"）
  // 离线时回退到缓存，兼顾 PWA 可用性
  e.respondWith(
    caches.open(CACHE).then((cache) =>
      fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          // 不缓存明显损坏的响应（空/过短），防止坏资源污染缓存
          return res.clone().text().then((txt) => {
            if (txt.trim().length >= 50) cache.put(req, res.clone());
            return res;
          });
        }
        return res;
      }).catch(() => cache.match(req))
    )
  );
});

// 后台同步：当设备恢复联网时推送离线积累的数据
self.addEventListener('sync', (e) => {
  if (e.tag === 'wb-sync') {
    e.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'wb-background-sync' });
        });
      })
    );
  }
});

// 点击系统通知：聚焦已有窗口，否则打开工作台
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      const c = clients.find((x) => 'focus' in x) || clients[0];
      if (c) return c.focus();
      return self.clients.openWindow('/');
    })
  );
});
