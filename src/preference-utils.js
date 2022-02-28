const Store = require('electron-store');

const store = new Store();

function setOrDelete(key, value) {
    if (typeof value === 'undefined') {
        store.delete(key);
    } else {
        store.set(key, value);
    }
}

function deleteAllWindowPreferences() {
    store.delete(`nt.address`);
    store.delete(`nt.port`);
    store.delete(`lastOpenedDashboard`);
}

function getPreferencesForWindow(windowId) {
    return {
      ntAddress: store.get(`nt.address.${windowId}`),
      ntPort: store.get(`nt.port.${windowId}`),
      lastOpenedDashboard: store.get(`lastOpenedDashboard.${windowId}`)
    }
  }
  
  function deletePreferencesForWindow(windowId) {
    store.delete(`nt.address.${windowId}`);
    store.delete(`nt.port.${windowId}`);
    store.delete(`lastOpenedDashboard.${windowId}`);
  }
  
  function setPreferencesForWindow(windowId, { ntAddress, ntPort, lastOpenedDashboard }) {
    setOrDelete(`nt.address.${windowId}`, ntAddress);
    setOrDelete(`nt.port.${windowId}`, ntPort);
    setOrDelete(`lastOpenedDashboard.${windowId}`, lastOpenedDashboard);
  }

  function getWindowCountOnLastClose() {
    const value = parseInt(store.get('windowCountOnLastClose'));
    return isNaN(value) ? 0 : Math.min(value, 5);
  }

  function clearWindowCountOnLastClose() {
    store.delete('windowCountOnLastClose');
  }

  function setWindowCountOnLastClose(count) {
    store.set('windowCountOnLastClose', count);
  }
    
  exports.deleteAllWindowPreferences = deleteAllWindowPreferences;
  exports.getPreferencesForWindow = getPreferencesForWindow;
  exports.setPreferencesForWindow = setPreferencesForWindow;
  exports.deletePreferencesForWindow = deletePreferencesForWindow;
  exports.getWindowCountOnLastClose = getWindowCountOnLastClose;
  exports.clearWindowCountOnLastClose = clearWindowCountOnLastClose;
  exports.setWindowCountOnLastClose = setWindowCountOnLastClose;