const { windows } = require('./windows');
const { ipcMain } = require('electron');

const sendDashboardHtmlHandlers = new Map();
const dashboardReadyHandlers = new Map();

ipcMain.handle('sendDashboardHtml', (ev, html) => {
  const handler = sendDashboardHtmlHandlers.get(ev.sender.id);
  if (handler) {
    handler(html);
  }
});

ipcMain.handle('dashboardReady', ev => {
  const handler = dashboardReadyHandlers.get(ev.sender.id);
  if (handler) {
    handler();
  }
});

function requestWindowContent() {
  const contentPromises = [...windows.getWindows()].map(window => {
    return new Promise(resolve => {
      sendDashboardHtmlHandlers.set(window.id, html => {
        resolve({ window, html });
      });
      window.webContents.send('requestDashboardHtml');
    });
  });
  return Promise.all(contentPromises);
}

function reloadWindows() {
  const promises = [...windows.getWindows()].map(window => {
    return new Promise(resolve => {
      dashboardReadyHandlers.set(window.id, () => {
        resolve();
      });
      window.reload();
    });
  });
  return Promise.all(promises);
}

async function reloadDashboards() {
  const getWindowContent = await requestWindowContent();
  await reloadWindows();
  getWindowContent.forEach(({ window, html }) => {
    window.webContents.send('setDashboardHtml', html);
  });
}

exports.reloadDashboards = reloadDashboards;