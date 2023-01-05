#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use chrono;
use std::fs;
use std::fs::File;
use std::io::Write;
use tauri::api::dialog;
use tauri::{
    api::path,
    api::process::{Command, CommandEvent},
    CustomMenuItem, Manager, Menu, MenuItem, Submenu,
};

mod plugins;

use crate::plugins::Config;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn save_file(path: &str, content: &str) {
    if path != "" {
        let mut f = File::create(path).expect("Unable to create file");
        f.write_all(content.as_bytes())
            .expect("Unable to write data");
    } else {
        let content_copy: String = content.into();
        dialog::FileDialogBuilder::default()
            .add_filter("HTML", &["html"])
            .save_file(move |path_buf| match path_buf {
                Some(p) => {
                    let file_path = p.into_os_string().into_string().unwrap();
                    let mut f = File::create(file_path).expect("Unable to create file");
                    f.write_all(content_copy.clone().as_bytes())
                        .expect("Unable to write data");
                    // event.window().emit("saveDashboardAs", file_path).unwrap();
                }
                _ => {}
            });
    }
}

// #[tauri::command]
// fn load_plugin() {
//     dialog::FileDialogBuilder::default().pick_folder(|path_buf| match path_buf {
//         Some(p) => {
//             let folder_path = p.into_os_string().into_string().unwrap();
//         }
//         _ => {}
//     });
// }

// the payload type must implement `Serialize` and `Clone`.
#[derive(Clone, serde::Serialize)]
struct FilePayload {
    path: String,
    contents: String,
}

fn main() {
    // here `"quit".to_string()` defines the menu item id, and the second parameter is the menu item label.
    let new_dashboard = CustomMenuItem::new("new_dashboard".to_string(), "New Dashboard");
    let new_window = CustomMenuItem::new("new_window".to_string(), "New Window");
    let open_dashboard = CustomMenuItem::new("open_dashboard".to_string(), "Open Dashboard...");
    let save_dashboard = CustomMenuItem::new("save_dashboard".to_string(), "Save Dashboard");
    let save_dashboard_as =
        CustomMenuItem::new("save_dashboard_as".to_string(), "Save Dashboard As...");
    let settings = CustomMenuItem::new("settings".to_string(), "Settings");
    let plugins = CustomMenuItem::new("plugins".to_string(), "Manage Plugins");
    let close = CustomMenuItem::new("close".to_string(), "Close Window");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let submenu = Submenu::new(
        "File",
        Menu::new()
            .add_item(new_dashboard)
            .add_item(new_window)
            .add_native_item(MenuItem::Separator)
            .add_item(open_dashboard)
            .add_item(save_dashboard)
            .add_item(save_dashboard_as)
            // .add_native_item(MenuItem::Separator)
            // .add_item(settings)
            .add_item(plugins)
            .add_native_item(MenuItem::Separator)
            .add_item(close)
            .add_item(quit),
    );
    let menu = Menu::new()
        // .add_native_item(MenuItem::Copy)
        // .add_item(CustomMenuItem::new("hide", "Hide"))
        .add_submenu(submenu);
    let app = tauri::Builder::default();
    // let newDashboardHandler = app.tauri::generate_handler![greet]
    app.menu(menu)
        .on_menu_event(|event| match event.menu_item_id() {
            "new_dashboard" => {
                event.window().emit("newDashboard", {}).unwrap();
            }
            "new_window" => {
                let label = [
                    "window".to_string(),
                    chrono::offset::Local::now().timestamp_micros().to_string(),
                ]
                .join("");
                tauri::WindowBuilder::new(
                    &event.window().app_handle(),
                    label,
                    tauri::WindowUrl::App("index.html".into()),
                )
                .build()
                .expect("failed to build window")
                .set_title("FRC Web Components")
                .ok();
            }
            "open_dashboard" => {
                dialog::FileDialogBuilder::default()
                    .add_filter("HTML", &["html"])
                    .pick_file(move |path_buf| match path_buf {
                        Some(p) => {
                            // let mut data = String::new();
                            let file_path = p.into_os_string().into_string().unwrap();
                            let contents = fs::read_to_string(file_path.clone())
                                .expect("Should have been able to read the file");
                            event
                                .window()
                                .emit(
                                    "openDashboard",
                                    FilePayload {
                                        path: file_path.clone(),
                                        contents,
                                    },
                                )
                                .unwrap();
                        }
                        _ => {}
                    });
            }
            "save_dashboard_as" => {
                dialog::FileDialogBuilder::default()
                    .add_filter("HTML", &["html"])
                    .save_file(move |path_buf| match path_buf {
                        Some(p) => {
                            let file_path = p.into_os_string().into_string().unwrap();
                            event.window().emit("saveDashboardAs", file_path).unwrap();
                        }
                        _ => {}
                    });
            }
            "save_dashboard" => {
                event.window().emit("saveDashboard", "").unwrap();
            }
            "plugins" => {
                event.window().emit("openPluginsDialog", "").unwrap();
            }
            "quit" => {
                std::process::exit(0);
            }
            "close" => {
                // main_window.emit("event-name", Payload { message: "Tauri is awesome!".into() }).unwrap();
                event.window().close().unwrap();
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![greet])
        .invoke_handler(tauri::generate_handler![save_file])
        .setup(|app| {
            let config_path = path::config_dir()
                .unwrap()
                .into_os_string()
                .into_string()
                .unwrap();
            let window = app.get_window("main").unwrap();
            tauri::async_runtime::spawn(async move {
                let (mut rx, mut child) = Command::new_sidecar("app")
                    .expect("failed to setup `app` sidecar")
                    .args([&config_path])
                    .spawn()
                    .expect("Failed to spawn packaged node");

                let mut i = 0;
                while let Some(event) = rx.recv().await {
                    if let CommandEvent::Stdout(line) = event {
                        println!("{line}");
                        window
                            .emit("message", Some(format!("'{}'", line)))
                            .expect("failed to emit event");
                        i += 1;
                        if i == 4 {
                            child.write("message from Rust\n".as_bytes()).unwrap();
                            i = 0;
                        }
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
