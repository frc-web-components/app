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

export interface PluginInfo {
  [directory: string]: null | {
    name: string | null;
    description: string | null;
    version: string | null;
  };
}

export async function getPlugins(): Promise<Plugin[]> {
  return new Promise((resolve) => {
    readTextFile("./fwc-plugins/plugins.json", {
      dir: BaseDirectory.Config,
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
      dir: BaseDirectory.Config,
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
        dir: BaseDirectory.Config,
      }
    );
  } catch (e) {
    console.error(e);
  }
}

export async function getAsset(path: string): Promise<Response> {
  return fetch(`http://localhost:18127/assets/${path}`);
}

export async function loadPlugins() {
  const plugins = await getPlugins();
  plugins.forEach((value, index) => {
    import( /* @vite-ignore */ `http://localhost:18127/plugins/${index}`)
      .catch((error) => {
        console.error(
          `Failed to load plugin with path "${value.directory}":`,
          error
        );
      });
  });
}
export async function getPluginInfo() {
  const response = await fetch("http://localhost:18127/plugin-info");
  const pluginInfo: PluginInfo = await response.json();
  return pluginInfo;
}
