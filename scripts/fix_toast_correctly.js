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

const correctSnippet =
  '\'<div class="rc-toast-title">We recovered <span class="rc-toast-amount">$\' + amount + \'</span> for \' + name + \'</div>\' +';

htmlFiles.forEach((filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace any broken rc-toast-title line in recovery toast scripts
  // Matches '<div class="rc-toast-title">We recovered <span class="rc-toast-amount">...</span> for '+name+'</div>'+
  content = content.replace(
    /'<div class="rc-toast-title">We recovered <span class="rc-toast-amount">[\s\S]*?<\/div>'\s*\+/g,
    () => correctSnippet
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    fixedCount++;
  }
});

console.log(`Successfully fixed ${fixedCount} files with correct toast snippet!`);
