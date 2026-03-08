/**
 * SIGEC - Service Worker (PWA)
 * Cache inteligente + suporte offline básico
 */

const CACHE_NAME = 'sigec-v2.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/css/style.css',
  '/src/js/app.js',
  '/src/js/pdv.js',
  '/src/js/api.js',
  '/manifest.json'
];

// ─── Install ──────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Cacheando assets estáticos');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate ─────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch ────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls → Network first, sem cache
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => new Response(
        JSON.stringify({ error: 'Sem conexão com a internet' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      ))
    );
    return;
  }

  // Assets estáticos → Cache first
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        // Fallback para index.html em modo offline
        if (request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// ─── Background Sync (futuro) ─────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-vendas') {
    console.log('[SW] Sincronizando vendas offline...');
  }
});

// ─── Push Notifications (futuro) ─────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  self.registration.showNotification(data.title || 'SIGEC', {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-96.png'
  });
});
