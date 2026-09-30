const DB_NAME = 'dementes-db';
const DB_VERSION = 1;
const STORE_NAME = 'periods';

const openDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getIdbValue = async <T>(key: string): Promise<T | null> => {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(key);

    request.onsuccess = () => resolve((request.result as T) ?? null);
    request.onerror = () => reject(request.error);
  });
};

export const setIdbValue = async <T>(key: string, value: T): Promise<void> => {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const deleteIdbValue = async (key: string): Promise<void> => {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);

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
