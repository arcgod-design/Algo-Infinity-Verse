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

            // Replace href="styles.css" or href="../../styles.css" with href="/styles.css"
            const regex = /<link\s+rel="stylesheet"\s+href="[^"]*styles\.css"\s*\/?>/g;
            if (regex.test(content)) {
                content = content.replace(regex, '<link rel="stylesheet" href="/styles.css" />');
                modified = true;
            } else {
                // If the global stylesheet isn't there at all, we should probably add it just above the local stylesheet.
                // But the bug report mentions "missing or broken relative path". Let's check if it exists at all.
                if (!content.includes('href="/styles.css"')) {
                    // Inject before the first <link rel="stylesheet" href="...css" />
                    const injectRegex = /(<link\s+rel="stylesheet"\s+href="[^"]+\.css"\s*\/?>)/;
                    if (injectRegex.test(content)) {
                        content = content.replace(injectRegex, '<link rel="stylesheet" href="/styles.css" />\n    $1');
                        modified = true;
                    }
                }
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed global stylesheet in:', fullPath);
            }
        }
    }
}

processDir(path.join(__dirname, '../pages/visualizers'));
processDir(path.join(__dirname, '../pages/sort'));
console.log('Global styles fix complete.');
