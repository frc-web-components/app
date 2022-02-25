const { NetworkTables } = require('./networktables.js');
const { SourceProvider } = require('@webbitjs/store');
const { preferences } = require('../preferences.js');

class NetworkTablesProvider extends SourceProvider {

  constructor() {
    super();
    NetworkTables.connect(preferences.ntAddress);
    NetworkTables.addGlobalListener((key, value) => {
      this.updateSource(key, value);
    }, true);

    preferences.onNtChange(() => {
      NetworkTables.connect(preferences.ntAddress)
    });
  }

  userUpdate(key, value) {
    NetworkTables.setValue(key, value);
  }
}

exports.NetworkTablesProvider = NetworkTablesProvider;
