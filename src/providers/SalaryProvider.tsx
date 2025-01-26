import { PropsWithChildren, useState } from 'react';
import { Month, MONTHS } from '../constants/constants.ts';
import { Monthly } from '../models/Monthly.ts';
import { getSalaryRetentions, getTax, getTaxExemption } from '../utils/utils.ts';
import { defaultMonthly, SalaryContext } from '../contexts/SalaryContext.ts';

export const SalaryProvider = ({ children }: PropsWithChildren) => {
  const [monthly, setMonthly] = useState(defaultMonthly);

  const value = {
    monthly,
    updateMonth: (month: Month, monthly: Monthly) => {
      setMonthly(prevMonths => {
        let exemptAccumulate = 0;
        for (const keyMonth in MONTHS) {
          const currentMonth = month === keyMonth ? monthly : prevMonths[keyMonth as Month];

          const salaryCOP = currentMonth.salaryUsd * currentMonth.trm;

          currentMonth.retentions = getSalaryRetentions(salaryCOP);
          currentMonth.tax = getTax(salaryCOP, exemptAccumulate);

          currentMonth.netSalary = salaryCOP - currentMonth.retentions.health - currentMonth.retentions.retirement - (currentMonth.retentions.solidarity ?? 0) - currentMonth.tax;

          exemptAccumulate += getTaxExemption(salaryCOP, exemptAccumulate);
        }

        return prevMonths;
      });
    }
  };

  return <SalaryContext.Provider value={ value }>{ children }</SalaryContext.Provider>;

};