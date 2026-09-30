import { Month } from '../constants/constants.ts';
import { RetentionsSalary } from './RetentionsSalary.ts';

export interface Period {
  month: Month;
  salaryUsd: number;
  salaryCop: number;
  trm: number;
  manualTrm: number | null;
  bonusUsd: number;
  bonusCop: number;
  baseSalary: number;
  retentions: RetentionsSalary;
  deductions: number;
  prima: number;
  tax: number;
  netSalary: number;
}