const fs = require('fs');
const path = require('path');

const filesToCheck = [
  'index.html',
  'complaint.html',
  'complaint_form.html',
  'dashboard.html'
];

filesToCheck.forEach(file => {
  const filePath = path.join('/Users/brendan/Downloads/ic3rat', file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let scriptCount = 0;
  
  while ((match = scriptRegex.exec(content)) !== null) {
    const jsCode = match[1].trim();
    if (!jsCode || match[0].includes('src=')) continue;
    scriptCount++;
    try {
      new Function(jsCode);
    } catch (e) {
      console.log(`=== ERROR in ${file} script #${scriptCount} ===`);
      console.log('Message:', e.message);
      // Print first 50 lines of script
      const lines = jsCode.split('\n');
      console.log(lines.map((l, i) => `${i+1}: ${l}`).join('\n'));
    }
  }
});
