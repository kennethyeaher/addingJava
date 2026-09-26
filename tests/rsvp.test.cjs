const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { readFile, mkdir } = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
let browser;
let server;
let baseUrl;
const draftKey = 'rsvp-card.draft.v1';

/** serves only the three application files, or returns a plain 404 response. */
async function serveCard(request, response) {
  const files = {
    '/tutorial_4_files/': ['index.html', 'text/html'],
    '/tutorial_4_files/style.css': ['style.css', 'text/css'],
    '/tutorial_4_files/script.js': ['script.js', 'text/javascript'],
  };
  const file = files[request.url];
  if (!file) { response.writeHead(404).end(); return; }
  try {
    const content = await readFile(path.join(__dirname, '../tutorial_4_files', file[0]));
    response.writeHead(200, { 'Content-Type': file[1] }).end(content);
  } catch {
    response.writeHead(500).end('Could not read application file');
  }
}

before(async () => {
  server = createServer(serveCard);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseUrl = process.env.RSVP_BASE_URL || `http://127.0.0.1:${server.address().port}/tutorial_4_files/`;
  browser = await chromium.launch(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {});
});

after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
});

/** creates an isolated browser page and checks its console when the test ends. */
async function openCard(t, options = {}, initScript) {
  const context = await browser.newContext(options);
  t.after(() => context.close());
  if (initScript) await context.addInitScript(initScript);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  t.after(() => assert.deepEqual(errors, [], 'browser console errors'));
  await page.goto(baseUrl);
  return page;
}

