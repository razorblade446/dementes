import { Month, PeriodType } from '../constants/constants.ts';
import { Period } from '../models/Period.ts';
import { Context, createContext } from 'react';

export interface ISalaryContext {
  periodType: PeriodType;
  periods: Record<Month, Period>;
  updatePeriod: (month: Month, period: Period) => void;
  resetPeriods: () => void;
}

export const SalaryContext = createContext<ISalaryContext>({
  periodType: PeriodType.COP,
  periods: {} as Record<Month, Period>,
  updatePeriod: () => {
  },
  resetPeriods: () => {
  }
});

export class SalaryContextBuilder {
  private static instances = new Map<PeriodType, Context<ISalaryContext>>();

  static getSalaryContext(periodType: PeriodType): Context<ISalaryContext> {
    if (!SalaryContextBuilder.instances.has(periodType)) {
      const salaryContext = {
        periodType: periodType,
        periods: {} as Record<Month, Period>,
        updatePeriod: (_month: Month, _period: Period) => {
        },
        resetPeriods: () => {
        }
      };

      SalaryContextBuilder.instances.set(periodType, createContext(salaryContext));
    }

    return SalaryContextBuilder.instances.get(periodType) as Context<ISalaryContext>;
  }
}