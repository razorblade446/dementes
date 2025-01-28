import { Month } from '../constants/constants.ts';
import { Period } from '../models/Period.ts';
import { getBasePeriods } from '../utils/utils.ts';
import { createContext } from 'react';

export interface ISalaryContext {
  periods: Record<Month, Period>;
  updatePeriod: (month: Month, period: Period) => void;
  resetPeriods: () => void;
}

const storedPeriods = localStorage.getItem('periods');

export const defaultPeriods: Record<Month, Period> = storedPeriods ? JSON.parse(storedPeriods) : getBasePeriods();

export const SalaryContext = createContext<ISalaryContext>({
  periods: defaultPeriods, updatePeriod: () => {
  }, resetPeriods: () => {
  }
});