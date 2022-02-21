// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

const { NetworkTableInstance, EntryListenerFlags } = require('node-ntcore');
import { renderDashboard } from './node_modules/@frc-web-components/components/dist/components.es.js';

const nt = NetworkTableInstance.getDefault();
nt.startClient('127.0.0.1');
nt.addEntryListener('', (key, entry, value) => {
  console.log('raw value:', value.isBoolean())
  console.log('listener:', key, entry, value);
  if (key === '/SmartDashboard/Field/traj') {
    console.log('raw:', value.getRaw() instanceof Uint8Array)
  }
}, EntryListenerFlags.UPDATE | EntryListenerFlags.NEW, EntryListenerFlags.IMMEDIATE);


document.addEventListener('DOMContentLoaded', () => {
  renderDashboard(document.querySelector('#dash'));
  window.ntTables = nt;
});