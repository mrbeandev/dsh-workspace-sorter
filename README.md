# dsh-workspace-sorter

> **Experimental candidate — not yet GUI-verified.** Build and unit/package checks pass. Installation from the tarball, actual sidebar rendering, and coexistence/uninstall tests are still release gates. Do not interpret this public source repository as a production-readiness guarantee.

Independent workspace ordering in the DeepSeek Harness sidebar's existing **View options** popup, below its session-order options.

- **Workspace order → Manual workspace order** retains the host's saved order (default).
- **Workspace order → Last used workspace** displays workspaces newest first, by the latest `updatedAt` among their member sessions. Empty workspaces sort last; ties retain manual order.
- Session ordering, grouping, archive filtering, pinning, search, rename and delete remain native.
- Preference is browser-local, persisted as `dsh-workspace-sorter.order.v1`. It synchronizes across tabs on the same origin.
- No network requests, credentials, session contents, or persistent host workspace changes.

## Compatibility and limitations

**Pinned internal adapter for DSH 0.2.0-rc.2.** The native view-options menu has no public extension slot. This plugin wraps the registered `WorkspaceBrowser` function, transforms the returned `ViewOptionsMenu`, and projects a sorted workspace snapshot. It preserves the original entry's injected services, child-slot permissions, locale, and store. It does not edit installed DSH bundles or manipulate the DOM. This is an internal integration, not a stable public menu API; incompatible sidebar components are rejected with an explicit error.

“Last used” is **latest session activity**, not merely clicking a folder. Activity includes archived sessions. Workspace-tree mode keeps the native hierarchy and applies ordering within it. In flat mode there is no workspace list to reorder. Workspace drag commits are suppressed while Last used is active; switch to Manual before dragging. Session drag behavior remains native. The native drag affordance is still shown.

The UI additions are intentionally English-only. Full browser runtime/HMR and coexistence testing is still required before release. A full refresh after enabling/disabling is required because the adapter changes the live component entry; automatic HMR is not claimed.

## Build and test

```sh
npm run check
npm pack
```

An optional installed-bundle shape check runs when `DSH_TEST_WORKSPACE_CLIENT` points to the installed `dsh-client-ui-workspace/lib/client.js` artifact. Without it, that one integration check is skipped so contributors and CI do not need a private DSH installation. This check inspects shape, not browser behavior.

Editable client source is `client/index.mjs`. `scripts/build.mjs` produces `lib/client.js`, using the GUI's React singleton rather than bundling React. Host `index.mjs` is intentionally a no-op; `cordis.patch.yml` registers the dual-face package. No Remote or additional service namespace is required. The sole injected package is `@deepseek-ai/dsh-client-ui-workspace`, which owns the sidebar and supplies its dependencies.

## Try locally

First test the packed tarball in a disposable web profile. Do not publish without explicit authorization.

```sh
dsh plugin --profile web add /absolute/path/to/dsh-workspace-sorter-0.1.0.tgz
```

Before activating in your normal profile, **disable the existing `dsh-workspace-sort` plugin** (entry `workspace-sort`): it independently overwrites the host's manual order daily and would undermine the meaning of Manual here. This package does not silently disable another plugin. Restart DSH if requested and refresh the actual DSH GUI. Open Workspaces → View options → Workspace order.

Verify manual/last-used toggling, new session activity, reload persistence, narrow/collapsed sidebar, workspace-tree/flat grouping, archive filters, search, session drag, workspace drag in Manual, and uninstall + refresh. Uninstalling leaves only the browser preference; no host order needs restoring.
