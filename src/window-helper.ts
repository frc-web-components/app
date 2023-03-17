import {
  appWindow,
  PhysicalPosition,
  PhysicalSize,
} from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api";

interface WindowInfo {
  dashboardPath: string | null;
  size: [number, number];
  position: [number, number];
}

function hasLoaded(): boolean {
  return !!sessionStorage.getItem("hasDashboardLoaded");
}

function setLoaded() {
  sessionStorage.setItem("hasDashboardLoaded", "true");
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

export async function getAllWindowLabels(): Promise<string[]> {
  const labels = (await invoke("get_window_labels")) as string[];
  return labels;
}

export async function getOpenDashboards(): Promise<Record<string, WindowInfo>> {
  let openDashboards = loadDashboards();
  const windowLabels = await getAllWindowLabels();
  const filteredOpenDashboards: Record<string, WindowInfo> = {};
  windowLabels.forEach((label) => {
    filteredOpenDashboards[label] = openDashboards[label];
  });
  return filteredOpenDashboards;
}

export async function setOpenDashboard(label: string, info: WindowInfo) {
  const openDashboards = await getOpenDashboards();
  openDashboards[label] = info;
  storeDashboards(openDashboards);
}

export async function removeWindow(label: string) {
  const openDashboards = await getOpenDashboards();
  delete openDashboards[label];
  storeDashboards(openDashboards);
}

export async function storePosition(x: number, y: number) {
  const openDashboards = await getOpenDashboards();
  openDashboards[appWindow.label].position = [x, y];
  storeDashboards(openDashboards);
}

export async function storeSize(width: number, height: number) {
  const openDashboards = await getOpenDashboards();
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

export async function loadPreviousLayout(): Promise<WindowInfo | undefined> {
  if (appWindow.label === "main" && !hasLoaded()) {
    setLoaded();
    const prevOpenDashboards = loadDashboards();
    const hasPrevMainLabel = "main" in prevOpenDashboards;
    const mainLabel = hasPrevMainLabel
      ? "main"
      : Object.keys(prevOpenDashboards)[0];
    for (const [label, info] of Object.entries(prevOpenDashboards)) {
      const [width, height] = info.size;
      const [x, y] = info.position;
      if (label === mainLabel) {
        await appWindow.setSize(new PhysicalSize(width, height));
        await appWindow.setPosition(new PhysicalPosition(x, y));
      } else {
        invoke("create_window", {
          width,
          height,
          x,
          y,
          path: info.dashboardPath ?? undefined,
        });
      }
    }
    if (mainLabel) {
      return prevOpenDashboards[mainLabel];
    }
  }
  return undefined;
}
