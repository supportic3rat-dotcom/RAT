const fs = require('fs');
const path = require('path');

const rootDir = '/Users/brendan/Downloads/ic3rat';

// Index all PSA files by filename
const psaMap = {};
function scanPsaFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      scanPsaFiles(full);
    } else if (f.endsWith('.html')) {
      psaMap[f] = path.relative(rootDir, full);
    }
  }
}
scanPsaFiles(path.join(rootDir, 'PSA'));

function getAllHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git') continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getAllHtmlFiles(filePath, fileList);
    } else if (file.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const htmlFiles = getAllHtmlFiles(rootDir);

for (const filePath of htmlFiles) {
  let content = fs.readFileSync(filePath, 'utf8');
  const relPathFromRoot = path.relative(rootDir, filePath);
  const dirOfFile = path.dirname(filePath);
  const depth = relPathFromRoot.split(path.sep).length - 1;
  const rootPrefix = depth === 0 ? '' : '../'.repeat(depth);

  content = content.replace(/href=["'](?:\/PSA\/(?:Archive\/)?)?(\d{4}\/)?(PSA\d+)(?:\.html)?["']/g, (match, yr, psaName) => {
    const psaFilename = psaName.endsWith('.html') ? psaName : psaName + '.html';
    if (psaMap[psaFilename]) {
      const relToCurrent = path.relative(dirOfFile, path.join(rootDir, psaMap[psaFilename]));
      return `href="${relToCurrent}"`;
    }
    return match;
  });

  fs.writeFileSync(filePath, content, 'utf8');
}

console.log('PSA cross-reference mapping completed.');
