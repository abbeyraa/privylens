// Preload script untuk Electron
// File ini berjalan di context terisolasi sebelum halaman dimuat
// Bisa digunakan untuk expose API yang aman ke renderer process

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods yang memungkinkan renderer process
// menggunakan API Electron dengan aman
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
  
  // Template storage API
  templateStorage: {
    // Read templates from file
    read: () => ipcRenderer.invoke('template-storage:read'),
    
    // Write templates to file
    write: (templates) => ipcRenderer.invoke('template-storage:write', templates),
    
    // Migrate from localStorage
    migrate: (localStorageData) => ipcRenderer.invoke('template-storage:migrate', localStorageData),
    
    // Get storage info
    getInfo: () => ipcRenderer.invoke('template-storage:info'),
  },
});

