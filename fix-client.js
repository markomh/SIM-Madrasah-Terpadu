const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

walkDir(path.join(__dirname, 'src'), (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    const clientDirectiveRegex = /([\'\"]use client[\'\"];?)/;
    const match = content.match(clientDirectiveRegex);
    
    if (match) {
        const directive = match[0];
        if (content.trim().indexOf(directive) !== 0) {
            content = content.replace(new RegExp('[\'\"]use client[\'\"];?\\s*', 'g'), '');
            content = '\"use client\";\n\n' + content;
            fs.writeFileSync(filePath, content);
            console.log('Fixed use client in: ' + filePath);
        }
    }
  }
});
