import {
  DEPENDENTS_DEDUCTION_RATE,
  DEPENDENTS_UVT_LIMIT_DEDUCTION,
  EXEMPTION_FACTOR,
  HEALTH_CONTRIBUTION,
  INTEGRAL_LIMIT,
  MINIMUM_SALARY,
  Month,
  MONTHS,
  PeriodType,
  PRIMA_TAX_METHOD,
  PrimaTaxMethod,
  RETIREMENT_CONTRIBUTION,
  UVT,
  UVT_LIMIT_EXEMPTION
} from '../constants/constants.ts';
import Big from 'big.js';
import { RetentionsSalary } from '../models/RetentionsSalary.ts';
import { Period } from '../models/Period.ts';
import { CurrencyYearSalaries } from '../models/YearSalaries.ts';
import { deleteIdbValue, getIdbValue, migrateLocalStorageKey, setIdbValue } from './indexedDb.ts';
import { getOfficialTrmByMonth, getOfficialTrmForMonth } from '../services/trm.ts';
import { getSettings } from './settings.ts';

const DEFAULT_TRM = 4000;

export const getStorageKey = (periodType: PeriodType) => {
  return `periods-${ periodType }`;
};

export const getStorage = async (periodType: PeriodType): Promise<Record<Month, Period> | null> => {
  const storageKey = getStorageKey(periodType);
  await migrateLocalStorageKey<Record<Month, Period>>(storageKey);

  return getIdbValue<Record<Month, Period>>(storageKey);
};

export const setStorage = (periodType: PeriodType, periods: Record<Month, Period>) => {
  return setIdbValue(getStorageKey(periodType), periods);
};

export const removeStorage = (periodType: PeriodType) => {
  return deleteIdbValue(getStorageKey(periodType));
};

export const isIntegralSalary = (salary: number): boolean => {
  return Big(salary).gte(INTEGRAL_LIMIT);
};

export const getBaseSalary = (salary: number): number => {
  const baseSalary = isIntegralSalary(salary) ? Big(salary).times(.7) : Big(salary);

  return baseSalary.round(0, 3).toNumber();
};

export const getSolidaryRetirement = (salary: number) => {
  const baseSalary = Big(getBaseSalary(salary));

  const salaryFactor = Big(baseSalary).div(MINIMUM_SALARY);

  if (salaryFactor.lte(4)) {
    return 0;
  } else if (salaryFactor.lte(16)) {
    return baseSalary.times(.01).toNumber();
  } else if (salaryFactor.lte(17)) {
    return baseSalary.times(.012).toNumber();
  } else if (salaryFactor.lte(18)) {
    return baseSalary.times(.014).toNumber();
  } else if (salaryFactor.lte(19)) {
    return baseSalary.times(.016).toNumber();
  } else if (salaryFactor.lte(20)) {
    return baseSalary.times(.018).toNumber();
  } else {
    return baseSalary.times(.02).toNumber();
  }
};

export const getHealthContribution = (salary: number): number => {
  const baseSalary = Big(getBaseSalary(salary));

  return baseSalary.times(HEALTH_CONTRIBUTION).toNumber();
};

export const getRetirementContribution = (salary: number): number => {
  const baseSalary = Big(getBaseSalary(salary));

  return baseSalary.times(RETIREMENT_CONTRIBUTION).toNumber();
};

export const getSalaryRetentions = (salary: number): RetentionsSalary => {
  return {
    health: getHealthContribution(salary),
    retirement: getRetirementContribution(salary),
    solidarity: getSolidaryRetirement(salary)
  };
};

export const getNetSalaryRetentions = (salary: number): number => {
  const { health, retirement, solidarity } = getSalaryRetentions(salary);

  return Big(health).plus(retirement).plus(solidarity ?? 0).toNumber();
};

// Deducción por dependientes (Art. 387 E.T., docs/tax.md §1) — flat 10% of gross monthly labor
// income, capped at 32 UVT/month. Doesn't scale with dependent count; requires at least one
// qualifying dependent (hasDependents).
export const getDependentsDeduction = (salary: number, bonus: number, hasDependents: boolean): number => {
  if (!hasDependents) {
    return 0;
  }

  const grossLaborIncome = Big(getBaseSalary(salary)).plus(bonus);
  const trialDeduction = grossLaborIncome.times(DEPENDENTS_DEDUCTION_RATE);

  return (trialDeduction.gt(DEPENDENTS_UVT_LIMIT_DEDUCTION) ? Big(DEPENDENTS_UVT_LIMIT_DEDUCTION) : trialDeduction).toNumber();
};

