// Service Worker para Push Notifications
const CACHE_NAME = 'cipherchat-v2';

// Instalar SW
self.addEventListener('install', (event) => {
    console.log('📲 SW Instalado');
    self.skipWaiting();
});

// Ativar SW
self.addEventListener('activate', (event) => {
    console.log('📲 SW Ativado');
    event.waitUntil(clients.claim());
});

// Push Notification - QUANDO RECEBE DO SERVIDOR
self.addEventListener('push', (event) => {
    console.log('📩 Push recebido!');
    
    let data = {};
    try {
        data = event.data?.json() || {};
    } catch (e) {
        data = { title: 'Nova mensagem', body: 'Você tem uma nova mensagem' };
    }
    
    const title = data.title || 'CipherChat';
    const options = {
        body: data.body || 'Nova mensagem recebida',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        vibrate: [200, 100, 200],
        tag: data.tag || 'msg-' + Date.now(),
        data: data.data || {},
        requireInteraction: true, // Fica até usuário clicar
        actions: [
            { action: 'open', title: '💬 Abrir' },
            { action: 'close', title: '✕ Fechar' }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(windowClients => {
                // Procurar janela aberta
                for (let client of windowClients) {
                    if (client.url.includes(urlToOpen) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Abrir nova janela
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});