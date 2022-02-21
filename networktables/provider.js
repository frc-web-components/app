import NetworkTables from './networktables.js';
const { SourceProvider } = require('@webbitjs/store');

export default class NetworkTablesProvider extends SourceProvider {

  constructor() {
    super();
    this.connect('localhost');
    NetworkTables.addGlobalListener((key, value) => {
      this.updateSource(key, value);
    }, true);
  }

  connect(address) {
    if (address) {
      localStorage.networkTablesAddress = address === 'localhost' ? '127.0.0.1' : address;
    }

    if (localStorage.networkTablesAddress) {
      NetworkTables.connect(localStorage.networkTablesAddress);
    }
  }

  userUpdate(key, value) {
    NetworkTables.setValue(key, value);
  }
}
