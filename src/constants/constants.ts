export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
] as const;

export type Month = typeof MONTHS[number];

export enum PeriodType {
  COP = 'COP',
  USD = 'USD'
}

// Updated to 2025
export const UVT = 52374;
export const UVT_LIMIT = 790;
export const UVT_LIMIT_EXEMPTION = UVT * UVT_LIMIT;
export const EXEMPTION_FACTOR = 0.25;

export const MINIMUM_SALARY = 1750905;
export const INTEGRAL_LIMIT = MINIMUM_SALARY * 13;

export const MINIMUM_SOLIDARY_RETIREMENT = 4 * MINIMUM_SALARY;

export const HEALTH_CONTRIBUTION = 0.04;
export const RETIREMENT_CONTRIBUTION = 0.04;

// Day of the month whose official TRM (Colombian USD exchange rate) is used for that month's calculation.
export const TRM_REFERENCE_DAY = 10;

// DIAN-sanctioned methods for withholding tax on prima de servicios (docs/tax.md §5).
export enum PrimaTaxMethod {
  PROCEDIMIENTO_1 = 'PROCEDIMIENTO_1', // Art. 385 E.T. — independent calculation, own 25%/790-UVT exemption draw
  PROCEDIMIENTO_2 = 'PROCEDIMIENTO_2'  // Art. 386 E.T. — fixed semestral percentage, not yet implemented
}

// Hardcoded until the settings panel/modal exists to let the user choose.
export const PRIMA_TAX_METHOD: PrimaTaxMethod = PrimaTaxMethod.PROCEDIMIENTO_1;