export const getTaxExemption = (salary: number, bonus: number, exemptAccumulate: number, dependentsDeduction = 0): number => {
  const netSalaryRetentions = getNetSalaryRetentions(salary);

  const deductedSalary = Big(salary).minus(netSalaryRetentions).minus(dependentsDeduction);

  // TODO: test for values less than 0
  let remainingExempt = Big(UVT_LIMIT_EXEMPTION).minus(exemptAccumulate);

  if (remainingExempt.lte(0)) {
    remainingExempt = Big(0);
  }

  const trialExempt = deductedSalary.plus(bonus).times(EXEMPTION_FACTOR);

  return (trialExempt.gt(remainingExempt) ? remainingExempt : trialExempt).toNumber();
};

const FIRST_SEMESTER_MONTHS: Month[] = MONTHS.slice(0, 6);
const SECOND_SEMESTER_MONTHS: Month[] = MONTHS.slice(6, 12);

export const PRIMA_MONTHS: Month[] = ['Junio', 'Diciembre'];

export const isPrimaMonth = (month: Month): boolean => {
  return PRIMA_MONTHS.includes(month);
};

export const getSemesterMonths = (month: Month): Month[] => {
  return FIRST_SEMESTER_MONTHS.includes(month) ? FIRST_SEMESTER_MONTHS : SECOND_SEMESTER_MONTHS;
};

// Average of the semester's six getBaseSalary() values (docs/tax.md §5) — `periods` must already
// hold every month of that semester up to and including `month` (true for a forward Jan->Dec pass).
export const getSemesterAvgBaseSalary = (periods: Record<Month, Pick<Period, 'baseSalary'>>, month: Month): number => {
  const semesterMonths = getSemesterMonths(month);

  const total = semesterMonths.reduce((sum, semesterMonth) => {
    return sum + (periods[semesterMonth]?.baseSalary ?? 0);
  }, 0);

  return Big(total).div(semesterMonths.length).toNumber();
};

export const getPrima = (semesterAvgBaseSalary: number): number => {
  return Big(semesterAvgBaseSalary).div(2).round(0, 3).toNumber();
};

// Prima's own 25%/790-UVT exemption draw (Art. 385 E.T.) — no retentions subtracted, prima isn't a
// retention base (Art. 307 CST). Shares the same annual exemptAccumulate cap as getTaxExemption().
export const getPrimaExemption = (prima: number, exemptAccumulate: number): number => {
  let remainingExempt = Big(UVT_LIMIT_EXEMPTION).minus(exemptAccumulate);

  if (remainingExempt.lte(0)) {
    remainingExempt = Big(0);
  }

  const trialExempt = Big(prima).times(EXEMPTION_FACTOR);

  return (trialExempt.gt(remainingExempt) ? remainingExempt : trialExempt).toNumber();
};

// Procedimiento 1 (Art. 385 E.T.) only — prima taxed independently of the month's salary bracket.
export const getPrimaTax = (prima: number, exemptAccumulate: number): number => {
  if (PRIMA_TAX_METHOD !== PrimaTaxMethod.PROCEDIMIENTO_1) {
    return 0;
  }

  const primaExempt = getPrimaExemption(prima, exemptAccumulate);
  const primaTaxable = Big(prima).minus(primaExempt).toNumber();

  return getTaxFromTaxableAmount(primaTaxable);
};

export const getTaxableSalary = (salary: number, bonus: number, exemptAccumulate: number, dependentsDeduction = 0): number => {
  const netSalaryRetentions = getNetSalaryRetentions(salary);

  const deductedSalary = Big(salary).minus(netSalaryRetentions).minus(dependentsDeduction);

  const realExempt = getTaxExemption(salary, bonus, exemptAccumulate, dependentsDeduction);

  return deductedSalary.plus(bonus).minus(realExempt).toNumber();
};

