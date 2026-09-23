# Domain docs

## Layout and reading rules

This repository uses a single-context layout:

- `CONTEXT.md` at the repository root holds domain terminology.
- `docs/adr/` holds architecture decision records.

Before exploring the codebase, read `CONTEXT.md` and any ADRs relevant
to the area being investigated.

If these documents do not exist, proceed silently. Domain modeling
creates them lazily when terminology or decisions are resolved.

## Vocabulary

Use the terms defined in `CONTEXT.md` when naming domain concepts in
issues, proposals, hypotheses, and tests.

If a needed concept is missing, check existing project usage and note
a genuine glossary gap for domain modeling.

## Decision conflicts

If a proposal contradicts an existing ADR, identify the ADR and
explain why its decision should be reconsidered.
