self.addEventListener('push', function (event) {
  var data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Five Lundi', {
      body: data.body || '',
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: 'five-lundi-sub',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow('./'));
});
