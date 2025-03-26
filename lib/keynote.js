const { exec } = require('child_process');

class KeynoteController {
  constructor(stateManager) {
    this.stateManager = stateManager;
  }

  // Core AppleScript execution with improved error handling
  runAppleScript(script) {
    return new Promise((resolve, reject) => {
      const escapedScript = script.replace(/'/g, "'\\''");
      exec(`osascript -e '${escapedScript}'`, (error, stdout, stderr) => {
        if (error) {
          console.error('AppleScript Error:', error);
          reject(error);
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }

  runJXA(script) {
    return new Promise((resolve, reject) => {
      const escapedScript = script.replace(/'/g, "'\\''");
      exec(`osascript -l JavaScript -e '${escapedScript}'`, (error, stdout) => {
        if (error) {
          console.error('JXA Error:', error);
          reject(error);
        } else {
          try {
            resolve(JSON.parse(stdout.trim()));
          } catch (e) {
            resolve(stdout.trim());
          }
        }
      });
    });
  }

  // Simplified status checking without builds or video info
  async checkStatus() {
    try {
      // First check if document exists and get basic properties in one call
      const basicStatus = await this.runAppleScript(`
        tell application "System Events"
          set isRunning to (exists process "Keynote")
          if not isRunning then
            return "no keynote"
          end if
        end tell
        
        tell application "Keynote"
          if not (exists front document) then
            return "no document"
          end if
          
          set docName to name of front document
          set slideCount to count of slides of front document
          set isPlaying to playing
          
          -- Safe way to get current slide with error handling
          try
            if isPlaying then
              set currentSlide to slide number of current slide of front document
            else
              -- When not in presentation mode, try to get selected slide
              try
                set currentSlide to slide number of first slide of selection of front document
              on error
                set currentSlide to 1
              end try
            end if
          on error
            set currentSlide to 1
          end try
          
          return docName & "|" & currentSlide & "|" & slideCount & "|" & isPlaying
        end tell
      `);

      if (basicStatus === "no keynote") {
        const emptyState = {
          document: null,
          currentSlide: 0,
          totalSlides: 0,
          playing: false,
          error: "Keynote not running"
        };
        this.stateManager.updateState(emptyState);
        return emptyState;
      }

      if (basicStatus === "no document") {
        const emptyState = {
          document: null,
          currentSlide: 0,
          totalSlides: 0,
          playing: false,
          error: "No document open"
        };
        this.stateManager.updateState(emptyState);
        return emptyState;
      }

      // Parse basic information
      let [docName, currentSlide, totalSlides, isPlaying] = basicStatus.split('|');
      
      // Build simplified status object
      const state = {
        document: docName,
        currentSlide: parseInt(currentSlide, 10),
        totalSlides: parseInt(totalSlides, 10),
        playing: isPlaying === "true"
      };
      
      this.stateManager.updateState(state);
      return state;
    } catch (error) {
      console.error('Error checking Keynote status:', error);
      const errorState = { 
        error: error.message, 
        playing: false,
        document: this.stateManager.getState().document,
        currentSlide: this.stateManager.getState().currentSlide,
        totalSlides: this.stateManager.getState().totalSlides
      };
      this.stateManager.updateState(errorState);
      return errorState;
    }
  }

  // Keynote control methods
  async start() {
    await this.runAppleScript('tell application "Keynote" to start slideshow');
    return this.checkStatus();
  }
  
  async startFromBeginning() {
    try {
      await this.runAppleScript(`
        tell application "Keynote"
          activate
          if front document exists then
            start slideshow
            delay 0.5
            show slide 1 of front document
          end if
        end tell
      `);
      return this.checkStatus();
    } catch (error) {
      console.error('Error starting from beginning:', error);
      return this.checkStatus();
    }
  }
  
  async stop() {
    await this.runAppleScript('tell application "Keynote" to stop slideshow');
    return this.checkStatus();
  }
  


async next() {
  try {
    // First check if Keynote is running and a presentation is open
    const state = await this.checkStatus();
    if (!state.playing) {
      console.log('Cannot navigate: no presentation is playing');
      return false;
    }
    
    await this.runAppleScript('tell application "Keynote" to show next');
    await this.checkStatus(); // Update state after navigation
    return true;
  } catch (error) {
    console.error('AppleScript Error:', error);
    return false;
  }
}

async previous() {
  try {
    // First check if Keynote is running and a presentation is open
    const state = await this.checkStatus();
    if (!state.playing) {
      console.log('Cannot navigate: no presentation is playing');
      return false;
    }
    
    await this.runAppleScript('tell application "Keynote" to show previous');
    await this.checkStatus(); // Update state after navigation
    return true;
  } catch (error) {
    console.error('AppleScript Error:', error);
    return false;
  }
}
  
  async goToSlide(slideNumber) {
    await this.runAppleScript(`
      tell application "Keynote" 
        if front document exists then
          show slide ${slideNumber} of front document
        end if
      end tell
    `);
    return this.checkStatus();
  }

  async openPresentation(filePath) {
    await this.runAppleScript(`
      tell application "Keynote"
        activate
        open POSIX file "${filePath}"
      end tell
    `);
    return this.checkStatus();
  }
  
  async closePresentation() {
    await this.runAppleScript(`
      tell application "Keynote"
        if front document exists then
          close front document saving no
        end if
      end tell
    `);
    return this.checkStatus();
  }
}

module.exports = KeynoteController;