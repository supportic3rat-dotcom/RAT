#!/usr/bin/env python3
"""Give written PSA pages the same site navbar as the rest of IC3 RAT."""
import os
import re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PSA_DIR = os.path.join(ROOT, 'PSA')


def prefixes(rel_path):
    depth = rel_path.count('/')
    p = '../' * depth if depth else ''
    return p


def navbar_html(p):
    return f'''    <a class="usa-skipnav" href="#main-content">Skip to content</a>
    <div class="usa-overlay"></div>
    <header id="ic3Header" class="usa-header usa-header--basic usa-header--megamenu desktop:margin-0">
        <div class="usa-nav-container">
            <div class="usa-navbar">
                <div class="usa-logo">
                    <a href="{p}index.html">
                        <img class="usa-footer__logo-img" src="{p}images/ic3ratlogo.jpeg" alt="IC3 RAT Logo" style="height:52px;width:auto;object-fit:contain;">
                    </a>
                    <em class="usa-logo__text"><a href="{p}Home/Index.html">FBI IC3 Recovery Asset Team (RAT)</a></em>
                </div>
                <button type="button" class="usa-menu-btn">Menu</button>
            </div>
            <nav aria-label="Primary navigation" class="usa-nav">
                <button type="button" class="usa-nav__close">
                    <svg width="24" height="24" viewbox="0 0 24 24" role="img">
                        <title>Close</title>
                        <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="#ffffff"></path>
                    </svg>
                </button>
                <ul class="usa-nav__primary usa-accordion">
                    <li class="usa-nav__primary-item">
                        <a class="usa-nav-link" data-open-modal aria-controls="fileTerms" href="#fileTerms" style="background:#d9381e!important;color:#ffffff!important;border-radius:4px;padding:0.5rem 1.25rem;font-weight:700;text-decoration:none;">File A Report</a>
                    </li>
                    <li class="usa-nav__primary-item">
                        <button type="button" class="usa-accordion__button usa-nav__link" aria-expanded="false" aria-controls="public-nav">
                            <span>Public Info</span>
                        </button>
                        <div id="public-nav" class="usa-nav__submenu usa-megamenu">
                            <div class="grid-row grid-gap-4">
                                <div class="usa-col">
                                    <ul class="usa-nav__submenu-list">
                                        <li class="usa-nav__submenu-item">
                                            <a href="{p}PSA.html">Public Service Announcements</a>
                                        </li>
                                        <li class="usa-nav__submenu-item">
                                            <a href="{p}Outreach/Brochures.html">Brochures</a>
                                        </li>
                                        <li class="usa-nav__submenu-item">
                                            <a href="{p}AnnualReport/Reports.html">Annual Reports</a>
                                        </li>
                                        <li class="usa-nav__submenu-item">
                                            <a href="{p}Outreach/Resources.html">Resources</a>
                                        </li>
                                        <li class="usa-nav__submenu-item">
                                            <a href="{p}Home/RAT.html">Recovery Asset Team (RAT)</a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </li>
                    <li class="usa-nav__primary-item">
                        <button type="button" class="usa-accordion__button usa-nav__link" aria-expanded="false" aria-controls="industry-nav">
                            <span>Industry Info</span>
                        </button>
                        <div id="industry-nav" class="usa-nav__submenu usa-megamenu">
                            <div class="grid-row grid-gap-4">
                                <div class="usa-col">
                                    <ul class="usa-nav__submenu-list">
                                        <li class="usa-nav__submenu-item">
                                            <a href="{p}CSA.html">Industry Alerts</a>
                                        </li>
                                        <li class="usa-nav__submenu-item">
                                            <a href="{p}ContactFBICyber.html">Contact FBI Cyber</a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </li>
                    <li class="usa-nav__primary-item">
                        <a class="usa-nav-link" href="{p}Outreach/PrivateSectorEngagement.html">Cyber Private Sector</a>
                    </li>
                    <li class="usa-nav__primary-item">
                        <button type="button" class="usa-accordion__button usa-nav__link" aria-expanded="false" aria-controls="crime-info-nav">
                            <span>Crime Info</span>
                        </button>
                        <div id="crime-info-nav" class="usa-nav__submenu usa-megamenu">
                            <div class="grid-row grid-gap-4">
                                <div class="usa-col">
                                    <ul class="usa-nav__submenu-list">
                                        <li class="usa-nav__submenu-item">
                                            <a href="{p}CrimeInfo/AccountTakeover.html">Account Takeover (ATO)</a>
                                        </li>
                                        <li class="usa-nav__submenu-item">
                                            <a href="{p}CrimeInfo/Botnet-DDoS.html">Botnet/DDoS/TDoS</a>
                                        </li>
                                        <li class="usa-nav__submenu-item">
                                            <a href="{p}CrimeInfo/BEC.html">Business Email Compromise (BEC)</a>
                                        </li>
                                        <li class="usa-nav__submenu-item">
                                            <a href="{p}CrimeInfo/ChineseAuthorityImpersonation.html">Chinese Authority Impersonation</a>
                                        </li>
                                        <li class="usa-nav__submenu-item">
                                            <a href="{p}CrimeInfo/Cryptocurrency.html">Cryptocurrency</a>
                                        </li>
                                        <li class="usa-nav__submenu-item">
                                            <a href="{p}CrimeInfo/DataBreach.html">Data Breach</a>
                                        </li>
                                        <li class="usa-nav__submenu-item">
                                            <a href="{p}CrimeInfo/ElderFraud.html">Elder Fraud</a>
                                        </li>
                                        <li class="usa-nav__submenu-item">
                                            <a href="{p}CrimeInfo/Investment.html">Investment Fraud</a>
                                        </li>
                                        <li class="usa-nav__submenu-item">
                                            <a target="_blank" rel="noopener" href="https://www.fbi.gov/scams-and-safety">Other Common Scams</a>
                                        </li>
                                        <li class="usa-nav__submenu-item">
                                            <a href="{p}CrimeInfo/Ransomware.html">Ransomware</a>
                                        </li>
                                        <li class="usa-nav__submenu-item">
                                            <a href="{p}CrimeInfo/TechSupportGovImpersonation.html">Tech/Customer Support and Government Impersonation</a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </li>
                    <li class="usa-nav__primary-item">
                        <a class="usa-nav-link" href="{p}login.html" style="font-weight:700;">Client Login</a>
                    </li>
                </ul>
                <section aria-label="Search component">
                    <form action="{p}Search/Results.html" autocomplete="off" class="usa-search usa-search--small" role="search" method="get">
                        <label class="usa-sr-only" for="search-field">Search</label>
                        <input class="usa-input" id="search-field" type="search" name="term">
                        <button class="usa-button" type="submit">
                            <img src="{p}images/search--white.a22b1.svg" class="usa-search__submit-icon" alt="Search">
                        </button>
                    </form>
                </section>
            </nav>
        </div>
    </header>
'''


