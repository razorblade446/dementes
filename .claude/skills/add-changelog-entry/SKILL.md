---
name: add-changelog-entry
description: Append a dated entry to the Roadmap/Changelog section of the project's CLAUDE.md after a notable change lands. Use at the end of a task that changed calculator behavior, constants, or user-facing UI.
---

1. Read `CLAUDE.md` at the repo root.
2. Under the `## Roadmap / Changelog` section, add one new bullet at the top of the list (most recent first):
   `- YYYY-MM-DD — <one-line summary of what changed and why, in the same terse style as existing entries>`
   Use today's date. Keep the summary to one line — this is a changelog, not a PR description.
3. Do not rewrite or reorder existing entries. Do not add a summary anywhere else in CLAUDE.md — this section is the single place for it.
