const Store = require('electron-store');
const pathModule = require('path');
const Remote = require('@electron/remote');

class Preferences {

  constructor() {
    this._store = new Store();
    this._windowId = Remote.getCurrentWindow().id;
  }

  get ntAddress() {
    return this._store.get(`nt.address[${this._windowId}]`) ?? 'localhost';
  }

  set ntAddress(address) {
    return this._store.set(`nt.address[${this._windowId}]`, address);
  }

  get ntPort() {
    return this._store.get(`nt.port[${this._windowId}]`);
  }

  set ntPort(port) {
    return this._store.set(`nt.port[${this._windowId}]`, port);
  }

  get lastOpenedDashboard() {
    return this._store.get(`lastOpenedDashboard[${this._windowId}]`);
  }

  set lastOpenedDashboard(path) {
    if (typeof path === 'undefined') {
      this._store.delete(`lastOpenedDashboard[${this._windowId}]`);
    } else {
      this._store.set(`lastOpenedDashboard[${this._windowId}]`, path);
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
    this._store.onDidChange(`nt.port[${this._windowId}]`, callback);
    this._store.onDidChange(`nt.address[${this._windowId}]`, callback);
  }

  onLastOpenedDashboardChange(callback) {
    this._store.onDidChange(`lastOpenedDashboard[${this._windowId}]`, callback);
  }

  onPluginsChange(callback) {
    this._store.onDidChange('plugins', callback);
  }
}

exports.preferences = new Preferences();
