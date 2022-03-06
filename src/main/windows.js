const { 
  deleteAllWindowPreferences, 
  getPreferencesForWindow, 
  setPreferencesForWindow,
  setWindowCountOnLastClose,
} = require('../preference-utils');
const path = require('path');
const { BrowserWindow } = require('electron');
const Remote = require("@electron/remote/main");

class Windows {

  constructor() {
    this._windows = new Set();
    this._lastOpenedDashboard = new Map();
    this._hasUpdateWindowPreferencesBeenCalled = false;
  }

  updateWindowPreferences(ids) {
    // Should only be called once
    if (this._hasUpdateWindowPreferencesBeenCalled) {
      return;
    }
    const windowIds = ids ?? [...this._windows.values()].map(window => window.id);
    const preferencesForWindows = windowIds.map(id => getPreferencesForWindow(id));
    deleteAllWindowPreferences();
    preferencesForWindows.forEach((preferences, index) => {
      const id = (index + 1).toString();
      setPreferencesForWindow(id, preferences);
    });
    setWindowCountOnLastClose(windowIds.length);
    
    this._hasUpdateWindowPreferencesBeenCalled = true;
  }

  getLastOpenedDashboard(windowId) {
    return this._lastOpenedDashboard.get(windowId);
  }

  setLastOpenedDashboard(windowId, path) {
    this._lastOpenedDashboard.set(windowId, path);
  }

  createWindow(x, y) {
    // Create the browser window.
    let window = new BrowserWindow({
      width: 800,
      height: 600,
      x,
      y,
      title: "FRC Web Components",
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
        contextIsolation: false,
      },
    });
  
    Remote.enable(window.webContents);
  
    const windowId = window.id;
  
    window.on("closed", () => {
      if (this._windows.size === 1) {
        this.updateWindowPreferences([windowId]);
      } else {
        this._windows.delete(window);
        window = null;
      }
    });
  
    // and load the index.html of the app.
    window.loadFile(path.join(__dirname, '../index.html'));
    this._windows.add(window);
  }
}

exports.windows = new Windows();