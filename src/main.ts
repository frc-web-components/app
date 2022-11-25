import createDashboard from "@frc-web-components/frc-web-components";
import { appWindow } from "@tauri-apps/api/window";
import { invoke } from '@tauri-apps/api';
import { BaseDirectory, createDir, writeFile, writeBinaryFile } from "@tauri-apps/api/fs";

const createDataFolder = async () => {
  try {
    await createDir("data/bleh", {
      dir: BaseDirectory.Desktop,
      recursive: true,
    });
  } catch (e) {
    console.error(e);
  }
};

const createDataFile = async () => {
  try {
    await writeFile(
      {
        contents: "[]",
        path: `./data/bleh/data.json`,
      },
      {
        dir: BaseDirectory.Desktop,
      }
    );
  } catch (e) {
    console.log(e);
  }
};

async function doStuff() {
  await createDataFolder();
  await createDataFile();
}


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
  (window as any).dasboard = dashboard;

  doStuff();

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
