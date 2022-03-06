const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const Store = require('electron-store');
const Remote = require("@electron/remote/main");
const { getMenu } = require("./getMenu");
const { clearWindowCountOnLastClose, getWindowCountOnLastClose } = require('../preference-utils');
const { windows } = require('./windows');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

const initialize = () => {
  Store.initRenderer();
  Remote.initialize();
  
  const windowCount = Math.max(1, getWindowCountOnLastClose());
  clearWindowCountOnLastClose();

  for(let i = 0; i < windowCount; i++) {
    windows.createWindow(20 * (i + 1), 20 * (i + 1));
  }

  ipcMain.handle('reloadDashboard', (ev, path) => {
    const window = BrowserWindow.fromId(ev.sender.id);
    window.reload();
  });

  ipcMain.handle('loadPluginDialogOpen', (ev, path) => {
    const window = BrowserWindow.fromId(ev.sender.id);
    dialog.showOpenDialog(window, { 
      title: 'Load Plugin',
      filters: [{ name: 'Javascript', extensions: ['js'] }],
      properties: ['openFile'] 
    })
      .then(({ canceled, filePaths }) => {
        if (!canceled) {
          window.webContents.send('pluginLoad', filePaths);
        }
      });
  });

  ipcMain.handle('lastOpenedDashboardChange', (ev, path) => {
    windows.setLastOpenedDashboard(ev.sender.id, path);
  });

  const oldMenu = Menu.getApplicationMenu();
  const menu = getMenu(oldMenu)
  Menu.setApplicationMenu(menu); 
};

app.on('ready', initialize);

app.on('window-all-closed', () => {
  app.quit();
});



