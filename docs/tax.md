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

This bracket table is also referred to below as "the Art. 383 table" — it is the same lookup DIAN calls "tabla de retención" for both Procedimiento 1 (§5) and Procedimiento 2 (§5).

## 4. TRM (USD → COP exchange rate)

`src/services/trm.ts`, wired into `getDefaultPeriodsWithOfficialTrm()` (utils.ts). For USD periods with no stored data, each month's TRM is fetched automatically as the official Banco de la República TRM published for the `TRM_REFERENCE_DAY` (constants.ts, currently **10**) of that month, current calendar year. Source: `https://www.datos.gov.co/resource/32sa-8pi3.json` (dataset `32sa-8pi3`). Once a period is stored (edited or saved), its `trm` value is fixed and no longer re-fetched.

### Automatic vs. manual TRM (`Period.trm` / `Period.manualTrm`)

`Period` (models/Period.ts) carries both fields:
- `trm` — the automatic/official rate (set once on first load per month, never touched by manual edits).
- `manualTrm: number | null` — a per-month override; `null` means "use the automatic rate."

`getEffectiveTrm(period)` (utils.ts) resolves `manualTrm ?? trm` and is what actually drives `salaryCop`/`bonusCop` (SalaryProvider.tsx). Editing the TRM input in the UI only ever sets `manualTrm`; it never overwrites the original automatic `trm`. The restore icon next to the TRM input (only shown when a month has a manual override) sets `manualTrm` back to `null`, snapping that month back to its stored automatic rate — no re-fetch needed since `trm` was preserved.

For a month whose reference day has no exact TRM published yet (a future month in the current year, or a reference day that falls on a weekend/holiday), the query falls back to the most recently published TRM as of that date (`vigenciadesde <= date`, ordered descending, limit 1) rather than requiring `vigenciadesde <= date <= vigenciahasta`. Verified against the live dataset on 2026-09-30: exact match for past months, weekend day-10 dates resolve via `vigenciahasta` coverage, and future months (Oct–Dec 2026) resolve to the latest known value (3341.23) instead of throwing.

## 5. Prima de servicios (statutory service bonus)

