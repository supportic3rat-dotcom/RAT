/**
 * FBI IC3 RAT - Live Recovery Toast Notification System
 * Features: Official FBI Seal / Logo Icon, TrustedTypes / CSP Compliant, Safe DOM Node Construction
 */
(function () {
  'use strict';

  // Do not run on client dashboard or admin console pages
  var path = (window.location.pathname || '').toLowerCase();
  if (path.includes('dashboard') || path.includes('admin')) {
    return;
  }

  if (window.__IC3_RECOVERY_TOAST_INITIALIZED__) return;
  window.__IC3_RECOVERY_TOAST_INITIALIZED__ = true;

  function injectToastStyles() {
    if (document.getElementById('recovery-toast-runtime-style')) return;
    var css = [
      '#recovery-toast-container{position:fixed!important;bottom:1.25rem!important;left:1.25rem!important;z-index:999999999!important;display:flex!important;flex-direction:column-reverse!important;gap:0.65rem!important;max-width:350px!important;pointer-events:none!important;}',
      '.rc-toast{background:#0b1526!important;border:1px solid #1e293b!important;border-left:4px solid #94a3b8!important;border-radius:10px!important;padding:0.85rem 1rem!important;display:flex!important;align-items:flex-start!important;gap:0.75rem!important;box-shadow:0 10px 30px rgba(0,0,0,0.75)!important;pointer-events:all!important;animation:rcSlideIn 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards!important;opacity:0;font-family:system-ui,-apple-system,sans-serif!important;}',
      '.rc-toast.rc-hide{animation:rcSlideOut 0.32s ease forwards!important;}',
      '@keyframes rcSlideIn{from{opacity:0;transform:translateX(-30px) scale(0.95)}to{opacity:1;transform:translateX(0) scale(1)}}',
      '@keyframes rcSlideOut{from{opacity:1;transform:translateX(0) scale(1)}to{opacity:0;transform:translateX(-30px) scale(0.9)}}',
      '.rc-toast-icon{width:38px!important;height:38px!important;border-radius:50%!important;background:rgba(255,255,255,0.08)!important;border:1px solid rgba(255,255,255,0.25)!important;display:flex!important;align-items:center!important;justify-content:center!important;flex-shrink:0!important;padding:2px!important;box-sizing:border-box!important;}',
      '.rc-toast-fbi-seal{width:100%!important;height:100%!important;object-fit:contain!important;border-radius:50%!important;display:block!important;filter:none!important;}',
      '.rc-toast-body{flex:1!important;min-width:0!important;}',
      '.rc-toast-label{font-size:0.68rem!important;font-weight:700!important;text-transform:uppercase!important;letter-spacing:1px!important;color:#cbd5e1!important;margin-bottom:0.2rem!important;}',
      '.rc-toast-title{font-size:0.88rem!important;font-weight:700!important;color:#ffffff!important;margin-bottom:0.15rem!important;line-height:1.3!important;}',
      '.rc-toast-sub{font-size:0.76rem!important;color:#94a3b8!important;}',
      '.rc-toast-amount{color:#38bdf8!important;font-weight:800!important;}',
      '.rc-toast-close{background:none!important;border:none!important;cursor:pointer!important;color:#64748b!important;font-size:1.25rem!important;line-height:1!important;padding:0!important;flex-shrink:0!important;pointer-events:all!important;}'
    ].join('');
    var style = document.createElement('style');
    style.id = 'recovery-toast-runtime-style';
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }
  injectToastStyles();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectToastStyles);
  }

  var firstNames = [
    'James','Patricia','Robert','Michael','Jennifer','Linda','Barbara','John','David',
    'Sarah','Emily','Daniel','Kevin','Ashley','Jessica','William','Thomas','Charles',
    'Dorothy','Karen','Lisa','Nancy','Betty','Sandra','Margaret','Richard','Joseph',
    'Mark','Christopher','Maria','Susan','Michelle','Matthew','Anthony','Amy','Angela',
    'Laura','Carol','Ruth','Amanda','Anna','Rebecca','Katherine','Sharon','Shirley','Virginia'
  ];
  
  var lastNames = [
    'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Wilson',
    'Martinez','Anderson','Taylor','Thomas','Hernandez','Moore','Martin','Jackson',
    'Thompson','White','Lopez','Lee','Gonzalez','Harris','Clark','Lewis','Robinson',
    'Walker','Perez','Hall','Young','Allen','Sanchez','Wright','King','Scott','Green',
    'Baker','Adams','Nelson','Hill'
  ];

  var countries = [
    'United States','United States','United States','United States','Canada','Canada',
    'United Kingdom','Australia','Germany','France','Netherlands','Switzerland',
    'Singapore','Japan','South Korea','UAE','New Zealand','Sweden','Norway','Denmark',
    'Ireland','Spain','Italy','Belgium','Austria','Finland','Portugal','Mexico',
    'Brazil','South Africa','India','Israel'
  ];

  var cities = {
    'United States': ['New York','Los Angeles','Chicago','Houston','Phoenix','Philadelphia','San Antonio','San Diego','Dallas','San Jose','Austin','Jacksonville','Fort Worth','Columbus','Charlotte'],
    'Canada': ['Toronto','Vancouver','Montreal','Calgary','Ottawa','Edmonton','Winnipeg'],
    'United Kingdom': ['London','Manchester','Birmingham','Edinburgh','Glasgow','Leeds'],
    'Australia': ['Sydney','Melbourne','Brisbane','Perth','Adelaide'],
    'Germany': ['Berlin','Munich','Hamburg','Frankfurt','Cologne'],
    'France': ['Paris','Lyon','Marseille','Toulouse','Nice'],
    default: []
  };

  function rand(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function randAmount() {
    var tiers = [
      [8000, 49999],
      [50000, 199999],
      [200000, 750000],
      [800000, 2500000]
    ];
    var tier = rand(tiers);
    var amt = Math.floor(Math.random() * (tier[1] - tier[0]) + tier[0]);
    return amt.toLocaleString('en-US');
  }

  function randName() {
    return rand(firstNames) + ' ' + rand(lastNames)[0] + '.';
  }

  function randCountry() {
    return rand(countries);
  }

  function getImagesPrefix() {
    // 1. Check existing image or link hrefs in DOM for path prefix
    var existing = document.querySelector('img[src*="images/"], link[href*="images/"]');
    if (existing) {
      var attr = existing.getAttribute('src') || existing.getAttribute('href') || '';
      var idx = attr.indexOf('images/');
      if (idx !== -1) {
        return attr.substring(0, idx + 7);
      }
    }
    // 2. Check script tags
    var script = document.querySelector('script[src*="recovery-toast.js"], script[src*="site.js"]');
    if (script) {
      var s = script.getAttribute('src') || '';
      var jIdx = s.indexOf('js/');
      if (jIdx !== -1) {
        return s.substring(0, jIdx) + 'images/';
      }
    }
    return 'images/';
  }

  function getOrCreateContainer() {
    var c = document.getElementById('recovery-toast-container');
    if (!c && document.body) {
      c = document.createElement('div');
      c.id = 'recovery-toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  function createFBILogoElement() {
    var img = document.createElement('img');
    img.src = getImagesPrefix() + 'fbi_seal_new.8aaa0.png';
    img.alt = 'FBI Seal';
    img.className = 'rc-toast-fbi-seal';
    return img;
  }

  // VISIBLE duration for each toast (ms)
  var TOAST_VISIBLE_MS = 2000;
  // Slide-out animation duration (ms) — must match rcSlideOut
  var TOAST_SLIDEOUT_MS = 450;

  // Gap between toasts AFTER the previous one fully disappears:
  // index 0 = gap before 2nd toast, index 1+ = gap before every subsequent toast
  var GAP_SEQUENCE = [3000, 5000]; // 3s then 5s forever

  function showToast() {
    var container = getOrCreateContainer();
    if (!container) return;

    var country = randCountry();
    var cityArr = cities[country] || cities.default;
    var location = (cityArr.length ? rand(cityArr) + ', ' : '') + country;
    var name = randName();
    var amount = randAmount();
    var now = new Date();
    var timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    var toast = document.createElement('div');
    toast.className = 'rc-toast';

    var iconDiv = document.createElement('div');
    iconDiv.className = 'rc-toast-icon';
    iconDiv.appendChild(createFBILogoElement());

    var bodyDiv = document.createElement('div');
    bodyDiv.className = 'rc-toast-body';

    var labelDiv = document.createElement('div');
    labelDiv.className = 'rc-toast-label';
    labelDiv.textContent = '✓ Recovery Confirmed';

    var titleDiv = document.createElement('div');
    titleDiv.className = 'rc-toast-title';

    var recoveredText = document.createTextNode('We recovered ');
    var amountSpan = document.createElement('span');
    amountSpan.className = 'rc-toast-amount';
    amountSpan.textContent = '$' + amount;
    var forText = document.createTextNode(' for ' + name);

    titleDiv.appendChild(recoveredText);
    titleDiv.appendChild(amountSpan);
    titleDiv.appendChild(forText);

    var subDiv = document.createElement('div');
    subDiv.className = 'rc-toast-sub';
    subDiv.textContent = '📍 ' + location + '  ·  ' + timeStr;

    bodyDiv.appendChild(labelDiv);
    bodyDiv.appendChild(titleDiv);
    bodyDiv.appendChild(subDiv);

    var closeBtn = document.createElement('button');
    closeBtn.className = 'rc-toast-close';
    closeBtn.setAttribute('aria-label', 'Dismiss');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', function () {
      dismissToast(toast);
    });

    toast.appendChild(iconDiv);
    toast.appendChild(bodyDiv);
    toast.appendChild(closeBtn);

    container.appendChild(toast);

    // Auto-dismiss after fixed visible duration
    setTimeout(function () {
      dismissToast(toast);
    }, TOAST_VISIBLE_MS);
  }

  function dismissToast(toast) {
    if (!toast || toast.classList.contains('rc-hide')) return;
    toast.classList.add('rc-hide');
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, TOAST_SLIDEOUT_MS);
  }

  function scheduleLoop(gapIndex) {
    // Total wait = slide-out time + gap before next toast
    var gap = GAP_SEQUENCE[Math.min(gapIndex, GAP_SEQUENCE.length - 1)];
    var wait = TOAST_SLIDEOUT_MS + gap;
    setTimeout(function () {
      showToast();
      scheduleLoop(gapIndex + 1);
    }, wait);
  }

  function init() {
    // First toast appears 4 seconds after page load
    setTimeout(function () {
      showToast();
      // After it's visible for 2s + slides out (0.45s), then 3s gap → next
      scheduleLoop(0);
    }, 4000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
