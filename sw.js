// Service Worker pour Alerte Calendrier
const CACHE_NAME = 'alerte-calendrier-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png'
];

// Installation
self.addEventListener('install', event => {
    console.log('[SW] Installation...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Mise en cache des fichiers');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// Activation
self.addEventListener('activate', event => {
    console.log('[SW] Activation...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Suppression ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Interception des requêtes
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Retourner le cache si disponible, sinon fetch
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
            .catch(() => {
                // Fallback pour les pages hors ligne
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            })
    );
});

// Réception des messages du client
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
        const { title, body, delay, eventId } = event.data;
        
        // Programmer une notification
        setTimeout(() => {
            self.registration.showNotification(title, {
                body: body,
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                tag: eventId,
                requireInteraction: true,
                vibrate: [200, 100, 200, 100, 200],
                actions: [
                    { action: 'dismiss', title: 'OK' }
                ]
            });
        }, delay);
    }
});

// Gestion des clics sur notification
self.addEventListener('notificationclick', event => {
    console.log('[SW] Clic sur notification');
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                // Ouvrir l'app si pas déjà ouverte
                for (const client of clientList) {
                    if (client.url.includes('alerte-calendrier') && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
    );
});

// Sync périodique (si supporté)
self.addEventListener('periodicsync', event => {
    if (event.tag === 'check-calendar') {
        console.log('[SW] Sync périodique - vérification calendrier');
        event.waitUntil(checkCalendarEvents());
    }
});

// Fonction de vérification des événements
async function checkCalendarEvents() {
    // Cette fonction pourrait être étendue pour vérifier les événements
    // directement depuis le Service Worker
    console.log('[SW] Vérification des événements calendrier');
}
