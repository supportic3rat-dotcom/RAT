import os
import re

seo_configs = {
    'index.html': {
        'title': 'FBI IC3 Recovery Asset Team (RAT) - Financial Fraud Kill Chain',
        'desc': 'Official portal for the FBI Internet Crime Complaint Center (IC3) Recovery Asset Team (RAT). Specialized unit executing the Financial Fraud Kill Chain (FFKC) to freeze and recover fraudulent wire transfers.',
        'keywords': 'FBI, IC3, Recovery Asset Team, RAT, Financial Fraud Kill Chain, FFKC, wire fraud, cybercrime, BEC, asset recovery, freeze fraudulent transfers',
        'type': 'website'
    },
    'Home/RAT.html': {
        'title': 'Comprehensive Report: Recovery Asset Team (RAT) - FBI IC3 RAT',
        'desc': 'Comprehensive operations overview and annual metrics for the FBI IC3 Recovery Asset Team (RAT) and the Financial Fraud Kill Chain.',
        'keywords': 'Recovery Asset Team, RAT, FBI, IC3, Financial Fraud Kill Chain, wire transfer recovery, BEC, statistical report',
        'type': 'article'
    },
    'Home/About.html': {
        'title': 'About Us - FBI IC3 Recovery Asset Team (RAT)',
        'desc': 'Learn about the mission, history, and operation of the FBI Internet Crime Complaint Center (IC3) and the Recovery Asset Team.',
        'keywords': 'About IC3, FBI Cyber Division, Recovery Asset Team, mission, internet crime complaint center',
        'type': 'website'
    },
    'Home/FAQ.html': {
        'title': 'Frequently Asked Questions - FBI IC3 RAT',
        'desc': 'Frequently asked questions regarding reporting cyber fraud, wire transfer recovery, RAT operations, and the Financial Fraud Kill Chain.',
        'keywords': 'IC3 FAQ, RAT FAQ, wire fraud recovery questions, reporting cybercrime, FBI IC3 help',
        'type': 'website'
    },
    'Home/Privacy.html': {
        'title': 'Privacy Policy - FBI IC3 RAT',
        'desc': 'Privacy and security policies for the FBI Internet Crime Complaint Center (IC3) portal and reporting systems.',
        'keywords': 'IC3 privacy policy, data security, FBI reporting privacy, confidentiality',
        'type': 'website'
    },
    'ContactFBICyber.html': {
        'title': 'Contact FBI Cyber - FBI IC3 Recovery Asset Team (RAT)',
        'desc': 'Direct contact directory and emergency reporting channels for the FBI Cyber Division, IC3, and field offices nationwide.',
        'keywords': 'Contact FBI Cyber, report cybercrime, FBI field offices, IC3 contact, emergency fraud report',
        'type': 'website'
    },
    'complaint.html': {
        'title': 'File an Incident Claim — FBI IC3 Recovery Asset Team',
        'desc': 'Submit your internet crime and wire fraud incident report to the IC3 Recovery Asset Team to initiate the Financial Fraud Kill Chain.',
        'keywords': 'file complaint, IC3 complaint, report wire fraud, BEC reporting, cyber incident claim',
        'type': 'website'
    },
    'complaint_form.html': {
        'title': 'Start Your Claim — IC3 RAT',
        'desc': 'Submit your internet crime claim to the IC3 Recovery Asset Team. Answer a few quick questions to initiate recovery.',
        'keywords': 'claim form, IC3 complaint form, asset recovery intake',
        'type': 'website'
    },
    'dashboard.html': {
        'title': 'Client Portal — IC3 Recovery Asset Team',
        'desc': 'IC3 RAT Client Portal — track your recovery case, view disbursements, and communicate with your case officer.',
        'keywords': 'client portal, case tracking, asset recovery dashboard, IC3 RAT status',
        'type': 'website',
        'noindex': True
    },
    'admin.html': {
        'title': 'Administrative Command Portal — FBI IC3 RAT',
        'desc': 'Administrative Command & Case Management Portal for authorized FBI IC3 RAT personnel.',
        'keywords': 'admin portal, case management, IC3 RAT admin',
        'type': 'website',
        'noindex': True
    },
    'login.html': {
        'title': 'Client Portal Login — FBI IC3 Recovery Asset Team',
        'desc': 'Sign in to your IC3 Recovery Asset Team Client Portal to track your case status, view disbursements, and communicate with your case officer.',
        'keywords': 'IC3 login, client portal login, asset recovery portal',
        'type': 'website',
        'noindex': True
    },
    'PSA.html': {
        'title': 'Public Service Announcements (PSAs) - FBI IC3',
        'desc': 'Official FBI IC3 Public Service Announcements and threat intelligence advisories on trending cybercrime and fraud schemes.',
        'keywords': 'FBI PSA, IC3 announcements, cyber warnings, fraud alerts, cybercrime advisories',
        'type': 'website'
    },
    'CSA.html': {
        'title': 'Cybersecurity Advisories (CSAs) - FBI IC3',
        'desc': 'Joint Cybersecurity Advisories from the FBI, CISA, and partner agencies detailing active cyber threats and mitigations.',
        'keywords': 'Cybersecurity Advisories, CSA, FBI alerts, CISA advisories, threat indicators',
        'type': 'website'
    },
    'AnnualReport/Reports.html': {
        'title': 'Annual Reports - FBI IC3',
        'desc': 'Annual Internet Crime Reports and statistical analyses published by the FBI Internet Crime Complaint Center.',
        'keywords': 'IC3 annual report, cybercrime statistics, internet crime annual report, fraud trends',
        'type': 'website'
    }
}

