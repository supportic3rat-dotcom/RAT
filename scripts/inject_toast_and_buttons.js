/**
 * 1. Restyle all "File a Complaint" / complaint-trigger buttons → red bg, white text, "File A Report"
 * 2. Inject the live recovery toast notification system into every HTML page
 */
const fs = require('fs');
const path = require('path');

const rootDir = '/Users/brendan/Downloads/ic3rat';

// ─── Toast + Recovery Notification Script ───────────────────────────────────
const TOAST_SCRIPT = `
<style id="recovery-toast-style">
#recovery-toast-container {
  position: fixed;
  bottom: 1.25rem;
  left: 1.25rem;
  z-index: 999999999;
  display: flex;
  flex-direction: column-reverse;
  gap: 0.65rem;
  max-width: 340px;
  pointer-events: none;
}
.rc-toast {
  background: #0f1f35;
  border: 1px solid #1e3a5f;
  border-left: 4px solid #10b981;
  border-radius: 10px;
  padding: 0.85rem 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.55);
  pointer-events: all;
  animation: rcSlideIn 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards;
  opacity: 0;
}
.rc-toast.rc-hide {
  animation: rcSlideOut 0.32s ease forwards;
}
@keyframes rcSlideIn {
  from { opacity:0; transform: translateX(-30px) scale(0.95); }
  to   { opacity:1; transform: translateX(0) scale(1); }
}
@keyframes rcSlideOut {
  from { opacity:1; transform: translateX(0) scale(1); }
  to   { opacity:0; transform: translateX(-30px) scale(0.9); }
}
.rc-toast-icon {
  width: 36px; height: 36px; border-radius: 50%;
  background: rgba(16,185,129,0.15);
  border: 1px solid rgba(16,185,129,0.4);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  font-size: 1rem;
}
.rc-toast-body { flex: 1; min-width: 0; }
.rc-toast-label {
  font-size: 0.67rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #10b981;
  margin-bottom: 0.15rem;
}
.rc-toast-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.1rem;
  line-height: 1.3;
}
.rc-toast-sub {
  font-size: 0.76rem;
  color: #93b3d8;
}
.rc-toast-amount {
  color: #34d399;
  font-weight: 800;
}
.rc-toast-close {
  background: none; border: none; cursor: pointer;
  color: #64748b; font-size: 1rem; line-height: 1;
  padding: 0; flex-shrink: 0; pointer-events: all;
}
.rc-toast-close:hover { color: #fff; }
</style>

<div id="recovery-toast-container"></div>

<script id="recovery-toast-script">
(function(){
  var firstNames = ['James','Patricia','Robert','Michael','Jennifer','Linda','Barbara','John','David','Sarah','Emily','Daniel','Kevin','Ashley','Jessica','William','Thomas','Charles','Dorothy','Karen','Lisa','Nancy','Betty','Sandra','Margaret','Richard','Joseph','Mark','Christopher','Maria','Susan','Michelle','Matthew','Anthony','Amy','Angela','Laura','Carol','Ruth','Amanda','Anna','Rebecca','Katherine','Sharon','Shirley','Virginia'];
  var lastNames = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Wilson','Martinez','Anderson','Taylor','Thomas','Hernandez','Moore','Martin','Jackson','Thompson','White','Lopez','Lee','Gonzalez','Harris','Clark','Lewis','Robinson','Walker','Perez','Hall','Young','Allen','Sanchez','Wright','King','Scott','Green','Baker','Adams','Nelson','Hill'];
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

  function rand(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function randAmount(){
    var tiers = [
      [8000,49999],[50000,199999],[200000,750000],[800000,2500000]
    ];
    var tier = rand(tiers);
    var amt = Math.floor(Math.random()*(tier[1]-tier[0])+tier[0]);
    return amt.toLocaleString('en-US');
  }
  function randName(){ return rand(firstNames)+' '+rand(lastNames[0])+'.'; }
  function randCountry(){ return rand(countries); }

  function showToast(){
    var container = document.getElementById('recovery-toast-container');
    if(!container) return;

    var country = randCountry();
    var cityArr = cities[country] || cities.default;
    var location = (cityArr.length ? rand(cityArr)+', ' : '') + country;
    var name = randName();
    var amount = randAmount();
    var now = new Date();
    var timeStr = now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});

    var toast = document.createElement('div');
    toast.className = 'rc-toast';
    toast.innerHTML =
      '<div class="rc-toast-icon">🔒</div>'+
      '<div class="rc-toast-body">'+
        '<div class="rc-toast-label">✓ Recovery Confirmed</div>'+
        '<div class="rc-toast-title">We recovered <span class="rc-toast-amount">$'+amount+'</span> for '+name+'</div>'+
        '<div class="rc-toast-sub">📍 '+location+' &nbsp;·&nbsp; '+timeStr+'</div>'+
      '</div>'+
      '<button class="rc-toast-close" aria-label="Dismiss">×</button>';

    container.appendChild(toast);

    // Close button
    toast.querySelector('.rc-toast-close').addEventListener('click',function(){
      dismissToast(toast);
    });

    // Auto dismiss after 6s
    var timer = setTimeout(function(){ dismissToast(toast); }, 6000);
    toast.addEventListener('mouseenter',function(){ clearTimeout(timer); });
    toast.addEventListener('mouseleave',function(){ timer = setTimeout(function(){ dismissToast(toast); }, 3000); });

    // Max 4 toasts visible
    var toasts = container.querySelectorAll('.rc-toast:not(.rc-hide)');
    if(toasts.length > 4) dismissToast(toasts[0]);
  }

  function dismissToast(toast){
    toast.classList.add('rc-hide');
    setTimeout(function(){ if(toast.parentNode) toast.parentNode.removeChild(toast); }, 350);
  }

  // Show first toast after 3s, then every 9–18s randomly
  function scheduleNext(){
    var delay = 9000 + Math.random()*9000;
    setTimeout(function(){ showToast(); scheduleNext(); }, delay);
  }

  setTimeout(function(){ showToast(); scheduleNext(); }, 3000);
})();
</script>`;

