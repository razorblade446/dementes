import { DEFAULT_TRM_REFERENCE_DAY } from '../constants/constants.ts';
import { Settings } from '../models/Settings.ts';
import { getIdbValue, SETTINGS_STORE_NAME, setIdbValue } from './indexedDb.ts';

const SETTINGS_KEY = 'app-settings';

export const getSettings = async (): Promise<Settings> => {
  const storedSettings = await getIdbValue<Settings>(SETTINGS_KEY, SETTINGS_STORE_NAME);

  return storedSettings ?? { trmReferenceDay: DEFAULT_TRM_REFERENCE_DAY };
};

export const setSettings = (settings: Settings): Promise<void> => {
  return setIdbValue(SETTINGS_KEY, settings, SETTINGS_STORE_NAME);
};
