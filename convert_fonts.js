const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/ui/KieuDang');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.css'));

files.forEach(f => {
  let p = path.join(dir, f);
  let content = fs.readFileSync(p, 'utf8');
  content = content.replace(/font-size:\s*(\d+(?:\.\d+)?)px/g, (match, p1) => {
    let px = parseFloat(p1);
    let rem = (px / 14).toFixed(3);
    // clean up trailing zeros
    rem = parseFloat(rem);
    return `font-size: ${rem}rem`;
  });
  fs.writeFileSync(p, content);
});

// Also fix index.html
const indexHtml = path.join(__dirname, 'src/ui/index.html');
let htmlContent = fs.readFileSync(indexHtml, 'utf8');
htmlContent = htmlContent.replace(/font-size:\s*(\d+(?:\.\d+)?)px/g, (match, p1) => {
  let px = parseFloat(p1);
  let rem = (px / 14).toFixed(3);
  rem = parseFloat(rem);
  return `font-size: ${rem}rem`;
});
fs.writeFileSync(indexHtml, htmlContent);

console.log('Done converting font-sizes to rem');
