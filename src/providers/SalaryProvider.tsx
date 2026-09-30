import { PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { Month, PeriodType } from '../constants/constants.ts';
import { Period } from '../models/Period.ts';
import {
  getBasePeriodsAll,
  getDefaultPeriods,
  getDefaultPeriodsWithOfficialTrm,
  recalculatePeriods,
  removeStorage,
  setStorage
} from '../utils/utils.ts';
import { ISalaryContext, SalaryContextBuilder } from '../contexts/SalaryContext.ts';
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
        const mergedPeriods = { ...oldPeriods, [month]: period };
        const newPeriods = recalculatePeriods(periodType, mergedPeriods);

        setStorage(periodType, newPeriods);

        return newPeriods;
      });
    },
    resetPeriods: () => {
      removeStorage(periodType);

      getDefaultPeriodsWithOfficialTrm(periodType).then((defaultPeriods) => {
        setPeriods({
          ...allPeriods,
          [periodType]: defaultPeriods
        });
      });
    }
  };

  const SalaryContextWrapper = SalaryContextBuilder.getSalaryContext(periodType);

  return <SalaryContextWrapper.Provider value={ value }>{ children }</SalaryContextWrapper.Provider>;

};