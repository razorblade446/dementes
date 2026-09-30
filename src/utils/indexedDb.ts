const DB_NAME = 'dementes-db';
const DB_VERSION = 2;
const PERIODS_STORE_NAME = 'periods';
export const SETTINGS_STORE_NAME = 'settings';

const openDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(PERIODS_STORE_NAME)) {
        request.result.createObjectStore(PERIODS_STORE_NAME);
      }

      if (!request.result.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
        request.result.createObjectStore(SETTINGS_STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getIdbValue = async <T>(key: string, storeName: string = PERIODS_STORE_NAME): Promise<T | null> => {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const request = tx.objectStore(storeName).get(key);

    request.onsuccess = () => resolve((request.result as T) ?? null);
    request.onerror = () => reject(request.error);
  });
};

export const setIdbValue = async <T>(key: string, value: T, storeName: string = PERIODS_STORE_NAME): Promise<void> => {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(value, key);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const deleteIdbValue = async (key: string, storeName: string = PERIODS_STORE_NAME): Promise<void> => {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(key);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

/**
 * One-time migration off the old localStorage-based store. Copies the legacy
 * value into IndexedDB, reads it back to confirm the write matches, and only
 * then clears the localStorage key — so a failed/partial migration leaves
 * the legacy data in place as a fallback instead of silently losing it.
 */
export const migrateLocalStorageKey = async <T>(key: string): Promise<void> => {
  const legacyRaw = localStorage.getItem(key);

  if (legacyRaw === null) {
    return;
  }

  const legacyValue = JSON.parse(legacyRaw) as T;
  await setIdbValue(key, legacyValue);

  const migratedValue = await getIdbValue<T>(key);
  const migratedOk = JSON.stringify(migratedValue) === JSON.stringify(legacyValue);

  if (migratedOk) {
    localStorage.removeItem(key);
  }
};
