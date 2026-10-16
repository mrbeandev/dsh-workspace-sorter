# Release checklist

## Current release: 0.1.0 (published by the owner)

The npm registry confirms `dsh-workspace-sorter@0.1.0`, with repository metadata
pointing to `mrbeandev/dsh-workspace-sorter`. It is MIT-licensed. Publication
remains manual; no automatic npm publishing workflow is configured.

**Status: experimental.** Publication does not close the runtime verification
requirements below. Version 0.1.0 is immutable on npm; fixes must use a new
version. Documentation changes here do not update the already-published README.

## Verification evidence

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
