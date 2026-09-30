import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getBasePeriods,
  getBasePeriodsAll,
  getBaseSalary,
  getDefaultPeriods,
  getHealthContribution,
  getNetSalary,
  getRetirementContribution,
  getSalaryRetentions,
  getSolidaryRetirement,
  getStorage,
  getStorageKey,
  getTax,
  getTaxableSalary,
  getTaxExemption,
  removeStorage,
  setStorage
} from './utils.ts';
import {
  HEALTH_CONTRIBUTION,
  INTEGRAL_LIMIT,
  MINIMUM_SALARY,
  MONTHS,
  PeriodType,
  RETIREMENT_CONTRIBUTION,
  UVT,
  UVT_LIMIT_EXEMPTION
} from '../constants/constants.ts';

describe('getBaseSalary', () => {
  it('returns the salary unchanged when below the integral limit', () => {
    expect(getBaseSalary(12000000)).toBe(12000000);
  });

  it('returns 70% of the salary, rounded, when at the integral limit', () => {
    expect(getBaseSalary(INTEGRAL_LIMIT)).toBe(15933236);
  });

  it('returns 70% of the salary, rounded up, when above the integral limit', () => {
    expect(getBaseSalary(22761766)).toBe(15933237);
  });
});

describe('getSolidaryRetirement', () => {
  it('returns 0 when the salary/minimum-salary factor is <= 4', () => {
    expect(getSolidaryRetirement(3501810)).toBe(0);
  });

  it('returns 1% when the factor is <= 16', () => {
    expect(getSolidaryRetirement(17509050)).toBe(175090.5);
  });

  it('returns 1.2% when the factor is <= 17', () => {
    expect(getSolidaryRetirement(41271332)).toBe(346679.196);
  });

  it('returns 1.4% when the factor is <= 18', () => {
    expect(getSolidaryRetirement(43772625)).toBe(428971.732);
  });

  it('returns 1.6% when the factor is <= 19', () => {
    expect(getSolidaryRetirement(46273918)).toBe(518267.888);
  });

  it('returns 1.8% when the factor is <= 20', () => {
    expect(getSolidaryRetirement(48775211)).toBe(614567.664);
  });

  it('returns 2% when the factor is > 20', () => {
    expect(getSolidaryRetirement(52527150)).toBe(735380.1);
  });
});

describe('getHealthContribution', () => {
  it('is 4% of the base salary, below the integral limit', () => {
    expect(getHealthContribution(12000000)).toBe(12000000 * HEALTH_CONTRIBUTION);
  });

  it('is 4% of the base salary, above the integral limit', () => {
    // baseSalary = 30,000,000 * .7 = 21,000,000
    expect(getHealthContribution(30000000)).toBe(21000000 * HEALTH_CONTRIBUTION);
  });
});

describe('getRetirementContribution', () => {
  it('is 4% of the base salary, below the integral limit', () => {
    expect(getRetirementContribution(12000000)).toBe(12000000 * RETIREMENT_CONTRIBUTION);
  });

  it('is 4% of the base salary, above the integral limit', () => {
    expect(getRetirementContribution(30000000)).toBe(21000000 * RETIREMENT_CONTRIBUTION);
  });
});

describe('getSalaryRetentions', () => {
  it('composes health, retirement and solidarity from the same base salary', () => {
    expect(getSalaryRetentions(17509050)).toEqual({
      health: 700362,
      retirement: 700362,
      solidarity: 175090.5
    });
  });
});

describe('getTaxExemption', () => {
  it('returns 25% of (deducted salary + bonus) when under the remaining cap', () => {
    // baseSalary = 5,000,000 (factor 2.85 <= 4, solidarity 0)
    // netRetentions = 200,000 + 200,000 + 0 = 400,000
    // deductedSalary = 5,000,000 - 400,000 = 4,600,000
    // trialExempt = 4,600,000 * .25 = 1,150,000 < remaining (41,375,460)
    expect(getTaxExemption(5000000, 0, 0)).toBe(1150000);
  });

  it('is capped by the remaining accumulated-exemption budget', () => {
    // remainingExempt = UVT_LIMIT_EXEMPTION - exemptAccumulate = 100,000
    // trialExempt (1,150,000) > remainingExempt (100,000) -> capped
    const exemptAccumulate = UVT_LIMIT_EXEMPTION - 100000;
    expect(getTaxExemption(5000000, 0, exemptAccumulate)).toBe(100000);
  });

  it('clamps remainingExempt to 0 when exemptAccumulate already exceeds the yearly limit', () => {
    const exemptAccumulate = UVT_LIMIT_EXEMPTION + 624540;
    expect(getTaxExemption(5000000, 0, exemptAccumulate)).toBe(0);
  });
});

describe('getTaxableSalary', () => {
  it('composes deducted salary + bonus - exemption', () => {
    // deductedSalary = 4,600,000, exemption = 1,150,000 (see getTaxExemption case above)
    expect(getTaxableSalary(5000000, 0, 0)).toBe(3450000);
  });
});

