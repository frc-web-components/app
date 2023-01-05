use serde::{Deserialize, Serialize};
use serde_json::Result;
use std::fs::File;
use std::io::Write;
use std::path::Path;
use std::{fs, path::PathBuf};
use tauri::api;

#[derive(Serialize, Deserialize)]
pub struct Plugin {
    pub directory: String,
    pub name: String,
}

#[derive(Serialize, Deserialize)]
pub struct Config {
    plugins: Vec<Plugin>,
}

impl Config {
    pub fn get_default() -> Config {
        Config {
            plugins: vec![Plugin {
                directory: String::from(""),
                name: String::from(""),
            }],
        }
    }
}

pub fn get_plugin_dir() -> PathBuf {
    let config_path = api::path::config_dir()
        .unwrap()
        .into_os_string()
        .into_string()
        .unwrap();
    let dir_path = Path::new(&config_path).join("fwc-plugins");
    dir_path.join("plugins.json")
}
pub fn get_plugins_path() -> PathBuf {
    let dir_path = get_plugin_dir();
    dir_path.join("plugins.json")
}

pub fn write_plugin_config(config: &Config) -> std::io::Result<()> {
    let config_path = api::path::config_dir()
        .unwrap()
        .into_os_string()
        .into_string()
        .unwrap();
    let dir_path = get_plugin_dir();
    let plugin_config_path = get_plugins_path();
    // handle if dir already exists
    fs::create_dir(dir_path)?;
    let content = serde_json::to_string(&config)?;
    let mut f = File::create(plugin_config_path).expect("Unable to create file");
    f.write_all(content.as_bytes())
        .expect("Unable to write data");
    Ok(())
}

pub fn get_plugin_config() -> std::io::Result<Config> {
    let exists = Path::new(get_plugins_path().as_path()).exists();
    if !exists {
        write_plugin_config(&Config::get_default())?
    }
    match fs::read_to_string(get_plugins_path().as_path()) {
        Ok(contents) => {
            let config: Config = serde_json::from_str(&contents)?;
            Ok(config)
        }
        Err(_) => Ok(Config::get_default()),
    }
}