Method A (Procedimiento 1) is implemented (`getPrima`, `getSemesterAvgBaseSalary`, `getPrimaExemption`, `getPrimaTax` in `utils.ts`; `Period.prima`). The per-month recompute (salary→retentions→tax→prima→exemptAccumulate) lives in one shared `recalculatePeriods()` in `utils.ts`, used by `getDefaultPeriods()`, `SalaryProvider.updatePeriod()`, and `getBasePeriods()` (the last one refreshes periods loaded from storage, so data stored before a formula/field change doesn't surface stale or missing values, e.g. `$NaN` for `prima` on data stored before this feature existed). Method B (Procedimiento 2) is documented below but not implemented — see Known gaps. The active method is `PRIMA_TAX_METHOD` in `constants.ts`, hardcoded to `PROCEDIMIENTO_1` pending a settings panel to let the user choose.

Covers **non-integral salaries** — for integral salary (≥ `INTEGRAL_LIMIT`), prima is already folded into the 70% factor and has no separate concept (§1).

### Legal basis and amount

Art. 306 CST: equivalent to one month of salary per year of service, paid in two equal installments per calendar semester:

- 1st installment: on or before 30 June, for the Jan–Jun semester.
- 2nd installment: on or before 20 December, for the Jul–Dec semester.

```
prima(semester) = (monthlySalary × daysWorkedInSemester) / 360
```

For a full semester worked (180 days), this simplifies to `monthlySalary / 2`. Salary can vary month to month (it is itself a variable input per period), and variation in salary is salary — so this calculator uses the **average of the semester's six `getBaseSalary()` values**, not a single month's salary, as the IBL:

```
semesterAvgBaseSalary = average(getBaseSalary(salary_m) for m in semester's 6 months)
prima(semester) = semesterAvgBaseSalary / 2
```

`bonus` is excluded from this average — it is a separate optional field, not part of salary, and does not feed the prima base. This calculator does not model partial-period employment, so implementation can assume a full semester (180 days) for every period, paid in the June and December periods.

Auxilio de transporte (transport subsidy) is excluded from this calculator's model entirely (not in `constants.ts`, not in `Period`), so it is also out of scope for the prima base — consistent with the rest of the codebase.

### Not a contribution base

Per Art. 307 CST, prima de servicios is **not salary** and is excluded from the health/pension/solidarity contribution base (§2) and from parafiscal contributions. It does **not** reduce or add to `getSalaryRetentions()` — those stay computed on the ordinary monthly salary only, unaffected by prima, under **either** taxing method below.

### Tax withholding — two DIAN-sanctioned methods

An employer picks one withholding method per employee and applies it consistently for the year (switching is restricted, not a month-to-month choice). This calculator should let the user select which method to model, since the two produce different net results on the prima payment. Both methods reuse the same Art. 383 bracket table (§3); they differ in what base that table is applied to.

#### Method A — Procedimiento 1 (Art. 385 E.T.): independent calculation

Per DIAN doctrine ([Concepto 9377/1992](https://normograma.dian.gov.co/dian/compilacion/docs/concepto_tributario_dian_0009377_1992.htm), [Oficio 8899/2015](https://normograma.dian.gov.co/dian/compilacion/docs/oficio_dian_8899_2015.htm)), prima is **not added to that month's ordinary salary** for withholding purposes. It is run through the Art. 383 table as its own, independent calculation:

```
1. primaExempt = min(prima × 0.25, remainingAnnualExemptCap)   // same 25%/790-UVT rule as §1, same running exemptAccumulate
2. primaTaxable = prima − primaExempt                          // no retentions subtracted — prima isn't a retention base
3. primaTax = Art. 383 bracket lookup on primaTaxable           // same table as §3, evaluated independently of the month's salary bracket
4. monthTotalTax = salaryTax + primaTax                         // both computed independently, then summed for that month
```

Key consequences confirmed by DIAN doctrine:
- It is possible to owe withholding on salary but not on prima (or vice versa) in the same month, since each is bracket-evaluated on its own taxable base.
- `primaExempt` and the ordinary salary's exemption draw from the **same** single annual 790-UVT cap (`exemptAccumulate` in `getBasePeriods()`) — not separate caps. Implementation should compute the salary's exemption/accumulate update first, then the prima's, within the same month.

#### Method B — Procedimiento 2 (Art. 386 E.T.): fixed semestral percentage

Under Procedimiento 2, prima is **added to** the month's other taxable payments, and the combined total is withheld at a **fixed percentage rate** — not a fresh bracket lookup — that was computed at the start of the semester and held constant for all six months.

**How the fixed rate (`porcentajeFijo`) is computed**, per Art. 386:

```
trailing12MonthGravableTotal = sum of all taxable payments to the worker over the 12 months preceding the calculation
                                (excludes cesantías and interés a cesantías; prima payments in that trailing window ARE included)
averageMonthlyBase = trailing12MonthGravableTotal / 13
```
(divide by 13, not 12 — DIAN's stated formula, an explicit legal fraction, not a monthly average)
```
porcentajeFijo = effective withholding rate the Art. 383 table (§3) produces for averageMonthlyBase
               = Art383Tax(averageMonthlyBase) / averageMonthlyBase
```

**Recalculation cadence**: computed twice a year — the rate set in June governs withholding for July–December, and the rate set in December governs withholding for January–June of the following year.

**Applying it to a month that includes prima**:

```
monthTaxableBase = (salary − retentions) + bonus + prima   // prima summed in, unlike Method A
monthTax = monthTaxableBase × porcentajeFijo
```

No separate 25%-exemption step is applied at the point of withholding under Procedimiento 2 — the 25% exemption is instead already baked into how `porcentajeFijo` was derived from the Art. 383 table, and (per DIAN doctrine) the 40%-of-gross exemption/deduction cap still bounds the total each month.

**Implementation note**: Method B requires tracking a rolling 12-month gravable-payments history per worker to derive `porcentajeFijo`, which this calculator does not currently store (`Period` only holds the current month's figures). This is new model surface, not a formula substitution — flag as a larger addition when scoping implementation, versus Method A which slots into the existing `exemptAccumulate` mechanism with no new state.

### Net salary impact

```
// Method A (Procedimiento 1)
netSalary(month with prima) = salary + bonus − retentions − salaryTax + prima − primaTax

// Method B (Procedimiento 2)
netSalary(month with prima) = salary + bonus − retentions + prima − monthTax
```

No health/retirement/solidarity retention line applies to the `prima` term under either method.

## Known gaps

- `getTaxExemption()` has an untested edge case for negative accumulated-exemption inputs (utils.ts:93, `// TODO: test for values less than 0`).
- Bracket thresholds, the 25%/790-UVT exemption rule, and contribution rates (4%/4%/progressive) are Colombian law and DIAN policy — do not change without a cited official source. Annual UVT/minimum-salary value updates use the `update-tax-year` skill.
- Prima de servicios (§5) Method A (Procedimiento 1) is implemented. Method B (Procedimiento 2) is documented but not implemented — it requires new rolling-12-month gravable-payments state this calculator doesn't currently track, and a settings panel to let the user pick between methods (currently a hardcoded constant, `PRIMA_TAX_METHOD`).

## Changelog

- 2026-09-30 — Initial version of this document, describing the rules as implemented after the 2026 UVT update (commit `58af3e3`).
- 2026-09-30 — Added automatic official-TRM fetch for default USD periods, using day 10 of each month (`TRM_REFERENCE_DAY`).
- 2026-09-30 — Added §5 Prima de servicios (research: amount formula, non-integral-only scope, exclusion from contribution base, independent Art. 385 withholding calc sharing the same annual exemption cap). Documentation only — not yet implemented.
- 2026-09-30 — §5 amount formula revised: use average of the semester's six `getBaseSalary()` values (salary varies per month, and variation in salary is salary) instead of a single month's salary; `bonus` excluded from the base.
- 2026-09-30 — §5 documented both DIAN-sanctioned withholding methods (Procedimiento 1 independent calc, Procedimiento 2 fixed semestral percentage) so the user can be offered a choice of method at implementation time. Reordered sections so TRM (§4) precedes Prima (§5).
- 2026-09-30 — §5 Method A (Procedimiento 1) implemented: `Period.prima`, `getPrima()`/`getSemesterAvgBaseSalary()`/`getPrimaExemption()`/`getPrimaTax()` in `utils.ts`, wired into `getDefaultPeriods()` and `SalaryProvider.updatePeriod()`; UI shows a Prima column (SalarySectionCop/Usd, SalaryPeriod) gated on at least one non-integral month, with a hover tooltip showing the semester average base salary. Selectable via `PRIMA_TAX_METHOD` in `constants.ts`.
- 2026-09-30 — Fixed `$NaN` rendering for `prima` (and future fields) on periods loaded from storage written before this feature: extracted the per-month recompute into a shared `recalculatePeriods()`, now also run by `getBasePeriods()` on stored data, instead of returning stored periods verbatim.
