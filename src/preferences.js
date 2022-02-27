const Store = require('electron-store');
const pathModule = require('path');

const store = new Store();

class Preferences {

  constructor() {
    const Remote = require('@electron/remote');
    this._windowId = Remote.getCurrentWindow().id;
    console.log('windowId:', this._windowId);
  }

  get ntAddress() {
    return store.get(`nt.address[${this._windowId}]`) ?? 'localhost';
  }

  set ntAddress(address) {
    return store.set(`nt.address[${this._windowId}]`, address);
  }

  get ntPort() {
    return store.get(`nt.port[${this._windowId}]`);
  }

  set ntPort(port) {
    return store.set(`nt.port[${this._windowId}]`, port);
  }

  get lastOpenedDashboard() {
    return store.get(`lastOpenedDashboard[${this._windowId}]`);
  }

  set lastOpenedDashboard(path) {
    if (typeof path === 'undefined') {
      store.delete(`lastOpenedDashboard[${this._windowId}]`);
    } else {
      store.set(`lastOpenedDashboard[${this._windowId}]`, path);
    }
  }

  get plugins() {
    return store.get('plugins') ?? [];
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
    store.set('plugins', plugins);
  }

  removePlugin(path) {
    const plugins = this.plugins.filter(plugin => plugin.path !== path);
    store.set('plugins', plugins);
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
    store.set('plugins', plugins);
  }

  onNtChange(callback) {
    store.onDidChange(`nt.port[${this._windowId}]`, callback);
    store.onDidChange(`nt.address[${this._windowId}]`, callback);
  }

  onLastOpenedDashboardChange(callback) {
    store.onDidChange(`lastOpenedDashboard[${this._windowId}]`, callback);
  }

  onPluginsChange(callback) {
    store.onDidChange('plugins', callback);
  }
}

exports.preferences = new Preferences();