const Store = require('electron-store');
const pathModule = require('path');

class Preferences {

  constructor() {
    this._store = new Store();
  }

  get ntAddress() {
    return this._store.get('nt.address') ?? 'localhost';
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

  get plugins() {
    return this._store.get('plugins') ?? [];
  }

  hasPlugin(path) {
    return !!this.plugins.find(plugin => plugin.path === path);
  }

  addPlugin(path) {
    if (this.hasPlugin(path)) {
      return;
    }
    const name = pathModule.parse(path).name;
    const plugins = [
      ...this.plugins,
      { name, path, enabled: true }
    ];
    this._store.set('plugins', plugins);
  }

  removePlugin(path) {
    const plugins = this.plugins.filter(plugin => plugin.path !== path);
    this._store.set('plugins', plugins);
  }

  enablePlugin(path, enabled) {
    const pluginIndex = this.plugins.findIndex(plugin => plugin.path === path);
    if (pluginIndex < 0) {
      return;
    }
    const plugins = this.plugins;
    plugins[pluginIndex] = {
      enabled,
      ...this.plugins[pluginIndex],
    }
    this._store.set('plugins', plugins);
  }

  onNtChange(callback) {
    this._store.onDidChange('nt.port', callback);
    this._store.onDidChange('nt.address', callback);
  }

  onLastOpenedDashboardChange(callback) {
    this._store.onDidChange('lastOpenedDashboard', callback);
  }

  onPluginsChange(callback) {
    this._store.onDidChange('plugins', callback);
  }
}

exports.preferences = new Preferences();
