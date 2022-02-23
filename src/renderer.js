import { renderDashboard } from '../node_modules/@frc-web-components/components/dist/components.es.js';
import NetworkTables from './networktables/networktables.js';
import NetworkTablesProvider  from './networktables/provider.js';
import { openModal } from './modals/modal.js';
import preferences from './preferences.js';
const { ipcRenderer } = require('electron');
const fs = require("fs");
const path = require('path');

window.NT = NetworkTables;

function setDashboardTitle(dashboardName) {
  document.title = `${dashboardName} - FRC Web Components`;
}

function openDashboard(dashboardPath, api) {
  fs.readFile(dashboardPath, (error, buffer) => {
    if (!error) {
      const fileContent = buffer.toString();
      api.setHtml(fileContent);
      preferences.lastOpenedDashboard = dashboardPath;
      setDashboardTitle(path.parse(dashboardPath).name);
      ipcRenderer.invoke('lastOpenedDashboardChange', dashboardPath);
    } else {
      console.error(error);
    }
  });
}

function saveDashboard(dashboardPath, api) {
  const dashboardHtml = api.getHtml();
  fs.writeFile(dashboardPath, dashboardHtml, error => {
    if (error) {
      console.error(error);
    } else {
      preferences.lastOpenedDashboard = dashboardPath;
      setDashboardTitle(path.parse(dashboardPath).name);
      ipcRenderer.invoke('lastOpenedDashboardChange', dashboardPath);
    }
  });
}

function newDashboard(api) {
  api.resetHtml();
  preferences.lastOpenedDashboard = undefined;
  setDashboardTitle('Untitled Dashboard');
  ipcRenderer.invoke('lastOpenedDashboardChange', undefined);
}

NetworkTables.addDeletionListener(key => {
  // console.log('entry deleted:', key);
});

document.addEventListener('DOMContentLoaded', () => {
  setDashboardTitle('Untitled Dashboard')
  const provider = new NetworkTablesProvider();
  const api = renderDashboard(document.querySelector('#dash'), provider, true);
  document.querySelector('#loading')?.remove();
  if (preferences.lastOpenedDashboard) {
    openDashboard(preferences.lastOpenedDashboard, api);
  }

  ipcRenderer.on('ntModalOpen', () => {
    openModal();
  });
  
  ipcRenderer.on('dashboardOpen', (ev, filePaths) => {
    const [dashboardPath] = filePaths;
    openDashboard(dashboardPath, api);
  });

  ipcRenderer.on('dashboardSave', (ev, dashboardPath) => {
    saveDashboard(dashboardPath, api);
  });

  ipcRenderer.on('newDashboard', () => {
    newDashboard(api);
  });
});
