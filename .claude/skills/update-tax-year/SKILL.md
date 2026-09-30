---
name: update-tax-year
description: Update this calculator's Colombian tax-year constants (UVT, minimum salary) in src/constants/constants.ts for a new year, using DIAN-published values. Use when the user asks to update UVT, minimum salary, or "update for <year>".
---

Update `src/constants/constants.ts` for a new tax year.

1. Ask the user for the new year's official values if not given: `UVT` (Unidad de Valor Tributario) and `MINIMUM_SALARY` (salario mínimo mensual legal vigente), both published annually by DIAN/the Colombian government. Do not guess these numbers — they must come from the user or a cited official source.
2. Edit `src/constants/constants.ts`:
   - Update `export const UVT = ...`
   - Update `export const MINIMUM_SALARY = ...`
   - `UVT_LIMIT_EXEMPTION`, `INTEGRAL_LIMIT`, and `MINIMUM_SOLIDARY_RETIREMENT` are derived — do not hand-edit them, they recompute from the two constants above.
   - Fix or remove the stale `// Updated to 2025` comment above `UVT` — replace it with the correct year, or drop it since the value itself is the source of truth.
3. Do not touch `getTax()`'s bracket thresholds/rates or `EXEMPTION_FACTOR`/`UVT_LIMIT` (790) unless the user explicitly says the law itself changed — those are structural, not annual-value updates.
4. Run `npm run lint` and `npm run build` to confirm nothing broke.
5. Append a dated entry to CLAUDE.md's Roadmap/Changelog section noting the year update (or invoke the `add-changelog-entry` skill to do this).
