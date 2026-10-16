import { mkdir, writeFile } from 'node:fs/promises';
import { createClientPlugin } from '../client/index.mjs';
await mkdir(new URL('../lib/', import.meta.url), { recursive: true });
await writeFile(new URL('../lib/client.js', import.meta.url), `// Generated; edit client/index.mjs, then npm run build.\nwindow.__ModuleLoader__.load({ id: 'dsh-workspace-sorter', factory: (${createClientPlugin.toString()}) });\n`);
console.log('Built dsh-workspace-sorter client.');
