import createDashboard from "@frc-web-components/frc-web-components";
import { appWindow } from "@tauri-apps/api/window";
import { invoke, event } from "@tauri-apps/api";
import {
  BaseDirectory,
  createDir,
  writeFile,
  readTextFile,
  writeBinaryFile,
} from "@tauri-apps/api/fs";
import "./components/plugins-dialog";
import { Command } from "@tauri-apps/api/shell";

const createDataFolder = async () => {
  try {
    await createDir("fwc-plugins", {
      dir: BaseDirectory.Resource,
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
        contents: JSON.stringify({
            plugins: [
              { directory: '', name: '' }
            ]
        }),
        path: `./fwc-plugins/plugins.json`,
      },
      {
        dir: BaseDirectory.Resource,
      }
    );
  } catch (e) {
    console.log(e);
  }
};

async function getPlugins(): Promise<string> {
  return readTextFile('./fwc-plugins/plugins.json', { dir: BaseDirectory.Resource })
}

async function createFile() {
  await createDataFolder();
  await createDataFile();
}


interface FilePayload {
  path: string;
  contents: string;
}

function setTitle(title?: string) {
  if (!title) {
    appWindow.setTitle("Untitled Dashboard - FRC Web Components");
  } else {
    const startIndex = Math.max(
      title.lastIndexOf("\\"),
      title.lastIndexOf("/")
    );
    const filename = startIndex > -1 ? title.substring(startIndex + 1) : title;
    appWindow.setTitle(`${filename} - FRC Web Components`);
  }
}

window.addEventListener("DOMContentLoaded", async () => {

  (window as any).createFile = createFile;
  (window as any).getPlugins = getPlugins;

  let currentDashboardPath: string = "";

  setTitle();

  const dashboard = createDashboard(document.body);
  (window as any).dasboard = dashboard;

  // doStuff();

  if (appWindow.label === "main") {
    const command = Command.sidecar("binaries/app");
    const child = await command.spawn();

    command.stdout.on("data", (line) => {
      console.log('data:', line);
    });
    // addMessage(frontendDiv, `command stdout: "${line}"`)
    setTimeout(() => {
      var enc = new TextEncoder(); // always utf-8
      // console.log(enc.encode("This is a string converted to a Uint8Array"));
      child.write("bleh").then(() => {
        console.log('success')
      });
    }, 2000);
  }

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

  appWindow.listen("saveDashboard", () => {
    invoke("save_file", {
      path: currentDashboardPath,
      content: dashboard.getHtml(),
    });
  });
});
