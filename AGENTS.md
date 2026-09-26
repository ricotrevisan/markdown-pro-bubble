# Markdown Pro plugin

Bubble plugin that converts markdown to styled HTML (Showdown, Highlight.js, KaTeX). Decoded source is in `src/`; Pled encodes it to `dist/`. See `README.md` for features.

- Two code piles: `src/` is decoded Bubble plugin source (Pled uploads it); `lib/` is the runtime bundle (`dist.js`) that sets `window.hljs`, `window.showdown`, `window.showdownKatex` and `window.katex`.
- From `lib/`: `npm ci && npm run build`. From the root: `npm ci && npm test` (needs `lib/` installed; the browser tests load `lib/dist.js`).
- When `lib/` dependencies or `lib/index.js` change, release the bundle: `npm run release` in `lib/` writes a content-hashed file to `lib/release/`; `pled upload` it, set the `<script src>` in `src/elements/md-to-html-AAC/headers.html` to the returned URL, then `pled push`. Never reuse an uploaded filename.

## Bubble apps

Use the **bubble-plugin-development** skill for the shared workflow (Pled, Buildprint branching, verifying against the real Bubble UI).

- Dev app: `tiptap-plugin`. Develop and verify plugin changes here. Buildprint profile `ricowtf`: run every command as `BUILDPRINT_PROFILE=ricowtf buildprint ...`.
- Public demo pages: `nocode-to-knowcode`. Buildprint cannot access this app (Bubble free plan). Edit it in the Bubble editor, and copy new sections over from `tiptap-plugin` (see the skill's "Public demo pages").

## Agent skills

### Issue tracker

Issues and specs live in this repository's GitHub Issues. Before reading,
creating, or updating tickets, read `docs/agents/issue-tracker.md`.

### Triage labels

Use the five default triage roles. Before triaging or applying labels,
read `docs/agents/triage-labels.md`.

### Domain docs

This repository uses a single-context layout. Before exploring domain
concepts or design decisions, read `docs/agents/domain.md`.
