// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

import { renderDashboard } from './node_modules/@frc-web-components/components/dist/components.es.js';
import NetworkTables from './networktables/networktables.js';

NetworkTables.addGlobalListener((key, value) => {
  console.log('entry:', key, value)
});

document.addEventListener('DOMContentLoaded', () => {
  renderDashboard(document.querySelector('#dash'));
});