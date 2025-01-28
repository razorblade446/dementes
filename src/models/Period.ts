import { Month } from '../constants/constants.ts';
import { RetentionsSalary } from './RetentionsSalary.ts';

export interface Period {
  month: Month;
  salaryUsd: number;
  salaryCop: number;
  trm: number;
  baseSalary: number;
  retentions: RetentionsSalary;
  tax: number;
  netSalary: number;
}