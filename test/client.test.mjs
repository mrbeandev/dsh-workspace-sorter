import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { createClientPlugin } from '../client/index.mjs';

function harness() {
  const values = new Map();
  const events = new EventTarget();
  globalThis.localStorage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  globalThis.window = events;
  const React = {
    useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
    useMemo: fn => fn(),
    createElement: (type, props) => ({ type, props, key: props?.key }),
    isValidElement: node => !!node && typeof node === 'object' && 'type' in node,
    cloneElement: (node, props, ...children) => ({ ...node, props: { ...node.props, ...props, ...(children.length ? { children: children[0] } : {}) } }),
  };
  const plugin = createClientPlugin(id => { assert.equal(id, 'react'); return React; });
  return { plugin, values, React };
}

test('stable recency sort is immutable and handles empty/missing/invalid sessions', () => {
  const { plugin } = harness();
  const items = [{ id: 'empty', sessionIds: [] }, { id: 'old', sessionIds: ['a'] }, { id: 'new', sessionIds: ['b', 'a'] }, { id: 'tie', sessionIds: ['b'] }, { id: 'bad', sessionIds: ['x', 'missing'] }];
  const before = structuredClone(items);
  assert.deepEqual(plugin.sortItems(items, { a: { updatedAt: 10 }, b: { updatedAt: 20 }, x: { updatedAt: NaN } }).map(x => x.id), ['new', 'tie', 'old', 'empty', 'bad']);
  assert.deepEqual(items, before);
});

test('menu adds independent options, persists choice, and forwards native selections', () => {
  const { plugin, values } = harness();
  let native, closed = false;
  function Menu() {}
  function ViewOptionsMenu() { return { type: Menu, props: { items: [{ id: 'updated' }, { id: 'archived-filter-separator', type: 'separator' }], selectedIds: ['updated'], onClose: () => { closed = true; }, onSelect: id => { native = id; } } }; }
  const Wrapped = plugin.menuFor(ViewOptionsMenu);
  let node = Wrapped({});
  assert.ok(node.props.selectedIds.includes('updated'));
  assert.ok(node.props.selectedIds.includes('dsh-workspace-sorter.manual'));
  node.props.onSelect('dsh-workspace-sorter.last-used');
  assert.equal(values.get('dsh-workspace-sorter.order.v1'), 'last-used');
  assert.equal(closed, true);
  node = Wrapped({});
  assert.deepEqual(node.props.selectedIds, ['updated', 'dsh-workspace-sorter.last-used']);
  node.props.onSelect('only-archived');
  assert.equal(native, 'only-archived');
});

test('guard fails without changing unrelated sidebar components', () => {
  const { plugin } = harness();
  const entry = { component: function OtherSidebar() {} };
  plugin.apply({ slots: { entries: () => [entry], subscribe: () => () => {} }, effect: fn => fn() });
  assert.equal(entry.component.name, 'OtherSidebar');
});

test('wrapper preserves entry contract and restores original component on dispose', () => {
  const { plugin } = harness();
  function WorkspaceBrowser(props) { /* ViewOptionsMenu storedWorkspaces insertWorkspaceBefore */ return props.useWorkspaces(x => x.items); }
  const entry = { component: WorkspaceBrowser, store: {}, children: {}, inject: () => ({}), locale: 'workspace' };
  const store = entry.store;
  let dispose;
  plugin.apply({ slots: { entries: () => [entry], subscribe: () => () => {} }, effect: fn => { dispose = fn(); } });
  assert.notEqual(entry.component, WorkspaceBrowser);
  assert.equal(entry.store, store);
  const state = { items: [{ id: 'old', sessionIds: ['a'] }, { id: 'new', sessionIds: ['b'] }] };
  const props = { useSessions: fn => fn({ byId: { a: { updatedAt: 1 }, b: { updatedAt: 2 } } }), useWorkspaces: fn => fn(state) };
  assert.deepEqual(entry.component(props).map(x => x.id), ['old', 'new']);
  plugin.menuFor(() => ({ type: 'menu', props: { items: [{ id: 'archived-filter-separator' }], selectedIds: [], onClose() {} } }))({}).props.onSelect('dsh-workspace-sorter.last-used');
  assert.deepEqual(entry.component(props).map(x => x.id), ['new', 'old']);
  dispose();
  assert.equal(entry.component, WorkspaceBrowser);
});

test('generated client factory loads with the exact npm identity', async () => {
  let registration;
  vm.runInNewContext(await readFile(new URL('../lib/client.js', import.meta.url), 'utf8'), { window: { __ModuleLoader__: { load: item => { registration = item; } } } });
  assert.equal(registration.id, 'dsh-workspace-sorter');
  assert.equal(typeof registration.factory, 'function');
});

const installed = process.env.DSH_TEST_WORKSPACE_CLIENT;
test('adapter guard and menu shape match the actual installed workspace bundle', { skip: !installed }, async () => {
  let registration;
  vm.runInNewContext(await readFile(installed, 'utf8'), { window: { __ModuleLoader__: { load: item => { registration = item; } } } });
  function noop() { return {}; }
  const fake = new Proxy({}, { get: () => noop });
  const exported = registration.factory(() => fake);
  // Inspect source markers rather than executing host-dependent apply.
  const source = await readFile(installed, 'utf8');
  assert.match(source, /function WorkspaceBrowser\(/);
  assert.match(source, /function ViewOptionsMenu\(/);
  assert.match(source, /id: "archived-filter-separator"/);
  assert.equal(typeof exported.apply, 'function');
});
