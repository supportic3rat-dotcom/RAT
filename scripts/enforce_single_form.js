const fs = require('fs');
const path = require('path');

const rootDir = '/Users/brendan/Downloads/ic3rat';

// 1. Read main 5-step complaint form
const mainFormPath = path.join(rootDir, 'complaint_form.html');
const mainFormContent = fs.readFileSync(mainFormPath, 'utf8');

// Copy main form content to complaint.html so complaint.html IS the 5-step form
fs.writeFileSync(path.join(rootDir, 'complaint.html'), mainFormContent, 'utf8');
console.log('✅ Overwrote complaint.html with complaint_form.html (5-step wizard)');

// Subfolder complaint/complaint.html and complaint/complaint_form.html relative paths fix
const subFormContent = mainFormContent
  .replace(/src="images\//g, 'src="../images/')
  .replace(/href="images\//g, 'href="../images/')
  .replace(/href="css\//g, 'href="../css/')
  .replace(/src="js\//g, 'src="../js/')
  .replace(/href="Home\//g, 'href="../Home/')
  .replace(/href="index.html"/g, 'href="../index.html"')
  .replace(/href="dashboard.html"/g, 'href="../dashboard.html"');

fs.writeFileSync(path.join(rootDir, 'complaint/complaint.html'), subFormContent, 'utf8');
fs.writeFileSync(path.join(rootDir, 'complaint/complaint_form.html'), subFormContent, 'utf8');
console.log('✅ Updated subfolder complaint/complaint.html & complaint_form.html');

// 2. Overwrite legacy step 2-7 files with auto-redirects
const legacyStepsRoot = [
  'complaint_step2.html',
  'complaint_step3.html',
  'complaint_step4.html',
  'complaint_step5.html',
  'complaint_step6.html',
  'complaint_step7.html'
];

legacyStepsRoot.forEach(file => {
  const redirectHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=complaint_form.html">
  <title>Redirecting to Claim Form...</title>
  <script>window.location.href = "complaint_form.html";</script>
</head>
<body style="background:#05101e;color:#fff;font-family:sans-serif;padding:2rem;text-align:center;">
  <p>Redirecting to Start Your Claim form...</p>
  <a href="complaint_form.html" style="color:#3b82f6;">Click here if you are not redirected automatically.</a>
</body>
</html>`;
  fs.writeFileSync(path.join(rootDir, file), redirectHtml, 'utf8');
  console.log(`✅ Redirect set for ${file} -> complaint_form.html`);
});

const legacyStepsSub = [
  'complaint/complaint_step2.html',
  'complaint/complaint_step3.html',
  'complaint/complaint_step4.html',
  'complaint/complaint_step5.html',
  'complaint/complaint_step6.html',
  'complaint/complaint_step7.html'
];

legacyStepsSub.forEach(file => {
  const redirectHtmlSub = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=complaint_form.html">
  <title>Redirecting to Claim Form...</title>
  <script>window.location.href = "complaint_form.html";</script>
</head>
<body style="background:#05101e;color:#fff;font-family:sans-serif;padding:2rem;text-align:center;">
  <p>Redirecting to Start Your Claim form...</p>
  <a href="complaint_form.html" style="color:#3b82f6;">Click here if you are not redirected automatically.</a>
</body>
</html>`;
  const p = path.join(rootDir, file);
  if (fs.existsSync(p)) {
    fs.writeFileSync(p, redirectHtmlSub, 'utf8');
    console.log(`✅ Redirect set for ${file} -> complaint_form.html`);
  }
});

// 3. Scan all HTML files in codebase and update links pointing to complaint_step*.html to point directly to complaint_form.html
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

const allHtmls = getAllHtmlFiles(rootDir);
let updatedLinksCount = 0;

allHtmls.forEach(filePath => {
  // Skip the redirect step files themselves
  const base = path.basename(filePath);
  if (base.startsWith('complaint_step')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  content = content.replace(/href="[^"]*complaint_step\d\.html"/g, 'href="complaint_form.html"');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    updatedLinksCount++;
  }
});

console.log(`✅ Updated step links in ${updatedLinksCount} HTML files.`);
console.log('🎉 Done! Single 5-Step Claim Wizard (complaint_form.html) is now enforced system-wide!');
