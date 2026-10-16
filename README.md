# dsh-workspace-sorter

Independent **workspace-folder ordering** for DeepSeek Harness, with its own
**Workspace order** section in the existing sidebar View options menu.

[![npm version](https://img.shields.io/npm/v/dsh-workspace-sorter.svg)](https://www.npmjs.com/package/dsh-workspace-sorter)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/mrbeandev/dsh-workspace-sorter/actions/workflows/check.yml/badge.svg)](https://github.com/mrbeandev/dsh-workspace-sorter/actions/workflows/check.yml)

- **Source code:** [github.com/mrbeandev/dsh-workspace-sorter](https://github.com/mrbeandev/dsh-workspace-sorter)
- **npm package:** [npmjs.com/package/dsh-workspace-sorter](https://www.npmjs.com/package/dsh-workspace-sorter)

**Contents:** [Why this plugin exists](#why-this-plugin-exists) ·
[Install](#install-from-npm) · [Compatibility](#compatibility-and-limitations) ·
[Development](#build-and-test) · [Local setup](./LOCAL-SETUP.md) · [Release checklist](./RELEASE.md)

## Why this plugin exists

DSH's native **Order by → Last updated** orders sessions inside each workspace,
not the workspace folders themselves. This plugin adds an independent ordering
choice without overwriting the host's saved manual workspace order.

## Install from npm

This checkout prepares **0.1.3**, including the running-workspace folder glow and collapsed-workspace name quick-open. Version 0.1.3 has not been published by this change. Avoid 0.1.0, which failed the isolated GUI boot test.

```bash
dsh plugin --profile web add dsh-workspace-sorter
```

Disable the older `dsh-workspace-sort` plugin if installed, finish active work,
restart DSH when required, and refresh the actual DSH Web page. Then open
**Workspaces → View options → Workspace order**.

To remove:

```bash
dsh plugin --profile web remove dsh-workspace-sorter
```

Restart when required and refresh. No host order needs restoring. Only the
browser preference remains.

## Workspace name quick-open

When a workspace is **collapsed**, clicking its **name** expands it and opens
its latest non-archived session by session update time. Provisional blank
sessions are skipped; an empty workspace simply expands. Clicking the arrow,
folder glyph, or empty row area keeps native expand/collapse-only behavior.
Workspace action buttons are untouched. Clicking the name of an already
expanded workspace keeps native collapse behavior. Modified clicks do not
trigger auto-navigation. This does not change the saved session ordering.

## Running workspace indicator

Workspace folder icons glow **green** while any member session is running,
even when the workspace is collapsed. A selected-but-idle session does not
trigger the glow. Running child agents listed in a member session's subagent
catalog also count. The indicator follows DSH's live session-status store and
clears when the work stops. It works with either workspace-order choice.

The glow is steady (no flashing animation). Only the folder glyph receives
color and shadow; native row selection, labels, and session indicators remain
unchanged. It does not imply a workspace has merely been selected. The
implementation and status aggregation are unit-tested; the full running →
idle transition still needs a real-agent browser test. The sidebar smoke suite
passes with the indicator wrapper installed.

## The Workspace order menu

| Option | Effect |
|---|---|
| **Manual workspace order** (default) | Displays the host's saved manual order. |
| **Last used workspace** | Latest member-session activity first; empty workspaces last and ties in manual order. |

The native session-order choice remains independent. See the limitations below.

> **0.1.3 candidate — not published by this change.** Published 0.1.0 failed real-browser activation in a clean DSH profile; avoid enabling it. The corrected candidate passes 10/10 real-browser smoke checks and 4/4 post-uninstall checks on DSH 0.2.0-rc.2. Broader coexistence and interaction testing remains pending. See [RELEASE.md](./RELEASE.md).

Independent workspace ordering in the DeepSeek Harness sidebar's existing **View options** popup, below its session-order options.

- **Workspace order → Manual workspace order** retains the host's saved order (default).
- **Workspace order → Last used workspace** displays workspaces newest first, by the latest `updatedAt` among their member sessions. Empty workspaces sort last; ties retain manual order.
- Session ordering, grouping, archive filtering, pinning, search, rename and delete remain native.
- Preference is browser-local, persisted as `dsh-workspace-sorter.order.v1`. It synchronizes across tabs on the same origin.
- No network requests, credentials, session contents, or persistent host workspace changes.

## Compatibility and limitations

**Pinned internal adapter for DSH 0.2.0-rc.2.** The native view-options menu has no public extension slot. This plugin wraps the registered `WorkspaceBrowser` function, transforms the returned `ViewOptionsMenu`, and projects a sorted workspace snapshot. It preserves the original entry's injected services, child-slot permissions, locale, and store. It does not edit installed DSH bundles or manipulate the DOM. This is an internal integration, not a stable public menu API; the adapter waits for native registration and leaves unmatched sidebar components untouched rather than failing application boot.

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
