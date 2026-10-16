import test from 'node:test';
import assert from 'node:assert/strict';
import { createClientPlugin } from '../client/index.mjs';
const plugin = () => createClientPlugin(() => ({}));

test('latest session uses recency, ignores archives and provisional blank sessions', () => {
  const p = plugin(), item = { sessionIds: ['missing', 'old', 'new', 'archived', 'blank'] };
  const byId = { old: { updatedAt: 10 }, new: { updatedAt: 20 }, archived: { updatedAt: 30 }, blank: { blank: true, updatedAt: 40 } };
  assert.equal(p.latestSession(item, byId, ['archived']), 'new');
  assert.equal(p.latestSession({ sessionIds: [] }, byId), undefined);
  assert.equal(p.latestSession({ sessionIds: ['blank'] }, byId), undefined);
});

test('only collapsed workspace name click queues navigation; arrow and actions stay native', async () => {
  const p = plugin(), calls = [];
  let expanded = 'false';
  const title = { contains: target => target.kind === 'title' };
  const row = { children: [{}, {}, title, {}], getAttribute: name => name === 'aria-expanded' ? expanded : 'workspace:w' };
  const target = kind => ({ kind, closest: () => row });
  const items = [{ workspaceId: 'w', sessionIds: ['s'] }], list = { byId: { s: { updatedAt: 10 } } };
  const click = (kind, extra = {}) => p.workspaceNameClick({ button: 0, target: target(kind), currentTarget: { contains: () => true }, ...extra }, items, list, [], id => calls.push(id));
  click('arrow'); click('folder'); click('actions'); click('title', { ctrlKey: true });
  assert.deepEqual(calls, []);
  click('title');
  assert.deepEqual(calls, []); // native expansion can happen first
  await Promise.resolve();
  assert.deepEqual(calls, ['s']);
  expanded = 'true'; click('title');
  await Promise.resolve();
  assert.deepEqual(calls, ['s']);
});