def footer_and_modal(p):
    return f'''    <div class="usa-modal usa-modal--lg" id="fileTerms" aria-labelledby="fileTermsHeading" aria-describedby="fileTermsDesc" aria-hidden="true">
        <div class="usa-modal__content">
            <div class="usa-modal__main" id="fileTermsDesc">
                <div class="usa-alert usa-alert--warning">
                    <div class="usa-alert__body">
                        <h4 id="fileTermsHeading" class="usa-alert__heading">Terms and Conditions</h4>
                        <p class="usa-alert__text">
                            Prior to filing a complaint with the IC3, please read the following information regarding terms and conditions.
                        </p>
                    </div>
                </div>
                <div class="font-serif-sm">
                    <p>Should you have additional questions prior to filing your complaint, view <a target="_blank" href="{p}Home/FAQ.html">FAQ</a> for more information.</p>
                    <p>Complaints filed via this website are analyzed and may be referred to federal, state, local or international law enforcement and partner agencies for possible investigation.</p>
                    <p>The complaint information you submit to this site is encrypted via secure socket layer (<abbr>SSL</abbr>) encryption. Please see the <a target="_blank" href="{p}Home/Privacy.html">Privacy Policy</a> for further information.</p>
                    <p>By clicking "I Accept" you acknowledge the following:</p>
                    <p>The information I'm providing on this form is correct to the best of my knowledge. I understand that providing false information could make me subject to fine, imprisonment, or both. (<cite>TITLE 18, U.S. CODE, SECTION 1001</cite>)</p>
                </div>
                <div class="usa-modal__footer">
                    <ul class="usa-button-group display-flex flex-justify-center">
                        <li class="usa-button-group__item">
                            <button id="acceptFile" type="button" class="usa-button" data-close-modal>Accept &amp; File A Report</button>
                        </li>
                        <li class="usa-button-group__item">
                            <button type="button" class="usa-button usa-button--base" data-close-modal>Decline</button>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
    <footer id="ic3Footer" class="usa-footer usa-footer--slim">
    <div class="grid-container usa-footer__return-to-top">
        <a href="#">Return to top</a>
    </div>
    <div class="usa-footer__primary-section">
        <nav class="usa-footer__nav" aria-label="Footer navigation">
            <div>
                <section class="usa-footer__primary-content usa-footer__primary-content--collapsible">
                    <h4 class="usa-footer__primary-link">IC3 RAT</h4>
                    <ul class="usa-list usa-list--unstyled">
                        <li class="usa-footer__secondary-link"><a href="{p}index.html">Home Page</a></li>
                        <li class="usa-footer__secondary-link"><a href="{p}Home/RAT.html">IC3 RAT Operational Report</a></li>
                        <li class="usa-footer__secondary-link"><a href="{p}Home/About.html">About IC3 RAT</a></li>
                        <li class="usa-footer__secondary-link"><a href="{p}Home/Privacy.html">Privacy Policy</a></li>
                    </ul>
                </section>
            </div>
            <div>
                <section class="usa-footer__primary-content usa-footer__primary-content--collapsible">
                    <h4 class="usa-footer__primary-link">FBI</h4>
                    <ul class="usa-list usa-list--unstyled">
                        <li class="usa-footer__secondary-link"><a target="_blank" rel="noopener" href="https://www.fbi.gov/">FBI.gov Home</a></li>
                        <li class="usa-footer__secondary-link"><a target="_blank" rel="noopener" href="https://www.fbi.gov/investigate/cyber">FBI Cyber Division</a></li>
                    </ul>
                </section>
            </div>
            <div>
                <section class="usa-footer__primary-content usa-footer__primary-content--collapsible">
                    <h4 class="usa-footer__primary-link">Contact FBI Cyber</h4>
                    <ul class="usa-list usa-list--unstyled">
                        <li class="usa-footer__secondary-link">
                            <address class="usa-footer__address">
                                <div class="usa-footer__contact-info">
                                    <a href="https://wa.me/14783099781">+1 (478) 309-9781</a>
                                </div>
                            </address>
                        </li>
                        <li class="usa-footer__secondary-link"><strong>Questions?</strong> <a href="{p}Home/FAQ.html">See IC3 FAQ</a></li>
                    </ul>
                </section>
            </div>
        </nav>
    </div>
    <div class="usa-footer__secondary-section">
        <div class="grid-container">
            <div id="foot" class="usa-footer__logo grid-row grid-gap-2">
                <div class="grid-col-auto">
                    <picture>
                        <source srcset="{p}images/fbi_seal_new.8aaa0.webp" type="image/webp">
                        <img class="usa-footer__logo-img" src="{p}images/fbi_seal_new.8aaa0.png" alt="FBI Seal">
                    </picture>
                    <div class="agency">
                        <h1>FBI</h1>
                        <h3>Recovery Asset Team (RAT)</h3>
                    </div>
                </div>
            </div>
        </div>
    </div>
</footer>
'''


