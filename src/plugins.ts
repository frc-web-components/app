import {
  BaseDirectory,
  createDir,
  writeFile,
  readTextFile,
} from "@tauri-apps/api/fs";
import { Command } from "@tauri-apps/api/shell";

interface Plugin {
  directory: string;
  name: string;
}

interface PluginConfig {
  plugins: Plugin[];
}

export async function getPlugins(): Promise<string> {
  return readTextFile('./fwc-plugins/plugins.json', { dir: BaseDirectory.Resource })
}

export async function createPluginConfig(): Promise<void> {
  try {
    await createDir("fwc-plugins", {
      dir: BaseDirectory.Resource,
      recursive: true,
    });


    const pluginConfig: PluginConfig = {
      plugins: [{ directory: "", name: "" }],
    };

    await writeFile(
      {
        contents: JSON.stringify(pluginConfig),
        path: `./fwc-plugins/plugins.json`,
      },
      {
        dir: BaseDirectory.Resource,
      }
    );
  } catch (e) {
    console.error(e);
  }
};

export async function createPluginSidecar() {
  const command = Command.sidecar("binaries/app");
  await command.spawn();

  command.stdout.on("data", (line) => {
    console.log("data:", line);
  });
  // addMessage(frontendDiv, `command stdout: "${line}"`)
}

export async function getFile(path: string): Promise<Response> {
  return fetch(`/assets/${path}`);
}