import os
import re
import csv

rootDir = os.path.abspath('.')

# ==========================================
# 1. FIX BROKEN FOOTER / HOTLINE SYNTAX
# ==========================================
def fix_broken_links_and_tags(content):
    # Fix broken WhatsApp/Hotline tag
    content = re.sub(
        r'<a\s+href="https://wa\.me/14783099781"\s*\+1\s*\(478\)\s*309-9781/a>',
        r'<a href="https://wa.me/14783099781">+1 (478) 309-9781</a>',
        content
    )
    content = re.sub(
        r'<a\s+href="https://wa\.me/14783099781"\+1\s*\(478\)\s*309-9781/a>',
        r'<a href="https://wa.me/14783099781">+1 (478) 309-9781</a>',
        content
    )
    # Fix any similar broken closing tag
    content = re.sub(r'(\+1\s*\(\d{3}\)\s*\d{3}-\d{4})/a>', r'\1</a>', content)
    
    # Fix direct links to .pdf.html -> .pdf
    content = re.sub(r'href="([^"]+)\.pdf\.html"', r'href="\1.pdf"', content)
    
    return content

# ==========================================
# 2. REMOVE ALL "NEVER CONTACT" / CONTACT DISCLAIMERS
# ==========================================
def remove_contact_disclaimers(content, filepath):
    # Specific targeted replacements for known files
    
    # 1. FAQ.html
    if 'FAQ.html' in filepath:
        # Replace "You will not hear from the IC3..."
        content = re.sub(
            r'<p>You will not hear from the IC3\.\s*The IC3 does not conduct investigations and, therefore, is not able to provide the investigative status of a previously filed complaint\.\s*Investigation and prosecution are at the discretion of the receiving agencies\.</p>',
            r'<p>After you file a complaint, information is prioritized by the Recovery Asset Team (RAT) and investigated in coordination with financial institutions, law enforcement task forces, and partner agencies.</p>',
            content
        )
        # Remove "we will not email or send an electronic version of this file."
        content = content.replace(
            'This is the only time you will be able to retain a copy of your complaint &mdash; we will not email or send an electronic version of this file.',
            'Please retain a copy of your complaint confirmation for your records.'
        )
        # Update "The IC3 is not a resource available to the general public..."
        content = re.sub(
            r'<dd>The IC3 is not a resource available to the general public for answering questions arising from the complaint information it receives\.\s*IC3 does not release information about specific complaints and/or the resolution of those complaints\.\s*Therefore, IC3 is unable to provide you with such information\.</dd>',
            r'<dd>Complaints submitted to IC3 are processed securely and reviewed by analysts in accordance with federal law enforcement privacy standards.</dd>',
            content
        )

    # 2. PSA/2025/PSA250418.html
    if 'PSA250418.html' in filepath:
        content = re.sub(
            r'<li>The IC3 will never directly communicate with individuals via phone, email, social media, phone apps, or public forums\.\s*If further information is needed, individuals will be contacted by FBI employees from local field offices or other law enforcement officers\.</li>\s*',
            '',
            content
        )
        content = re.sub(
            r'<li>The IC3 will not ask for payment to recover lost funds, nor will they refer a victim to a company requesting payment for recovering funds\.</li>\s*',
            '',
            content
        )

    # 3. PSA/2026/PSA260720.html
    if 'PSA260720.html' in filepath:
        content = re.sub(
            r'<li>IC3 does not maintain a social media presence and does not investigate crimes or recover funds through Facebook, Telegram, or similar platforms\..*?</li>\s*',
            '',
            content
        )
        content = re.sub(
            r'<li>IC3 will never directly communicate with individuals via phone, email, social media, phone apps, online chat, or public forums\..*?</li>\s*',
            '',
            content
        )
        content = re.sub(
            r'<li>IC3 will never ask for payment to recover lost funds, nor will IC3 refer someone to a company requesting payment for recovering funds\.</li>\s*',
            '',
            content
        )
        content = re.sub(
            r'<li>IC3 does not maintain any social media presence\..*?</li>\s*',
            '',
            content
        )

    # 4. PSA/2016/PSA160602.html
    if 'PSA160602.html' in filepath:
        content = re.sub(
            r'A legitimate software or security company will not directly contact individuals unless the contact is initiated by the customer\.',
            '',
            content
        )

    # General cleanup for any remaining phrases:
    general_patterns = [
        re.compile(r'<li>\s*(?:The\s+)?IC3\s+will\s+never\s+(?:directly\s+)?(?:contact|communicate|reach\s+out|call|email)[^<]*</li>\s*', re.IGNORECASE),
        re.compile(r'<p>\s*(?:The\s+)?IC3\s+will\s+never\s+(?:directly\s+)?(?:contact|communicate|reach\s+out|call|email)[^<]*</p>\s*', re.IGNORECASE),
        re.compile(r'<li>\s*You\s+will\s+not\s+hear\s+from\s+the\s+IC3[^<]*</li>\s*', re.IGNORECASE),
        re.compile(r'<p>\s*You\s+will\s+not\s+hear\s+from\s+the\s+IC3[^<]*</p>\s*', re.IGNORECASE),
        re.compile(r'<li>\s*(?:The\s+)?IC3\s+does\s+not\s+(?:conduct\s+investigations|contact\s+victims|reach\s+out)[^<]*</li>\s*', re.IGNORECASE),
        re.compile(r'(?:The\s+)?IC3\s+will\s+never\s+(?:directly\s+)?communicate\s+with\s+individuals[^.]*\.', re.IGNORECASE),
        re.compile(r'(?:The\s+)?IC3\s+will\s+never\s+(?:directly\s+)?contact\s+individuals[^.]*\.', re.IGNORECASE),
        re.compile(r'You\s+will\s+not\s+hear\s+from\s+the\s+IC3\.', re.IGNORECASE)
    ]
    
    for pat in general_patterns:
        content = pat.sub('', content)

    return content

