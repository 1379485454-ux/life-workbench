/* 个人工作台 · Service Worker (App Shell + 智能缓存) */
const CACHE = 'workbench-v2';
const PRE_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/supabase.min.js',
  '/js/sync.js',
  '/js/app.js',
  '/js/charts.js',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/manifest.webmanifest',
];

self.addEventListener('install', (e) => {
  // 不阻塞 install：个别资源 404 也不影响整体
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
  if (url.origin !== self.location.origin) return; // 跨域不处理
  if (url.pathname.startsWith('/api/')) return;     // 联网数据始终走网络

  // HTML 导航：网络优先，离线兜底
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('/index.html')));
    return;
  }

  // 静态资源：stale-while-revalidate（秒开 + 后台更新）
  e.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(req).then((cached) => {
        const network = fetch(req).then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            cache.put(req, res.clone());
          }
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    )
  );
});
