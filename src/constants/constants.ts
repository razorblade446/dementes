export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
] as const;

export type Month = typeof MONTHS[number];

// Updated to 2025
export const UVT = 49799;
export const UVT_LIMIT = 790;
export const UVT_LIMIT_EXEMPTION = UVT * UVT_LIMIT;
export const EXEMPTION_FACTOR = 0.25;

export const MINIMUM_SALARY = 1423500;
export const INTEGRAL_LIMIT = MINIMUM_SALARY * 13;

export const MINIMUM_SOLIDARY_RETIREMENT = 4 * MINIMUM_SALARY;

export const HEALTH_CONTRIBUTION = 0.04;
export const RETIREMENT_CONTRIBUTION = 0.04;
