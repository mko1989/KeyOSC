const path = require('path');
const fs = require('fs');
const KeynoteController = require('./lib/keynote');
const OscServer = require('./lib/osc-server');
const FileManager = require('./lib/file-manager');
const StateManager = require('./lib/state-manager');

// Load configuration
let config = {
  oscLocalPort: 8111,
  oscCompanionPort: 8222,
  oscCompanionIp: '127.0.0.1',
  presentationsPath: '',
  pollingInterval: 300
};

// Load from config file if exists
try {
  if (fs.existsSync(path.join(__dirname, 'config.json'))) {
    config = {...config, ...JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json')))};
    console.log('Loaded config:', config);
  }
} catch (error) {
  console.error('Error loading config:', error);
}

// Initialize modules
const stateManager = new StateManager();
const keynoteController = new KeynoteController(stateManager);
const fileManager = new FileManager(config.presentationsPath);
const oscServer = new OscServer(config, stateManager, keynoteController, fileManager);

// Save config function
function saveConfig() {
  try {
    fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify(config, null, 2));
    console.log('Saved config:', config);
  } catch (error) {
    console.error('Error saving config:', error);
  }
}

// Start the application
console.log('Starting KeyOSC...');
oscServer.start();

// Initial status check
keynoteController.checkStatus();

// Export for testing or external access
module.exports = {
  config,
  saveConfig,
  stateManager,
  keynoteController,
  oscServer,
  fileManager
};