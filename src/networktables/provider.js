import NetworkTables from './networktables.js';
const { SourceProvider } = require('@webbitjs/store');
import preferences from '../preferences.js';

export default class NetworkTablesProvider extends SourceProvider {

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
