import { Month } from '../constants/constants.ts';
import { RetentionsSalary } from './RetentionsSalary.ts';

export interface Monthly {
  month: Month;
  salaryUsd: number;
  trm: number;
  baseSalary: number;
  retentions: RetentionsSalary;
  tax: number;
  netSalary: number;
}