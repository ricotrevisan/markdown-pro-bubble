# Issue tracker: GitHub

Issues and specs live in GitHub Issues for
`ricotrevisan/markdown-pro-bubble`. Use the `gh` CLI from this repository.

## Conventions

- Create: `gh issue create --title "..." --body-file <path>`.
- Read: `gh issue view <number> --json number,title,body,labels,comments`.
- List: `gh issue list --state open --json number,title,body,labels,comments`,
  adding label and state filters as needed.
- Comment: `gh issue comment <number> --body-file <path>`.
- Apply or remove labels: `gh issue edit <number> --add-label "..."`
  or `--remove-label "..."`.
- Close: `gh issue close <number> --comment "..."`.

For multiline bodies, write the exact text to a temporary file and pass
its path with `--body-file`.

When a skill says "publish to the issue tracker", create a GitHub issue.
When it says "fetch the relevant ticket", read the issue and its comments.

## Pull requests as a triage surface

**PRs as a request surface: no.**

GitHub shares issue and pull request numbers. If a bare reference is
ambiguous, resolve it with `gh pr view <number>` and fall back to
`gh issue view <number>`.

## Wayfinding operations

- Map: one issue labelled `wayfinder:map`, containing Notes,
  Decisions-so-far, and Fog.
- Child ticket: link an issue to the map using GitHub sub-issues.
  If unavailable, use a task list in the map and a `Part of #<map>`
  line in the child.
- Ticket type: use `wayfinder:research`, `wayfinder:prototype`,
  `wayfinder:grilling`, or `wayfinder:task`.
- Blocking: use native GitHub issue dependencies. If unavailable,
  record `Blocked by: #<number>` lines in the child.
- Frontier: inspect the map's open children in map order; choose the
  first unassigned child with no open blockers.
- Claim: assign the ticket to the driving developer before work.
- Resolve: comment with the result, close the child, and append a
  summary and link to the map's Decisions-so-far.