HEAD_LINKS = '''    <link rel="stylesheet" href="{p}css/uswds.min.12c2d.css">
    <link rel="stylesheet" href="{p}css/site.d8c3f.css">
<style id="psa-chrome-layout">
body {{
  display: flex !important;
  flex-direction: column !important;
  align-items: stretch !important;
  justify-content: flex-start !important;
}}
#container {{
  margin-left: auto;
  margin-right: auto;
  align-self: center;
}}
#ic3Header, #ic3Footer, .usa-banner, .usa-overlay {{
  width: 100%;
}}
#ic3Header img, #ic3Footer img, .usa-banner img {{
  filter: none !important;
}}
#ic3Header .usa-logo img {{
  display: inline-block !important;
}}
</style>
'''


def ensure_head_assets(content, p):
    if 'css/site.d8c3f.css' not in content:
        block = HEAD_LINKS.format(p=p)
        if '</head>' in content:
            content = content.replace('</head>', block + '</head>', 1)
        else:
            content = block + content
    elif 'id="psa-chrome-layout"' not in content and 'id="ic3Header"' not in content:
        extra = HEAD_LINKS.format(p=p).split('site.d8c3f.css">', 1)[-1]
        content = content.replace('</head>', extra + '</head>', 1)
    if 'recovery-toast.js' not in content:
        tag = f'    <script defer src="{p}js/recovery-toast.js"></script>\n'
        content = content.replace('</head>', tag + '</head>', 1)
    if f'src="{p}js/site.js"' not in content and 'js/site.js' not in content:
        tag = f'    <script defer src="{p}js/site.js"></script>\n'
        content = content.replace('</head>', tag + '</head>', 1)
    return content


