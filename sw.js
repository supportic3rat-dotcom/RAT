/* Background Web Push and installed-app badge handler for both dashboard roles. */
var BADGE_DB_NAME = 'ic3-rat-app-badge';
var BADGE_STORE_NAME = 'state';

function updateStoredBadge(update) {
  return new Promise(function (resolve, reject) {
    var request = indexedDB.open(BADGE_DB_NAME, 1);
    request.onupgradeneeded = function () {
      request.result.createObjectStore(BADGE_STORE_NAME, { keyPath: 'key' });
    };
    request.onerror = function () { reject(request.error); };
    request.onsuccess = function () {
      var db = request.result;
      var transaction = db.transaction(BADGE_STORE_NAME, 'readwrite');
      var store = transaction.objectStore(BADGE_STORE_NAME);
      var getRequest = store.get('unread');
      var nextCount = 0;
      getRequest.onsuccess = function () {
        var currentCount = getRequest.result ? getRequest.result.count : 0;
        nextCount = Math.max(0, Math.floor(update(currentCount) || 0));
        store.put({ key: 'unread', count: nextCount });
      };
      transaction.oncomplete = function () {
        db.close();
        resolve(nextCount);
      };
      transaction.onerror = function () {
        db.close();
        reject(transaction.error);
      };
      transaction.onabort = function () {
        db.close();
        reject(transaction.error);
      };
    };
  });
}

function applyPlatformBadge(count) {
  var badgeNavigator = self.navigator;
  var method = count > 0 ? 'setAppBadge' : 'clearAppBadge';
  try {
    if (badgeNavigator && typeof badgeNavigator[method] === 'function') {
      var result = count > 0 ? badgeNavigator.setAppBadge(count) : badgeNavigator.clearAppBadge();
      return Promise.resolve(result).catch(function (error) {
        console.warn('[PWA] App icon badge update failed:', error);
      });
    }
    if (self.registration && typeof self.registration[method] === 'function') {
      var registrationResult = count > 0
        ? self.registration.setAppBadge(count)
        : self.registration.clearAppBadge();
      return Promise.resolve(registrationResult).catch(function (error) {
        console.warn('[PWA] App icon badge update failed:', error);
      });
    }
  } catch (error) {
    console.warn('[PWA] App icon badge update failed:', error);
  }
  return Promise.resolve();
}

self.addEventListener('message', function (event) {
  var data = event.data || {};
  if (data.type !== 'ic3-set-app-badge') return;
  var count = Math.max(0, Math.floor(Number(data.count) || 0));
  event.waitUntil(updateStoredBadge(function () { return count; }).then(applyPlatformBadge).catch(function (error) {
    console.warn('[PWA] Could not save app icon badge count:', error);
  }));
});

self.addEventListener('push', function (event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {
    data = { title: 'IC3 RAT update', body: event.data ? event.data.text() : '' };
  }
  var title = data.title || 'IC3 RAT update';
  var options = {
    body: data.body || 'There is an update to your case.',
    icon: data.icon || '/images/favicon-192.8aaa0.png',
    badge: data.badge || '/images/favicon-192.8aaa0.png',
    tag: data.tag || 'ic3-rat-update',
    data: { url: data.url || '/dashboard.html' },
    renotify: true
  };
  event.waitUntil(updateStoredBadge(function (count) { return count + 1; }).then(function (count) {
    return applyPlatformBadge(count);
  }).catch(function (error) {
    console.warn('[PWA] Could not update app badge for push:', error);
  }).then(function () {
    return self.registration.showNotification(title, options);
  }));
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
