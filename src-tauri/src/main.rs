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
use tauri::{PhysicalPosition, PhysicalSize, Position, Size};
use tokio::runtime::Runtime;

mod server;

use crate::server::start_server;

use window_shadows::set_shadow;

#[tauri::command]
async fn create_window(
    app: tauri::AppHandle,
    width: u32,
    height: u32,
    x: i32,
    y: i32,
    path: Option<String>,
) {
    let label = [
        "window".to_string(),
        chrono::offset::Local::now().timestamp_micros().to_string(),
    ]
    .join("");
    let mut url = "index.html".to_owned();
    let mut query_str: String = String::from("");
    if let Some(path_str) = path.clone() {
        query_str = format!("?dashboardPath={}", path_str.as_str());
    }
    url.push_str(query_str.as_str());

    let window = tauri::WindowBuilder::new(&app, label, tauri::WindowUrl::App(url.into()))
        .build()
        .expect("failed to build window");

    window.set_title("FRC Web Components").ok();
    window
        .set_size(Size::Physical(PhysicalSize { width, height }))
        .ok();
    window
        .set_position(Position::Physical(PhysicalPosition { x, y }))
        .ok();

    // #[cfg(any(windows, target_os = "macos"))]
    window.set_decorations(false).ok();
    set_shadow(&window, true).unwrap();
    
}

#[tauri::command]
async fn create_new_window(app: tauri::AppHandle) {
    let label = [
        "window".to_string(),
        chrono::offset::Local::now().timestamp_micros().to_string(),
    ]
    .join("");
    let window = tauri::WindowBuilder::new(&app, label, tauri::WindowUrl::App("index.html".into()))
        .build()
        .expect("failed to build window");

    window.set_decorations(false).ok();
    window.set_title("FRC Web Components").ok();
    set_shadow(&window, true).expect("Unsupported platform!");
}

#[tauri::command]
async fn get_file_contents(path: Option<String>) -> Option<String> {
    if let Some(path_str) = path {
        if let Ok(contents) = fs::read_to_string(path_str.clone()) {
            return Some(contents);
        }
    }
    return None;
}

#[tauri::command]
fn get_window_labels(app: tauri::AppHandle) -> Vec<String> {
    let labels: Vec<String> = app
        .windows()
        .values()
        .map(|window| String::from(window.label()))
        .collect();
    labels
}

fn get_environment_variable(name: &str) -> String {
    std::env::var(name).unwrap_or_else(|_| "".to_string())
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
            .add_filter("JSON", &["json"])
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

// the payload type must implement `Serialize` and `Clone`.
#[derive(Clone, serde::Serialize)]
struct FilePayload {
    path: String,
    contents: String,
}

#[tokio::main]
async fn main() {
    // let port = portpicker::pick_unused_port().expect("failed to find unused port");
    let port = 18126;
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

    let tauri_env = get_environment_variable("TAURI_ENV");
    let context = if tauri_env == "dev" {
        tauri::generate_context!()
    } else {
        context
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_localhost::Builder::new(port).build())
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            set_shadow(&window, true).expect("Unsupported platform!");
            Ok(())
        })
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
                    .add_filter("JSON", &["json"])
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
                    .add_filter("JSON", &["json"])
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
        .invoke_handler(tauri::generate_handler![
            save_file,
            create_window,
            create_new_window,
            get_window_labels,
            get_file_contents,
        ])
        .run(context)
        .expect("error while running tauri application");
}