def inject_navbar(content, p):
    if 'id="ic3Header"' in content:
        return content
    m = re.search(
        r'(<section class="usa-banner[\s\S]*?</section>)',
        content,
        re.IGNORECASE,
    )
    chrome = navbar_html(p)
    if m:
        content = content[:m.end()] + '\n' + chrome + content[m.end():]
    elif '<body>' in content or '<body ' in content:
        content = re.sub(r'(<body[^>]*>)', r'\1\n' + chrome, content, count=1)
    if 'id="fileTerms"' not in content:
        if '</body>' in content:
            content = content.replace('</body>', footer_and_modal(p) + '</body>', 1)
        else:
            content += footer_and_modal(p)
    return content


def fix_existing_navbar(content, p):
    content = re.sub(r'\s*<script[^>]*src="/assets/js/uswds[^"]*"[^>]*></script>', '', content)
    content = content.replace('/assets/img/us_flag_small.png', f'{p}images/us_flag_small.36692.png')
    content = content.replace('/assets/img/icon-dot-gov.svg', f'{p}images/icon-dot-gov.36692.svg')
    content = content.replace('/assets/img/icon-https.svg', f'{p}images/icon-https.36692.svg')
    content = re.sub(
        r'(<em class="usa-logo__text"><a href="[^"]*">)Internet Crime Complaint Center \(IC3\)(</a></em>)',
        r'\1FBI IC3 Recovery Asset Team (RAT)\2',
        content,
    )
    content = content.replace('>>File A Report', '>File A Report')
    content = content.replace('>>Accept & File A Report', '>Accept & File A Report')
    content = content.replace('>>Accept &amp; File A Report', '>Accept &amp; File A Report')
    if 'Home/RAT.html' not in content and 'id="public-nav"' in content:
        content = content.replace(
            f'<a href="{p}Outreach/Resources.html">Resources</a>\n                                        </li>\n                                    </ul>',
            f'<a href="{p}Outreach/Resources.html">Resources</a>\n                                        </li>\n                                        <li class="usa-nav__submenu-item">\n                                            <a href="{p}Home/RAT.html">Recovery Asset Team (RAT)</a>\n                                        </li>\n                                    </ul>',
        )
    return content


def process_file(filepath):
    rel = os.path.relpath(filepath, ROOT).replace(os.sep, '/')
    if rel.endswith('.pdf.html') or rel.endswith('RSS.html'):
        return False
    p = prefixes(rel)
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        original = f.read()
    content = original
    is_article = '/20' in rel and rel.count('/') >= 2
    if is_article or 'id="ic3Header"' not in content:
        content = ensure_head_assets(content, p)
        content = inject_navbar(content, p)
    content = fix_existing_navbar(content, p)
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print('updated', rel)
        return True
    return False


def main():
    n = 0
    for dirpath, dirnames, filenames in os.walk(PSA_DIR):
        dirnames[:] = [d for d in dirnames if d not in ('.git',)]
        for name in filenames:
            if not name.endswith('.html'):
                continue
            if process_file(os.path.join(dirpath, name)):
                n += 1
    print(f'Total updated: {n}')


if __name__ == '__main__':
    main()
