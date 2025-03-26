class StateManager {
  constructor() {
    this.state = {
      document: null,
      currentSlide: 0,
      totalSlides: 0,
      playing: false,
      polling: false
    };
    
    this.listeners = [];
    this.pollingInterval = null;
  }
  
  updateState(newState) {
    const prevState = {...this.state};
    this.state = {...this.state, ...newState};
    
    // Check if we need to start/stop polling
    if (this.state.playing !== prevState.playing) {
      if (this.state.playing) {
        this.startPolling();
      } else {
        this.stopPolling();
      }
    }
    
    // Notify listeners
    this.notifyListeners();
    
    return this.state;
  }
  
  getState() {
    return {...this.state};
  }
  
  onStateChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }
  
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.getState());
      } catch (error) {
        console.error('Error in state change listener:', error);
      }
    });
  }
  
  startPolling(interval = 300, keynoteController) {
    if (this.pollingInterval) {
      this.stopPolling();
    }
    
    this.state.polling = true;
    this.pollingInterval = setInterval(() => {
      if (keynoteController) {
        keynoteController.checkStatus();
      }
    }, interval);
  }
  
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.state.polling = false;
  }
}

module.exports = StateManager;