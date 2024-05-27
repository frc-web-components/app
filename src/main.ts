import "./dashboard";
import { getDashboard } from "@frc-web-components/react-dashboard";
import { PhysicalSize, appWindow } from "@tauri-apps/api/window";
import { readTextFile } from "@tauri-apps/api/fs";
import { exit } from "@tauri-apps/api/process";
import { invoke, dialog } from "@tauri-apps/api";
import { desktopDir, basename } from "@tauri-apps/api/path";
import "./components/plugins-dialog";
import {
  writePluginConfig,
  getPlugins,
  loadPlugins,
  getPluginInfo,
} from "./plugins";
import {
  removeCurrent,
  updateCurrent,
  loadPreviousLayout,
} from "./window-helper";

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

  dashboard.on("newWindowMenuClickEvent", () => {
    invoke("create_new_window");
  });

  dashboard.on("newDashboardMenuClickEvent", () => {
    currentDashboardPath = "";
    dashboard.resetLayout();
    setTitle();
  });

  dashboard.on("openDashboardMenuClickEvent", async () => {
    const path = await dialog.open({
      filters: [{ name: "JSON", extensions: ["json"] }],
      multiple: false,
    });
    if (!path || path instanceof Array) {
      return;
    }
    // const { contents, path } = event.payload as FilePayload;
    currentDashboardPath = path;
    const content = await readTextFile(path);
    dashboard.setLayout(JSON.parse(content));
    setTitle(currentDashboardPath);
  });

  dashboard.on("saveDashboardAsMenuClickEvent", async () => {
    const path = await dialog.save({
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (!path) {
      return;
    }
    currentDashboardPath = path;
    invoke("save_file", {
      path,
      content: JSON.stringify(dashboard.getLayout(), null, 4),
    });
    setTitle(currentDashboardPath);
  });

  dashboard.on("saveDashboardMenuClickEvent", async () => {
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

  dashboard.on("closeWindowMenuClickEvent", () => {
    appWindow.close();
  });

  dashboard.on("closeWindowClickEvent", () => {
    appWindow.close();
  });

  dashboard.on("quitMenuClickEvent", () => {
    exit();
  });

  dashboard.on("minimizeWindowClickEvent", () => {
    appWindow.minimize();
  });

  let previousSize: PhysicalSize | undefined;

  appWindow.onResized(async ({ payload: size }) => {
    const isMaximized = await appWindow.isMaximized();
    if (!isMaximized) {
      previousSize = size;
    }
  });

  dashboard.on("maximizeWindowClickEvent", async () => {
    appWindow.innerSize;
    const isMaximized = await appWindow.isMaximized();
    if (!isMaximized) {
      appWindow.maximize();
    } else if (previousSize) {
      appWindow.setSize(previousSize);
    }
  });

  async function updateDialogPlugins() {
    const pluginInfo = await getPluginInfo();
    const plugins: {
      name: string;
      version: string;
      description: string;
      location: string;
    }[] = [];
    Object.entries(pluginInfo).forEach(([location, info]) => {
      plugins.push({
        name: info?.name ?? "",
        description: info?.description ?? "",
        version: info?.version ?? "",
        location,
      });
    });
    dashboard.setLoadedPlugins(plugins);
  }

  dashboard.on("pluginsMenuClickEvent", () => {
    updateDialogPlugins();
  });

  dashboard.on("pluginDialogLoadPluginEvent", async () => {
    const selected = await dialog.open({
      directory: true,
      defaultPath: await desktopDir(),
    });
    if (!Array.isArray(selected) && selected !== null) {
      let plugins = await getPlugins();

      plugins = plugins.concat({
        directory: selected,
        name: await basename(selected),
      });
      await writePluginConfig(plugins);
      updateDialogPlugins();
    }
  });

  dashboard.on("pluginDialogRemoveEvent", async (location) => {
    const plugins = [...dashboard.getLoadedPlugins()];
    const index = plugins.findIndex((plugin) => plugin.location === location);
    plugins.splice(index, 1);
    await writePluginConfig(
      plugins.map(({ name, location }) => ({
        name,
        directory: location,
      }))
    );
    updateDialogPlugins();
  });
});
