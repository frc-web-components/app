const Store = require('electron-store');

const store = new Store();

function getPreferencesForWindow(windowId) {
    return {
      ntAddress: store.get(`nt.address[${windowId}]`),
      ntPort: store.get(`nt.port[${windowId}]`),
      lastOpenedDashboard: store.get(`lastOpenedDashboard[${windowId}]`)
    }
  }
  
  function deletePreferencesForWindow(windowId) {
    store.delete(`nt.address[${windowId}]`);
    store.delete(`nt.port[${windowId}]`);
    store.delete(`lastOpenedDashboard[${windowId}]`);
  }
  
  
  function setPreferencesForWindow(windowId, { ntAddress, ntPort, lastOpenedDashboard }) {
    store.set(`nt.address[${windowId}]`, ntAddress);
    store.set(`nt.port[${windowId}]`, ntPort);
    store.set(`lastOpenedDashboard[${windowId}]`, lastOpenedDashboard);
  }
  
  console.log('getPreferencesForWindow:', getPreferencesForWindow(1))
  
  exports.getPreferencesForWindow = getPreferencesForWindow;
  exports.setPreferencesForWindow = setPreferencesForWindow;
  exports.deletePreferencesForWindow = deletePreferencesForWindow;