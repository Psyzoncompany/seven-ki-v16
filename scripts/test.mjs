import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('../tests/',import.meta.url));
const files=readdirSync(dir).filter(n=>n.endsWith('.test.mjs')).sort().map(n=>fileURLToPath(new URL('../tests/'+n,import.meta.url)));
const result=spawnSync(process.execPath,['--test',...files],{stdio:'inherit'});
if(result.error)console.error(result.error.message);
process.exitCode=result.status??1;
