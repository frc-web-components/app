import { appWindow, WebviewWindow, getAll } from "@tauri-apps/api/window";

interface WindowInfo {
  dashboardPath: string | null;
  size: [number, number];
  position: [number, number];
}

export function getPreviousOpenDashboards(): Record<string, WindowInfo> {
  try {
    return JSON.parse(localStorage.getItem("windowDashboards") ?? "{}");
  } catch (e) {
    return {};
  }
}

export function getOpenDashboards(): Record<string, WindowInfo> {
  let openDashboards: Record<string, WindowInfo> = {};
  try {
    openDashboards = JSON.parse(
      localStorage.getItem("windowDashboards") ?? "{}"
    );
  } catch (e) {}
  const windows = getAll();
  const filteredOpenDashboards: Record<string, WindowInfo> = {};
  windows.forEach((window) => {
    filteredOpenDashboards[window.label] = openDashboards[window.label];
  });
  return filteredOpenDashboards;
}

export function setOpenDashboard(label: string, info: WindowInfo) {
  const openDashboards = getOpenDashboards();
  openDashboards[label] = info;
  localStorage.setItem("windowDashboards", JSON.stringify(openDashboards));
}

export function removeWindow(label: string) {
  const openDashboards = getOpenDashboards();
  delete openDashboards[label];
  localStorage.setItem("windowDashboards", JSON.stringify(openDashboards));
}

export function removeCurrent() {
  removeWindow(appWindow.label);
}

export async function updateCurrent(path: string | null) {
  const position = await appWindow.outerPosition();
  const size = await appWindow.outerSize();
  setOpenDashboard(appWindow.label, {
    dashboardPath: path,
    position: [position.x, position.y],
    size: [size.width, size.height],
  });
}
