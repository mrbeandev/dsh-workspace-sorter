#!/usr/bin/env node
// Dependency-free Chrome/CDP smoke test, following dsh-image-edge-cap.
// Use only an isolated DSH_HOME populated by e2e-fixtures.mjs.
import { spawn } from 'node:child_process';
import { mkdtemp, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const url = process.env.DSH_E2E_URL;
if (!url) throw new Error('Set DSH_E2E_URL to the isolated DSH URL (including token).');
const absent = process.env.DSH_E2E_ABSENT === '1';
const profile = await mkdtemp(join(tmpdir(), 'workspace-sorter-chrome-'));
const port = 9500 + Math.floor(Math.random() * 500);
const chrome = spawn(process.env.CHROME ?? 'google-chrome', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, '--window-size=1400,1000', 'about:blank'], { stdio: 'ignore' });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const results = [];
const check = (name, ok) => { results.push({ name, ok: !!ok }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); };
let ws;
try {
  let target;
  for (let i = 0; i < 60; i++) {
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page'); } catch {}
    if (target) break;
    await delay(100);
  }
  if (!target) throw new Error('Chrome did not start');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let seq = 0;
  const pending = new Map(), errors = [];
  ws.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) { const resolve = pending.get(message.id); pending.delete(message.id); resolve?.(message); }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails?.text);
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map(a => a.value ?? a.description).join(' '));
  };
  const send = (method, params = {}) => new Promise(resolve => { const id = ++seq; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.error || r.result?.exceptionDetails) throw new Error(JSON.stringify(r.error ?? r.result.exceptionDetails));
    return r.result?.result?.value;
  };
  const wait = async expression => { for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return true; await delay(100); } return false; };
  const open = async () => { await evaluate(`document.querySelector('button[aria-label="View options"]').click()`); await wait(`!!document.querySelector('[role=menu]')`); };
  const pick = async text => { const ok = await evaluate(`(() => {const e=[...document.querySelectorAll('[role=menuitem]')].find(e=>e.textContent.trim()===${JSON.stringify(text)});e?.click();return !!e;})()`); if (!ok) throw new Error(`Missing menu item ${text}`); await delay(150); };
  const order = `JSON.stringify([...document.querySelectorAll('[role=treeitem]')].map(e=>e.getAttribute('aria-label')||e.textContent).filter(t=>t.startsWith('Sorter ')))`;
  await send('Runtime.enable'); await send('Page.enable');
  await send('Page.navigate', { url });
  check('DSH boots with native workspace sidebar', await wait(`!!document.querySelector('button[aria-label="View options"]')`));
  await evaluate(`[...document.querySelectorAll('button')].find(e=>e.textContent==='Configure later')?.click()`);
  await open();
  const menu = await evaluate(`document.querySelector('[role=menu]').innerText`);
  if (absent) {
    check('removed plugin has no menu entries', !menu.includes('Workspace order'));
    check('removed plugin is absent from boot graph', await evaluate(`!window.__DSH_BOOT__.entries.some(e=>e.id==='dsh-workspace-sorter')`));
  } else {
    check('independent workspace section renders', menu.includes('Workspace order') && menu.includes('Last used workspace'));
    check('native grouping/session/archive controls remain', ['Group by', 'Last updated', 'Hide archived'].every(text => menu.includes(text)));
    await pick('Manual workspace order');
    check('manual folder order', await wait(`${order} === '["Sorter Empty","Sorter Old","Sorter New"]'`));
    await open(); await pick('Last used workspace');
    console.log('Observed recency order:', await evaluate(order));
    check('recent folder first and empty folder last', await wait(`${order} === '["Sorter New","Sorter Old","Sorter Empty"]'`));
    check('preference persisted in browser storage', await evaluate(`localStorage.getItem('dsh-workspace-sorter.order.v1')==='last-used'`));
    await send('Page.reload');
    check('sorted order survives reload', await wait(`${order} === '["Sorter New","Sorter Old","Sorter Empty"]'`));
    await open(); await pick('Manual workspace order');
    check('manual order is restored without host rewrite', await wait(`${order} === '["Sorter Empty","Sorter Old","Sorter New"]'`));
    await send('Emulation.setDeviceMetricsOverride', { width: 700, height: 900, deviceScaleFactor: 1, mobile: false });
    check('narrow viewport keeps workspace sidebar', await wait(`!!document.querySelector('button[aria-label="View options"]')`));
  }
  check('no browser errors', errors.length === 0);
  if (errors.length) console.log(JSON.stringify(errors));
} finally {
  ws?.close(); chrome.kill();
  await new Promise(resolve => chrome.exitCode !== null ? resolve() : chrome.once('exit', resolve));
  // Verify the exact mkdtemp path before deleting only this browser profile.
  const resolved = await realpath(profile);
  if (!resolved.startsWith(`${await realpath(tmpdir())}/workspace-sorter-chrome-`)) throw new Error('Unexpected browser profile path');
  await rm(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
console.log(`${results.filter(r => r.ok).length}/${results.length} checks passed`);
process.exitCode = results.some(r => !r.ok) ? 1 : 0;
