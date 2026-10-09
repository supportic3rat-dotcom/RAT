const fs = require('fs');
const path = require('path');

const filesToCheck = [
  'index.html',
  'complaint.html',
  'complaint_form.html',
  'dashboard.html',
  'js/site.js'
];

let allPassed = true;

filesToCheck.forEach(file => {
  const filePath = path.join('/Users/brendan/Downloads/ic3rat', file);
  if (!fs.existsSync(filePath)) {
    console.error(`[ERROR] File missing: ${file}`);
    allPassed = false;
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract all inline <script> contents
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let scriptCount = 0;
  
  while ((match = scriptRegex.exec(content)) !== null) {
    const jsCode = match[1].trim();
    if (!jsCode || match[0].includes('src=')) continue;
    scriptCount++;
    try {
      // Test compilation of script
      new Function(jsCode);
    } catch (e) {
      console.error(`[SYNTAX ERROR] in ${file} script #${scriptCount}:`, e.message);
      allPassed = false;
    }
  }
  console.log(`[OK] Checked ${file}: ${scriptCount} inline script(s) valid.`);
});

if (allPassed) {
  console.log('\n✅ ALL KEY FILES & SCRIPTS PASSED SYNTAX & INTEGRITY CHECKS!');
} else {
  console.log('\n❌ ISSUES FOUND! Check log above.');
}
