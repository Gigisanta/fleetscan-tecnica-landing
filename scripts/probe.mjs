import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const url = 'file:///Users/prueba/fleetscan-tecnica-landing/index.html';
const profile = mkdtempSync(join(tmpdir(), 'fleetscan-cdp-'));
const child = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run',
  '--no-default-browser-check', `--user-data-dir=${profile}`, '--remote-debugging-port=9227',
  'about:blank'
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < 50; i++) {
  try { await fetch('http://127.0.0.1:9227/json/version'); break; } catch { await sleep(100); }
}
const target = await fetch('http://127.0.0.1:9227/json/new?' + encodeURIComponent(url), { method: 'PUT' }).then(r => r.json());
const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});
await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));
const send = (method, params = {}) => new Promise((resolve) => {
  const callId = ++id; pending.set(callId, resolve); ws.send(JSON.stringify({ id: callId, method, params }));
});
await send('Page.enable');
await send('Runtime.enable');

async function probe(name, width, height, screenshotPath) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 700 });
  await send('Page.navigate', { url });
  await new Promise((resolve) => setTimeout(resolve, 900));
  const expr = `(() => {
    const rect = (sel) => document.querySelector(sel)?.getBoundingClientRect();
    const all = (sel) => [...document.querySelectorAll(sel)];
    const cta = rect('.hero-actions');
    const nav = rect('.site-header');
    const hero = rect('.hero');
    const links = all('a,button,input,textarea').map(el => ({tag: el.tagName, text: el.innerText || el.placeholder || el.name || '', r: el.getBoundingClientRect()}));
    const smallTargets = links.filter(x => x.r.width && x.r.height && (x.r.width < 40 || x.r.height < 40)).map(x => ({tag:x.tag,text:x.text,w:x.r.width,h:x.r.height}));
    return {
      viewport: [innerWidth, innerHeight],
      overflowX: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
      scrollHeight: document.documentElement.scrollHeight,
      h1Count: document.querySelectorAll('h1').length,
      title: document.title,
      metaDescription: document.querySelector('meta[name="description"]')?.content.length,
      brokenAnchors: all('a[href^="#"]').filter(a => !document.querySelector(a.getAttribute('href'))).map(a => a.getAttribute('href')),
      heroHeight: hero?.height,
      ctaTop: cta?.top,
      ctaBottom: cta?.bottom,
      navBottom: nav?.bottom,
      scannerTop: rect('.scanner-card')?.top,
      scannerBottom: rect('.scanner-card')?.bottom,
      smallTargets,
      jsonLdCount: document.querySelectorAll('script[type="application/ld+json"]').length,
      formFields: all('input,textarea').length,
      sectionCount: all('main section').length
    };
  })()`;
  const out = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(screenshotPath, Buffer.from(shot.result.data, 'base64'));
  return { name, ...out.result.result.value, screenshotPath };
}

const results = [];
results.push(await probe('desktop', 1440, 1000, '/tmp/fleetscan-cdp-desktop.png'));
results.push(await probe('mobile', 390, 1000, '/tmp/fleetscan-cdp-mobile.png'));
console.log(JSON.stringify(results, null, 2));
ws.close();
child.kill('SIGTERM');
setTimeout(() => rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }), 250);