// ─── helpers ────────────────────────────────────────────────────────────────
function getAllHtmlFiles(dir, list=[]) {
  for (const e of fs.readdirSync(dir, {withFileTypes:true})) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules') getAllHtmlFiles(full, list);
    else if (e.isFile() && e.name.endsWith('.html')) list.push(full);
  }
  return list;
}

const files = getAllHtmlFiles(rootDir);
let toastUpdated = 0, btnUpdated = 0;

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  let orig = html;

  // ── 1. Remove old toast injection ───────────────────────────────────
  html = html.replace(/<style id="recovery-toast-style">[\s\S]*?<\/style>\s*/g, '');
  html = html.replace(/<div id="recovery-toast-container"><\/div>\s*/g, '');
  html = html.replace(/<script id="recovery-toast-script">[\s\S]*?<\/script>\s*/g, '');

  // ── 2. Inject toast before </body> ──────────────────────────────────
  if (html.includes('</body>')) {
    html = html.replace('</body>', TOAST_SCRIPT + '\n</body>');
    toastUpdated++;
  }

  // ── 3. Restyle all complaint-trigger buttons ────────────────────────
  // Patterns to match & transform:

  // (a) <button ... data-open-modal ... aria-controls="fileTerms"...>...</button>
  html = html.replace(
    /(<button[^>]*(?:data-open-modal|aria-controls="fileTerms")[^>]*>)\s*[^<]*\s*(<\/button>)/gi,
    (match, open, close) => {
      // inject red style
      let tag = open
        .replace(/style="[^"]*"/i, '')
        .replace(/class="([^"]*)"/i, (m, cls) => {
          // remove any existing background color classes, add red
          return `class="${cls}"`;
        });
      // force inline style red
      if (!/style=/i.test(tag)) {
        tag = tag.replace('>', ' style="background:#d9381e!important;color:#ffffff!important;border:none!important;">');
      } else {
        tag = tag.replace(/style="([^"]*)"/i, 'style="$1;background:#d9381e!important;color:#ffffff!important;border:none!important;"');
      }
      return tag + 'File A Report' + close;
    }
  );

  // (b) <a ... href="#fileTerms" or aria-controls="fileTerms" ...>...</a>
  html = html.replace(
    /(<a[^>]*(?:href="#fileTerms"|aria-controls="fileTerms")[^>]*>)\s*[^<]*\s*(<\/a>)/gi,
    (match, open, close) => {
      let tag = open;
      if (!/style=/i.test(tag)) {
        tag = tag.replace('>', ' style="background:#d9381e!important;color:#ffffff!important;border-radius:4px;padding:0.5rem 1.25rem;font-weight:700;text-decoration:none;">');
      } else {
        tag = tag.replace(/style="([^"]*)"/i, 'style="$1;background:#d9381e!important;color:#ffffff!important;">');
      }
      return tag + 'File A Report' + close;
    }
  );

  // (c) <a href="complaint.html" ...>, <a href="complaint_form.html"...>  — nav links and CTAs
  html = html.replace(
    /(<a[^>]*href="(?:\.\.\/)*complaint(?:_form)?\.html"[^>]*>)\s*([^<]*)\s*(<\/a>)/gi,
    (match, open, text, close) => {
      // Only restyle if it looks like a CTA (has btn class or no class) — skip footer plain links
      if (/usa-footer__secondary-link|footer-link/i.test(open)) return match;
      let tag = open;
      if (!/style=/i.test(tag)) {
        tag = tag.replace('>', ' style="background:#d9381e!important;color:#ffffff!important;border-radius:4px;padding:0.6rem 1.4rem;font-weight:700;text-decoration:none;">');
      } else {
        tag = tag.replace(/style="([^"]*)"/i, 'style="$1;background:#d9381e!important;color:#ffffff!important;">');
      }
      return tag + 'File A Report' + close;
    }
  );

  // (d) acceptFile button (the modal accept button)
  html = html.replace(
    /(<button[^>]*id="acceptFile"[^>]*>)\s*[^<]*\s*(<\/button>)/gi,
    (match, open, close) => {
      let tag = open;
      if (!/style=/i.test(tag)) {
        tag = tag.replace('>', ' style="background:#d9381e!important;color:#ffffff!important;border:none!important;">');
      } else {
        tag = tag.replace(/style="([^"]*)"/i, 'style="$1;background:#d9381e!important;color:#ffffff!important;">');
      }
      return tag + 'Accept & File A Report' + close;
    }
  );

  if (html !== orig) {
    fs.writeFileSync(file, html, 'utf8');
    btnUpdated++;
  }
}

console.log(`Toast injected into ${toastUpdated} files.`);
console.log(`Buttons restyled in ${btnUpdated} files.`);
console.log('Done.');
