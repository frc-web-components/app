import { FrcDashboard } from "@frc-web-components/frc-web-components/types/dashboard";
import {
  BaseDirectory,
  createDir,
  writeFile,
  readTextFile,
} from "@tauri-apps/api/fs";

export interface Plugin {
  directory: string;
  name: string;
}

export interface PluginConfig {
  plugins: Plugin[];
}

export async function getPlugins(): Promise<Plugin[]> {
  return new Promise((resolve) => {
    readTextFile("./fwc-plugins/plugins.json", {
      dir: BaseDirectory.Resource,
    })
      .then((content) => {
        try {
          const pluginConfig: PluginConfig = JSON.parse(content);
          resolve(pluginConfig.plugins);
        } catch (e) {
          console.error("error reading plugin config:", e);
          resolve([{ directory: "", name: "" }]);
        }
      })
      .catch(() => {
        resolve([{ directory: "", name: "" }]);
      });
  });
}

export async function writePluginConfig(plugins: Plugin[]): Promise<void> {
  try {
    await createDir("fwc-plugins", {
      dir: BaseDirectory.Resource,
      recursive: true,
    });

    const pluginConfig: PluginConfig = {
      plugins,
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
}

export async function getAsset(path: string): Promise<Response> {
  return fetch(`http://localhost:8125/assets/${path}`);
}

export async function loadPlugins(dashboard: FrcDashboard) {
  const plugins = await getPlugins();
  plugins.forEach((value, index) => {
    import(`http://localhost:8125/plugins/${index}`)
      .then((pluginExports) => {
        console.log('pluginExports:', pluginExports, pluginExports?.default);
        try {
          pluginExports?.default?.(dashboard);
        } catch(error) {
          console.error(`Error executing plugin with path "${value.directory}":`, error);
        }
      })
      .catch((error) => {
        console.error(`Failed to load plugin with path "${value.directory}":`, error);
      });
  });
}
