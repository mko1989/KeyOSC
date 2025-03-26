const osc = require('node-osc');

class OscServer {
  constructor(config, stateManager, keynoteController, fileManager) {
    this.config = config;
    this.stateManager = stateManager;
    this.keynote = keynoteController;
    this.fileManager = fileManager;
    
    // Set up OSC client to send messages to Companion
    this.client = new osc.Client(
      config.oscCompanionIp, 
      config.oscCompanionPort
    );
    
    // Subscribe to state changes
    this.stateManager.onStateChange((newState) => {
      this.sendStateToCompanion(newState);
    });
  }
  
  start() {
    // Create OSC server to receive messages from Companion
    this.server = new osc.Server(this.config.oscLocalPort, '0.0.0.0');
    console.log(`OSC server listening on port ${this.config.oscLocalPort}`);
    
    // Handle incoming OSC messages
    this.server.on('message', this.handleOscMessage.bind(this));
  }
  
  // Add stop method to properly clean up resources
  stop() {
    console.log('Stopping OSC server...');
    if (this.server) {
      this.server.close();
      this.server = null;
      console.log('OSC server stopped');
    }
    
    if (this.client) {
      this.client.close();
      this.client = null;
      console.log('OSC client closed');
    }
  }
  
  // Add method to update config (for when user changes settings)
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Restart client with new config if it's already running
    if (this.client) {
      this.client.close();
      this.client = new osc.Client(
        this.config.oscCompanionIp, 
        this.config.oscCompanionPort
      );
    }
    
    // Restart server with new port if it's already running
    if (this.server) {
      this.stop();
      this.start();
    }
    
    console.log('OSC config updated:', this.config);
  }
  
  async handleOscMessage(msg) {
    console.log('Received OSC message:', msg);
    
    const address = msg[0];
    const args = msg.slice(1);
    
    // Parse command and arguments
    try {
        switch(address) {
            case '/keyosc/start':  // Changed from /keynote/start
              await this.keynote.start();
              break;
              
            case '/keyosc/start-from-beginning':  // Changed from /keynote/start-from-beginning
              await this.keynote.startFromBeginning();
              break;
              
            case '/keyosc/stop':  // Changed from /keynote/stop
              await this.keynote.stop();
              break;
              
            case '/keyosc/next':  // Changed from /keynote/next
              await this.keynote.next();
              break;
              
            case '/keyosc/previous':  // Changed from /keynote/previous
              await this.keynote.previous();
              break;
              
            case '/keyosc/goto':  // Changed from /keynote/goto
              if (args.length > 0) {
                const slideNumber = parseInt(args[0]);
                if (!isNaN(slideNumber)) {
                  await this.keynote.goToSlide(slideNumber);
                }
              }
              break;
              
            case '/keyosc/open':  // Changed from /keynote/open
              if (args.length > 0) {
                await this.keynote.openPresentation(args[0]);
              }
              break;
              
            case '/keyosc/open-base64':  // Changed from /keynote/open-base64
              if (args.length > 0) {
                try {
                  const decodedPath = Buffer.from(args[0], 'base64').toString('utf8');
                  await this.keynote.openPresentation(decodedPath);
                } catch (error) {
                  console.error('Error decoding base64 path:', error);
                }
              }
              break;
              
            case '/keyosc/close':  // Changed from /keynote/close
              await this.keynote.closePresentation();
              break;
              
            case '/keyosc/list':  // Changed from /keynote/list
              const listPath = args.length > 0 ? args[0] : null;
              const presentations = await this.fileManager.listPresentations(listPath);
              this.sendPresentationList(presentations);
              break;
              
            case '/keyosc/set-path':  // Changed from /keynote/set-path
              if (args.length > 0) {
                this.fileManager.setPresentationsPath(args[0]);
                this.config.presentationsPath = args[0];
              }
              break;
              
            case '/keyosc/status':  // Changed from /keynote/status
              await this.keynote.checkStatus();
              break;
          }
    } catch (error) {
      console.error('Error handling OSC message:', error);
    }
  }
  
  sendStateToCompanion(state) {
    try {
      // Send direct addresses (renamed from oscnote to keyosc)
      this.client.send('/keyosc/keynote_document/value', state.document || 'No document');
      this.client.send('/keyosc/keynote_current_slide/value', state.currentSlide || 0);
      this.client.send('/keyosc/keynote_total_slides/value', state.totalSlides || 0);
      this.client.send('/keyosc/keynote_playing/value', state.playing ? "1" : "0");
      this.client.send('/keyosc/keynote_status/value', JSON.stringify(state));

      // Send individual presentation information
      if (state.presentations) {
        state.presentations.forEach((presentation, index) => {
          this.client.send(`/keyosc/presentation/${index}`, presentation.name);
        });
      }
    } catch (error) {
      console.error('Error sending state to Companion:', error);
    }
  }

  isRunning() {
    return !!this.server;
  }
  
  sendPresentationList(presentations) {
    try {
      this.client.send('/keyosc/presentations', JSON.stringify(presentations));
    } catch (error) {
      console.error('Error sending presentation list:', error);
    }
  }
}

module.exports = OscServer;