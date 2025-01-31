import { Period } from './Period.ts';
import { Month, PeriodType } from '../constants/constants.ts';

export type YearSalaries = Record<Month, Period>;

export type CurrencyYearSalaries = {
  [key in PeriodType]?: YearSalaries;
}