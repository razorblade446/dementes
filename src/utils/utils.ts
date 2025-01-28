import {
  EXEMPTION_FACTOR,
  HEALTH_CONTRIBUTION,
  INTEGRAL_LIMIT,
  MINIMUM_SALARY,
  Month,
  MONTHS,
  RETIREMENT_CONTRIBUTION,
  UVT,
  UVT_LIMIT_EXEMPTION
} from '../constants/constants.ts';
import Big from 'big.js';
import { RetentionsSalary } from '../models/RetentionsSalary.ts';
import { Period } from '../models/Period.ts';

export const getBaseSalary = (salary: number): number => {
  const baseSalary = Big(salary).gte(INTEGRAL_LIMIT) ? Big(salary).times(.7) : Big(salary);

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

export const getTaxExemption = (salary: number, exemptAccumulate: number): number => {
  const netSalaryRetentions = getNetSalaryRetentions(salary);

  const deductedSalary = Big(salary).minus(netSalaryRetentions);

  // TODO: test for values less than 0
  let remainingExempt = Big(UVT_LIMIT_EXEMPTION).minus(exemptAccumulate);

  if (remainingExempt.lte(0)) {
    remainingExempt = Big(0);
  }

  const trialExempt = deductedSalary.times(EXEMPTION_FACTOR);

  return (trialExempt.gt(remainingExempt) ? remainingExempt : trialExempt).toNumber();
};

export const getTaxableSalary = (salary: number, exemptAccumulate: number): number => {
  const netSalaryRetentions = getNetSalaryRetentions(salary);

  const deductedSalary = Big(salary).minus(netSalaryRetentions);

  const realExempt = getTaxExemption(salary, exemptAccumulate);

  return deductedSalary.minus(realExempt).toNumber();
};

export const getTax = (salary: number, exemptAccumulate: number): number => {
  const taxableSalary = Big(getTaxableSalary(salary, exemptAccumulate));

  const salaryUvt = taxableSalary.div(UVT);

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

export const getNetSalary = (salary: number, exemptAccumulate: number) => {
  const { health, retirement, solidarity } = getSalaryRetentions(salary);

  const totalRetentions = Big(health).plus(retirement).plus(solidarity ?? 0);

  const tax = getTax(salary, exemptAccumulate);

  return Big(salary).minus(totalRetentions).minus(tax).toNumber();
};

export const getBasePeriods = () => {
  let exemptAccumulate = 0;
  return MONTHS.reduce<Record<Month, Period>>((periods, month) => {
    const salaryUsd = 3000;
    const trm = 4321.19;

    const salaryCop = Big(salaryUsd).times(trm).toNumber();

    const baseSalary = getBaseSalary(salaryCop);
    const retentions = getSalaryRetentions(salaryCop);
    const netSalaryRetentions = getNetSalaryRetentions(salaryCop);
    const tax = getTax(salaryCop, exemptAccumulate);

    const netSalary = Big(salaryCop).minus(netSalaryRetentions).minus(tax).toNumber();

    periods[month] = {
      month,
      salaryUsd,
      salaryCop,
      trm,
      baseSalary,
      retentions,
      tax,
      netSalary
    };

    exemptAccumulate += getTaxExemption(salaryCop, exemptAccumulate);

    return periods;
  }, {} as unknown as Record<Month, Period>);
};

export const financial = (value: number): string => {
  const currencyFormat = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 2
  });

  return currencyFormat.format(value);
};