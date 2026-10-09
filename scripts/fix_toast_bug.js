const fs = require('fs');
const path = require('path');

function getAllHtmlFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllHtmlFiles(filePath, arrayOfFiles);
    } else if (file.endsWith('.html')) {
      arrayOfFiles.push(filePath);
    }
  });
  return arrayOfFiles;
}

const htmlFiles = getAllHtmlFiles('/Users/brendan/Downloads/ic3rat');
let fixedCount = 0;

htmlFiles.forEach((filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Fix broken toast title line corrupted with </html>
  // Pattern matches: '<div class="rc-toast-title">We recovered <span class="rc-toast-amount">\n</html>\n+amount+'</span> for '+name+'</div>'+
  // or variations with or without $ or linebreaks
  content = content.replace(
    /'<div class="rc-toast-title">We recovered <span class="rc-toast-amount">\s*<\/html>\s*\+amount\+/g,
    '\'<div class="rc-toast-title">We recovered <span class="rc-toast-amount">$\' + amount + \''
  );

  // Also fix if it was written like '<div class="rc-toast-title">We recovered <span class="rc-toast-amount">\n</html>\n$'
  content = content.replace(
    /'<div class="rc-toast-title">We recovered <span class="rc-toast-amount">\s*<\/html>\s*\$'/g,
    '\'<div class="rc-toast-title">We recovered <span class="rc-toast-amount">$\''
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed toast script bug in: ${path.relative('/Users/brendan/Downloads/ic3rat', filePath)}`);
    fixedCount++;
  }
});

console.log(`Finished! Fixed ${fixedCount} files.`);