test('class requirements: choices, names, guest wording, live input, and data types', async t => {
  const page = await openCard(t);
  assert.equal(await page.locator('#guest-field').isVisible(), false);
  assert.equal(await page.locator('.btn.active').count(), 0);
  await page.locator('#name-input').fill('Kenneth');
  assert.equal(await page.locator('#confirmation').isVisible(), false);
  await page.locator('#btn-yes').click();
  for (const [count, words] of [['0', 'flying solo.'], ['1', 'bringing 1 guest.'], ['3', 'bringing 3 guests.'], ['10', 'bringing 10 guests.']]) {
    await page.locator('#guest-input').fill(count);
    assert.equal(await page.locator('#confirmation').innerText(), `Kenneth is coming, ${words}`);
    assert.match(await page.locator('#guest-total').innerText(), new RegExp(`^${Number(count) + 1} `));
  }
  await page.locator('#btn-no').click();
  assert.equal(await page.locator('.btn.active').count(), 1);
  assert.equal(await page.locator('#btn-no').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#btn-yes').getAttribute('aria-pressed'), 'false');
  assert.equal(await page.locator('#guest-field').isVisible(), false);
  await page.locator('#name-input').fill('Sam');
  assert.equal(await page.locator('#regret').innerText(), "We'll miss you, Sam!");
  await page.locator('#name-input').fill('  ');
  assert.match(await page.locator('#regret').innerText(), /Someone/);
  await page.locator('#btn-yes').click();
  assert.equal(await page.locator('#guest-input').inputValue(), '10');
  const state = await page.evaluate(() => checkStatus());
  assert.equal(typeof state.isGoing, 'boolean');
  assert.equal(state.guestType, 'number');
  assert.equal(state.inputType, 'string');
});

test('invalid guest counts block confirmation and download, then recover', async t => {
  const page = await openCard(t);
  assert.equal(await page.locator('#download-button').isDisabled(), true);
  await page.locator('#btn-yes').click();
  for (const count of ['', '-1', '1.5', '11']) {
    await page.locator('#guest-input').fill(count);
    assert.equal(await page.locator('#confirmation').isVisible(), false);
    assert.equal(await page.locator('#download-button').isDisabled(), true);
    assert.equal(await page.locator('#guest-input').getAttribute('aria-invalid'), 'true');
    assert.match(await page.locator('#guest-error').innerText(), /whole number from 0 to 10/);
  }
  await page.locator('#guest-input').fill('2');
  assert.equal(await page.locator('#download-button').isEnabled(), true);
  assert.equal(await page.locator('#guest-error').innerText(), '');
  await page.locator('#guest-input').fill('-1');
  await page.locator('#btn-no').click();
  assert.equal(await page.locator('#download-button').isEnabled(), true);
});

test('drafts require opt in, restore on reload, and clear when saving is turned off', async t => {
  const page = await openCard(t);
  await page.locator('#name-input').fill('Alex');
  await page.locator('#btn-yes').click();
  assert.equal(await page.evaluate(key => localStorage.getItem(key), draftKey), null);
  await page.reload();
  assert.equal(await page.locator('#name-input').inputValue(), '');
  await page.locator('#name-input').fill('Alex');
  await page.locator('#btn-yes').click();
  await page.locator('#guest-input').fill('3');
  await page.locator('#remember-draft').check();
  await page.reload();
  assert.equal(await page.locator('#remember-draft').isChecked(), true);
  assert.equal(await page.locator('#name-input').inputValue(), 'Alex');
  assert.equal(await page.locator('#guest-input').inputValue(), '3');
  assert.equal(await page.locator('#btn-yes').getAttribute('aria-pressed'), 'true');
  await page.locator('#remember-draft').uncheck();
  assert.equal(await page.evaluate(key => localStorage.getItem(key), draftKey), null);
  await page.reload();
  assert.equal(await page.locator('#name-input').inputValue(), '');
});

test('reset clears saved data; Undo restores it once and a new edit cancels Undo', async t => {
  const page = await openCard(t);
  await page.locator('#name-input').fill('Taylor');
  await page.locator('#btn-no').click();
  await page.locator('#remember-draft').check();
  await page.locator('#reset-button').click();
  assert.equal(await page.locator('#name-input').inputValue(), '');
  assert.equal(await page.locator('.btn.active').count(), 0);
  assert.equal(await page.evaluate(key => localStorage.getItem(key), draftKey), null);
  await page.locator('#undo-button').click();
  assert.equal(await page.locator('#name-input').inputValue(), 'Taylor');
  assert.equal(await page.locator('#btn-no').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#remember-draft').isChecked(), true);
  assert.equal(await page.locator('#undo-button').isVisible(), false);
  await page.locator('#reset-button').click();
  await page.locator('#name-input').fill('New response');
  assert.equal(await page.locator('#undo-button').isVisible(), false);
});

test('corrupt or unrecognized drafts leave the card usable', async t => {
  const page = await openCard(t);
  for (const saved of ['{', '{"version":99}', '{"version":1,"remember":true,"name":4}']) {
    await page.evaluate(({ key, saved }) => localStorage.setItem(key, saved), { key: draftKey, saved });
    await page.reload();
    assert.match(await page.locator('#draft-status').innerText(), /could not be read/);
    await page.locator('#btn-yes').click();
    assert.equal(await page.locator('#confirmation').isVisible(), true);
    await page.locator('#reset-button').click();
    assert.equal(await page.evaluate(key => localStorage.getItem(key), draftKey), null);
  }
});

test('blocked storage reports failure without preventing a response', async t => {
  const page = await openCard(t, {}, () => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage unavailable'); } });
  });
  await page.locator('#remember-draft').check();
  assert.match(await page.locator('#draft-status').innerText(), /could not save/);
  await page.locator('#btn-yes').click();
  assert.equal(await page.locator('#confirmation').isVisible(), true);
  await page.locator('#reset-button').click();
  assert.match(await page.locator('#draft-status').innerText(), /could not clear/);
});

test('download contains the selected response and treats names as plain text', async t => {
  const page = await openCard(t);
  await page.locator('#name-input').fill('<img src=x onerror=alert(1)>');
  await page.locator('#btn-yes').click();
  await page.locator('#guest-input').fill('2');
  assert.equal(await page.locator('#confirmation img, #summary-name img').count(), 0);
  for (const choice of ['#btn-yes', '#btn-no']) {
    await page.locator(choice).click();
    const pending = page.waitForEvent('download');
    await page.locator('#download-button').click();
    const download = await pending;
    assert.equal(download.suggestedFilename(), 'rsvp-response.txt');
    const text = await readFile(await download.path(), 'utf8');
    assert.match(text, /<img src=x onerror=alert\(1\)>/);
    assert.match(text, /not been sent to an organizer/);
    assert.match(text, choice === '#btn-yes' ? /3 people in your party/ : /We'll miss you/);
  }
});

test('keyboard input and original task disclosure remain usable', async t => {
  const page = await openCard(t);
  await page.locator('#name-input').focus();
  await page.keyboard.type('Casey');
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').getAttribute('id'), 'btn-yes');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#btn-yes').getAttribute('aria-pressed'), 'true');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Space');
  assert.equal(await page.locator('#btn-no').getAttribute('aria-pressed'), 'true');
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').getAttribute('id'), 'remember-draft');
  await page.locator('summary').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.tasks-panel').isVisible(), true);
});

test('responsive layouts, text zoom, forced colors, and reduced motion', async t => {
  const page = await openCard(t);
  await page.locator('#name-input').fill('Kenneth');
  await page.locator('#btn-yes').click();
  await page.locator('#guest-input').fill('2');
  for (const width of [320, 375, 480, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1050 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `overflow at ${width}`);
    if (process.env.RSVP_CAPTURE_DIR && [375, 1440].includes(width)) {
      await mkdir(process.env.RSVP_CAPTURE_DIR, { recursive: true });
      await page.locator('#name-input').blur();
      await page.screenshot({ path: path.join(process.env.RSVP_CAPTURE_DIR, `preview-${width}.png`), fullPage: true });
    }
    await page.locator('summary').click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `task overflow at ${width}`);
    await page.locator('summary').click();
  }
  await page.setViewportSize({ width: 320, height: 900 });
  await page.addStyleTag({ content: 'html { font-size: 200%; }' });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  assert.equal(await page.locator('#btn-yes').evaluate(el => getComputedStyle(el).outlineStyle), 'solid');
  assert.equal(await page.locator('#btn-yes').evaluate(el => getComputedStyle(el).transitionDuration), '0s');
});

test('JavaScript disabled shows a clear explanation', async t => {
  const page = await openCard(t, { javaScriptEnabled: false });
  assert.equal(await page.locator('noscript').isVisible(), true);
  assert.match(await page.locator('noscript').innerText(), /needs JavaScript/);
});
