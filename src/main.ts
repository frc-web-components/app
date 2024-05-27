import "./dashboard";
import { getDashboard } from "@frc-web-components/react-dashboard";
import { appWindow } from "@tauri-apps/api/window";
import { invoke, dialog } from "@tauri-apps/api";
import "./components/plugins-dialog";
import { writePluginConfig, getPlugins, loadPlugins } from "./plugins";
import {
  removeCurrent,
  updateCurrent,
  loadPreviousLayout,
} from "./window-helper";

interface FilePayload {
  path: string;
  contents: string;
}

function setTitle(path?: string) {
  updateCurrent(path ?? null);
  if (!path) {
    appWindow.setTitle("Untitled Dashboard - FRC Web Components");
    window.location.hash = "";
  } else {
    const startIndex = Math.max(path.lastIndexOf("\\"), path.lastIndexOf("/"));
    const filename = startIndex > -1 ? path.substring(startIndex + 1) : path;
    appWindow.setTitle(`${filename} - FRC Web Components`);
    window.location.hash = `dashboardPath=${path}`;
  }
}

function getInitialDashboardPath(): string | null {
  const url = new URL(document.location as any);
  const params = url.searchParams;
  const hash = new URLSearchParams(url.hash.substring(1));
  return hash.get("dashboardPath") ?? params.get("dashboardPath");
}

window.addEventListener("DOMContentLoaded", async () => {
  let currentDashboardPath: string = "";
  const initialDashboardPath = getInitialDashboardPath();

  if (appWindow.label === "main") {
    loadPreviousLayout().then((windowInfo) => {
      const path = windowInfo?.dashboardPath;
      if (path) {
        invoke("get_file_contents", {
          path,
        }).then((contents) => {
          if (contents) {
            currentDashboardPath = path;
            dashboard.setLayout(JSON.parse(contents as string));
            setTitle(path);
          } else {
            updateCurrent(path);
          }
        });
      } else {
        updateCurrent(currentDashboardPath);
      }
    });
  } else {
    updateCurrent(currentDashboardPath);
  }

  appWindow.onCloseRequested(() => {
    removeCurrent();
  });

  appWindow.onMoved(() => {
    updateCurrent(currentDashboardPath);
  });

  appWindow.onResized(() => {
    updateCurrent(currentDashboardPath);
  });

  (window as any).writePluginConfig = writePluginConfig;
  (window as any).getPlugins = getPlugins;

  setTitle();

  const dashboard = getDashboard();
  await loadPlugins();

  if (initialDashboardPath) {
    invoke("get_file_contents", {
      path: initialDashboardPath,
    }).then((contents) => {
      if (contents) {
        currentDashboardPath = initialDashboardPath;
        dashboard.setLayout(JSON.parse(contents as string));
        setTitle(initialDashboardPath);
      }
    });
  }

  appWindow.listen("newDashboard", () => {
    currentDashboardPath = "";
    dashboard.resetLayout();
    setTitle();
  });

  appWindow.listen("openDashboard", (event) => {
    const { contents, path } = event.payload as FilePayload;
    currentDashboardPath = path;
    dashboard.setLayout(JSON.parse(contents as string));
    setTitle(currentDashboardPath);
  });

  appWindow.listen("saveDashboardAs", (event) => {
    const path = event.payload as string;
    currentDashboardPath = path;
    invoke("save_file", { path, content: JSON.stringify(dashboard.getLayout(), null, 4) });
    setTitle(currentDashboardPath);
  });

  appWindow.listen("saveDashboard", async () => {
    if (!currentDashboardPath) {
      const path = await dialog.save({
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (!path) {
        return;
      }
      currentDashboardPath = path;
      setTitle(currentDashboardPath);
    }
    invoke("save_file", {
      path: currentDashboardPath,
      content: JSON.stringify(dashboard.getLayout()),
    });
  });
});