describe('getTax', () => {
  // Every case below zeroes out the exemption by passing an exemptAccumulate that
  // already exceeds UVT_LIMIT_EXEMPTION, so taxableSalary = salary - netRetentions,
  // and the bracket math is worked out by hand from the documented DIAN formula:
  // tax = (salaryUvt - lowerBound) * rate + baseUvt, expressed in UVT then *UVT,
  // truncated (rounded down) to the nearest 1,000 COP.
  const noExemption = UVT_LIMIT_EXEMPTION + 1000000;

  it('is 0 for taxable salary <= 95 UVT', () => {
    // baseSalary = 5,000,000 (factor 2.85, solidarity 0)
    // netRetentions = 400,000; taxable = 5,000,000 - 400,000 = 4,600,000
    // salaryUvt = 4,600,000 / 52,374 = 87.83 <= 95
    expect(getTax(5000000, 0, noExemption)).toBe(0);
  });

  it('bracket 95-150 UVT: 19% over 95 UVT', () => {
    // baseSalary = 8,000,000 (factor 4.57, solidarity 1% = 80,000)
    // netRetentions = 320,000 + 320,000 + 80,000 = 720,000
    // taxable = 8,000,000 - 720,000 = 7,280,000; salaryUvt = 139.0003
    // tax = (139.0003 - 95) * .19 * 52,374 = 437,849.3 -> floored to 437,000
    expect(getTax(8000000, 0, noExemption)).toBe(437000);
  });

  it('bracket 150-360 UVT: 28% over 150 UVT + 10 UVT', () => {
    // baseSalary = 20,000,000 (factor 11.42, solidarity 1% = 200,000)
    // netRetentions = 800,000 + 800,000 + 200,000 = 1,800,000
    // taxable = 20,000,000 - 1,800,000 = 18,200,000; salaryUvt = 347.5007
    // tax = ((347.5007 - 150) * .28 + 10) * 52,374 = 3,420,032 -> floored to 3,420,000
    expect(getTax(20000000, 0, noExemption)).toBe(3420000);
  });

  it('bracket 360-640 UVT: 33% over 360 UVT + 69 UVT', () => {
    // salary = 27,947,705 (>= INTEGRAL_LIMIT) -> baseSalary = round_up(.7 * salary) = 19,563,394
    // factor = 11.17, solidarity 1% = 195,633.94
    // netRetentions = 782,535.76 + 782,535.76 + 195,633.94 = 1,760,705.46
    // taxable = 27,947,705 - 1,760,705.46 = 26,186,999.54; salaryUvt = 499.99999
    // tax = ((499.99999 - 360) * .33 + 69) * 52,374 = 6,033,484.65 -> floored to 6,033,000
    expect(getTax(27947705, 0, noExemption)).toBe(6033000);
  });

  it('bracket 640-945 UVT: 35% over 640 UVT + 162 UVT', () => {
    // salary = 44,850,353 -> baseSalary = round_up(.7 * salary) = 31,395,248
    // factor = 17.93, solidarity 1.4% = 439,533.472
    // netRetentions = 1,255,809.92 + 1,255,809.92 + 439,533.472 = 2,951,153.312
    // taxable = 44,850,353 - 2,951,153.312 = 41,899,199.688; salaryUvt = 799.99999
    // tax = ((799.99999 - 640) * .35 + 162) * 52,374 = 11,417,531.89 -> floored to 11,417,000
    expect(getTax(44850353, 0, noExemption)).toBe(11417000);
  });

  it('bracket 945-2300 UVT: 37% over 945 UVT + 268 UVT', () => {
    // salary = 84,474,194 -> baseSalary = round_up(.7 * salary) = 59,131,936
    // factor = 33.77 (> 20), solidarity 2% = 1,182,638.72
    // netRetentions = 2,365,277.44 + 2,365,277.44 + 1,182,638.72 = 5,913,193.6
    // taxable = 84,474,194 - 5,913,193.6 = 78,561,000.4; salaryUvt = 1500.00001
    // tax = ((1500.00001 - 945) * .37 + 268) * 52,374 = 24,791,233.05 -> floored to 24,791,000
    expect(getTax(84474194, 0, noExemption)).toBe(24791000);
  });

  it('bracket 2300+ UVT: 39% over 2300 UVT + 770 UVT', () => {
    // salary = 168,948,387 -> baseSalary = round_up(.7 * salary) = 118,263,871
    // factor = 67.54 (> 20), solidarity 2% = 2,365,277.42
    // netRetentions = 4,730,554.84 + 4,730,554.84 + 2,365,277.42 = 11,826,387.1
    // taxable = 168,948,387 - 11,826,387.1 = 157,121,999.9; salaryUvt = 2999.99999
    // tax = ((2999.99999 - 2300) * .39 + 770) * 52,374 = 54,626,081.96 -> floored to 54,626,000
    expect(getTax(168948387, 0, noExemption)).toBe(54626000);
  });
});

