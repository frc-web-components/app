import { renderDashboard } from '../node_modules/@frc-web-components/components/dist/components.es.js';
const { NetworkTables } = require('./networktables/networktables.js');
const { NetworkTablesProvider } =  require('./networktables/provider.js');
import { openNtDialog, openPluginsDialog } from './modals/index.js';
const { preferences } = require('./preferences.js');
const { ipcRenderer } = require('electron');
const fs = require("fs");
const path = require('path');
import { loadPlugins } from './plugins.js';


function includeDialogs() {
  require('./modals/networktables-dialog-element');
  require('./modals/plugins-dialog-element');
} 

function setDashboardTitle(dashboardName) {
  document.title = `${dashboardName} - FRC Web Components`;
}

function openDashboard(dashboardPath, api) {
  return new Promise(resolve => {
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
      resolve();
    });
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

function addMainListeners(api) {
  ipcRenderer.on('ntModalOpen', () => {
    openNtDialog();
  });

  ipcRenderer.on('pluginsModalOpen', () => {
    openPluginsDialog();
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

  ipcRenderer.on('requestDashboardHtml', () => {
    ipcRenderer.invoke('sendDashboardHtml', api.getHtml());
  });

  ipcRenderer.on('setDashboardHtml', (ev, html) => {
    api.setHtml(html);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  setDashboardTitle('Untitled Dashboard')
  const provider = new NetworkTablesProvider();
  const api = renderDashboard(document.querySelector('#dash'), null /* provider */, true);
  window.FwcDashboard = {
    addElements: api.addElements,
    lit: api.lit,
    NetworkTables,
  };
  document.querySelector('#loading')?.remove();
  includeDialogs();
  loadPlugins(preferences.plugins);
  if (preferences.lastOpenedDashboard) {
    await openDashboard(preferences.lastOpenedDashboard, api);
  }
  addMainListeners(api);
  ipcRenderer.invoke('dashboardReady');
});
