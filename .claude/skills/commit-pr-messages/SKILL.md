---
name: commit-pr-messages
description: Generate standardized commit messages and PR descriptions for this repo. Use whenever drafting a git commit message or a pull request description/title — keeps commits short and PRs comprehensive with a consistent format.
---

Two distinct templates. Pick based on what's being generated.

## Commit messages — short, concise

1. Run `git status` and `git diff --staged` (or `git diff` if nothing staged) to see actual file changes. Check `git log -10 --oneline` for this repo's existing style.
2. Subject line only, in most cases:
   - Imperative mood, capitalized first word, no trailing period.
   - Match existing repo style — verb-first (`Add`, `Fix`, `Update`, `Migrate`, `Refactor`), no Conventional Commits prefix (`feat:`, `fix:`) unless `git log` shows the repo actually uses that style.
   - Target ≤50 chars; hard cap 72.
   - Describe *what changed*, scoped to the diff — not every file touched, the effective change (e.g. `Add prima de servicios for non-integral salaries`, not `Update utils.ts, constants.ts, Period.ts`).
3. Add a short body **only** when the *why* isn't obvious from the subject + diff (a non-obvious constraint, a bug workaround, a law/spec citation). 1-3 bullet points max, markdown `-` bullets. Skip the body entirely for mechanical/trivial changes.
4. Always end with the attribution line(s) given in the conversation's system-reminder, when one is present.
5. Show the drafted message in a fenced code block so the user can copy the raw text. Per user's standing preference ([[feedback_commit_pr_markdown]] memory), do not commit it yourself unless already instructed to in this conversation — this repo's CLAUDE.md also forbids git write operations by default.

Template:
```
<Verb> <what changed, scoped to the diff>

- <why, only if non-obvious> (optional, omit for trivial changes)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```

## PR descriptions — comprehensive, standard format

1. Run `git log [base-branch]...HEAD` and `git diff [base-branch]...HEAD` to see the full set of commits/changes in the PR, not just the latest commit.
2. Always markdown-structured (per [[feedback_commit_pr_markdown]] — user explicitly asked for this). Use this section order, omitting a section only if genuinely empty:

```
## Summary
<1-3 bullets: what changed and why, product/user-facing framing first>

## Changes
- <bullet per notable change or file/area, one line each>
- ...

## Test plan
- [ ] <bulleted checklist of how this was/should be verified>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

3. Title: short (under 70 chars), imperative, same verb-first style as commit subjects. Put detail in the body, not the title.
4. `## Summary` explains the *why* — user/product impact, not a restatement of the diff.
5. `## Changes` is the *what* — one bullet per logical change, referencing file paths where it helps (`path/to/file.ts:123` style) but not an exhaustive file list.
6. `## Test plan` is a checklist (`- [ ]`), not prose — include manual verification steps if no automated test covers the change (e.g. `npm run test`, `npm run build`, manual browser check).
7. Always output the PR body as plain/raw markdown text inside a fenced code block — never let it render. User copies it manually into GitHub/GitLab.
8. Do not create the PR (`gh pr create`) unless the user has explicitly asked you to in this conversation — draft only, same as commits.
