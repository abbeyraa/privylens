/**
 * Template Storage Service
 * Handles template storage dengan fallback:
 * - Electron: File system (JSON file)
 * - Web: localStorage
 */

const TEMPLATES_STORAGE_KEY = "otomate_templates";
const MIGRATION_FLAG_KEY = "otomate_migrated_to_file";

/**
 * Check if running in Electron
 */
function isElectron() {
  return typeof window !== 'undefined' && 
         window.electronAPI && 
         window.electronAPI.templateStorage;
}

/**
 * Read templates from storage
 */
export async function getTemplates() {
  try {
    // Try Electron file storage first
    if (isElectron()) {
      const result = await window.electronAPI.templateStorage.read();
      if (result.success) {
        return result.data || [];
      }
      console.warn('Failed to read from file storage, falling back to localStorage');
    }

    // Fallback to localStorage
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error("Failed to load templates:", error);
    return [];
  }
}

/**
 * Save templates to storage
 */
export async function saveTemplates(templates) {
  try {
    // Try Electron file storage first
    if (isElectron()) {
      const result = await window.electronAPI.templateStorage.write(templates);
      if (result.success) {
        // Also save to localStorage as backup
        try {
          localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
        } catch (e) {
          console.warn('Failed to backup to localStorage:', e);
        }
        return true;
      }
      console.warn('Failed to write to file storage, falling back to localStorage');
    }

    // Fallback to localStorage
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    return true;
  } catch (error) {
    console.error("Failed to save templates:", error);
    return false;
  }
}

/**
 * Migrate templates from localStorage to file storage
 * This is called once on app startup if migration hasn't been done
 */
export async function migrateToFileStorage() {
  // Only migrate if in Electron and migration hasn't been done
  if (!isElectron()) {
    return { success: false, message: 'Not running in Electron' };
  }

  // Check if already migrated
  const migrated = localStorage.getItem(MIGRATION_FLAG_KEY);
  if (migrated === 'true') {
    return { success: true, message: 'Already migrated', skipped: true };
  }

  try {
    // Get templates from localStorage
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (!stored) {
      // No data to migrate
      localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
      return { success: true, message: 'No data to migrate', migratedCount: 0 };
    }

    const templates = JSON.parse(stored);
    if (!Array.isArray(templates) || templates.length === 0) {
      // No valid data to migrate
      localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
      return { success: true, message: 'No templates to migrate', migratedCount: 0 };
    }

    // Migrate to file storage
    const result = await window.electronAPI.templateStorage.migrate(templates);
    
    if (result.success) {
      // Mark as migrated
      localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
      console.log(`Migrated ${result.migratedCount || templates.length} templates to file storage`);
      return {
        success: true,
        message: 'Migration successful',
        migratedCount: result.migratedCount || templates.length
      };
    } else {
      // Migration failed, but don't block app
      console.warn('Migration failed:', result.error || result.message);
      return {
        success: false,
        message: result.error || result.message || 'Migration failed',
        migratedCount: 0
      };
    }
  } catch (error) {
    console.error('Error during migration:', error);
    return {
      success: false,
      error: error.message,
      migratedCount: 0
    };
  }
}

/**
 * Get storage info (for debugging/settings)
 */
export async function getStorageInfo() {
  try {
    if (isElectron()) {
      const result = await window.electronAPI.templateStorage.getInfo();
      if (result.success) {
        return {
          type: 'file',
          ...result.data
        };
      }
    }

    // Fallback info for localStorage
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    const templates = stored ? JSON.parse(stored) : [];
    return {
      type: 'localStorage',
      templateCount: templates.length,
      size: stored ? stored.length : 0
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return {
      type: 'unknown',
      error: error.message
    };
  }
}

/**
 * Check if file storage is available
 */
export function isFileStorageAvailable() {
  return isElectron();
}

