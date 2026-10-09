import os
import re

rootDir = os.path.abspath('.')

MODAL_STYLE = '''
<style id="modal-fix">
/* ── File-a-Complaint Modal — definitive override ── */
#fileTerms {
  display: none !important;
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  margin: 0 !important;
  padding: 0 !important;
  background: rgba(0,0,0,0.9) !important;
  backdrop-filter: blur(6px) !important;
  -webkit-backdrop-filter: blur(6px) !important;
  z-index: 2147483647 !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
  border: none !important;
  border-radius: 0 !important;
  max-width: none !important;
  max-height: none !important;
}
#fileTerms.is-visible {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}
#fileTerms > .usa-modal__content {
  display: block !important;
  position: relative !important;
  inset: auto !important;
  background: #ffffff !important;
  border-radius: 12px !important;
  border: none !important;
  box-shadow: 0 24px 80px rgba(0,0,0,0.95) !important;
  width: calc(100% - 2rem) !important;
  max-width: 660px !important;
  max-height: 82vh !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  scroll-behavior: auto !important;
  padding: 2rem !important;
  margin: 0 auto !important;
  flex-shrink: 0 !important;
  z-index: auto !important;
}
#fileTerms > .usa-modal__content > .usa-modal__main {
  padding: 0 !important;
  margin: 0 !important;
  width: 100% !important;
}

/* ── Force Crisp Black Text across Terms Modal ── */
#fileTerms,
#fileTerms > .usa-modal__content,
#fileTerms > .usa-modal__content > .usa-modal__main,
#fileTerms .font-serif-sm,
#fileTerms .font-serif-sm *,
#fileTerms p,
#fileTerms li,
#fileTerms ul,
#fileTerms span,
#fileTerms strong,
#fileTerms div:not(.usa-alert--warning *) {
  color: #000000 !important;
}

/* Title 18 Citation in Black Bold */
#fileTerms cite {
  color: #000000 !important;
  font-weight: 700 !important;
  font-style: normal !important;
}

#fileTerms .usa-alert--warning {
  background-color: #fef3c7 !important;
  border-left: 4px solid #d97706 !important;
  border-radius: 6px !important;
  padding: 1rem !important;
  margin-bottom: 1rem !important;
}
#fileTerms .usa-alert--warning .usa-alert__heading,
#fileTerms .usa-alert--warning h4,
#fileTerms #fileTermsHeading {
  color: #92400e !important;
  font-weight: 700 !important;
}
#fileTerms .usa-alert--warning .usa-alert__text,
#fileTerms .usa-alert--warning p {
  color: #78350f !important;
}

#fileTerms a,
#fileTerms .font-serif-sm a {
  color: #005ea2 !important;
  text-decoration: underline !important;
}

#fileTerms .usa-modal__footer {
  margin-top: 1.5rem !important;
  padding-top: 1rem !important;
  border-top: 1px solid #e2e8f0 !important;
}

#fileTerms #acceptFile,
#fileTerms .usa-button[id="acceptFile"] {
  background-color: #d9381e !important;
  color: #ffffff !important;
  border: none !important;
}

#fileTerms .usa-button--base {
  background-color: #f1f5f9 !important;
  color: #0f172a !important;
  border: 1px solid #cbd5e1 !important;
}

body.is-modal-open {
  overflow: hidden !important;
}
</style>'''

updated = 0

for root, dirs, files in os.walk(rootDir):
    if 'node_modules' in root or '.git' in root:
        continue
    for f in files:
        if f.endswith('.html'):
            filepath = os.path.join(root, f)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as fl:
                html = fl.read()

            if 'id="fileTerms"' not in html:
                continue

            # Remove all old modal-fix style blocks
            html = re.sub(r'<style id="modal-fix">[\s\S]*?<\/style>\s*', '', html)

            # Inject just before </body>
            if '</body>' in html:
                html = html.replace('</body>', MODAL_STYLE + '\n</body>', 1)
                with open(filepath, 'w', encoding='utf-8') as fl:
                    fl.write(html)
                updated += 1
                rel = os.path.relpath(filepath, rootDir)
                print(f'✓ {rel}')

print(f'\nDone — updated {updated} files with black text styles for terms modal.')
