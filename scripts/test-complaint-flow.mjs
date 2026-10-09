import puppeteer from 'puppeteer-core';

const BASE = 'http://127.0.0.1:8080';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function fill(page, selector, value) {
  await page.waitForSelector(selector, { timeout: 10000 });
  await page.focus(selector);
  await page.$eval(selector, (el) => { el.value = ''; });
  await page.type(selector, value, { delay: 5 });
  await page.$eval(selector, (el) => {
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

async function clickRadio(page, name, value) {
  const sel = `input[type="radio"][name="${name}"][value="${value}"]`;
  await page.waitForSelector(sel);
  await page.click(sel);
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  const consoleLogs = [];
  page.on('console', (msg) => consoleLogs.push(`[console.${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => consoleLogs.push(`[pageerror] ${err.message}`));

  const responses = [];
  page.on('response', async (res) => {
    if (res.url().includes('submit-complaint')) {
      let body = '';
      try { body = await res.text(); } catch (_) {}
      responses.push({ status: res.status(), body });
    }
  });

  // Step 1
  await page.goto(`${BASE}/complaint_form.html`, { waitUntil: 'domcontentloaded' });
  await clickRadio(page, 'affected', 'yes');
  await fill(page, '#contactName', 'Terminal Test User');
  await fill(page, '#businessName', 'Terminal Test Co');
  await fill(page, '#phoneNumber', '202-555-0199');
  await fill(page, '#emailAddress', 'terminal.test@example.com');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.click('button[type="submit"]')
  ]);

  // Step 2
  await fill(page, '#complainantName', 'Terminal Test User');
  await page.select('#complainantAge', '36-45');
  await clickRadio(page, 'under17', 'no');
  await fill(page, '#address', '100 Terminal Avenue');
  await fill(page, '#address2', '');
  await fill(page, '#suiteApt', 'Apt 2');
  await fill(page, '#city', 'Washington');
  await fill(page, '#county', 'District of Columbia');
  await page.select('#country', 'United States');
  await page.select('#state', 'NY'); // limited options in markup
  await fill(page, '#zipCode', '20001');
  await fill(page, '#compPhone', '202-555-0199');
  await fill(page, '#compEmail', 'terminal.test@example.com');
  await clickRadio(page, 'businessTargeted', 'yes');
  await fill(page, '#bizName', 'Terminal Test Co');
  await clickRadio(page, 'operationsImp', 'no');
  await fill(page, '#bizITPOC', 'IT POC Test');
  await fill(page, '#otherBizPOC', '');
  await page.select('#criticalSector', 'it');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.click('button[type="submit"]')
  ]);

  // Step 3 — form action is "#", so save then navigate manually
  await clickRadio(page, 'moneyLost', 'yes');
  await fill(page, '#totalLoss', '$1,250.00');
  await page.select('#txType1', 'wire');
  // Re-apply names after type change rewrites fields
  await page.evaluate(() => {
    document.querySelectorAll('.transaction-card').forEach((card, index) => {
      card.querySelectorAll('input, select, textarea').forEach((input, fieldIndex) => {
        if (!input.name) input.name = `tx${index + 1}_field${fieldIndex + 1}`;
      });
    });
  });
  await fill(page, 'input[name="tx1_field2"]', 'Bank of America');
  await fill(page, 'input[name="tx1_field3"]', '026009593');
  await fill(page, 'input[name="tx1_field4"]', '1234567890');
  await fill(page, 'input[name="tx1_field5"]', 'Recipient Bank');
  await fill(page, 'input[name="tx1_field6"]', '9876543210 / Fake Vendor LLC');
  await fill(page, 'input[name="tx1_field7"]', 'WIRE20260930001');
  await page.$eval('input[name="tx1_field8"]', (el) => {
    el.value = '2026-09-30T10:15';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await fill(page, 'input[name="tx1_field9"]', '$1,250.00');
  await fill(page, 'input[name="tx1_field10"]', '');
  await fill(page, 'input[name="tx1_field11"]', 'Website browser flow test');
  await page.evaluate(() => {
    const form = document.querySelector('form');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  await page.goto(`${BASE}/complaint_step4.html`, { waitUntil: 'domcontentloaded' });

  // Step 4
  await fill(page, '#subjName1', 'Fake Vendor Contact');
  await fill(page, '#subjBizName1', 'Fake Vendor LLC');
  await fill(page, '#subjAddress1', '500 Scam Street');
  await fill(page, '#subjAddress2_1', '');
  await fill(page, '#subjSuiteApt1', '');
  await fill(page, '#subjCity1', 'Miami');
  await page.select('#subjCountry1', 'United States');
  await page.select('#subjState1', 'FL');
  await fill(page, '#subjZip1', '33101');
  await fill(page, '#subjPhone1', '305-555-0101');
  await fill(page, '#subjEmail1', 'contact@fakevendor.example');
  await fill(page, '#subjWebsite1', 'https://fakevendor.example');
  await fill(page, '#subjIP1', '198.51.100.23');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.click('button[type="submit"]')
  ]);

  // Step 5
  await fill(page, '#incidentDescription', 'Full website browser flow test through all complaint steps, including optional empty fields, submitted via terminal automation.');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.click('button[type="submit"]')
  ]);

  // Step 6 — submit to Supabase
  await page.click('#affirmCheck');
  await fill(page, '#digitalSignature', 'Terminal Test User');

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }),
    page.click('button.btn-submit')
  ]);

  const url = page.url();
  const payloadKeys = await page.evaluate(() => Object.keys(sessionStorage).sort());
  const reference = await page.evaluate(() => sessionStorage.getItem('complaintReference'));
  const complaintId = await page.evaluate(() => sessionStorage.getItem('complaintId'));
  const receiptText = await page.evaluate(() => document.body.innerText.slice(0, 1500));

  console.log(JSON.stringify({
    finalUrl: url,
    reference,
    complaintId,
    submitResponses: responses,
    payloadKeyCount: payloadKeys.length,
    payloadKeys,
    receiptSnippet: receiptText.replace(/\s+/g, ' ').slice(0, 400),
    consoleLogs: consoleLogs.slice(-20)
  }, null, 2));

  await browser.close();

  if (!reference || !complaintId) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
