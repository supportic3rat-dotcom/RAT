(function () {
  'use strict';

  var deferredPrompt = null;
  var isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  var isAndroid = /android/i.test(window.navigator.userAgent);
  var isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferredPrompt = event;
  });

  function hide(id) {
    var prompt = document.getElementById(id);
    if (prompt) prompt.classList.remove('show');
  }

  window.showPwaInstallPrompt = function (id) {
    var prompt = document.getElementById(id);
    if (!prompt || isStandalone || sessionStorage.getItem('ic3_pwa_prompt_dismissed') === '1') return;
    var text = prompt.querySelector('[data-pwa-copy]');
    var button = prompt.querySelector('[data-pwa-install]');
    if (isIos) {
      if (text) text.innerHTML = 'For reliable notifications on iPhone or iPad: open this page in <strong>Safari</strong>, tap <strong>Share</strong>, choose <strong>Add to Home Screen</strong>, then open the new app from your Home Screen and allow notifications. Chrome on iPhone cannot complete the full push setup by itself.';
      if (button) button.textContent = 'Got it';
    } else if (isAndroid) {
      if (text) text.innerHTML = 'In Chrome on Android, tap the <strong>⋮ menu</strong>, choose <strong>Install app</strong> or <strong>Add to Home screen</strong>, confirm, then open the new app from your Home Screen and allow notifications.';
      if (button && !deferredPrompt) button.textContent = 'Got it';
    } else if (!deferredPrompt) {
      if (text) text.textContent = 'Use your browser menu and choose “Install app” or “Add to Home Screen”, then open the new app and allow notifications for reliable updates.';
      if (button) button.textContent = 'Got it';
    }
    prompt.classList.add('show');
  };

  window.installPwaOrDismiss = async function (id) {
    if (!deferredPrompt) {
      hide(id);
      sessionStorage.setItem('ic3_pwa_prompt_dismissed', '1');
      return;
    }
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    hide(id);
    sessionStorage.setItem('ic3_pwa_prompt_dismissed', '1');
  };

  window.dismissPwaInstallPrompt = function (id) {
    hide(id);
    sessionStorage.setItem('ic3_pwa_prompt_dismissed', '1');
  };
}());
