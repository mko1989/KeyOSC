const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

class FileManager {
  constructor(initialPath = '') {
    this.presentationsPath = initialPath;
  }
  
  // Keep existing method for backward compatibility
  setPresentationsPath(newPath) {
    this.presentationsPath = newPath;
    console.log(`FileManager: Presentations path updated to ${newPath}`);
    return this.listPresentations();
  }
  
  // Add the method expected by electron.js
  setPath(newPath) {
    return this.setPresentationsPath(newPath);
  }
  
  // Add getFiles method that was called in electron.js
  getFiles() {
    // Return empty array immediately if path not set
    if (!this.presentationsPath) return [];
    
    // Return promise that resolves to files or empty array on error
    return this.listPresentations()
      .catch(err => {
        console.error('Error getting files:', err);
        return [];
      });
  }
  
  async listPresentations(customPath = null) {
    const dirPath = customPath || this.presentationsPath;
    
    if (!dirPath) {
      return [];
    }
    
    try {
      const files = await readdir(dirPath);
      const presentations = [];
      
      for (const file of files) {
        if (file.endsWith('.key')) {
          const filePath = path.join(dirPath, file);
          const stats = await stat(filePath);
          
          presentations.push({
            name: file,
            path: filePath,
            size: stats.size,
            modified: stats.mtime
          });
        }
      }
      
      return presentations;
    } catch (error) {
      console.error('Error listing presentations:', error);
      return [];
    }
  }
  
  getFilePath(filename) {
    if (!this.presentationsPath) return null;
    return path.join(this.presentationsPath, filename);
  }
  
  // Add methods for folder selection dialog if needed
  selectPresentationsFolder() {
    // Implement folder selection dialog
    // This would require additional dependencies like `electron` or `node-dialog`
  }
}

module.exports = FileManager;