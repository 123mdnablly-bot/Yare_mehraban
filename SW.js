// ============ Service Worker یار مهربان ============
const CACHE_NAME = 'yare-mehraban-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './favicon-32x32.png'
];

// نصب: کش کردن فایل‌های اصلی
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker نصب شد');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache).catch(err => console.log('خطا در کش:', err)))
  );
  self.skipWaiting();
});

// فعال‌سازی: پاک کردن کش قدیمی
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker فعال شد');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// دریافت: استراتژی Network First (اول شبکه، بعد کش)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // برای درخواست‌های Supabase، مستقیم به شبکه برو
  if (event.request.url.includes('supabase.co')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // کش کردن نسخه جدید
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // اگه شبکه نبود، از کش بده
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // اگه کش هم نبود، صفحه اصلی رو بده
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
