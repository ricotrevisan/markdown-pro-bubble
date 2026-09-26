# Markdown Pro plugin

Bubble plugin that converts markdown to styled HTML (Showdown, Highlight.js, KaTeX). Decoded source is in `src/`; Pled encodes it to `dist/`. See `README.md` for features.

## Bubble apps

Use the **bubble-plugin-development** skill for the shared workflow (Pled, Buildprint branching, verifying against the real Bubble UI).

- Dev app: `tiptap-plugin`. Develop and verify plugin changes here.
- Public demo pages: `nocode-to-knowcode`. Update them when a release changes what they show.
- Both are Buildprint projects under the `ricowtf` profile. Run every command as `BUILDPRINT_PROFILE=ricowtf buildprint ...`.

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
