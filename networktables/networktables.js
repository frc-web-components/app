const { NetworkTableInstance, EntryListenerFlags } = require('node-ntcore');

class NetworkTables {

  constructor() {
    this._ntInstance = NetworkTableInstance.getDefault();
    this.connect();
  }

  connect(address = '127.0.0.1', port) {
    this._ntInstance.startClient(address, port);
  }

  getValue(key) {
    const entry = this._ntInstance.getEntry(key);
    if (!entry) {
      return undefined;
    }
    return this._getValueFromEntry(entry.getValue());
  }

  addGlobalListener(listener) {
    this._ntInstance.addEntryListener('', (key, entry, value) => {
      const valueFromEntry = this._getValueFromEntry(value);
      if (typeof valueFromEntry !== 'undefined') {
        listener(key, valueFromEntry);
      }
    }, EntryListenerFlags.UPDATE | EntryListenerFlags.NEW, EntryListenerFlags.IMMEDIATE);
  }

  _getValueFromEntry(value) {
    if (value.isBoolean()) {
      return value.getBoolean();
    }
    if (value.isBooleanArray()) {
      return value.getBooleanArray();
    }
    if (value.isDouble()) {
      return value.getDouble();
    }
    if (value.isDoubleArray()) {
      return value.getDoubleArray();
    }
    if (value.isString()) {
      return value.getString();
    }
    if (value.isStringArray()) {
      return value.getStringArray();
    }
    if (value.isRaw()) {
      return value.getRaw();
    }
    return undefined;
  }

}


export default new NetworkTables();