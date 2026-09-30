import { Month, MONTHS } from '../constants/constants.ts';

// Banco de la República's official TRM dataset, published on the government open-data portal.
const TRM_ENDPOINT = 'https://www.datos.gov.co/resource/32sa-8pi3.json';

const toIsoDate = (date: Date): string => {
  return date.toISOString().slice(0, 10) + 'T00:00:00.000';
};

export const fetchOfficialTrm = async (date: Date): Promise<number> => {
  const isoDate = toIsoDate(date);
  // No exact match for a future/not-yet-published date: fall back to the most recently
  // published TRM as of that date, instead of requiring vigenciadesde<=date<=vigenciahasta.
  const where = `vigenciadesde<='${ isoDate }'`;
  const url = `${ TRM_ENDPOINT }?$where=${ encodeURIComponent(where) }&$order=vigenciadesde%20DESC&$limit=1`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`No se pudo obtener la TRM oficial (HTTP ${ response.status })`);
  }

  const data: Array<{ valor: string }> = await response.json();

  if (!data.length) {
    throw new Error(`No hay TRM oficial publicada para ${ isoDate }`);
  }

  return parseFloat(data[0].valor);
};

export const getOfficialTrmForMonth = (year: number, monthIndex: number, referenceDay: number): Promise<number> => {
  const referenceDate = new Date(Date.UTC(year, monthIndex, referenceDay));

  return fetchOfficialTrm(referenceDate);
};

export const getOfficialTrmByMonth = async (year: number, referenceDay: number): Promise<Record<Month, number>> => {
  const entries = await Promise.all(
    MONTHS.map(async (month, monthIndex) => [month, await getOfficialTrmForMonth(year, monthIndex, referenceDay)] as const)
  );

  return entries.reduce((trms, [month, trm]) => {
    trms[month] = trm;

    return trms;
  }, {} as Record<Month, number>);
};
