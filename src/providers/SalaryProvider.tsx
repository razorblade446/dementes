import { PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { Month, MONTHS, PeriodType } from '../constants/constants.ts';
import { Period } from '../models/Period.ts';
import {
  getBasePeriodsAll,
  getBaseSalary,
  getDefaultPeriods,
  getNetSalaryRetentions,
  getSalaryRetentions,
  getTax,
  getTaxExemption,
  removeStorage,
  setStorage
} from '../utils/utils.ts';
import { ISalaryContext, SalaryContextBuilder } from '../contexts/SalaryContext.ts';
import Big from 'big.js';
import { CurrencyYearSalaries, YearSalaries } from '../models/YearSalaries.ts';

type PeriodsFn = (oldPeriods: YearSalaries) => YearSalaries;

const getDefaultPeriodsAll = (): CurrencyYearSalaries => {
  return [PeriodType.COP, PeriodType.USD].reduce((periods, periodType) => {
    return {
      ...periods,
      [periodType]: getDefaultPeriods(periodType)
    };
  }, {} as CurrencyYearSalaries);
};

export const SalaryProvider = ({ periodType, children }: PropsWithChildren & { periodType: PeriodType }) => {
  const [allPeriods, setPeriodsAll] = useState(getDefaultPeriodsAll);

  useEffect(() => {
    getBasePeriodsAll().then(setPeriodsAll);
  }, []);

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
          const bonusUsd = periodType === PeriodType.USD ? currentMonth.bonusUsd : 0;
          const trm = periodType === PeriodType.USD ? currentMonth.trm : 0;

          const salaryCop = periodType === PeriodType.USD ? Big(currentMonth.salaryUsd).times(currentMonth.trm).toNumber() : currentMonth.salaryCop;
          const bonusCop = periodType === PeriodType.USD ? Big(currentMonth.bonusUsd).times(currentMonth.trm).toNumber() : currentMonth.bonusCop;
          const baseSalary = getBaseSalary(salaryCop);
          const retentions = getSalaryRetentions(salaryCop);
          const netSalaryRetentions = getNetSalaryRetentions(salaryCop);
          const tax = getTax(salaryCop, bonusCop, exemptAccumulate);

          const netSalary = Big(salaryCop).plus(bonusCop).minus(netSalaryRetentions).minus(tax).toNumber();

          newPeriods[keyMonth as Month] = {
            ...currentMonth,
            salaryUsd,
            bonusUsd,
            trm,
            salaryCop,
            bonusCop,
            baseSalary,
            retentions,
            tax,
            netSalary
          };

          exemptAccumulate += getTaxExemption(salaryCop, bonusCop, exemptAccumulate);
        }

        setStorage(periodType, newPeriods);

        return newPeriods;
      });
    },
    resetPeriods: () => {
      removeStorage(periodType);

      setPeriods({
        ...allPeriods,
        [periodType]: getDefaultPeriods(periodType)
      });
    }
  };

  const SalaryContextWrapper = SalaryContextBuilder.getSalaryContext(periodType);

  return <SalaryContextWrapper.Provider value={ value }>{ children }</SalaryContextWrapper.Provider>;

};