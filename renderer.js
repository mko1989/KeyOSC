// Load configuration on startup
window.addEventListener('DOMContentLoaded', async () => {
  loadConfig();
  refreshStatus();
  updateLogs();
  
  // Set up event listeners
  document.getElementById('config-form').addEventListener('submit', saveConfig);
  document.getElementById('refresh-status').addEventListener('click', refreshStatus);
  
  // Add folder selection handling
  document.getElementById('select-folder-btn').addEventListener('click', selectPresentationsFolder);
  
  // Update logs every 2 seconds
  setInterval(updateLogs, 2000);
  // Update status every 5 seconds
  setInterval(refreshStatus, 5000);
});

async function loadConfig() {
  const config = await window.keyOSC.getConfig();
  document.getElementById('oscLocalPort').value = config.oscLocalPort;
  document.getElementById('oscCompanionPort').value = config.oscCompanionPort;
  document.getElementById('oscCompanionIp').value = config.oscCompanionIp;
  document.getElementById('pollingInterval').value = config.pollingInterval;
  
  // Show current presentations path if any
  if (config.presentationsPath) {
    document.getElementById('presentations-path').textContent = config.presentationsPath;
  }
}

async function saveConfig(e) {
  e.preventDefault();
  
  const config = {
    oscLocalPort: parseInt(document.getElementById('oscLocalPort').value, 10),
    oscCompanionPort: parseInt(document.getElementById('oscCompanionPort').value, 10),
    oscCompanionIp: document.getElementById('oscCompanionIp').value,
    pollingInterval: parseInt(document.getElementById('pollingInterval').value, 10),
    // Keep the existing presentations path
    presentationsPath: (await window.keyOSC.getConfig()).presentationsPath || ''
  };
  
  await window.keyOSC.saveConfig(config);
  alert('Configuration saved!');
}

async function selectPresentationsFolder() {
  const folderPath = await window.keyOSC.selectPresentationsFolder();
  if (folderPath) {
    document.getElementById('presentations-path').textContent = folderPath;
    // Refresh presentations list
    await listPresentations();
  }
}

async function listPresentations() {
  const presentations = await window.keyOSC.getPresentations();
  const container = document.getElementById('presentations-list');
  
  container.innerHTML = '';
  for (const presentation of presentations) {
    const item = document.createElement('div');
    item.className = 'presentation-item';
    item.textContent = presentation.name;
    item.addEventListener('click', () => openPresentation(presentation.path));
    container.appendChild(item);
  }
}

function openPresentation(path) {
  window.keyOSC.keynoteAction('start', path);
}

async function updateLogs() {
  const logs = await window.keyOSC.getLogs();
  const container = document.getElementById('log-container');
  
  container.innerHTML = '';
  for (const log of logs) {
    const line = document.createElement('div');
    line.className = log.message.startsWith('ERROR:') ? 'log-error' : 'log-info';
    
    // Format timestamp
    const timestamp = new Date(log.timestamp).toTimeString().split(' ')[0];
    line.textContent = `[${timestamp}] ${log.message}`;
    
    container.appendChild(line);
  }
  
  // Auto scroll to bottom
  container.scrollTop = container.scrollHeight;
}

async function refreshStatus() {
  const status = await window.keyOSC.getStatus();
  
  if (!status.running) {
    document.getElementById('status-container').classList.add('not-running');
    return;
  }
  
  document.getElementById('status-container').classList.remove('not-running');
  
  // Get state from the nested structure
  const state = status.state || {};
  
  document.getElementById('status-document').textContent = state.document || 'None';
  document.getElementById('status-slide').textContent = state.currentSlide || 0;
  document.getElementById('status-total').textContent = state.totalSlides || 0;
  document.getElementById('status-playing').textContent = state.playing ? 'Yes' : 'No';
  
  // Update OSC status
  document.getElementById('osc-status').textContent = 
    status.oscServer && status.oscServer.running ? 'Connected' : 'Disconnected';
}

// Basic Keynote controls
document.getElementById('next-slide-btn').addEventListener('click', () => {
  window.keyOSC.keynoteAction('next');
});

document.getElementById('prev-slide-btn').addEventListener('click', () => {
  window.keyOSC.keynoteAction('previous');
});

document.getElementById('exit-btn').addEventListener('click', () => {
  window.keyOSC.keynoteAction('exit');
});