const Store = require('electron-store');

class Preferences {

  constructor() {
    this._store = new Store();
  }

  get ntAddress() {
    return this._store.get('nt.address');
  }

  set ntAddress(address) {
    return this._store.set('nt.address', address);
  }

  get ntPort() {
    return this._store.get('nt.port');
  }

  set ntPort(port) {
    return this._store.set('nt.port', port);
  }

  get lastOpenedDashboard() {
    return this._store.get('lastOpenedDashboard');
  }

  set lastOpenedDashboard(path) {
    if (typeof path === 'undefined') {
      this._store.delete('lastOpenedDashboard');
    } else {
      this._store.set('lastOpenedDashboard', path);
    }
  }

  onNtChange(callback) {
    this._store.onDidChange('nt.port', callback);
    this._store.onDidChange('nt.address', callback);
  }

  onLastOpenedDashboardChange(callback) {
    this._store.onDidChange('lastOpenedDashboard', callback);
  }
}

exports.preferences = new Preferences();
