import { PropsWithChildren, useState } from 'react';
import { Month, MONTHS } from '../constants/constants.ts';
import { Period } from '../models/Period.ts';
import { getBaseSalary, getNetSalaryRetentions, getSalaryRetentions, getTax, getTaxExemption } from '../utils/utils.ts';
import { defaultPeriods, ISalaryContext, SalaryContext } from '../contexts/SalaryContext.ts';
import Big from 'big.js';

export const SalaryProvider = ({ children }: PropsWithChildren) => {
  const [periods, setPeriods] = useState(defaultPeriods);

  const value: ISalaryContext = {
    periods,
    updatePeriod: (month: Month, period: Period) => {
      setPeriods(oldPeriods => {
        let exemptAccumulate = 0;

        const newPeriods = {} as Record<Month, Period>;

        for (const keyMonth of MONTHS) {
          const currentMonth = month === keyMonth ? period : oldPeriods[keyMonth as Month];

          const salaryCop = Big(currentMonth.salaryUsd).times(currentMonth.trm).toNumber();
          const baseSalary = getBaseSalary(salaryCop);
          const retentions = getSalaryRetentions(salaryCop);
          const netSalaryRetentions = getNetSalaryRetentions(salaryCop);
          const tax = getTax(salaryCop, exemptAccumulate);

          const netSalary = Big(salaryCop).minus(netSalaryRetentions).minus(tax).toNumber();

          newPeriods[keyMonth as Month] = {
            ...currentMonth,
            salaryCop,
            baseSalary,
            retentions,
            tax,
            netSalary
          }

          exemptAccumulate += getTaxExemption(salaryCop, exemptAccumulate);
        }

        localStorage.setItem('periods', JSON.stringify(newPeriods));

        return newPeriods;
      });
    },
    resetPeriods: () => {
      localStorage.removeItem('periods');
      setPeriods(defaultPeriods);
    }
  };

  return <SalaryContext.Provider value={ value }>{ children }</SalaryContext.Provider>;

};