// Runtime for the md-to-html element. Build with `npm run build`; the plugin
// header loads the uploaded dist.js, and update.js reads these globals.
import hljs from 'highlight.js';
import showdown from 'showdown';
import showdownKatex from 'showdown-katex';
import katex from 'katex';

window.hljs = hljs;
window.showdown = showdown;
window.showdownKatex = showdownKatex;
window.katex = katex;
