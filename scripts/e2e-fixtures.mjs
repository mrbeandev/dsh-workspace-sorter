// Test-only host plugin. Never pack or install in a primary DSH profile.
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
export const inject = ['workspaceRegistry', 'sessions'];
export async function apply(ctx) {
  const home = process.env.DSH_HOME;
  if (!home || !resolve(home).startsWith('/tmp/dsh-workspace-sorter-e2e.')) throw new Error('Fixtures require a dedicated /tmp/dsh-workspace-sorter-e2e.* home');
  const workspaces = {};
  for (const name of ['Old', 'New', 'Empty']) {
    const path = join(home, name.toLowerCase());
    await mkdir(path, { recursive: true });
    workspaces[name] = await ctx.workspaceRegistry.create(path, `Sorter ${name}`);
  }
  for (const [name, age] of [['Old', 86400000], ['New', 3600000]]) {
    const workspace = workspaces[name];
    if (workspace.sessionIds.length) continue;
    const time = Date.now() - age;
    const session = ctx.sessions.create(undefined, {
      meta: { cwd: workspace.path, createdAt: time },
      seed: [{ type: 'user/message', seq: 0, time, surfaceOp: 'append', data: { id: `fixture-${name.toLowerCase()}`, role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: 'Synthetic offline sorter fixture' }] } }],
    });
    await workspace.attachSession(session.id);
  }
  await ctx.workspaceRegistry.insertBefore(workspaces.Old.id, workspaces.New.id);
  await ctx.workspaceRegistry.insertBefore(workspaces.Empty.id, workspaces.Old.id);
}
