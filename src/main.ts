import addPlugins from "@frc-web-components/plugins";
import createDashboard from "@frc-web-components/frc-web-components";
import { appWindow } from "@tauri-apps/api/window";

window.addEventListener("DOMContentLoaded", async () => {
  const dashboard = createDashboard(document.body);
  addPlugins(dashboard);
  (window as any).dasboard = dashboard;

  appWindow.listen("newDashboard", () => {
    dashboard.resetHtml();
  });

  appWindow.listen("openDashboard", event => {
    event.windowLabel;
    dashboard.setHtml(event.payload as string);
  });
});
