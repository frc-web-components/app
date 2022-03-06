const { app, Menu, dialog } = require('electron');
const { windows } = require('./windows');

function getMenu(oldMenu) {
  return Menu.buildFromTemplate([
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
          click() {
            windows.createWindow();
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
            if (windows.getLastOpenedDashboard(window.id)) {
              window.webContents.send('dashboardSave', windows.getLastOpenedDashboard(window.id));
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
              defaultPath: windows.getLastOpenedDashboard(window.id),
            })
              .then(({ canceled, filePath }) => {
                if (!canceled) {
                  window.webContents.send('dashboardSave', filePath);
                }
              });
          }
        },
        { type: 'separator' },
        // {
        //   label: 'Preferences',
        //   click(_, window) {
        //     window.webContents.send('ntModalOpen');
        //   }
        // },
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
            windows.updateWindowPreferences();
            app.quit();
          }
        }
      ]
    },
    ...oldMenu.items.slice(1)
  ]);
}
exports.getMenu = getMenu;