# ==========================================
# 3. CONVERT RAW PDF.HTML FILES TO DARK PDF VIEWERS
# ==========================================
def fix_pdf_html_file(filepath):
    # Find relative depth
    rel_path = os.path.relpath(filepath, rootDir).replace('\\', '/')
    pdf_target = rel_path[:-5] # remove '.html', leaves '.pdf'
    pdf_filename = os.path.basename(pdf_target)
    pdf_rel_from_here = pdf_filename
    
    rel_depth = rel_path.count('/')
    img_prefix = ('../' * rel_depth) + 'images/' if rel_depth > 0 else 'images/'
    css_prefix = ('../' * rel_depth) + 'css/' if rel_depth > 0 else 'css/'
    root_prefix = ('../' * rel_depth) if rel_depth > 0 else ''

    html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="dark">
    <title>{pdf_filename} — Official Document Viewer | FBI IC3 RAT</title>
    <link rel="icon" type="image/jpeg" href="{img_prefix}ic3ratlogo.jpeg">
    <link rel="icon" type="image/png" sizes="32x32" href="{img_prefix}favicon-32.8aaa0.png">
    <link rel="shortcut icon" href="{root_prefix}favicon.ico">
    <link rel="stylesheet" href="{css_prefix}site.d8c3f.css">
    <style>
        :root {{ color-scheme: dark !important; }}
        html, body {{
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background-color: #030712 !important;
            color: #f8fafc !important;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }}
        .viewer-header {{
            background: #0b1d3a;
            border-bottom: 1px solid #1e293b;
            padding: 0.75rem 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            flex-shrink: 0;
        }}
        .viewer-brand {{
            display: flex;
            align-items: center;
            gap: 0.75rem;
            color: #ffffff;
            text-decoration: none;
            font-weight: 700;
            font-size: 1.1rem;
        }}
        .viewer-brand img {{
            height: 38px;
            width: auto;
        }}
        .viewer-actions {{
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }}
        .btn {{
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-weight: 600;
            font-size: 0.875rem;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            transition: all 0.2s;
        }}
        .btn-primary {{
            background: #d9381e;
            color: #ffffff;
            border: 1px solid transparent;
        }}
        .btn-primary:hover {{
            background: #b82a14;
        }}
        .btn-secondary {{
            background: #1e293b;
            color: #f8fafc;
            border: 1px solid #334155;
        }}
        .btn-secondary:hover {{
            background: #334155;
        }}
        .pdf-frame-container {{
            flex: 1;
            width: 100%;
            height: 100%;
            position: relative;
            background: #030712;
        }}
        iframe {{
            width: 100%;
            height: 100%;
            border: none;
            background: #030712;
        }}
    </style>
</head>
<body>
    <header class="viewer-header">
        <a href="{root_prefix}index.html" class="viewer-brand">
            <img src="{img_prefix}ic3ratlogo.jpeg" alt="FBI IC3 RAT">
            <span>FBI IC3 Document Viewer</span>
        </a>
        <div class="viewer-actions">
            <a href="{pdf_rel_from_here}" download class="btn btn-primary">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                Download PDF
            </a>
            <a href="javascript:history.back()" class="btn btn-secondary">Back</a>
        </div>
    </header>
    <main class="pdf-frame-container">
        <iframe src="{pdf_rel_from_here}#toolbar=1&navpanes=0&scrollbar=1" type="application/pdf">
            <div style="padding: 3rem; text-align: center; color: #94a3b8;">
                <p style="font-size: 1.25rem; color: #fff; margin-bottom: 1rem;">PDF Preview Not Supported In This Browser View</p>
                <a href="{pdf_rel_from_here}" download class="btn btn-primary">Download {pdf_filename}</a>
            </div>
        </iframe>
    </main>
</body>
</html>'''
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html_content)
    print(f'Converted raw PDF to styled viewer: {rel_path}')

# ==========================================
# 4. CONVERT RAW CSV.HTML FILES TO DARK DATA TABLES
# ==========================================
def fix_csv_html_file(filepath):
    rel_path = os.path.relpath(filepath, rootDir).replace('\\', '/')
    csv_title = os.path.basename(rel_path).replace('.csv.html', '').replace('_', ' ')
    
    rel_depth = rel_path.count('/')
    img_prefix = ('../' * rel_depth) + 'images/' if rel_depth > 0 else 'images/'
    css_prefix = ('../' * rel_depth) + 'css/' if rel_depth > 0 else 'css/'
    root_prefix = ('../' * rel_depth) if rel_depth > 0 else ''

    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        raw_lines = f.readlines()
    
    # Filter out empty or html-like noise if any
    csv_rows = []
    for line in raw_lines:
        line_clean = line.strip()
        if not line_clean or line_clean.startswith('<') or line_clean.startswith('<?'):
            continue
        csv_rows.append(line_clean)
    
    parsed = list(csv.reader(csv_rows))
    if not parsed:
        return
    
    headers = parsed[0]
    data_rows = parsed[1:]
    
    table_headers_html = ''.join(f'<th>{h.strip()}</th>' for h in headers)
    table_rows_html = ''
    for row in data_rows:
        if not any(row): continue
        tds = ''.join(f'<td>{cell.strip()}</td>' for cell in row)
        table_rows_html += f'<tr>{tds}</tr>\n'

    html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="dark">
    <title>{csv_title} — Indicators of Compromise | FBI IC3 RAT</title>
    <link rel="icon" type="image/jpeg" href="{img_prefix}ic3ratlogo.jpeg">
    <link rel="icon" type="image/png" sizes="32x32" href="{img_prefix}favicon-32.8aaa0.png">
    <link rel="shortcut icon" href="{root_prefix}favicon.ico">
    <link rel="stylesheet" href="{css_prefix}site.d8c3f.css">
    <style>
        :root {{ color-scheme: dark !important; }}
        html, body {{
            margin: 0;
            padding: 0;
            background-color: #030712 !important;
            color: #f8fafc !important;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            min-height: 100vh;
        }}
        .ioc-header {{
            background: #0b1d3a;
            border-bottom: 1px solid #1e293b;
            padding: 1rem 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
        }}
        .ioc-brand {{
            display: flex;
            align-items: center;
            gap: 0.75rem;
            color: #ffffff;
            text-decoration: none;
            font-weight: 700;
            font-size: 1.15rem;
        }}
        .ioc-brand img {{
            height: 40px;
            width: auto;
        }}
        .ioc-container {{
            max-width: 1200px;
            margin: 2rem auto;
            padding: 0 1.5rem;
        }}
        .ioc-card {{
            background: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
        }}
        .ioc-card-header {{
            padding: 1.5rem;
            border-bottom: 1px solid #1e293b;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
        }}
        .ioc-title {{
            font-size: 1.35rem;
            font-weight: 700;
            color: #ffffff;
            margin: 0;
        }}
        .ioc-subtitle {{
            font-size: 0.875rem;
            color: #94a3b8;
            margin-top: 0.25rem;
        }}
        .search-box {{
            padding: 0.5rem 0.85rem;
            background: #030712;
            border: 1px solid #334155;
            border-radius: 6px;
            color: #ffffff;
            font-size: 0.875rem;
            width: 260px;
        }}
        .ioc-table-wrapper {{
            overflow-x: auto;
            max-height: 70vh;
        }}
        table.ioc-table {{
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 0.875rem;
        }}
        table.ioc-table th {{
            background: #1e293b;
            color: #e2e8f0;
            padding: 0.85rem 1.25rem;
            font-weight: 600;
            border-bottom: 1px solid #334155;
            position: sticky;
            top: 0;
            z-index: 10;
        }}
        table.ioc-table td {{
            padding: 0.75rem 1.25rem;
            border-bottom: 1px solid #1e293b;
            color: #cbd5e1;
            font-family: 'JetBrains Mono', monospace, sans-serif;
            word-break: break-all;
        }}
        table.ioc-table tr:hover td {{
            background: #1e293b55;
            color: #ffffff;
        }}
        .btn {{
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-weight: 600;
            font-size: 0.875rem;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            background: #1e293b;
            color: #ffffff;
            border: 1px solid #334155;
            transition: all 0.2s;
        }}
        .btn:hover {{
            background: #334155;
        }}
    </style>
</head>
<body>
    <header class="ioc-header">
        <a href="{root_prefix}index.html" class="ioc-brand">
            <img src="{img_prefix}ic3ratlogo.jpeg" alt="FBI IC3 RAT">
            <span>FBI IC3 Threat Intelligence</span>
        </a>
        <a href="javascript:history.back()" class="btn">Back</a>
    </header>
    <main class="ioc-container">
        <div class="ioc-card">
            <div class="ioc-card-header">
                <div>
                    <h1 class="ioc-title">{csv_title}</h1>
                    <div class="ioc-subtitle">Official Threat Indicators of Compromise (IOC) • {len(data_rows)} Entries</div>
                </div>
                <input type="text" id="filterInput" class="search-box" placeholder="Filter indicators..." onkeyup="filterTable()">
            </div>
            <div class="ioc-table-wrapper">
                <table class="ioc-table" id="iocTable">
                    <thead>
                        <tr>{table_headers_html}</tr>
                    </thead>
                    <tbody>
                        {table_rows_html}
                    </tbody>
                </table>
            </div>
        </div>
    </main>
    <script>
        function filterTable() {{
            const query = document.getElementById('filterInput').value.toLowerCase();
            const rows = document.querySelectorAll('#iocTable tbody tr');
            rows.forEach(r => {{
                r.style.display = r.textContent.toLowerCase().includes(query) ? '' : 'none';
            }});
        }}
    </script>
</body>
</html>'''
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html_content)
    print(f'Converted raw CSV to styled interactive table: {rel_path}')

# ==========================================
# 5. ENFORCE INDESTRUCTIBLE GLOBAL DARK MODE
# ==========================================
def update_site_css_for_dark_mode():
    site_css_path = os.path.join(rootDir, 'css', 'site.d8c3f.css')
    dark_mode_css = '''
/* =========================================================
   PERMANENT INDESTRUCTIBLE DARK MODE (MOBILE & DESKTOP)
   Forces dark background even when phone/browser is in Light Mode
   ========================================================= */
:root {
    color-scheme: dark !important;
    --ic3-bg-dark: #030712 !important;
    --ic3-card-dark: #0f172a !important;
    --ic3-border-dark: #1e293b !important;
    --ic3-text-dark: #f8fafc !important;
    --ic3-text-muted: #94a3b8 !important;
}

html, body {
    background-color: #030712 !important;
    background: #030712 !important;
    color: #f8fafc !important;
    color-scheme: dark !important;
}

/* Force all USWDS sections and structural elements to stay dark */
.usa-section,
.usa-layout-docs,
.usa-layout-docs__main,
.usa-prose,
.usa-accordion__content,
.grid-container,
.grid-row,
main,
header,
footer,
nav,
section,
article,
aside,
body {
    background-color: #030712 !important;
    color: #f8fafc !important;
}

.usa-footer {
    background-color: #050b14 !important;
    color: #f8fafc !important;
    border-top: 1px solid #1e293b !important;
}

.usa-card,
.usa-card__container,
.usa-summary-box,
.card {
    background-color: #0f172a !important;
    color: #f8fafc !important;
    border: 1px solid #1e293b !important;
}

/* Dark mode forms & tables */
input:not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]),
select,
textarea {
    background-color: #0f172a !important;
    color: #ffffff !important;
    border: 1px solid #334155 !important;
}

table, .usa-table {
    background-color: #0f172a !important;
    color: #f8fafc !important;
    border-color: #1e293b !important;
}

table th, .usa-table th {
    background-color: #1e293b !important;
    color: #ffffff !important;
}

table td, .usa-table td {
    background-color: #0f172a !important;
    color: #cbd5e1 !important;
    border-color: #1e293b !important;
}

/* Text elements inherit dark text */
p, h1, h2, h3, h4, h5, h6, li, dt, dd, span:not(.kpi-number), label, blockquote {
    color: #f8fafc !important;
}

.text-muted, .text-gray, .text-secondary {
    color: #94a3b8 !important;
}

a.usa-link, a {
    color: #60a5fa !important;
}

a.usa-link:hover, a:hover {
    color: #93c5fd !important;
}

/* KPI cards preserve crisp high-contrast readability */
.rat-kpi-card, .rat-kpi-card * {
    color: #000000 !important;
}
.rat-kpi-card {
    background: #ffffff !important;
}
'''
    with open(site_css_path, 'r', encoding='utf-8') as f:
        existing = f.read()
    
    if 'PERMANENT INDESTRUCTIBLE DARK MODE' not in existing:
        with open(site_css_path, 'a', encoding='utf-8') as f:
            f.write('\n' + dark_mode_css)
        print('Updated css/site.d8c3f.css with permanent indestructible dark mode rules.')

# ==========================================
# MAIN EXECUTION
# ==========================================
update_site_css_for_dark_mode()

files_scanned = 0
files_modified = 0

for root, dirs, files in os.walk(rootDir):
    if 'node_modules' in root or '.git' in root:
        continue
    for f in files:
        if f.endswith('.html'):
            filepath = os.path.join(root, f)
            files_scanned += 1
            
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as fl:
                content = fl.read()

            # If it's a raw PDF file inside .pdf.html
            if f.endswith('.pdf.html') or ('%PDF-' in content[:200]):
                fix_pdf_html_file(filepath)
                files_modified += 1
                continue
            
            # If it's a raw CSV file inside .csv.html
            if f.endswith('.csv.html'):
                fix_csv_html_file(filepath)
                files_modified += 1
                continue

            orig_content = content
            
            # 1. Fix broken syntax & links
            content = fix_broken_links_and_tags(content)
            
            # 2. Remove contact disclaimers
            content = remove_contact_disclaimers(content, filepath)
            
            # 3. Ensure dark mode meta tag and style in head
            if '<meta name="color-scheme" content="dark">' not in content:
                if '</head>' in content:
                    content = content.replace('</head>', '    <meta name="color-scheme" content="dark">\n</head>', 1)
            
            # Ensure dark background inline style on body/html in all templates
            dark_inline_style = '''<style id="force-dark-mode">
:root { color-scheme: dark !important; }
html, body {
  background-color: #030712 !important;
  color: #f8fafc !important;
  color-scheme: dark !important;
}
.usa-section, .usa-layout-docs, .usa-header, .usa-footer, main, header, footer, nav, body {
  background-color: #030712 !important;
  color: #f8fafc !important;
}
</style>'''
            if 'force-dark-mode' not in content and '</head>' in content:
                content = content.replace('</head>', f'{dark_inline_style}\n</head>', 1)

            if content != orig_content:
                with open(filepath, 'w', encoding='utf-8') as fl:
                    fl.write(content)
                files_modified += 1

print(f'Done. Total scanned: {files_scanned}, Total modified: {files_modified}')
