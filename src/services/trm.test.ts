import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchOfficialTrm, getOfficialTrmByMonth, getOfficialTrmForMonth } from './trm.ts';
import { MONTHS } from '../constants/constants.ts';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchOfficialTrm', () => {
  it('parses the TRM value from the official dataset response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ valor: '4123.45' }])
    });
    vi.stubGlobal('fetch', fetchMock);

    const trm = await fetchOfficialTrm(new Date(Date.UTC(2026, 0, 10)));

    expect(trm).toBe(4123.45);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain('2026-01-10T00%3A00%3A00.000');
  });

  it('falls back to the most recently published TRM when there is no exact match (e.g. a future date)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ valor: '3341.23' }])
    });
    vi.stubGlobal('fetch', fetchMock);

    const trm = await fetchOfficialTrm(new Date(Date.UTC(2026, 9, 10)));

    expect(trm).toBe(3341.23);
    expect(fetchMock.mock.calls[0][0]).toContain('$order=vigenciadesde');
    expect(fetchMock.mock.calls[0][0]).not.toContain('vigenciahasta');
  });

  it('throws when the dataset has no TRM published at all', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    }));

    await expect(fetchOfficialTrm(new Date(Date.UTC(2026, 0, 10)))).rejects.toThrow();
  });

  it('throws when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    await expect(fetchOfficialTrm(new Date(Date.UTC(2026, 0, 10)))).rejects.toThrow();
  });
});

describe('getOfficialTrmForMonth', () => {
  it('queries the reference day (10th) of the given month', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ valor: '4000' }])
    });
    vi.stubGlobal('fetch', fetchMock);

    await getOfficialTrmForMonth(2026, 2);

    expect(fetchMock.mock.calls[0][0]).toContain('2026-03-10');
  });
});

describe('getOfficialTrmByMonth', () => {
  it('returns a TRM entry for every month of the year', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ valor: '4500' }])
    }));

    const trms = await getOfficialTrmByMonth(2026);

    expect(Object.keys(trms)).toEqual(MONTHS as unknown as string[]);
    expect(trms.Enero).toBe(4500);
  });
});
