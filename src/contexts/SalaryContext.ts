import { Month, MONTHS } from '../constants/constants.ts';
import { Monthly } from '../models/Monthly.ts';
import { getBaseSalary, getNetSalary, getSalaryRetentions, getTax } from '../utils/utils.ts';
import Big from 'big.js';
import { createContext } from 'react';

export interface ISalaryContext {
  monthly: Record<Month, Monthly>;
  updateMonth: (month: Month, monthly: Monthly) => void;
}

export const defaultMonthly: Record<Month, Monthly> = MONTHS.reduce<Record<Month, Monthly>>((monthly, month) => {
  const salaryUsd = 5629.87;
  const trm = 4321.19;

  const baseSalary = getBaseSalary(Big(salaryUsd).times(trm).toNumber());

  const tax = getTax(baseSalary, 0);

  const retentions = getSalaryRetentions(baseSalary);

  const netSalary = getNetSalary(Big(salaryUsd).times(trm).toNumber(), 0);

  monthly[month] = {
    month,
    salaryUsd,
    trm,
    baseSalary,
    retentions,
    tax,
    netSalary
  };

  monthly[month].tax = getTax(monthly[month].salaryUsd * monthly[month].trm, 0);
  monthly[month].retentions = getSalaryRetentions(monthly[month].salaryUsd * monthly[month].trm);
  monthly[month].netSalary = monthly[month].salaryUsd * monthly[month].trm - monthly[month].retentions.health - monthly[month].retentions.retirement - (monthly[month].retentions.solidarity ?? 0) - monthly[month].tax;

  return monthly;
}, {} as unknown as Record<Month, Monthly>);

export const SalaryContext = createContext<ISalaryContext>({
  monthly: defaultMonthly, updateMonth: () => {
  }
});