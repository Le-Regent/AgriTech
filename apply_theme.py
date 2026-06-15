import os
import re

replacements = {
    'dark:bg-slate-900': 'dark:bg-surface-dark',
    'dark:bg-slate-800': 'dark:bg-muted-dark',
    'dark:border-slate-800': 'dark:border-border-dark',
    'dark:border-slate-700': 'dark:border-border-dark',
    'dark:hover:bg-slate-800': 'dark:hover:bg-surface-hover-dark',
    'dark:hover:bg-slate-700': 'dark:hover:bg-surface-hover-dark',
    'dark:bg-slate-100': 'dark:bg-muted-dark',
    'dark:bg-slate-50': 'dark:bg-background-dark'
}

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements.items():
        new_content = new_content.replace(old, new)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file_path}")

def main():
    src_dir = 'src'
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                process_file(os.path.join(root, file))

if __name__ == '__main__':
    main()
