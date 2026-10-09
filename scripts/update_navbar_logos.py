import os
import re

rootDir = os.path.abspath('.')
updated_files = 0

for root, dirs, files in os.walk(rootDir):
    if 'node_modules' in root or '.git' in root:
        continue
    for f in files:
        if f.endswith('.html'):
            filepath = os.path.join(root, f)
            rel_path = os.path.relpath(filepath, rootDir).replace(os.sep, '/')
            rel_depth = rel_path.count('/')
            img_prefix = ('../' * rel_depth) + 'images/' if rel_depth > 0 else 'images/'

            with open(filepath, 'r', encoding='utf-8', errors='ignore') as fl:
                content = fl.read()

            orig_content = content

            # Match .usa-logo blocks
            def replace_logo_block(m):
                block = m.group(0)
                link_target = 'index.html' if rel_depth == 0 else ('../' * (rel_depth - 1) + 'index.html' if rel_depth > 1 else '../index.html')
                if rel_path.startswith('Home/'):
                    link_target = 'Index.html'
                
                new_img = f'<img class="usa-footer__logo-img" src="{img_prefix}ic3ratlogo.jpeg" alt="IC3 RAT Logo" style="height:52px;width:auto;object-fit:contain;">'
                
                # Replace <picture>...</picture> or <img ...> inside <a ...>
                block_new = re.sub(
                    r'<a\s+href=[\'"][^\'"]*[\'"]>\s*(?:<picture>[\s\S]*?</picture>|<img[^>]*>)\s*</a>',
                    f'<a href="{link_target}">\n                        {new_img}\n                    </a>',
                    block
                )
                return block_new

            content = re.sub(r'<div class="usa-logo">[\s\S]*?</div>', replace_logo_block, content)

            if content != orig_content:
                with open(filepath, 'w', encoding='utf-8') as fl:
                    fl.write(content)
                updated_files += 1
                print(f'✓ Updated navbar logo in: {rel_path}')

print(f'\nTotal updated: {updated_files}')
