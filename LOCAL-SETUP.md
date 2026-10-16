# Local setup

Use a disposable DSH home for installation, persistence, and removal tests.
Do not copy credentials or private session logs into it. Use a filesystem with
POSIX permissions; the other plugins' setup guides recommend `/tmp` on Linux.

## Build and package

```bash
npm run check
npm pack
```

The source of truth is `client/index.mjs`; `lib/client.js` is generated.

## Isolated installation

In a separate terminal (do not change the home of your active DSH process):

```bash
export DSH_HOME="$(mktemp -d /tmp/dsh-workspace-sorter.XXXXXX)"
dsh plugin --profile web add /absolute/path/to/dsh-workspace-sorter-0.1.0.tgz
# For a registry-install check instead:
# dsh plugin --profile web add dsh-workspace-sorter@0.1.0
```

Starting an additional test server is a separate, explicit testing step. It
will not update your normal DSH GUI. Use its printed URL, not an assumed URL.

```bash
dsh web --no-open --port 18765
```

Open the printed authenticated URL in a separate browser profile. Create at
least three workspaces and sessions with different last-activity times using
safe synthetic inputs. Do not connect real providers or trigger billed calls
just to populate test data without separately authorizing them.

## Reproducible browser smoke test

After installing the candidate, add this test-only patch to the **disposable** profile before starting DSH (replace the path with this checkout):

```yaml
- insert:
    - id: sorter-e2e-fixtures
      name: /absolute/path/to/dsh-workspace-sorter/scripts/e2e-fixtures.mjs
```

The fixture plugin refuses homes outside `/tmp/dsh-workspace-sorter-e2e.*`.
It creates synthetic old/new/empty workspaces and offline session messages;
no provider calls or keys are needed. Start DSH and run:

```bash
DSH_E2E_URL='http://127.0.0.1:18765/?token=…' npm run test:e2e
```

The script launches its own temporary headless Chrome profile and drives it
through CDP. It checks boot, menu, native controls, manual/recency ordering,
browser preference, reload, manual restoration, narrow viewport and errors.
After removal and restart:

```bash
DSH_E2E_ABSENT=1 DSH_E2E_URL='http://127.0.0.1:18765/?token=…' npm run test:e2e
```

Local results on 2026-10-16: **0.1.1 candidate 10/10; removal 4/4** on DSH
0.2.0-rc.2. The registry 0.1.0 failed boot before the fix. Full matrix below
is broader than these smoke checks and is not claimed complete.

## Extended GUI test matrix

1. Confirm Workspace order appears inside the existing View options popup.
2. Select Last used; verify folder ordering changes while session ordering
   stays unchanged. Switch to Manual and verify the saved manual order returns.
3. Update activity in an older workspace and verify it moves appropriately.
4. Check empty workspaces, equal activity, missing session summaries, archives,
   pinned sessions, search, rename/delete, and workspace-tree/flat grouping.
5. Verify session dragging remains native; workspace drag commits are disabled
   in Last used and functional in Manual.
6. Reload and restart; verify the browser preference remains. Test two tabs,
   narrow/collapsed sidebar, and keyboard menu interaction.
7. Inspect browser console and host logs for registration/rendering errors.
8. Disable/re-enable, remove/reinstall, restart and refresh. Confirm removal
   restores the native sidebar and no host workspace order was rewritten.
9. Repeat with optional sidebar plugins installed. Keep `dsh-workspace-sort`
   disabled because it separately rewrites manual order daily.
10. Repeat installation from the exact registry version, not only the checkout.

## How related plugins test

The image-edge-cap repository provides a dependency-free headless Chrome/CDP
smoke-test script, parameterized by `DSH_E2E_URL`, plus an isolated `DSH_HOME`
setup and optional screenshots. It exercises the actual Settings page and
checks console errors. Its integration setup runs tests against several DSH
versions. The RPM repository separately tests middleware/config behavior and
documents a real rate-limiting smoke test.

These are inspected test procedures, not evidence that those prior sessions
executed every step. Workspace-sorter now has a matching CDP smoke-test script, executed locally
against an isolated DSH profile. Do not substitute its smoke checks for the
entire extended interaction matrix.

Keep screenshots, browser profiles, test homes, tokens, and logs outside Git
and the npm artifact. Stop the disposable server when done. Never delete a
computed test-home path without first verifying the resolved target.
