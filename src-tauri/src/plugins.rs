use notify::{RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use serde_json::Result;
use std::fs::File;
use std::io::Write;
use std::path::Path;
use std::{fs, path::PathBuf};
use tauri::api;

fn get_plugin_dir() -> PathBuf {
    let config_path = api::path::config_dir()
        .unwrap()
        .into_os_string()
        .into_string()
        .unwrap();
    let dir_path = Path::new(&config_path).join("fwc-plugins");
    dir_path.join("plugins.json")
}

fn get_plugins_path() -> PathBuf {
    let dir_path = get_plugin_dir();
    dir_path.join("plugins.json")
}

#[derive(Serialize, Deserialize)]
pub struct Plugin {
    pub directory: String,
    pub name: String,
}

#[derive(Serialize, Deserialize)]
pub struct Config {
    plugins: Vec<Plugin>,
    should_update: bool,
}

impl Config {
    pub fn new() -> Config {
        let mut config = Config {
            plugins: vec![],
            should_update: false,
        };
        config.read();
        config
    }

    fn watch(&mut self) -> notify::Result<()> {
        // Automatically select the best implementation for your platform.
        let mut watcher = notify::recommended_watcher(move|res| match res {
            Ok(event) => {
              self.should_update = true;
            },
            Err(e) => println!("watch error: {:?}", e)
        })?;

        // Add a path to be watched. All files and directories at that path and
        // below will be monitored for changes.
        watcher.watch(&get_plugins_path(), RecursiveMode::NonRecursive)?;

        Ok(())
    }

    fn write(&self) -> std::io::Result<()> {
        let plugin_config_path = get_plugins_path();
        let dir_path = get_plugin_dir();
        // handle if dir already exists
        fs::create_dir(dir_path)?;
        let content = serde_json::to_string(&self)?;
        let mut f = File::create(plugin_config_path).expect("Unable to create file");
        f.write_all(content.as_bytes())
            .expect("Unable to write data");
        Ok(())
    }

    fn read(&mut self) -> std::io::Result<()> {
        let exists = Path::new(get_plugins_path().as_path()).exists();
        if !exists {
            self.write()?
        }
        match fs::read_to_string(get_plugins_path().as_path()) {
            Ok(contents) => {
                let config: Config = serde_json::from_str(&contents)?;
                self.plugins = config.plugins;
                Ok(())
            }
            Err(_) => Ok(()),
        }
    }

    pub fn get_asset_paths(&mut self) -> Vec<String> {
        if self.should_update {
            self.read();
        }
        self.plugins.iter().map(|a| a.directory.clone()).collect()
    }
}
