import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteIdbValue, getIdbValue, migrateLocalStorageKey, setIdbValue } from './indexedDb.ts';

const createLocalStorageStub = () => {
  const store = new Map<string, string>();

  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    }
  };
};

beforeEach(() => {
  vi.stubGlobal('localStorage', createLocalStorageStub());
});

describe('getIdbValue / setIdbValue / deleteIdbValue', () => {
  it('returns null for a key that was never stored', async () => {
    expect(await getIdbValue('missing-key')).toBeNull();
  });

  it('round-trips a stored value', async () => {
    await setIdbValue('some-key', { month: 'Enero', salaryCop: 12000000 });

    expect(await getIdbValue('some-key')).toEqual({ month: 'Enero', salaryCop: 12000000 });
  });

  it('overwrites a value stored under the same key', async () => {
    await setIdbValue('overwrite-key', { salaryCop: 1 });
    await setIdbValue('overwrite-key', { salaryCop: 2 });

    expect(await getIdbValue('overwrite-key')).toEqual({ salaryCop: 2 });
  });

  it('deletes a stored value', async () => {
    await setIdbValue('to-delete', { salaryCop: 1 });
    await deleteIdbValue('to-delete');

    expect(await getIdbValue('to-delete')).toBeNull();
  });
});

describe('migrateLocalStorageKey', () => {
  it('does nothing when there is no legacy localStorage value', async () => {
    await migrateLocalStorageKey('no-legacy-key');

    expect(await getIdbValue('no-legacy-key')).toBeNull();
  });

  it('copies the legacy value into IndexedDB and clears it from localStorage once verified', async () => {
    localStorage.setItem('legacy-key', JSON.stringify({ Enero: { salaryCop: 999999 } }));

    await migrateLocalStorageKey('legacy-key');

    expect(await getIdbValue('legacy-key')).toEqual({ Enero: { salaryCop: 999999 } });
    expect(localStorage.getItem('legacy-key')).toBeNull();
  });

  it('leaves an existing IndexedDB value untouched when there is no legacy key', async () => {
    await setIdbValue('already-migrated-key', { Enero: { salaryCop: 1 } });

    await migrateLocalStorageKey('already-migrated-key');

    expect(await getIdbValue('already-migrated-key')).toEqual({ Enero: { salaryCop: 1 } });
  });
});
