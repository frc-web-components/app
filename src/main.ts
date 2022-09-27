import addPlugins from "@frc-web-components/plugins";
import createDashboard from "@frc-web-components/frc-web-components";
import { appWindow } from "@tauri-apps/api/window";
import { invoke } from '@tauri-apps/api';

window.addEventListener("DOMContentLoaded", async () => {
  const dashboard = createDashboard(document.body);
  addPlugins(dashboard);
  (window as any).dasboard = dashboard;

  appWindow.listen("newDashboard", () => {
    dashboard.resetHtml();
  });

  appWindow.listen("openDashboard", event => {
    dashboard.setHtml(event.payload as string);
  });

  appWindow.listen("saveDashboardAs", event => {
    console.log('save dashboard:', event.payload as string)
    invoke('save_file', { path: event.payload as string, content: dashboard.getHtml() })
    // dashboard.setHtml(event.payload as string);
  });
});
