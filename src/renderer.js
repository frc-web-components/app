// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

import { renderDashboard } from '../node_modules/@frc-web-components/components/dist/components.es.js';
import NetworkTables from './networktables/networktables.js';
import NetworkTablesProvider  from './networktables/provider.js';
import { openModal } from './modals/modal.js';
const { ipcRenderer } = require('electron');
const fs = require("fs");

window.NT = NetworkTables;

NetworkTables.addDeletionListener(key => {
  console.log('entry deleted:', key);
});

document.addEventListener('DOMContentLoaded', () => {
  const provider = new NetworkTablesProvider();
  const api = renderDashboard(document.querySelector('#dash'), provider);
  document.querySelector('#loading')?.remove();

  ipcRenderer.on('ntModalOpen', () => {
    openModal();
  });
  
  ipcRenderer.on('dashboardOpen', (ev, filePaths) => {
    const [dashboardPath] = filePaths;
    fs.readFile(dashboardPath, (error, buffer) => {
      if (!error) {
        const fileContent = buffer.toString();
        api.setHtml(fileContent);
      } else {
        console.error(error);
      }
    });
  });
});
