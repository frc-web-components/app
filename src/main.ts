import createDashboard from "@frc-web-components/fwc";
import { appWindow } from "@tauri-apps/api/window";
import { invoke, dialog } from "@tauri-apps/api";
import "./components/plugins-dialog";
import { writePluginConfig, getPlugins, loadPlugins } from "./plugins";
import {  removeCurrent, updateCurrent, getPreviousOpenDashboards } from './window-helper';

interface FilePayload {
  path: string;
  contents: string;
}

function setTitle(path?: string) {
  updateCurrent(path ?? null);
  if (!path) {
    appWindow.setTitle("Untitled Dashboard - FRC Web Components");
  } else {
    const startIndex = Math.max(
      path.lastIndexOf("\\"),
      path.lastIndexOf("/")
    );
    const filename = startIndex > -1 ? path.substring(startIndex + 1) : path;
    appWindow.setTitle(`${filename} - FRC Web Components`);
  }
}

window.addEventListener("DOMContentLoaded", async () => {

  if (appWindow.label === 'main') {
    const prevOpenDashboards = getPreviousOpenDashboards();
    console.log('prevOpenDashboards', prevOpenDashboards);
  }

  appWindow.onCloseRequested(() => {
    // alert('close');
    removeCurrent();
  });

  (window as any).writePluginConfig = writePluginConfig;
  (window as any).getPlugins = getPlugins;

  let currentDashboardPath: string = "";

  setTitle();

  const dashboard = createDashboard(document.body);
  (window as any).dashboard = dashboard;
  loadPlugins(dashboard);

  appWindow.listen("newDashboard", () => {
    currentDashboardPath = "";
    dashboard.resetHtml();
    setTitle();
  });

  appWindow.listen("openDashboard", (event) => {
    const { contents, path } = event.payload as FilePayload;
    currentDashboardPath = path;
    dashboard.setHtml(contents);
    setTitle(currentDashboardPath);
  });

  appWindow.listen("saveDashboardAs", (event) => {
    const path = event.payload as string;
    currentDashboardPath = path;
    invoke("save_file", { path, content: dashboard.getHtml() });
    setTitle(currentDashboardPath);
  });

  appWindow.listen("saveDashboard", async () => {
    if (!currentDashboardPath) {
      const path = await dialog.save({
        filters: [{ name: "HTML", extensions: ["html"] }],
      });
      if (!path) {
        return;
      }
      currentDashboardPath = path;
      setTitle(currentDashboardPath);
    }
    invoke("save_file", {
      path: currentDashboardPath,
      content: dashboard.getHtml(),
    });
  });
});
