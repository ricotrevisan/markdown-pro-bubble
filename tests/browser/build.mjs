import { build } from 'esbuild';
// Bundle actual npm runtimes, not a replacement converter or highlighter.
await build({ entryPoints: ['tests/browser/runtime.mjs'], bundle: true, platform: 'browser', format: 'iife', outfile: '.test-runtime/runtime.js' });
