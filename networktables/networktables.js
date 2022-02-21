const { NetworkTableInstance, EntryListenerFlags } = require('node-ntcore');
const { NetworkTableType } = require('node-ntcore/dist/networktables/network-table-instance.js');

function isArrayType(type) {
  const arrayTypes = [
    NetworkTableType.BOOLEAN_ARRAY, 
    NetworkTableType.DOUBLE_ARRAY,
    NetworkTableType.STRING_ARRAY
  ];
  return arrayTypes.includes(type);
}

function isEmptyArray(value) {
  return value instanceof Array && value.length === 0;
}

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

  setValue(key, value) {
    const entry = this._ntInstance.getEntry(key);

    const currentType = entry.getType();
    const newValueType = this._getType(value);

    if (currentType === NetworkTableType.UNASSIGNED) {
      this._setEntryFromType(entry, value, newValueType);
    } else {
      const matchesType = (
        (currentType === newValueType) 
        || (isArrayType(currentType) && isEmptyArray(newValueType))
      );
      if (matchesType) {
        this._setEntryFromType(entry, value, currentType);
      }
    }
  }

  addGlobalListener(listener) {
    this._ntInstance.addEntryListener('', (key, entry, value) => {
      const valueFromEntry = this._getValueFromEntry(value);
      if (typeof valueFromEntry !== 'undefined') {
        listener(key, valueFromEntry);
      }
    }, EntryListenerFlags.UPDATE | EntryListenerFlags.NEW, EntryListenerFlags.IMMEDIATE);
  }

  _setEntryFromType(entry, value, type) {
    switch(type) {
      case NetworkTableType.DOUBLE:
        entry.setDouble(value);
        break;
      case NetworkTableType.STRING:
        entry.setString(value);
        break;
      case NetworkTableType.BOOLEAN:
        entry.setBoolean(value);
        break;
      case NetworkTableType.DOUBLE_ARRAY:
        entry.setDoubleArray(value);
        break;
      case NetworkTableType.STRING_ARRAY:
        entry.setStringArray(value);
        break;
      case NetworkTableType.BOOLEAN_ARRAY:
        entry.setBooleanArray(value);
        break;
    }
  }

  _getType(value) {
    if (typeof value === 'number') {
      return NetworkTableType.DOUBLE;
    }
    if (typeof value === 'string') {
      return NetworkTableType.STRING;
    }
    if (typeof value === 'boolean') {
      return NetworkTableType.BOOLEAN;
    }
    if (value instanceof Array) {
      if (value.length === 0 || value.every(element => typeof element === 'number')) {
        return NetworkTableType.DOUBLE_ARRAY;
      }
      if (value.every(element => typeof element === 'string')) {
        return NetworkTableType.STRING_ARRAY;
      }
      if (value.every(element => typeof element === 'boolean')) {
        return NetworkTableType.BOOLEAN_ARRAY;
      }
    }
    return undefined;
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