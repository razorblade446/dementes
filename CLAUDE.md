# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Colombian salary calculator ("Calculadora de Salario"), single-page React app. Computes net monthly salary from a base salary + optional bonus, in either COP or USD, applying Colombian payroll rules: health/retirement/solidarity retentions and progressive income tax withholding (retención en la fuente). Deployed via GitHub Pages at base path `/dementes/`. UI is in Spanish.

Stack: React 18 + TypeScript (strict) + Vite 6 + React Router 7 + Tailwind CSS 4 + Sass. All currency math uses `big.js` (never native floating point) to avoid rounding errors.

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — `tsc -b && vite build` (typecheck gates the build; a type error fails `build` even if `dev` runs fine)
- `npm run lint` — ESLint (`eslint .`) — this is the only formatting/style gate, there is no Prettier/Biome. Single-quote strings are enforced (`eslint.config.js`).
- `npm run test` — Vitest (`vitest run`), covers `src/utils/utils.ts` calculation functions. `npm run test:watch` for dev.

## Domain logic — read before touching tax/retention code

Full rules reference (deductions, retentions, tax brackets/thresholds, kept current as law changes): @docs/tax.md

All tax-year constants live in `src/constants/constants.ts`: `UVT`, `MINIMUM_SALARY`, `UVT_LIMIT_EXEMPTION`, `EXEMPTION_FACTOR`, contribution rates. These change every year per DIAN (Colombian tax authority) published values — nothing else about the calculator logic should need to change for a year update. The comment above `UVT` says `// Updated to 2025` but the value is already updated for 2026 (commit `58af3e3`) — this comment is stale, don't trust it as a source of truth for which year the constants reflect; check the value against DIAN's current UVT instead.

Core calculation flow, in `src/utils/utils.ts`:
- `getBaseSalary()` — for "integral salary" (salary ≥ `INTEGRAL_LIMIT` = 13× minimum salary), only 70% of salary counts as base for retentions/tax.
- `getSalaryRetentions()` — health (4%) + retirement (4%) + solidarity (progressive 0–2%, `getSolidaryRetirement()`, based on salary/minimum-salary multiple).
- `getTaxExemption()` — 25% of (salary − retentions + bonus) is tax-exempt, capped by `UVT_LIMIT_EXEMPTION` (790 UVT) **accumulated across the calendar year** — `exemptAccumulate` is threaded month-to-month in `getBasePeriods()`. Don't compute exemption per-month in isolation; it depends on prior months' cumulative exemption.
- `getTax()` — 7-bracket progressive table in UVT multiples (thresholds: 95/150/360/640/945/2300 UVT). Bracket boundaries and rates are DIAN law, not arbitrary — don't touch without a cited source.
- `getNetSalary()` — salary + bonus − retentions − tax.

Known gap: `getTaxExemption()` has a `// TODO: test for values less than 0` (utils.ts:93). Covered by a test in `src/utils/utils.test.ts` that confirms current (clamp-to-0) behavior — the TODO is about whether that's the *right* behavior, not about test coverage.

## Conventions

- Feature branch + PR workflow (not direct-to-main), even for solo changes.
- Match existing commit message style seen in `git log` (e.g. `* Fix X`, `UPDATE <year> - <summary>`).
- **No git write operations** — no `commit`, `push`, `branch`, `merge`, PR creation, or any other state-changing git/gh command. Draft the commit message and/or PR description and show it to the user; the user runs the actual command.

## Roadmap / Changelog

Living section — add a dated entry here whenever a notable change lands, so this file stays a running record of where the calculator is and what's next. The `add-changelog-entry` skill (`.claude/skills/add-changelog-entry/`) automates appending to this section.

- 2026-09-30 — Implemented deducción por dependientes (Art. 387 E.T.): `getDependentsDeduction()` in `utils.ts` (10% of gross monthly labor income, capped 32 UVT/month, subtracted before the 25% exemption per Art. 388 ordering); global `Settings.hasDependents` toggle (`SettingsDialog`) rather than a per-period field, since eligibility is a taxpayer-level fact; new `Period.deductions` field; new "Deducciones" column in `SalarySectionCop`/`Usd` + `SalaryPeriod` gated on at least one month with `deductions > 0`, with a hover tooltip naming the deduction, rate, and cap.

- 2026-09-30 — Added a Settings dialog (cog icon in the nav bar) backed by a new IndexedDB `settings` store: TRM automatic reference-day is now editable (`DEFAULT_TRM_REFERENCE_DAY` is just the fallback), saving recalculates automatic TRM for stored USD periods without touching manual overrides; prima tax procedure is shown fixed/non-editable (Procedimiento 1).
- 2026-09-30 — Implemented prima de servicios for non-integral salaries: Prima column (shown only when at least one month is non-integral) computed on Junio/Diciembre rows as half the semester's average `getBaseSalary()`; taxed independently via Procedimiento 1 (Art. 385 E.T.), selectable via new `PRIMA_TAX_METHOD` constant in `constants.ts` (hardcoded pending a settings panel); summed into Retefuente and Salario Neto. Hover tooltip on the Prima cell shows the semester average base salary used.
- 2026-09-30 — Split TRM into automatic (`Period.trm`) and manual override (`Period.manualTrm`, null by default) fields; `getEffectiveTrm()` resolves `manualTrm ?? trm` for calculations, with a restore icon (shown only on overridden months) to clear the override back to the automatic rate.
- 2026-09-30 — Added automatic official-TRM fetch for default USD periods (`src/services/trm.ts`, `TRM_REFERENCE_DAY` = day 10 in constants.ts, wired via `getDefaultPeriodsWithOfficialTrm()`); manual TRM entry still overrides once a period is stored.
- 2026-09-30 — Added `docs/tax.md` (deductions/retentions/tax-bracket reference, imported into this file) and a Vitest suite for `src/utils/utils.ts` (28 tests, `npm run test`).
- 2026-01-23 — UVT/minimum-salary constants updated for 2026; added optional bonus columns to the period table.
