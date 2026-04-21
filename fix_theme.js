const fs = require('fs');
const path = require('path');

const replacements = {
    'dark:bg-slate-900': 'dark:bg-surface-dark',
    'dark:bg-slate-800': 'dark:bg-muted-dark',
    'dark:border-slate-800': 'dark:border-border-dark',
    'dark:border-slate-700': 'dark:border-border-dark',
    'dark:hover:bg-slate-800': 'dark:hover:bg-surface-hover-dark',
    'dark:hover:bg-slate-700': 'dark:hover:bg-surface-hover-dark',
    'dark:bg-slate-100': 'dark:bg-muted-dark',
    'dark:bg-slate-50': 'dark:bg-background-dark',
    'dark:text-slate-400': 'dark:text-muted-dark',
    'dark:text-slate-500': 'dark:text-muted-dark',
    'dark:divide-slate-800': 'dark:divide-border-dark'
};

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    for (const [oldStr, newStr] of Object.entries(replacements)) {
        content = content.split(oldStr).join(newStr);
    }
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.next' && file !== 'dist') {
                walkDir(filePath);
            }
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            processFile(filePath);
        }
    }
}

walkDir('./src');
console.log('Theme migration complete.');
