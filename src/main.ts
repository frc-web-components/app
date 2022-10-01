import addPlugins from "@frc-web-components/plugins";
import createDashboard from "@frc-web-components/frc-web-components";
import { appWindow } from "@tauri-apps/api/window";
import { invoke } from '@tauri-apps/api';

interface FilePayload {
  path: string;
  contents: string;
}

function setTitle(title?: string) {
  if (!title) {
    appWindow.setTitle('Untitled Dashboard - FRC Web Components');
  } else {
    const startIndex = Math.max(title.lastIndexOf("\\"), title.lastIndexOf('/'));
    const filename = startIndex > -1 ? title.substring(startIndex + 1): title;
    appWindow.setTitle(`${filename} - FRC Web Components`);

  }
}

window.addEventListener("DOMContentLoaded", async () => {
  let currentDashboardPath: string = '';
  
  setTitle();

  const dashboard = createDashboard(document.body);
  addPlugins(dashboard);
  (window as any).dasboard = dashboard;

  appWindow.listen("newDashboard", () => {
    currentDashboardPath = '';
    dashboard.resetHtml();
    setTitle();
  });

  appWindow.listen("openDashboard", event => {
    const { contents, path } = event.payload as FilePayload;
    currentDashboardPath = path;
    dashboard.setHtml(contents);
    setTitle(currentDashboardPath);
  });

  appWindow.listen("saveDashboardAs", event => {
    const path = event.payload as string;
    currentDashboardPath = path;
    invoke('save_file', { path, content: dashboard.getHtml() });
    setTitle(currentDashboardPath);
  });
  
  appWindow.listen("saveDashboard", () => {
    invoke('save_file', { path: currentDashboardPath, content: dashboard.getHtml() })
  });
});
