// Service Worker - LocalEcomer Push Notifications
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      },
      actions: [
        { action: 'open', title: 'Ver Mensaje' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Fetch handler - Requerido para que la PWA sea considerada "instalable"
self.addEventListener('fetch', function(event) {
  // Por ahora no cacheamos nada agresivamente en desarrollo, 
  // pero el listener debe existir.
  return;
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
