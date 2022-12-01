import {
  BaseDirectory,
  createDir,
  writeFile,
  readTextFile,
} from "@tauri-apps/api/fs";
import { Command } from "@tauri-apps/api/shell";
import { path } from "@tauri-apps/api";

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
  const resourceDir = await path.resourceDir();
  console.log('createPluginSidecar:', resourceDir);
  const command = Command.sidecar("binaries/app", resourceDir);

  await command.spawn();

  command.on('close', data => {
    console.log(`command finished with code ${data.code} and signal ${data.signal}`)
  });
  command.on('error', error => console.error(`command error: "${error}"`));
  command.stdout.on('data', line => console.log(`command stdout: "${line}"`));
  command.stderr.on('data', line => console.log(`command stderr: "${line}"`));
  // addMessage(frontendDiv, `command stdout: "${line}"`)
}

export async function getFile(path: string): Promise<Response> {
  return fetch(`/assets/${path}`);
}