import {
  appWindow,
  getAll,
  LogicalPosition,
  LogicalSize,
  PhysicalPosition,
  PhysicalSize,
} from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api";

interface WindowInfo {
  dashboardPath: string | null;
  size: [number, number];
  position: [number, number];
}

function storeDashboards(dashboards: Record<string, WindowInfo>) {
  localStorage.setItem("windowDashboards", JSON.stringify(dashboards));
}

export function loadDashboards(): Record<string, WindowInfo> {
  try {
    return JSON.parse(localStorage.getItem("windowDashboards") ?? "{}");
  } catch (e) {
    return {};
  }
}

export function getOpenDashboards(): Record<string, WindowInfo> {
  let openDashboards = loadDashboards();
  const windows = getAll();
  console.log(
    "windows:",
    windows.map((window) => window.label)
  );

  const filteredOpenDashboards: Record<string, WindowInfo> = {};
  windows.forEach((window) => {
    filteredOpenDashboards[window.label] = openDashboards[window.label];
  });
  return filteredOpenDashboards;
}

export function setOpenDashboard(label: string, info: WindowInfo) {
  console.log("setOpenDashboard:", label, info);
  const openDashboards = getOpenDashboards();
  openDashboards[label] = info;
  storeDashboards(openDashboards);
}

export function removeWindow(label: string) {
  const openDashboards = getOpenDashboards();
  delete openDashboards[label];
  storeDashboards(openDashboards);
}

export function storePosition(x: number, y: number) {
  const openDashboards = getOpenDashboards();
  console.log("appwindow:", appWindow.label, x, y);
  openDashboards[appWindow.label].position = [x, y];
  storeDashboards(openDashboards);
}

export function storeSize(width: number, height: number) {
  const openDashboards = getOpenDashboards();
  openDashboards[appWindow.label].size = [width, height];
  storeDashboards(openDashboards);
}

export function removeCurrent() {
  removeWindow(appWindow.label);
}

export async function updateCurrent(path: string | null) {
  const position = await appWindow.outerPosition();
  const size = await appWindow.innerSize();
  setOpenDashboard(appWindow.label, {
    dashboardPath: path,
    position: [position.x, position.y],
    size: [size.width, size.height],
  });
}

export async function loadPreviousLayout() {
  if (appWindow.label === "main") {
    const prevOpenDashboards = loadDashboards();
    for (const [label, info] of Object.entries(prevOpenDashboards)) {
      const [width, height] = info.size;
      const [x, y] = info.position;
      if (label === "main") {
        await appWindow.setSize(new PhysicalSize(width, height));
          await appWindow.setPosition(new PhysicalPosition(x, y));
      } else {
        invoke("create_window", {
          width,
          height,
          x,
          y,
        });
      }
    }
  }
}
