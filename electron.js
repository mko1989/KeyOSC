const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const StateManager = require('./lib/state-manager');
const OSCServer = require('./lib/osc-server');
const KeynoteController = require('./lib/keynote');
const FileManager = require('./lib/file-manager');
const Store = require('electron-store');

// Initialize config storage
const store = new Store();

// Default config
const defaultConfig = {
  oscLocalPort: 8111,
  oscCompanionPort: 8222,
  oscCompanionIp: '127.0.0.1',
  presentationsPath: '',
  pollingInterval: 300
};

// Get or set default config
let config = store.get('config') || defaultConfig;

let mainWindow;
let stateManager;
let keynoteController;
let fileManager;
let oscServer;

// Log storage
let logEntries = [];

function addLog(message) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, message };
  logEntries.push(logEntry);
  if (logEntries.length > 100) {
    logEntries.shift(); // Keep only 100 most recent logs
  }
  return logEntry;
}

// Log interceptor
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args) => {
  const message = args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : arg)).join(' ');
  addLog(message);
  originalConsoleLog.apply(console, args);
};

console.error = (...args) => {
  const message = args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : arg)).join(' ');
  addLog(`ERROR: ${message}`);
  originalConsoleError.apply(console, args);
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('index.html');
  
  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function initializeModules() {
  stateManager = new StateManager();
  keynoteController = new KeynoteController(stateManager);
  fileManager = new FileManager(config.presentationsPath);
  oscServer = new OSCServer(config, stateManager, keynoteController, fileManager);
  
  // Start OSC server
  oscServer.start();
  
  // Initial status check
  keynoteController.checkStatus();
}

app.whenReady().then(() => {
  createWindow();
  initializeModules();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Cleanup
  if (oscServer) {
    oscServer.stop();
  }
});

// IPC handlers
ipcMain.handle('get-config', () => {
  return config;
});

ipcMain.handle('save-config', (event, newConfig) => {
  config = { ...config, ...newConfig };
  store.set('config', config);
  
  // Update modules with new config
  if (fileManager) {
    fileManager.setPath(config.presentationsPath);
  }
  
  if (oscServer) {
    oscServer.updateConfig(config);
  }
  
  return config;
});

ipcMain.handle('get-presentations', () => {
  return fileManager ? fileManager.getFiles() : [];
});

ipcMain.handle('select-presentations-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    const folderPath = result.filePaths[0];
    config.presentationsPath = folderPath;
    store.set('config', config);
    
    if (fileManager) {
      fileManager.setPath(folderPath);
    }
    
    return folderPath;
  }
  
  return null;
});

ipcMain.handle('get-state', () => {
  return stateManager ? stateManager.getState() : {};
});

// Add missing handlers
ipcMain.handle('get-logs', () => {
  return logEntries;
});

ipcMain.handle('get-status', () => {
  if (!keynoteController) return { running: false };
  
  return {
    running: true,
    state: stateManager ? stateManager.getState() : {},
    oscServer: oscServer ? { running: oscServer.isRunning() } : { running: false }
  };
});

ipcMain.on('keynote-action', (event, action, payload) => {
  if (!keynoteController) return;
  
  try {
    switch (action) {
      case 'start':
        keynoteController.openPresentation(payload); // Changed from startPresentation
        break;
      case 'next':
        keynoteController.next(); // Changed from nextSlide
        break;
      case 'previous':
        keynoteController.previous(); // Changed from previousSlide
        break;
      case 'exit':
        keynoteController.closePresentation(); // Changed from exitPresentation
        break;
      default:
        console.log('Unknown keynote action:', action);
    }
  } catch (error) {
    console.error('Error executing keynote action:', error);
  }
});