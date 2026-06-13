const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function stripCommentsJS(code) {
    // A simple regex to strip JS comments, careful with strings and URLs.
    // Replace block comments
    code = code.replace(/\/\*[\s\S]*?\*\//g, '');
    // Replace line comments but not URLs (http://)
    code = code.replace(/(^|\s)\/\/(?!.*:\/\/)[\s\S]*?$/gm, '');
    return code;
}

function stripCommentsCSS(code) {
    return code.replace(/\/\*[\s\S]*?\*\//g, '');
}

function stripCommentsHTML(code) {
    return code.replace(/<!--[\s\S]*?-->/g, '');
}

walkDir(path.join(__dirname, 'src'), function(filePath) {
    const ext = path.extname(filePath);
    if (!['.js', '.css', '.html'].includes(ext)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    if (ext === '.js') content = stripCommentsJS(content);
    if (ext === '.css') content = stripCommentsCSS(content);
    if (ext === '.html') content = stripCommentsHTML(content);
    
    // Remove empty lines resulting from comment deletion
    content = content.replace(/^\s*[\r\n]/gm, '');
    
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Stripped comments from: ' + filePath);
    }
});
console.log('Done.');
