const { watchFile, existsSync, writeFile, readFile } = require("fs");
const { join } = require("path");

const pluginsDir = process.argv[process.argv.length - 1];
const pluginConfigPath = join(pluginsDir, "fwc-plugins/plugins.json");
let pluginConfig = null;

function getDefaultPluginConfig() {
  return {
    plugins: [{ directory: "", name: "" }],
  };
}


function writePluginConfig(config) {
  return new Promise((resolve, reject) => {
    writeFile(pluginConfigPath, JSON.stringify(config), "utf8", (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function getPluginConfig() {
  if (!existsSync(pluginConfigPath)) {
    await writePluginConfig(getDefaultPluginConfig());
  }
  return new Promise((resolve, reject) => {
    readFile(pluginConfigPath, "utf8", (err, data) => {
      if (err) {
        reject(err);
      } else {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(getDefaultPluginConfig());
        }
      }
    });
  });
}

async function updateConfig() {
  pluginConfig = await getPluginConfig();
}

async function getAssetPaths() {
  if (!pluginConfig) {
    await updateConfig();
  }
  return pluginConfig.plugins.map(({ directory }) => directory);
}

module.exports = { getAssetPaths };
