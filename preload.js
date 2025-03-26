const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('keyOSC', {
  // Config functions
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  
  // Presentation functions
  getPresentations: () => ipcRenderer.invoke('get-presentations'),
  selectPresentationsFolder: () => ipcRenderer.invoke('select-presentations-folder'),
  
  // State functions
  getState: () => ipcRenderer.invoke('get-state'),
  
  // Log functions
  getLogs: () => ipcRenderer.invoke('get-logs'),
  
  // Status function
  getStatus: () => ipcRenderer.invoke('get-status'),
  
  // Keynote control functions
  keynoteAction: (action, payload) => ipcRenderer.send('keynote-action', action, payload)
});