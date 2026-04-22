import os
import re

root_dir = r"c:\Users\mbarroso\OneDrive - Tribunal de Justica do Estado do Rio de Janeiro\wokspace\CRM\backend\src"

def fix_imports(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check if Optional is used
    if 'Optional[' not in content:
        return False

    # Check if Optional is already imported from typing
    if re.search(r'from typing import .*Optional', content):
        return False

    # Try to add Optional to existing typing import
    new_content, count = re.subn(
        r'from typing import (.*)', 
        r'from typing import \1, Optional', 
        content
    )
    
    if count == 0:
        # No typing import found at all, add one at the top or after other imports
        new_content = "from typing import Optional\n" + content
        count = 1
    else:
        # Clean up any potential double commas, though the regex above is simple
        new_content = new_content.replace(', ,', ',').replace('import ,', 'import')

    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

files_fixed = []
for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith('.py'):
            path = os.path.join(root, file)
            if fix_imports(path):
                files_fixed.append(path)

print(f"Fixed {len(files_fixed)} files.")
for f in files_fixed:
    print(f" - {f}")
