import { PropsWithChildren, useCallback, useState } from 'react';
import { Month, MONTHS, PeriodType } from '../constants/constants.ts';
import { Period } from '../models/Period.ts';
import {
  getBasePeriods,
  getBasePeriodsAll,
  getBaseSalary,
  getNetSalaryRetentions,
  getSalaryRetentions,
  getStorageKey,
  getTax,
  getTaxExemption,
  setStorage
} from '../utils/utils.ts';
import { ISalaryContext, SalaryContextBuilder } from '../contexts/SalaryContext.ts';
import Big from 'big.js';
import { CurrencyYearSalaries, YearSalaries } from '../models/YearSalaries.ts';

type PeriodsFn = (oldPeriods: YearSalaries) => YearSalaries;

export const SalaryProvider = ({ periodType, children }: PropsWithChildren & { periodType: PeriodType }) => {
  const basePeriods = getBasePeriodsAll();
  const [allPeriods, setPeriodsAll] = useState(basePeriods);

  const setPeriods = useCallback((periodsArg: PeriodsFn | CurrencyYearSalaries) => {
    if (typeof periodsArg === 'function') {
      setPeriodsAll((allPeriods) => {
        const newPeriods = periodsArg(allPeriods[periodType] as YearSalaries);
        return {
          ...allPeriods,
          [periodType]: newPeriods
        };
      });
    } else {
      setPeriodsAll(periodsArg);
    }
  }, [periodType]);

  const value: ISalaryContext = {
    periodType,
    periods: allPeriods[periodType] as YearSalaries,
    updatePeriod: (month: Month, period: Period) => {
      setPeriods((oldPeriods: YearSalaries) => {
        let exemptAccumulate = 0;

        const newPeriods = {} as YearSalaries;

        for (const keyMonth of MONTHS) {
          const currentMonth = month === keyMonth ? period : oldPeriods[keyMonth as Month];

          const salaryUsd = periodType === PeriodType.USD ? currentMonth.salaryUsd : 0;
          const trm = periodType === PeriodType.USD ? currentMonth.trm : 0;

          const salaryCop = periodType === PeriodType.USD ? Big(currentMonth.salaryUsd).times(currentMonth.trm).toNumber() : currentMonth.salaryCop;
          const baseSalary = getBaseSalary(salaryCop);
          const retentions = getSalaryRetentions(salaryCop);
          const netSalaryRetentions = getNetSalaryRetentions(salaryCop);
          const tax = getTax(salaryCop, exemptAccumulate);

          const netSalary = Big(salaryCop).minus(netSalaryRetentions).minus(tax).toNumber();

          newPeriods[keyMonth as Month] = {
            ...currentMonth,
            salaryUsd,
            trm,
            salaryCop,
            baseSalary,
            retentions,
            tax,
            netSalary
          };

          exemptAccumulate += getTaxExemption(salaryCop, exemptAccumulate);
        }

        setStorage(periodType, newPeriods);

        return newPeriods;
      });
    },
    resetPeriods: () => {
      localStorage.removeItem(getStorageKey(periodType));

      setPeriods({
        ...allPeriods,
        [periodType]: getBasePeriods(periodType)
      });
    }
  };

  const SalaryContextWrapper = SalaryContextBuilder.getSalaryContext(periodType);

  return <SalaryContextWrapper.Provider value={ value }>{ children }</SalaryContextWrapper.Provider>;

};