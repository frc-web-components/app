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

  onNtChange(callback) {
    this._store.onDidChange('nt.port', callback);
    this._store.onDidChange('nt.address', callback);
  }
}

export default new Preferences();