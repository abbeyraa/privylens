/**
 * Template Storage Utility untuk Electron
 * Menyimpan dan membaca template dari file JSON di userData directory
 */

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const TEMPLATES_FILENAME = 'templates.json';
const STORAGE_KEY = 'otomate_templates'; // Untuk backward compatibility dengan localStorage

/**
 * Get storage directory path
 */
function getStoragePath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, TEMPLATES_FILENAME);
}

/**
 * Get templates directory (untuk future use jika perlu folder terpisah)
 */
function getStorageDir() {
  return app.getPath('userData');
}

/**
 * Read templates from file
 */
function readTemplates() {
  try {
    const filePath = getStoragePath();
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return [];
    }

    // Read and parse JSON
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const templates = JSON.parse(fileContent);
    
    // Validate structure
    if (!Array.isArray(templates)) {
      console.warn('Templates file is not an array, returning empty array');
      return [];
    }

    return templates;
  } catch (error) {
    console.error('Error reading templates file:', error);
    // Return empty array on error instead of throwing
    return [];
  }
}

/**
 * Write templates to file
 */
function writeTemplates(templates) {
  try {
    const filePath = getStoragePath();
    const storageDir = getStorageDir();

    // Ensure directory exists
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    // Validate templates is an array
    if (!Array.isArray(templates)) {
      throw new Error('Templates must be an array');
    }

    // Write to file with pretty formatting
    const jsonContent = JSON.stringify(templates, null, 2);
    fs.writeFileSync(filePath, jsonContent, 'utf-8');

    return { success: true };
  } catch (error) {
    console.error('Error writing templates file:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Migrate templates from localStorage (if exists in renderer)
 * This is called from renderer process via IPC
 */
function migrateFromLocalStorage(localStorageData) {
  try {
    const filePath = getStoragePath();
    
    // If file already exists, don't overwrite
    if (fs.existsSync(filePath)) {
      const existing = readTemplates();
      if (existing.length > 0) {
        return { 
          success: false, 
          message: 'Templates file already exists, skipping migration',
          existingCount: existing.length
        };
      }
    }

    // Parse and validate localStorage data
    let templates = [];
    if (typeof localStorageData === 'string') {
      templates = JSON.parse(localStorageData);
    } else if (Array.isArray(localStorageData)) {
      templates = localStorageData;
    }

    if (!Array.isArray(templates)) {
      return { 
        success: false, 
        error: 'Invalid localStorage data format' 
      };
    }

    // Write to file
    const result = writeTemplates(templates);
    
    if (result.success) {
      return { 
        success: true, 
        migratedCount: templates.length 
      };
    }

    return result;
  } catch (error) {
    console.error('Error migrating from localStorage:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Get storage info (path, file size, etc)
 */
function getStorageInfo() {
  try {
    const filePath = getStoragePath();
    const exists = fs.existsSync(filePath);
    
    if (!exists) {
      return {
        exists: false,
        path: filePath,
        size: 0,
        templateCount: 0
      };
    }

    const stats = fs.statSync(filePath);
    const templates = readTemplates();

    return {
      exists: true,
      path: filePath,
      size: stats.size,
      templateCount: templates.length,
      lastModified: stats.mtime.toISOString()
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return {
      exists: false,
      path: getStoragePath(),
      size: 0,
      templateCount: 0,
      error: error.message
    };
  }
}

module.exports = {
  readTemplates,
  writeTemplates,
  migrateFromLocalStorage,
  getStorageInfo,
  getStoragePath,
  getStorageDir
};

