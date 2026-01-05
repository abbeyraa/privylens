/**
 * Settings storage utilities using localStorage
 */

const SETTINGS_STORAGE_KEY = "otomate_settings";

const DEFAULT_SETTINGS = {
  autoSave: true,
  darkMode: false,
  language: "id",
};

/**
 * Get settings from localStorage
 */
export function getSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Failed to load settings:", error);
  }
  return DEFAULT_SETTINGS;
}

/**
 * Save settings to localStorage
 */
export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error("Failed to save settings:", error);
    return false;
  }
}

/**
 * Get specific setting value
 */
export function getSetting(key) {
  const settings = getSettings();
  return settings[key] !== undefined ? settings[key] : DEFAULT_SETTINGS[key];
}

