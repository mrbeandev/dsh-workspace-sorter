/* Version-pinned adapter. No DOM manipulation or host workspace writes. */
export function createClientPlugin(require) {
  const React = require('react');
  const KEY = 'dsh-workspace-sorter.order.v1';
  const EVENT = 'dsh-workspace-sorter:changed';
  const read = () => { try { return localStorage.getItem(KEY) === 'last-used' ? 'last-used' : 'manual'; } catch { return 'manual'; } };
  let mode = read();
  const listeners = new Set();
  const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn); };
  const snapshot = () => mode;
  function refresh() { mode = read(); for (const fn of listeners) fn(); }
  function setMode(next) {
    mode = next;
    try { localStorage.setItem(KEY, next); } catch { /* Keep usable in private browsers. */ }
    for (const fn of listeners) fn();
    window.dispatchEvent(new Event(EVENT));
  }
  function sortItems(items, byId) {
    return items.map((item, index) => ({ item, index, time: item.sessionIds.reduce((latest, id) => {
      const session = byId[id];
      // Opening a new browser can create a provisional blank session in the
      // first workspace. That is not actual workspace activity.
      const lastPrompt = session?.projectionValues?.sessionListMetadata?.lastPromptAt;
      const value = session?.blank === true && !(typeof lastPrompt === 'number' && Number.isFinite(lastPrompt)) ? undefined : session?.updatedAt;
      return typeof value === 'number' && Number.isFinite(value) ? Math.max(latest, value) : latest;
    }, 0) })).sort((a, b) => b.time - a.time || a.index - b.index).map(row => row.item);
  }
  const menus = new WeakMap();
  function menuFor(Original) {
    if (menus.has(Original)) return menus.get(Original);
    function WorkspaceOrderMenu(props) {
      const selected = React.useSyncExternalStore(subscribe, snapshot, snapshot);
      const element = Original(props);
      const p = element.props;
      const separator = p.items.findIndex(item => item.id === 'archived-filter-separator');
      if (separator < 0) return element;
      const extra = [
        { type: 'separator', id: 'dsh-workspace-sorter.separator' },
        { type: 'label', id: 'dsh-workspace-sorter.label', text: 'Workspace order' },
        { id: 'dsh-workspace-sorter.manual', label: 'Manual workspace order' },
        { id: 'dsh-workspace-sorter.last-used', label: 'Last used workspace' },
      ];
      return React.cloneElement(element, {
        items: [...p.items.slice(0, separator), ...extra, ...p.items.slice(separator)],
        selectedIds: [...p.selectedIds, `dsh-workspace-sorter.${selected}`],
        onSelect(id) {
          if (id === 'dsh-workspace-sorter.manual' || id === 'dsh-workspace-sorter.last-used') {
            setMode(id.slice('dsh-workspace-sorter.'.length));
            p.onClose();
          } else p.onSelect(id);
        },
      });
    }
    menus.set(Original, WorkspaceOrderMenu);
    return WorkspaceOrderMenu;
  }
  function transform(node) {
    if (Array.isArray(node)) return node.map(transform);
    if (!React.isValidElement(node)) return node;
    if (typeof node.type === 'function' && node.type.name === 'ViewOptionsMenu') {
      return React.createElement(menuFor(node.type), { ...node.props, key: node.key });
    }
    if (node.props.children === undefined) return node;
    return React.cloneElement(node, undefined, transform(node.props.children));
  }
  function compatible(Component) {
    if (typeof Component !== 'function' || Component.name !== 'WorkspaceBrowser') return false;
    const source = Function.prototype.toString.call(Component);
    return ['ViewOptionsMenu', 'useWorkspaces', 'storedWorkspaces', 'insertWorkspaceBefore'].every(text => source.includes(text));
  }
  function apply(ctx) {
    let installed = false;
    const attempt = () => {
      if (installed) return;
      if (!ctx.slots.entries('sidebar.workspaces').some(item => compatible(item.component))) return;
      installed = true;
      install(ctx);
    };
    ctx.effect(() => ctx.slots.subscribe('sidebar.workspaces', attempt));
    attempt();
  }
  function install(ctx) {
    const entries = ctx.slots.entries('sidebar.workspaces');
    const entry = entries.find(item => compatible(item.component));
    if (!entry) throw new Error('dsh-workspace-sorter: unsupported workspace sidebar. Adapter targets DSH 0.2.0-rc.2; native sidebar left unchanged.');
    const Original = entry.component;
    function WorkspaceSorter(props) {
      const selected = React.useSyncExternalStore(subscribe, snapshot, snapshot);
      const sessions = props.useSessions(state => state);
      // Derive only the items projection, leaving phase, archive, pin and all
      // other workspace selectors untouched. Memoize to preserve hook snapshots.
      const project = React.useMemo(() => {
        let previous, derived;
        return state => {
          if (state !== previous) {
            previous = state;
            derived = selected === 'last-used' ? { ...state, items: sortItems(state.items, sessions.byId) } : state;
          }
          return derived;
        };
      }, [selected, sessions.byId]);
      const useWorkspaces = selector => props.useWorkspaces(state => selector(project(state)));
      const tree = Original({ ...props, useWorkspaces,
        insertWorkspaceBefore: selected === 'last-used' ? async () => {} : props.insertWorkspaceBefore,
      });
      return transform(tree);
    }
    // Preserve the original entry's store, injected services, locale, child-slot
    // authorization, and identity. Registering a second owner of its children
    // is rejected by DSH. This intentionally uses its inspected internal seam.
    entry.component = WorkspaceSorter;
    window.addEventListener('storage', refresh);
    window.addEventListener(EVENT, refresh);
    ctx.effect(() => () => {
      if (entry.component === WorkspaceSorter) entry.component = Original;
      window.removeEventListener('storage', refresh);
      window.removeEventListener(EVENT, refresh);
    });
  }
  return { inject: ['slots'], apply, sortItems, compatible, menuFor, transform };
}
