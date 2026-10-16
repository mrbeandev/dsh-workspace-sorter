import test from 'node:test';
import assert from 'node:assert/strict';
import { createClientPlugin } from '../client/index.mjs';

test('workspace glow follows running status, not selection, including child agents', () => {
  const plugin = createClientPlugin(() => ({}));
  const items = [{ workspaceId: 'selected', sessionIds: ['idle'] }, { workspaceId: 'running', sessionIds: ['work'] }, { workspaceId: 'parent', sessionIds: ['p'] }];
  const list = { byId: { idle: { retainedBy: { mainView: 1 }, running: false }, work: { running: true } }, projectionsBySession: { p: { values: { subagentCatalog: [{ id: 'child' }] } } } };
  assert.deepEqual(plugin.runningWorkspaces(items, list, new Map([['child', { running: true }]])), ['running', 'parent']);
  assert.deepEqual(plugin.runningWorkspaces(items, list, new Map([['work', { running: false }]])), []);
  const css = plugin.glowCss(['running']);
  assert.ok(css.includes('[data-row-key="workspace:running"] > span:first-child'));
  assert.ok(css.includes('drop-shadow'));
  assert.equal(css.includes('aria-expanded'), false); // collapsed and expanded
  assert.equal(plugin.glowCss([]), '');
  assert.equal(plugin.glowCss(['bad"}']).includes('bad"}'), false);
});

test('deferred native registration does not fail boot and installs when ready', () => {
  const listeners = new Set(), effects = [];
  globalThis.window = { addEventListener() {}, removeEventListener() {} };
  globalThis.localStorage = { getItem() { return null; } };
  const plugin = createClientPlugin(() => ({}));
  let entries = [];
  const ctx = { slots: { entries: () => entries, subscribe: (_name, fn) => { listeners.add(fn); return () => listeners.delete(fn); } }, effect: fn => effects.push(fn()) };
  assert.doesNotThrow(() => plugin.apply(ctx));
  function WorkspaceBrowser() { /* ViewOptionsMenu useWorkspaces storedWorkspaces insertWorkspaceBefore */ }
  const entry = { component: WorkspaceBrowser };
  entries = [entry];
  for (const fn of listeners) fn();
  assert.notEqual(entry.component, WorkspaceBrowser);
  for (const dispose of effects.reverse()) dispose?.();
  assert.equal(entry.component, WorkspaceBrowser);
});

test('provisional blank sessions do not outrank actual accepted prompts', () => {
  const plugin = createClientPlugin(() => ({}));
  const items = [{ id: 'blank', sessionIds: ['blank'] }, { id: 'old', sessionIds: ['old'] }, { id: 'new', sessionIds: ['new'] }];
  const byId = {
    blank: { blank: true, updatedAt: 1000 },
    old: { blank: true, updatedAt: 10, projectionValues: { sessionListMetadata: { lastPromptAt: 10 } } },
    new: { blank: false, updatedAt: 20 },
  };
  assert.deepEqual(plugin.sortItems(items, byId).map(item => item.id), ['new', 'old', 'blank']);
});
