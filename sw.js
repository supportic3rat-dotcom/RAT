/* Background Web Push handler for both dashboard roles. */
self.addEventListener('push', function (event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {
    data = { title: 'IC3 RAT update', body: event.data ? event.data.text() : '' };
  }
  var title = data.title || 'IC3 RAT update';
  var options = {
    body: data.body || 'There is an update to your case.',
    icon: data.icon || '/images/ic3ratlogo.png',
    badge: data.badge || '/images/favicon-192.png',
    tag: data.tag || 'ic3-rat-update',
    data: { url: data.url || '/dashboard.html' },
    renotify: true
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var target = event.notification.data && event.notification.data.url;
  if (!target) target = '/dashboard.html';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windows) {
    for (var i = 0; i < windows.length; i++) {
      if ('focus' in windows[i]) {
        windows[i].navigate(target);
        return windows[i].focus();
      }
    }
    return clients.openWindow(target);
  }));
});
