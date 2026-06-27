const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Fix markdown links in href: href="[...](url)" -> href="url"
            const regex = /href="\[([^\]]+)\]\(([^)]+)\)"/g;
            if (regex.test(content)) {
                content = content.replace(regex, 'href="$2"');
                modified = true;
            }

            // Also check for src="[...](url)" just in case
            const regexSrc = /src="\[([^\]]+)\]\(([^)]+)\)"/g;
            if (regexSrc.test(content)) {
                content = content.replace(regexSrc, 'src="$2"');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed markdown links in:', fullPath);
            }
        }
    }
}

processDir(path.join(__dirname, '../pages'));
console.log('Markdown links fix complete.');
