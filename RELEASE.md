# Release checklist

## Current candidate: 0.1.3 (not published)

Version 0.1.3 prepares collapsed-workspace name quick-open together with the
running-workspace glow. No npm publication is performed by this version bump. Test results
below were obtained from the corresponding local candidate before this
metadata-only bump.

Local tests on 2026-10-16 used DSH 0.2.0-rc.2, Node 24, and real headless
Google Chrome/CDP in a disposable DSH_HOME. The primary profile and port 3080
were not modified.

### Added: collapsed workspace name quick-open

Clicking the name of a collapsed workspace retains native expansion and then
opens its latest available non-archived, non-provisional session. Arrow and
other row-area clicks remain expansion-only. Tests cover recency selection,
archives, blanks, modified clicks, title/arrow/action targeting and already
expanded rows. An isolated browser check confirmed arrow-only expansion kept
the selected session and a collapsed-name click expanded and selected the
workspace's session. Initial synthetic navigation fixtures lacked a turn-end
reason and produced native feed errors; the reusable fixture now includes a
complete interrupted turn. Broader navigation smoke automation is pending.

### Added: running workspace folder glow

Folder glyphs glow green whenever a member session or catalogued child agent
is running. The live status store overrides cached list running flags. Selected
idle sessions do not glow; the CSS selector is independent of expansion state.
No DOM mutation or host write is used. Scoped steady glow is rendered beside
the native tree. Tests cover status precedence, child activity, idle selection,
collapsed-compatible selectors and CSS escaping. The 10/10 browser sidebar
smoke suite was rerun successfully after this addition; real-agent running →
idle visual transition testing remains pending.

### Findings and fixes

- Exact registry **0.1.0 installed successfully but failed GUI boot** because
  it assumed the native sidebar had already registered. The fix subscribes to
  slot registration and installs once the expected native component exists.
- Provisional blank browser sessions incorrectly dominated recency. Ignore
  blank sessions with no accepted prompt, while counting prompt timestamps
  even before an assistant response. Added regressions for both findings.
- Final corrected tarball: **10/10 GUI smoke checks passed** (boot, independent
  menu, native controls, manual order, recency order, preference, reload,
  manual restoration, narrow layout, no console errors).
- Removal + DSH restart: **4/4 checks passed** (boot, menu absent, boot-graph
  entry absent, no console errors). Several remove/reinstall cycles completed.
- Preference survived a manual test-server restart. Full automated multi-tab,
  live activity updates, keyboard, drag, archived/pinned and third-party
  sidebar coexistence tests remain pending.

No model calls or real credentials were used. Synthetic session messages were
created only in the disposable home. No npm publication was performed.

## Previous release: 0.1.0 (published by the owner)

The npm registry confirms `dsh-workspace-sorter@0.1.0`, with repository metadata
pointing to `mrbeandev/dsh-workspace-sorter`. It is MIT-licensed. Publication
remains manual; no automatic npm publishing workflow is configured.

**Status: experimental.** Publication does not close the runtime verification
requirements below. Version 0.1.0 is immutable on npm; fixes must use a new
version. Documentation changes here do not update the already-published README.

## Historical verification evidence (before GUI testing)

The table below records the original 0.1.0 preparation, not the current
0.1.1 results above. Pending GUI items were subsequently exercised only to
the scope explicitly described in the 0.1.1 findings.

| Check | Status |
|---|---|
| Build and generated bundle | Passed locally; CI checks bundle consistency |
| Five unit/factory tests | Passed locally and in CI |
| Installed DSH 0.2.0-rc.2 bundle-shape check | Passed locally; skipped in CI without the optional artifact path |
| Packed-file allowlist | Inspected: six runtime/documentation files, no private data |
| npm publication dry run | Passed before owner publication |
| GitHub Actions | Initial run passed |
| Registry metadata | 0.1.0 confirmed after publication |
| Tarball installation in isolated DSH | Pending |
| Actual GUI interaction / error logs | Pending |
| Reload/restart and multi-tab behavior | Pending |
| Disable/re-enable / uninstall/reinstall | Pending |
| Other sidebar plugins and DSH versions | Pending |

The shape check is not a real browser or Cordis-lifecycle integration test.
The guard is source-shape-based, not a strict DSH version gate.

## Before the next release

1. Complete the isolated matrix in LOCAL-SETUP.md against the exact packed
   artifact, then repeat with the registry installation after publication.
2. Add a reproducible GUI smoke-test script, following the other plugins'
   headless Chrome/CDP pattern, and record results without private data.
3. Review compatibility and dependency injection for the supported DSH version.
4. Verify source, generated bundle, runtime IDs, metadata, README version table,
   storage key, bundle patch, and advertised behavior agree.
5. Run `npm run check` and the optional installed-bundle shape test.
6. Run `npm publish --dry-run --json`; inspect the allowlist, size and integrity.
7. Check Git for credentials, logs, session data, tarballs, and machine paths.
8. Bump the version for package changes; commit and push with a clean tree.
9. Tag a verified release and publish only on explicit owner authorization.

`prepack` rebuilds and tests; `prepublishOnly` runs package checks. These are
not a complete runtime release gate. Do not describe all AGENTS.md release
requirements as satisfied until the pending checks above actually pass.