export const getTaxFromTaxableAmount = (taxableAmount: number): number => {
  const salaryUvt = Big(taxableAmount).div(UVT);

  if (salaryUvt.lte(95)) {
    return 0;
  } else if (salaryUvt.lte(150)) {
    return salaryUvt.minus(95).times(.19).times(UVT).div(1000).round(0, 0).times(1000).toNumber();
  } else if (salaryUvt.lte(360)) {
    // return (salaryUvt - 150) * .28 + 10 * UVT;
    return salaryUvt.minus(150).times(.28).plus(10).times(UVT).div(1000).round(0, 0).times(1000).toNumber();
  } else if (salaryUvt.lte(640)) {
    // return (salaryUvt - 360) * .33 + 69 * UVT;
    return salaryUvt.minus(360).times(.33).plus(69).times(UVT).div(1000).round(0, 0).times(1000).toNumber();
  } else if (salaryUvt.lte(945)) {
    // return (salaryUvt - 640) * .35 + 162 * UVT;
    return salaryUvt.minus(640).times(.35).plus(162).times(UVT).div(1000).round(0, 0).times(1000).toNumber();
  } else if (salaryUvt.lte(2300)) {
    // return (salaryUvt - 945) * .37 + 268 * UVT;
    return salaryUvt.minus(945).times(.37).plus(268).times(UVT).div(1000).round(0, 0).times(1000).toNumber();
  } else {
    //return (salaryUvt - 2300) * .39 + 770 * UVT;
    return salaryUvt.minus(2300).times(.39).plus(770).times(UVT).div(1000).round(0, 0).times(1000).toNumber();
  }
};

export const getTax = (salary: number, bonus: number, exemptAccumulate: number, dependentsDeduction = 0): number => {
  const taxableSalary = getTaxableSalary(salary, bonus, exemptAccumulate, dependentsDeduction);

  return getTaxFromTaxableAmount(taxableSalary);
};

export const getNetSalary = (salary: number, bonus: number, exemptAccumulate: number, dependentsDeduction = 0) => {
  const { health, retirement, solidarity } = getSalaryRetentions(salary);

  const totalRetentions = Big(health).plus(retirement).plus(solidarity ?? 0);

  const tax = getTax(salary, bonus, exemptAccumulate, dependentsDeduction);

  return Big(salary).plus(bonus).minus(totalRetentions).minus(tax).toNumber();
};

// Recomputes every derived field (baseSalary, retentions, prima, tax, netSalary, and for USD the
// COP conversion) from each period's raw inputs (salaryUsd/salaryCop, bonusUsd/bonusCop, trm,
// manualTrm). Used both on user edits and to refresh periods loaded from storage, so stored data
// from before a formula/field change (e.g. prima) doesn't surface stale or missing values.
export const recalculatePeriods = (
  periodType: PeriodType,
  periods: Record<Month, Period>,
  hasDependents = false
): Record<Month, Period> => {
  let exemptAccumulate = 0;

  const newPeriods = {} as Record<Month, Period>;

  for (const month of MONTHS) {
    const currentMonth = periods[month];

    const salaryUsd = periodType === PeriodType.USD ? currentMonth.salaryUsd : 0;
    const bonusUsd = periodType === PeriodType.USD ? currentMonth.bonusUsd : 0;
    const trm = periodType === PeriodType.USD ? currentMonth.trm : 0;
    const manualTrm = periodType === PeriodType.USD ? (currentMonth.manualTrm ?? null) : null;
    const effectiveTrm = periodType === PeriodType.USD ? getEffectiveTrm({ trm, manualTrm }) : 0;

    const salaryCop = periodType === PeriodType.USD ? Big(salaryUsd).times(effectiveTrm).toNumber() : currentMonth.salaryCop;
    const bonusCop = periodType === PeriodType.USD ? Big(bonusUsd).times(effectiveTrm).toNumber() : currentMonth.bonusCop;
    const baseSalary = getBaseSalary(salaryCop);
    const retentions = getSalaryRetentions(salaryCop);
    const netSalaryRetentions = getNetSalaryRetentions(salaryCop);
    const deductions = getDependentsDeduction(salaryCop, bonusCop, hasDependents);
    const salaryTax = getTax(salaryCop, bonusCop, exemptAccumulate, deductions);

    exemptAccumulate += getTaxExemption(salaryCop, bonusCop, exemptAccumulate, deductions);

    let prima = 0;
    let primaTax = 0;

    if (isPrimaMonth(month)) {
      prima = getPrima(getSemesterAvgBaseSalary({ ...newPeriods, [month]: { baseSalary } }, month));
      primaTax = getPrimaTax(prima, exemptAccumulate);
      exemptAccumulate += getPrimaExemption(prima, exemptAccumulate);
    }

    const tax = Big(salaryTax).plus(primaTax).toNumber();
    const netSalary = Big(salaryCop).plus(bonusCop).plus(prima).minus(netSalaryRetentions).minus(tax).toNumber();

    newPeriods[month] = {
      ...currentMonth,
      salaryUsd,
      bonusUsd,
      trm,
      manualTrm,
      salaryCop,
      bonusCop,
      baseSalary,
      retentions,
      deductions,
      prima,
      tax,
      netSalary
    };
  }

  return newPeriods;
};

