const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
const Remote = require("@electron/remote/main");
const { 
  deleteAllWindowPreferences, 
  getPreferencesForWindow, 
  setPreferencesForWindow,
  clearWindowCountOnLastClose,
  getWindowCountOnLastClose,
  setWindowCountOnLastClose,
} = require('./preference-utils');

const windows = new Set();
const lastOpenedDashboard = new Map();


let hasUpdateWindowPreferencesBeenCalled = false;

function updateWindowPreferences(ids) {
  // Should only be called once
  if (hasUpdateWindowPreferencesBeenCalled) {
    return;
  }
  const windowIds = ids ?? [...windows.values()].map(window => window.id);
  const preferencesForWindows = windowIds.map(id => getPreferencesForWindow(id));
  deleteAllWindowPreferences();
  preferencesForWindows.forEach((preferences, index) => {
    const id = (index + 1).toString();
    setPreferencesForWindow(id, preferences);
  });
  setWindowCountOnLastClose(windowIds.length);
  
  hasUpdateWindowPreferencesBeenCalled = true;
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

function createWindow(x, y) {
  // Create the browser window.
  let window = new BrowserWindow({
    width: 800,
    height: 600,
    x,
    y,
    title: "FRC Web Components",
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  Remote.enable(window.webContents);

  const windowId = window.id;

  window.on("closed", () => {
    if (windows.size === 1) {
      updateWindowPreferences([windowId]);
    } else {
      windows.delete(window);
      window = null;
    }
  });

  // and load the index.html of the app.
  window.loadFile(path.join(__dirname, 'index.html'));
  windows.add(window);
}

const initialize = () => {
  Store.initRenderer();
  Remote.initialize();
  
  const windowCount = Math.max(1, getWindowCountOnLastClose());
  clearWindowCountOnLastClose();

  for(let i = 0; i < windowCount; i++) {
    createWindow(20 * (i + 1), 20 * (i + 1));
  }

  ipcMain.handle('lastOpenedDashboardChange', (ev, path) => {
    lastOpenedDashboard.set(ev.sender.id, path);
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

  const oldMenu = Menu.getApplicationMenu();
  const menu = Menu.buildFromTemplate([
    {
        label: 'File',
        submenu: [
            {
              label: 'New Dashboard',
              click(_, window) {
                window.webContents.send('newDashboard');
              }
            },
            {
              label: 'New Window',
              click(_, window) {
                createWindow();
              }
            },
            { type: 'separator' },
            {
              label: 'Open Dashboard...',
              click(_, window) {
                dialog.showOpenDialog(window, { 
                  title: 'Open Dashboard',
                  filters: [{ name: 'HTML', extensions: ['html', 'htm'] }],
                  properties: ['openFile'] 
                })
                  .then(({ canceled, filePaths }) => {
                    if (!canceled) {
                      window.webContents.send('dashboardOpen', filePaths);
                    }
                  });
              }
            },
            {
              label: 'Save Dashboard',
              click(_, window) {
                if (lastOpenedDashboard.get(window.id)) {
                  window.webContents.send('dashboardSave', lastOpenedDashboard.get(window.id));
                } else {
                  dialog.showSaveDialog(window, { 
                    title: 'Save Dashboard',
                    filters: [{ name: 'HTML', extensions: ['html', 'htm'] }],
                  })
                    .then(({ canceled, filePath }) => {
                      if (!canceled) {
                        window.webContents.send('dashboardSave', filePath);
                      }
                    });
                }
              }
            },
            {
              label: 'Save Dashboard As...',
              click(_, window) {
                dialog.showSaveDialog(window, { 
                  title: 'Save Dashboard',
                  filters: [{ name: 'HTML', extensions: ['html', 'htm'] }],
                  defaultPath: lastOpenedDashboard.get(window.id),
                })
                  .then(({ canceled, filePath }) => {
                    if (!canceled) {
                      window.webContents.send('dashboardSave', filePath);
                    }
                  });
              }
            },
            { type: 'separator' },
            {
              label: 'Preferences',
              click(_, window) {
                window.webContents.send('ntModalOpen');
              }
            },
            {
              label: 'Plugins',
              click(_, window) {
                window.webContents.send('pluginsModalOpen');
              }
            },
            { type: 'separator' },
            { 
              label: 'Exit',
              click() { 
                updateWindowPreferences();
                app.quit();
              } 
            }
        ]
    },
    ...oldMenu.items.slice(1)
  ])
  Menu.setApplicationMenu(menu); 
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', initialize);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    initialize();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
