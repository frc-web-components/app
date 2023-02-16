#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use chrono;
use std::fs;
use std::fs::File;
use std::io::Write;
use tauri::api::dialog;
use tauri::{api::path, CustomMenuItem, Manager, Menu, MenuItem, Submenu};
use tauri::{utils::config::AppUrl, window::WindowBuilder, WindowUrl};
use tokio::runtime::Runtime;

mod server;

use crate::server::start_server;

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

#[tokio::main]
async fn main() {
    let port = portpicker::pick_unused_port().expect("failed to find unused port");

    let mut context = tauri::generate_context!();
    let url = format!("http://localhost:{}", port).parse().unwrap();
    let window_url = WindowUrl::External(url);
    // rewrite the config so the IPC is enabled on this URL
    context.config_mut().build.dist_dir = AppUrl::Url(window_url.clone());
    context.config_mut().build.dev_path = AppUrl::Url(window_url.clone());

    // here `"quit".to_string()` defines the menu item id, and the second parameter is the menu item label.
    let new_dashboard = CustomMenuItem::new("new_dashboard".to_string(), "New Dashboard");
    let new_window = CustomMenuItem::new("new_window".to_string(), "New Window");
    let open_dashboard = CustomMenuItem::new("open_dashboard".to_string(), "Open Dashboard...");
    let save_dashboard = CustomMenuItem::new("save_dashboard".to_string(), "Save Dashboard");
    let save_dashboard_as =
        CustomMenuItem::new("save_dashboard_as".to_string(), "Save Dashboard As...");
    let settings = CustomMenuItem::new("settings".to_string(), "Settings");
    let plugins = CustomMenuItem::new("plugins".to_string(), "Plugins");
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
            .add_native_item(MenuItem::Separator)
            .add_item(plugins)
            .add_native_item(MenuItem::Separator)
            .add_item(close)
            .add_item(quit),
    );
    let menu = Menu::new()
        // .add_native_item(MenuItem::Copy)
        // .add_item(CustomMenuItem::new("hide", "Hide"))
        .add_submenu(submenu);

    // Create a new runtime
    let mut rt = Runtime::new().unwrap();

    rt.spawn(async {
        start_server().await;
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_localhost::Builder::new(port).build())
        .menu(menu)
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
        .run(context)
        .expect("error while running tauri application");
}
