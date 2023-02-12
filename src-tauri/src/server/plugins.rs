use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::Write;
use std::collections::HashMap;
use std::path::Path;
use std::{fs, path::PathBuf};
use tauri::api;

fn get_plugin_dir() -> PathBuf {
    let config_path = api::path::config_dir()
        .unwrap()
        .into_os_string()
        .into_string()
        .unwrap();
    Path::new(&config_path).join("fwc-plugins")
}

fn get_plugins_path() -> PathBuf {
    let dir_path = get_plugin_dir();
    dir_path.join("plugins.json")
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Plugin {
    pub directory: String,
    pub name: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Config {
    plugins: Vec<Plugin>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Info {
    pub name: Option<String>,
    pub version: Option<String>,
    pub description: Option<String>
}

impl Config {
    pub fn new() -> Config {
        let mut config = Config {
            plugins: vec![],
            // should_update: false,
        };
        config.read();
        config
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

    pub fn get_plugin_info(&mut self) -> HashMap<String, Option<Info>> {
        let mut plugin_info = HashMap::new();
        let asset_paths = self.get_asset_paths();

        asset_paths.iter().for_each(|path| {
            let plugin_json_path = Path::new(path).join("plugin.json");
            if let Ok(contents) = fs::read_to_string(plugin_json_path) {
                if let Ok(info) = serde_json::from_str::<Info>(&contents) {
                    plugin_info.insert(path.clone(), Some(info));
                } else {
                    plugin_info.insert(path.clone(), None);
                }
            }
        });
        return plugin_info;
    }

    pub fn get_asset_paths(&mut self) -> Vec<String> {
        self.read();
        self.plugins.iter().map(|a| a.directory.clone()).collect()
    }
}