files_updated = 0

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root:
        continue
    for f in files:
        if f.endswith('.html'):
            filepath = os.path.normpath(os.path.join(root, f))
            rel_path = filepath.lstrip('./').replace('\\', '/')
            rel_depth = rel_path.count('/')
            img_prefix = ('../' * rel_depth) + 'images/' if rel_depth > 0 else 'images/'
            root_prefix = ('../' * rel_depth) if rel_depth > 0 else ''
            
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as file:
                content = file.read()
            
            orig_content = content
            
            fav_block = (
                f'    <link rel="icon" type="image/jpeg" href="{img_prefix}ic3ratlogo.jpeg">\n'
                f'    <link rel="icon" type="image/png" sizes="32x32" href="{img_prefix}favicon-32.8aaa0.png">\n'
                f'    <link rel="icon" type="image/png" sizes="128x128" href="{img_prefix}favicon-128.8aaa0.png">\n'
                f'    <link rel="icon" type="image/png" sizes="192x192" href="{img_prefix}favicon-192.8aaa0.png">\n'
                f'    <link rel="apple-touch-icon" sizes="180x180" href="{img_prefix}favicon-180.8aaa0.png">\n'
                f'    <link rel="shortcut icon" href="{root_prefix}favicon.ico">'
            )

            # Replace standard favicon tags if present, or add them
            old_fav_pattern = re.compile(
                r'([ \t]*<link rel="apple-touch-icon"[^>]*>\s*'
                r'<link rel="icon"[^>]*>\s*'
                r'<link rel="icon"[^>]*>\s*'
                r'<link rel="icon"[^>]*>)',
                re.DOTALL
            )
            single_fav_pattern = re.compile(
                r'([ \t]*<link rel="icon"[^>]*href="[^"]*favicon-[^"]*"[^>]*>)',
                re.DOTALL
            )
            
            if old_fav_pattern.search(content):
                content = old_fav_pattern.sub(fav_block, content, count=1)
            elif single_fav_pattern.search(content):
                content = single_fav_pattern.sub(fav_block, content, count=1)
            elif '</head>' in content and 'ic3ratlogo.jpeg' not in content:
                content = content.replace('</head>', fav_block + '\n</head>', 1)

            # Specific SEO config if defined for this path
            cfg = seo_configs.get(rel_path)
            if cfg:
                title = cfg['title']
                desc = cfg['desc']
                keywords = cfg['keywords']
                robots = 'noindex, nofollow' if cfg.get('noindex') else 'index, follow'
                og_type = cfg.get('type', 'website')
                
                seo_meta = (
                    f'    <!-- Primary SEO Meta Tags -->\n'
                    f'    <meta name="description" content="{desc}">\n'
                    f'    <meta name="keywords" content="{keywords}">\n'
                    f'    <meta name="author" content="Federal Bureau of Investigation (FBI) - IC3">\n'
                    f'    <meta name="robots" content="{robots}">\n\n'
                    f'    <!-- Open Graph / Facebook -->\n'
                    f'    <meta property="og:type" content="{og_type}">\n'
                    f'    <meta property="og:site_name" content="FBI IC3 Recovery Asset Team">\n'
                    f'    <meta property="og:title" content="{title}">\n'
                    f'    <meta property="og:description" content="{desc}">\n'
                    f'    <meta property="og:image" content="{img_prefix}ic3ratlogo.jpeg">\n'
                    f'    <meta property="og:image:alt" content="FBI IC3 Recovery Asset Team Logo">\n\n'
                    f'    <!-- Twitter Card -->\n'
                    f'    <meta name="twitter:card" content="summary_large_image">\n'
                    f'    <meta name="twitter:site" content="@FBI">\n'
                    f'    <meta name="twitter:title" content="{title}">\n'
                    f'    <meta name="twitter:description" content="{desc}">\n'
                    f'    <meta name="twitter:image" content="{img_prefix}ic3ratlogo.jpeg">'
                )

                if rel_path == 'index.html':
                    ld_json = (
                        '\n\n    <!-- Structured Data (JSON-LD) -->\n'
                        '    <script type="application/ld+json">\n'
                        '    {\n'
                        '      "@context": "https://schema.org",\n'
                        '      "@type": "GovernmentOrganization",\n'
                        '      "name": "FBI IC3 Recovery Asset Team (RAT)",\n'
                        '      "alternateName": "IC3 RAT",\n'
                        '      "url": "https://www.ic3.gov",\n'
                        '      "logo": "images/ic3ratlogo.jpeg",\n'
                        '      "description": "Specialized unit within the FBI Internet Crime Complaint Center executing the Financial Fraud Kill Chain (FFKC) to freeze and recover funds stolen in cyber-enabled wire fraud.",\n'
                        '      "parentOrganization": {\n'
                        '        "@type": "GovernmentOrganization",\n'
                        '        "name": "Federal Bureau of Investigation",\n'
                        '        "alternateName": "FBI"\n'
                        '      }\n'
                        '    }\n'
                        '    </script>'
                    )
                    seo_meta += ld_json
                
                # Remove pre-existing meta description if any
                content = re.sub(r'[ \t]*<meta name="description"[^>]*>\n?', '', content)
                content = re.sub(r'[ \t]*<!-- SEO & Social Meta Tags -->.*?(?=<!-- Open Graph|<!-- Primary SEO|<link|<style|<script|</head>)', '', content, flags=re.DOTALL)
                
                if '<!-- Primary SEO Meta Tags -->' not in content:
                    title_pattern = re.compile(r'(<title>.*?</title>)', re.DOTALL)
                    if title_pattern.search(content):
                        content = title_pattern.sub(r'\1\n' + seo_meta, content, count=1)

            if content != orig_content:
                with open(filepath, 'w', encoding='utf-8') as file:
                    file.write(content)
                files_updated += 1

print(f'Successfully processed and updated {files_updated} HTML files.')
