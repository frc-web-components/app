const { preferences } = require('./preferences');
const fs = require("fs");

function loadPlugins() {
  const enabledPlugins = preferences.plugins.filter(({ enabled }) => enabled);
  enabledPlugins.forEach(({ path, name }) => {
    fs.readFile(path, (error, buffer) => {
      if (!error) {
        const fileContent = buffer.toString();
        const pluginFunction = new Function(fileContent);
        try {
          pluginFunction();
        } catch(error) {
          console.error(`Error loading plugin "${name}"`, error);
        }
      } else {
        console.error(error);
      }
    });
  });
}

exports.loadPlugins = loadPlugins;