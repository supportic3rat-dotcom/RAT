/* Browser subscription helper. VAPID public key is safe to expose here. */
(function () {
  'use strict';

  function config() { return window.SUPABASE_CONFIG || {}; }
  function vapidKey() { return config().webPushVapidPublicKey || ''; }
  function base64ToBytes(value) {
    var padding = '='.repeat((4 - value.length % 4) % 4);
    var raw = atob((value + padding).replace(/-/g, '+').replace(/_/g, '/'));
    var bytes = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return bytes;
  }

  async function register(role, ref) {
    if (!ref || !vapidKey() || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return false;
    if (Notification.permission === 'default') {
      try { await Notification.requestPermission(); } catch (error) {
        console.warn('[Push] Notification permission request failed:', error);
        return false;
      }
    }
    if (Notification.permission !== 'granted') return false;
    var registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    var subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64ToBytes(vapidKey())
    });
    var cfg = config();
    var response = await fetch(cfg.url.replace(/\/$/, '') + '/functions/v1/push-subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': cfg.anonKey,
        'Authorization': 'Bearer ' + cfg.anonKey
      },
      body: JSON.stringify({ role: role, ref: String(ref).toLowerCase(), subscription: subscription.toJSON() })
    });
    if (!response.ok) throw new Error('Push subscription could not be saved.');
    return true;
  }

  window.IC3Push = {
    register: function (role, ref) {
      return register(role, ref).catch(function (error) {
        console.warn('[Push] Subscription setup failed:', error);
        return false;
      });
    }
  };
})();
