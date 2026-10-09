/**
 * Shared officer-chat helpers: unread counts, cross-tab ping, browser notifications.
 */
(function () {
  'use strict';

  var PING_KEY = 'ic3_chat_sync_ping';
  var appBadgeErrorReported = false;
  var serviceWorkerReady = null;

  if ('serviceWorker' in navigator && window.isSecureContext) {
    serviceWorkerReady = navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(function () { return navigator.serviceWorker.ready; })
      .catch(function (error) {
        console.warn('[Chat] Service worker registration failed:', error);
        return null;
      });
  }

  function lsGet(k) {
    try { return localStorage.getItem(k) || ''; } catch (e) { return ''; }
  }
  function lsSet(k, v) {
    try { localStorage.setItem(k, v); } catch (e) {}
  }
  function readStore(role) {
    try { return JSON.parse(lsGet('ic3_chat_read_' + role) || '{}') || {}; } catch (e) { return {}; }
  }
  function writeStore(role, obj) {
    lsSet('ic3_chat_read_' + role, JSON.stringify(obj || {}));
  }
  function seenStore(role) {
    try { return JSON.parse(lsGet('ic3_chat_seen_' + role) || '{}') || {}; } catch (e) { return {}; }
  }
  function writeSeen(role, obj) {
    lsSet('ic3_chat_seen_' + role, JSON.stringify(obj || {}));
  }

  function msgTime(m) {
    if (!m) return 0;
    var t = Date.parse(m.created_at || m.createdAt || '');
    return isNaN(t) ? 0 : t;
  }

  function countUnread(msgs, lastReadIso, otherSender) {
    var cutoff = lastReadIso ? Date.parse(lastReadIso) : 0;
    if (isNaN(cutoff)) cutoff = 0;
    var n = 0;
    (msgs || []).forEach(function (m) {
      if (m.sender !== otherSender) return;
      if (msgTime(m) > cutoff) n++;
    });
    return n;
  }

  function setAppBadge(count) {
    var unread = Math.max(0, Math.floor(Number(count) || 0));
    var action = unread > 0 ? 'setAppBadge' : 'clearAppBadge';
    try {
      if (typeof navigator[action] === 'function') {
        var result = unread > 0 ? navigator.setAppBadge(unread) : navigator.clearAppBadge();
        if (result && typeof result.catch === 'function') {
          result.catch(function (error) {
            if (!appBadgeErrorReported) {
              appBadgeErrorReported = true;
              console.warn('[Chat] App icon badge update failed:', error);
            }
          });
        }
      }
    } catch (error) {
      if (!appBadgeErrorReported) {
        appBadgeErrorReported = true;
        console.warn('[Chat] App icon badge update failed:', error);
      }
    }
    var controller = navigator.serviceWorker && navigator.serviceWorker.controller;
    if (controller) {
      controller.postMessage({ type: 'ic3-set-app-badge', count: unread });
    } else if (serviceWorkerReady) {
      serviceWorkerReady.then(function (registration) {
        if (registration && registration.active) {
          registration.active.postMessage({ type: 'ic3-set-app-badge', count: unread });
        }
      });
    }
  }

  var permissionAsked = false;

  var IC3Chat = {
    ping: function () {
      lsSet(PING_KEY, String(Date.now()));
    },
    getLastRead: function (role, ref) {
      if (!ref) return '';
      var store = readStore(role);
      return store[String(ref).toLowerCase()] || '';
    },
    markRead: function (role, ref) {
      if (!ref) return;
      var store = readStore(role);
      store[String(ref).toLowerCase()] = new Date().toISOString();
      writeStore(role, store);
    },
    countUnread: countUnread,
    setAppBadge: setAppBadge,
    otherSender: function (role) {
      return role === 'admin' ? 'user' : 'admin';
    },
    requestPermission: function () {
      if (typeof Notification === 'undefined') return;
      if (Notification.permission !== 'default') return;
      if (permissionAsked) return;
      permissionAsked = true;
      try {
        Notification.requestPermission().catch(function (error) {
          console.warn('[Chat] Notification permission request failed:', error);
        });
      } catch (e) {
        console.warn('[Chat] Notification permission request failed:', e);
      }
    },
    notifyNew: function (opts) {
      opts = opts || {};
      var role = opts.role || 'user';
      var ref = String(opts.ref || '').toLowerCase();
      var msgs = opts.messages || [];
      var other = IC3Chat.otherSender(role);
      var title = opts.title || 'New message';
      var open = !!opts.conversationOpen;
      if (!ref || !msgs.length) return 0;

      var unread = countUnread(msgs, IC3Chat.getLastRead(role, ref), other);
      if (open) {
        IC3Chat.markRead(role, ref);
        unread = 0;
      }

      var seen = seenStore(role);
      var lastSeen = Date.parse(seen[ref] || '') || 0;
      var newestOther = null;
      msgs.forEach(function (m) {
        if (m.sender !== other) return;
        if (!newestOther || msgTime(m) > msgTime(newestOther)) newestOther = m;
      });

      if (newestOther && msgTime(newestOther) > lastSeen) {
        seen[ref] = newestOther.created_at || new Date().toISOString();
        writeSeen(role, seen);
        if (!open && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          try {
            var body = String(newestOther.message || '').slice(0, 140);
            var n = new Notification(title, {
              body: body || 'You have a new message',
              tag: 'ic3-chat-' + role + '-' + ref,
              icon: 'images/ic3ratlogo.jpeg'
            });
            n.onclick = function () {
              window.focus();
              if (typeof opts.onClick === 'function') opts.onClick(ref);
              n.close();
            };
          } catch (e) {}
        }
      } else if (newestOther && !seen[ref]) {
        seen[ref] = newestOther.created_at;
        writeSeen(role, seen);
      }

      return unread;
    },
    notifyCaseUpdate: function (opts) {
      opts = opts || {};
      var ref = String(opts.ref || '').toLowerCase();
      var changes = Array.isArray(opts.changes) ? opts.changes : [];
      if (!ref || !changes.length) return;
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      try {
        var n = new Notification(opts.title || 'Your case was updated', {
          body: changes.join(', ') + '.',
          tag: 'ic3-case-update-' + ref,
          icon: 'images/ic3ratlogo.jpeg'
        });
        n.onclick = function () {
          window.focus();
          if (typeof opts.onClick === 'function') opts.onClick(ref);
          n.close();
        };
      } catch (e) {
        console.warn('[Chat] Case update notification failed:', e);
      }
    },
    formatClock: function (iso) {
      var d = iso ? new Date(iso) : new Date();
      if (isNaN(d.getTime())) return '';
      var now = new Date();
      var sameDay = d.toDateString() === now.toDateString();
      if (sameDay) {
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      }
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    },
    preview: function (text, n) {
      var s = String(text || '').replace(/\s+/g, ' ').trim();
      n = n || 48;
      return s.length > n ? s.slice(0, n) + '…' : s;
    },
    initials: function (name) {
      var parts = String(name || 'CL').trim().split(/\s+/);
      return ((parts[0] || 'C').charAt(0) + (parts[1] ? parts[1].charAt(0) : '')).toUpperCase();
    }
  };

  window.IC3Chat = IC3Chat;
})();
