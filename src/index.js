const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
// const { openModal } = require('./modals/modal.js');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  Store.initRenderer();
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: "FRC Web Components",
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  let lastOpenedDashboard;

  ipcMain.handle('lastOpenedDashboardChange', (ev, path) => {
    lastOpenedDashboard = path;
  });

  ipcMain.handle('loadPluginDialogOpen', (ev, path) => {
    dialog.showOpenDialog(mainWindow, { 
      title: 'Load Plugin',
      filters: [{ name: 'Javascript', extensions: ['js'] }],
      properties: ['openFile'] 
    })
      .then(({ canceled, filePaths }) => {
        if (!canceled) {
          mainWindow.webContents.send('pluginLoad', filePaths);
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
              click() {
                mainWindow.webContents.send('newDashboard');
              }
            },
            {
              label: 'Open Dashboard...',
              click() {
                dialog.showOpenDialog(mainWindow, { 
                  title: 'Open Dashboard',
                  filters: [{ name: 'HTML', extensions: ['html', 'htm'] }],
                  properties: ['openFile'] 
                })
                  .then(({ canceled, filePaths }) => {
                    if (!canceled) {
                      mainWindow.webContents.send('dashboardOpen', filePaths);
                    }
                  });
              }
            },
            {
              label: 'Save Dashboard',
              click() {
                if (lastOpenedDashboard) {
                  mainWindow.webContents.send('dashboardSave', lastOpenedDashboard);
                } else {
                  dialog.showSaveDialog(mainWindow, { 
                    title: 'Save Dashboard',
                    filters: [{ name: 'HTML', extensions: ['html', 'htm'] }],
                  })
                    .then(({ canceled, filePath }) => {
                      if (!canceled) {
                        mainWindow.webContents.send('dashboardSave', filePath);
                      }
                    });
                }
              }
            },
            {
              label: 'Save Dashboard As...',
              click() {
                dialog.showSaveDialog(mainWindow, { 
                  title: 'Save Dashboard',
                  filters: [{ name: 'HTML', extensions: ['html', 'htm'] }],
                  defaultPath: lastOpenedDashboard,
                })
                  .then(({ canceled, filePath }) => {
                    if (!canceled) {
                      mainWindow.webContents.send('dashboardSave', filePath);
                    }
                  });
              }
            },
            { type: 'separator' },
            {
              label: 'Preferences',
              click() {
                mainWindow.webContents.send('ntModalOpen');
              }
            },
            {
              label: 'Plugins',
              click() {
                mainWindow.webContents.send('pluginsModalOpen');
              }
            },
            { type: 'separator' },
            { 
              label: 'Exit',
              click() { 
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
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
