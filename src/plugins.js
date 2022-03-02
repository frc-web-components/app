export async function loadPlugins(plugins) {
  const enabledPlugins = plugins.filter(({ enabled }) => enabled);
  for (const { path, name } of enabledPlugins) {
    try {
      const exports = await import(path);
      const { elements } = exports?.default ?? {};
      if (elements) {
        window.FwcDashboard.addElements(elements);
      }
    } catch(error) {
      console.error(`Error loading plugin "${name}"`, error);
    }
  }
}
