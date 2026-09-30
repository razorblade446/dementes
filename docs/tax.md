# Colombian payroll tax rules — current implementation status

This document tracks the payroll tax/retention rules implemented by this calculator, as Colombian law and DIAN-published values change over time. Source of truth for values is `src/constants/constants.ts`; source of truth for formulas is `src/utils/utils.ts`. Update this file whenever either changes.

Current year values reflected below: **2026** (`UVT = 52374`, `MINIMUM_SALARY = 1750905` COP, per commit `58af3e3`).

## 1. Deductions

### Base salary ("integral salary" rule)

`getBaseSalary()` (utils.ts:34-38)

If salary ≥ `INTEGRAL_LIMIT` (13 × minimum salary), only **70%** of salary counts as the base for all retention and contribution calculations below. Below that threshold, the full salary is the base.

```
INTEGRAL_LIMIT = MINIMUM_SALARY × 13
baseSalary = salary ≥ INTEGRAL_LIMIT ? salary × 0.7 : salary
```

### Tax exemption (25% rule, capped, cumulative across the year)

`getTaxExemption()` (utils.ts:88-103)

25% of (salary − retentions + bonus) is exempt from taxable income, **capped at 790 UVT accumulated across the calendar year** — not per month. Each month's exemption reduces the remaining annual cap for subsequent months.

```
UVT_LIMIT = 790
UVT_LIMIT_EXEMPTION = UVT × UVT_LIMIT
remainingExempt = max(0, UVT_LIMIT_EXEMPTION − exemptAccumulate)
trialExempt = (salary − retentions + bonus) × 0.25
exemption = min(trialExempt, remainingExempt)
```

`exemptAccumulate` is threaded month-to-month by the caller (`getBasePeriods()`); this function does not reset per month on its own.

## 2. Retentions

`getSalaryRetentions()` (utils.ts:74-80), each computed on `baseSalary` from §1:

| Retention | Rate | Function |
|---|---|---|
| Health (salud) | 4% flat | `getHealthContribution()` (utils.ts:62-66) |
| Retirement (pensión) | 4% flat | `getRetirementContribution()` (utils.ts:68-72) |
| Solidarity (fondo de solidaridad pensional) | Progressive, 0–2%, see below | `getSolidaryRetirement()` (utils.ts:40-60) |

### Solidarity retention brackets

Based on `baseSalary / MINIMUM_SALARY`:

| Salary multiple of minimum wage | Rate |
|---|---|
| ≤ 4× | 0% |
| ≤ 16× | 1% |
| ≤ 17× | 1.2% |
| ≤ 18× | 1.4% |
| ≤ 19× | 1.6% |
| ≤ 20× | 1.8% |
| \> 20× | 2% |

## 3. Tax rules and thresholds (retención en la fuente)

`getTax()` (utils.ts:115-140). Taxable salary in UVT (`taxableSalary / UVT`) determines the bracket; each bracket applies a marginal rate above a UVT base plus a fixed UVT offset, then converts back to COP:

| Taxable income (UVT) | Rate | Fixed offset (UVT) |
|---|---|---|
| ≤ 95 | 0% | — |
| 95–150 | 19% | 10 |
| 150–360 | 28% | 69 |
| 360–640 | 33% | 162 |
| 640–945 | 35% | 268 |
| 945–2300 | 37% | 770 |
| \> 2300 | 39% | (see note) |

```
salaryUvt = taxableSalary / UVT
tax(bracket) = (salaryUvt − bracketFloorUvt) × rate + offsetUvt) × UVT
```
rounded to the nearest 1000 COP.

`taxableSalary` itself (`getTaxableSalary()`, utils.ts:105-113) = (salary − retentions) + bonus − exemption (§1).

## Known gaps

- `getTaxExemption()` has an untested edge case for negative accumulated-exemption inputs (utils.ts:93, `// TODO: test for values less than 0`).
- Bracket thresholds, the 25%/790-UVT exemption rule, and contribution rates (4%/4%/progressive) are Colombian law and DIAN policy — do not change without a cited official source. Annual UVT/minimum-salary value updates use the `update-tax-year` skill.

## Changelog

- 2026-09-30 — Initial version of this document, describing the rules as implemented after the 2026 UVT update (commit `58af3e3`).