describe('getNetSalary', () => {
  it('is salary + bonus - retentions - tax', () => {
    // baseSalary = 8,000,000 (factor 4.57, solidarity 1% = 80,000)
    // retentions = 320,000 + 320,000 + 80,000 = 720,000
    // deductedSalary = 8,000,000 - 720,000 = 7,280,000
    // trialExempt = (7,280,000 + 1,000,000) * .25 = 2,070,000 (under the cap)
    // taxableSalary = 7,280,000 + 1,000,000 - 2,070,000 = 6,210,000
    // salaryUvt = 118.5703 -> tax = (118.5703 - 95) * .19 * 52,374 = 234,549.3 -> floored to 234,000
    // netSalary = 8,000,000 + 1,000,000 - 720,000 - 234,000 = 8,046,000
    expect(getNetSalary(8000000, 1000000, 0)).toBe(8046000);
  });
});

// sanity check that the constants used above still match what the tests assume
describe('constants used in this file', () => {
  it('UVT and MINIMUM_SALARY have the expected 2026 values', () => {
    expect(UVT).toBe(52374);
    expect(MINIMUM_SALARY).toBe(1750905);
  });
});

const createLocalStorageStub = () => {
  const store = new Map<string, string>();

  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    }
  };
};

beforeEach(async () => {
  vi.stubGlobal('localStorage', createLocalStorageStub());
  // fake-indexeddb's store is shared (module-level) across every test in this
  // file, so wipe it before each test to keep storage tests independent.
  await removeStorage(PeriodType.COP);
  await removeStorage(PeriodType.USD);
});

describe('getStorageKey', () => {
  it('namespaces the key by period type', () => {
    expect(getStorageKey(PeriodType.COP)).toBe('periods-COP');
    expect(getStorageKey(PeriodType.USD)).toBe('periods-USD');
  });
});

describe('getStorage / setStorage / removeStorage', () => {
  it('returns null when nothing has been stored for that period type', async () => {
    expect(await getStorage(PeriodType.COP)).toBeNull();
  });

  it('round-trips periods written with setStorage', async () => {
    const periods = getDefaultPeriods(PeriodType.COP);
    await setStorage(PeriodType.COP, periods);

    expect(await getStorage(PeriodType.COP)).toEqual(periods);
  });

  it('clears the stored value with removeStorage', async () => {
    const periods = getDefaultPeriods(PeriodType.USD);
    await setStorage(PeriodType.USD, periods);
    await removeStorage(PeriodType.USD);

    expect(await getStorage(PeriodType.USD)).toBeNull();
  });

  it('migrates a legacy localStorage value on first read and removes the legacy key', async () => {
    const legacyPeriods = getDefaultPeriods(PeriodType.COP);
    localStorage.setItem(getStorageKey(PeriodType.COP), JSON.stringify(legacyPeriods));

    expect(await getStorage(PeriodType.COP)).toEqual(legacyPeriods);
    expect(localStorage.getItem(getStorageKey(PeriodType.COP))).toBeNull();
  });
});

describe('getDefaultPeriods', () => {
  it('builds one entry per month', () => {
    const periods = getDefaultPeriods(PeriodType.COP);

    expect(Object.keys(periods)).toEqual(MONTHS as unknown as string[]);
  });

  it('defaults COP periods to a 12,000,000 salary with no USD/TRM fields', () => {
    const periods = getDefaultPeriods(PeriodType.COP);

    expect(periods.Enero.salaryCop).toBe(12000000);
    expect(periods.Enero.bonusCop).toBe(5200000);
    expect(periods.Enero.salaryUsd).toBe(0);
    expect(periods.Enero.trm).toBe(0);
  });

  it('defaults USD periods to a 3,000 USD salary converted at the default TRM', () => {
    const periods = getDefaultPeriods(PeriodType.USD);

    expect(periods.Enero.salaryUsd).toBe(3000);
    expect(periods.Enero.trm).toBe(4000);
    expect(periods.Enero.salaryCop).toBe(12000000);
  });
});

describe('getBasePeriods', () => {
  it('returns the defaults when nothing is stored', async () => {
    expect(await getBasePeriods(PeriodType.COP)).toEqual(getDefaultPeriods(PeriodType.COP));
  });

  it('returns the stored periods when present, instead of the defaults', async () => {
    const stored = getDefaultPeriods(PeriodType.COP);
    stored.Enero.salaryCop = 999999;
    await setStorage(PeriodType.COP, stored);

    const result = await getBasePeriods(PeriodType.COP);
    expect(result.Enero.salaryCop).toBe(999999);
  });
});

describe('getBasePeriodsAll', () => {
  it('returns defaults for both period types keyed by period type', async () => {
    const result = await getBasePeriodsAll();

    expect(result[PeriodType.COP]).toEqual(getDefaultPeriods(PeriodType.COP));
    expect(result[PeriodType.USD]).toEqual(getDefaultPeriods(PeriodType.USD));
  });
});
