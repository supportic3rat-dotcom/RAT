import os
import re

rootDir = os.path.abspath('.')

files_cleaned = 0

for root, dirs, files in os.walk(rootDir):
    if 'node_modules' in root or '.git' in root:
        continue
    for f in files:
        if f.endswith('.html'):
            filepath = os.path.join(root, f)
            rel_path = os.path.relpath(filepath, rootDir).replace('\\', '/')
            rel_depth = rel_path.count('/')
            js_prefix = ('../' * rel_depth) + 'js/' if rel_depth > 0 else 'js/'
            
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as fl:
                content = fl.read()

            orig_content = content

            # 1. Remove all inline recovery toast styles, containers, and scripts
            content = re.sub(r'<style id="recovery-toast-style">[\s\S]*?<\/style>\s*', '', content)
            content = re.sub(r'<div id="recovery-toast-container"><\/div>\s*', '', content)
            content = re.sub(r'<script id="recovery-toast-script">[\s\S]*?<\/script>\s*', '', content)

            # 2. Add external recovery-toast.js script if not already added
            if 'recovery-toast.js' not in content:
                # Add before </head> or </body>
                toast_script_tag = f'    <script defer src="{js_prefix}recovery-toast.js"></script>'
                if '</head>' in content:
                    content = content.replace('</head>', f'{toast_script_tag}\n</head>', 1)
                elif '</body>' in content:
                    content = content.replace('</body>', f'{toast_script_tag}\n</body>', 1)

            # 3. Clean up any remaining leaked raw string fragments
            content = re.sub(r"'\+amount\s*\+\s*'\s*for\s*'\s*\+\s*name\s*\+\s*'", "", content)
            content = re.sub(r"'\s*\+\s*amount\s*\+\s*'\s*for\s*'\s*\+\s*name\s*\+\s*'", "", content)
            content = re.sub(r"contanier\.appendChild", "", content)

            if content != orig_content:
                with open(filepath, 'w', encoding='utf-8') as fl:
                    fl.write(content)
                files_cleaned += 1

print(f'Cleaned and centralized recovery toast across {files_cleaned} HTML files.')
