// Copies the built dist.js to an immutable, content-addressed filename for
// `pled upload`. Bubble's CDN caches assets, so never re-upload the same name.
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile } from 'node:fs/promises';

const bundle = await readFile(new URL('../dist.js', import.meta.url));
const sha = createHash('sha256').update(bundle).digest('hex');
const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const name = `markdown-pro-${version}-${sha.slice(0, 12)}.js`;
await mkdir(new URL('../release/', import.meta.url), { recursive: true });
await copyFile(new URL('../dist.js', import.meta.url), new URL(`../release/${name}`, import.meta.url));

console.log(`lib/release/${name}  (${bundle.byteLength} bytes, sha256 ${sha})

Next, only when authorized to publish:
  pled upload lib/release/${name}
  # set the <script src> in src/elements/md-to-html-AAC/headers.html to the returned URL
  pled push`);