export const getDefaultPeriods = (
  periodType: PeriodType,
  trmByMonth?: Partial<Record<Month, number>>,
  hasDependents = false
): Record<Month, Period> => {
  const rawPeriods = MONTHS.reduce<Record<Month, Period>>((periods, month) => {
    const salaryUsd = periodType === PeriodType.USD ? 3000 : 0;
    const trm = periodType === PeriodType.USD ? (trmByMonth?.[month] ?? DEFAULT_TRM) : 0;

    const salaryCop = periodType === PeriodType.USD ? Big(salaryUsd).times(trm).toNumber() : 12000000;

    const bonusUsd = periodType === PeriodType.USD ? 1300 : 0;
    const bonusCop = periodType === PeriodType.USD ? Big(bonusUsd).times(trm).toNumber() : 5200000;

    periods[month] = {
      month,
      salaryUsd,
      salaryCop,
      bonusUsd,
      bonusCop,
      trm,
      manualTrm: null,
      baseSalary: 0,
      retentions: { health: 0, retirement: 0, solidarity: 0 },
      deductions: 0,
      prima: 0,
      tax: 0,
      netSalary: 0
    };

    return periods;
  }, {} as unknown as Record<Month, Period>);

  return recalculatePeriods(periodType, rawPeriods, hasDependents);
};

export const getDefaultPeriodsWithOfficialTrm = async (periodType: PeriodType): Promise<Record<Month, Period>> => {
  const { trmReferenceDay, hasDependents } = await getSettings();

  if (periodType !== PeriodType.USD) {
    return getDefaultPeriods(periodType, undefined, hasDependents);
  }

  const trmByMonth = await getOfficialTrmByMonth(new Date().getFullYear(), trmReferenceDay);

  return getDefaultPeriods(periodType, trmByMonth, hasDependents);
};

// Re-fetches the official TRM (using the given reference day) for every stored USD month that
// has no manual override, then recomputes and persists that month — months with a manual
// override (Period.manualTrm) are left untouched, per Settings' TRM reference-day behavior.
// Also re-applies hasDependents, since a Settings save can change either value.
export const recalculateAutomaticTrmPeriods = async (referenceDay: number, hasDependents: boolean): Promise<void> => {
  const storedPeriods = await getStorage(PeriodType.USD);

  if (!storedPeriods) {
    return;
  }

  const year = new Date().getFullYear();
  const updatedPeriods = { ...storedPeriods };

  for (const month of MONTHS) {
    const period = updatedPeriods[month];

    if (period.manualTrm === null) {
      const monthIndex = MONTHS.indexOf(month);
      const trm = await getOfficialTrmForMonth(year, monthIndex, referenceDay);

      updatedPeriods[month] = { ...period, trm };
    }
  }

  const newPeriods = recalculatePeriods(PeriodType.USD, updatedPeriods, hasDependents);

  await setStorage(PeriodType.USD, newPeriods);
};

// Recomputes and persists stored COP periods (which don't go through the TRM refresh above) when
// a Settings save changes hasDependents. No-op if nothing is stored yet.
export const recalculateStoredCopPeriods = async (hasDependents: boolean): Promise<void> => {
  const storedPeriods = await getStorage(PeriodType.COP);

  if (!storedPeriods) {
    return;
  }

  const newPeriods = recalculatePeriods(PeriodType.COP, storedPeriods, hasDependents);

  await setStorage(PeriodType.COP, newPeriods);
};

export const getBasePeriods = async (periodType: PeriodType): Promise<Record<Month, Period>> => {
  const storedPeriods = await getStorage(periodType);

  if (storedPeriods) {
    const { hasDependents } = await getSettings();

    return recalculatePeriods(periodType, storedPeriods, hasDependents);
  }

  return getDefaultPeriodsWithOfficialTrm(periodType);
};

export const getBasePeriodsAll = async (): Promise<CurrencyYearSalaries> => {
  const entries = await Promise.all(
    [PeriodType.COP, PeriodType.USD].map(async (periodType) => [periodType, await getBasePeriods(periodType)] as const)
  );

  return entries.reduce((periods, [periodType, periodData]) => {
    return {
      ...periods,
      [periodType]: periodData
    };
  }, {} as CurrencyYearSalaries);
};

export const getBasePeriodsUsd = () => {
  return getBasePeriods(PeriodType.USD);
};

export const getBasePeriodsCop = () => {
  return getBasePeriods(PeriodType.COP);
};

export const getEffectiveTrm = (period: Pick<Period, 'trm' | 'manualTrm'>): number => {
  return period.manualTrm ?? period.trm;
};

export const financial = (value: number): string => {
  const currencyFormat = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 2
  });

  return currencyFormat.format(value);
};