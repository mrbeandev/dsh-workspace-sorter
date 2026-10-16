import test from 'node:test';
import assert from 'node:assert/strict';
import { createClientPlugin } from '../client/index.mjs';

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
