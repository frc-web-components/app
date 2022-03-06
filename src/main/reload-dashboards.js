const { windows } = require('./windows');
const { ipcMain } = require('electron');

function requestWindowContent() {
  const contentPromises = [...windows.getWindows()].map(window => {
    return new Promise(resolve => {
      ipcMain.handle('sendDashboardHtml', (ev, html) => {
        if (ev.sender.id === window.id) {
          resolve({ window, html });
        }
      });
      window.webContents.send('requestDashboardHtml');
    });
  });
  return new Promise.all(contentPromises);
}

function reloadWindows() {
  const promises = [...windows.getWindows()].map(window => {
    return new Promise(resolve => {
      ipcMain.handle('dashboardReady', (ev, html) => {
        if (ev.sender.id === window.id) {
          resolve();
        }
      });
      window.reload();
    });
  });
  return new Promise.all(promises);
}

async function reloadDashboards() {
  const getWindowContent = await requestWindowContent();
  await reloadWindows();
  getWindowContent.forEach(({ window, html }) => {
    window.webContents.send('setDashboardHtml', html);
  });
}

exports.reloadDashboards = reloadDashboards;