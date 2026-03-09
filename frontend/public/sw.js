/**
 * SIGEC - Service Worker (PWA)
 * Cache inteligente + suporte offline básico + instalação PWA
 */

const CACHE_NAME = 'sigec-v3.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/js/api.js',
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap'
];

// ─── Install ──────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Instalando SIGEC PWA...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Cacheando assets estáticos');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      console.log('[SW] Instalação concluída');
      return self.skipWaiting();
    })
  );
});

// ─── Activate ─────────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Ativando nova versão...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => {
        console.log('[SW] Removendo cache antigo:', k);
        return caches.delete(k);
      }))
    ).then(() => {
      console.log('[SW] Ativação concluída');
      return self.clients.claim();
    })
  );
});

// ─── Fetch ────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls → Network first, sem cache
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        console.log('[SW] API offline, retornando erro');
        return new Response(
          JSON.stringify({ error: 'Sem conexão com a internet. Verifique sua conexão e tente novamente.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Assets estáticos → Cache first
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        console.log('[SW] Servindo do cache:', request.url);
        return cached;
      }
      
      return fetch(request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            console.log('[SW] Cacheando novo asset:', request.url);
            cache.put(request, clone);
          });
        }
        return response;
      }).catch(() => {
        // Fallback para index.html em modo offline
        if (request.destination === 'document') {
          console.log('[SW] Offline, servindo página cached');
          return caches.match('/index.html');
        }
      });
    })
  );
});

// ─── Background Sync ─────────────────────────────────────
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);
  if (event.tag === 'sync-vendas') {
    event.waitUntil(syncVendasOffline());
  }
});

async function syncVendasOffline() {
  console.log('[SW] Sincronizando vendas offline...');
  // Implementar sincronização de vendas offline quando disponível
}

// ─── Push Notifications ───────────────────────────────────
self.addEventListener('push', event => {
  console.log('[SW] Push notification recebida');
  if (!event.data) return;
  
  const data = event.data.json();
  self.registration.showNotification(data.title || 'SIGEC', {
    body: data.body || 'Nova notificação do sistema',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' }
  });
});

// ─── Notification Click ───────────────────────────────────
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notificação clicada');
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// ─── PWA Install Prompt ───────────────────────────────────
self.addEventListener('beforeinstallprompt', event => {
  console.log('[SW] PWA install prompt pronto');
  // Não previne o comportamento padrão para permitir instalação
});
