#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use chrono;
use std::fs;
use tauri::api::dialog;
use tauri::{CustomMenuItem, Manager, Menu, MenuItem, Submenu};
use std::fs::File;
use std::io::Write;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn save_file(path: &str, content: &str) {
    let mut f = File::create(path).expect("Unable to create file");
    f.write_all(content.as_bytes()).expect("Unable to write data");
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
            .add_native_item(MenuItem::Separator)
            .add_item(settings)
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
                            let contents = fs::read_to_string(file_path)
                                .expect("Should have been able to read the file");
                            println!("{contents}");
                            event.window().emit("openDashboard", contents ).unwrap();
                            // println!("{}", file_path.clone());
                        }
                        _ => {}
                    });
            }
            "save_dashboard_as" => {
                dialog::FileDialogBuilder::default()
                    .add_filter("HTML", &["html"])
                    .save_file(move |path_buf| match path_buf {
                        Some(p) => {
                            // let mut data = String::new();
                            let file_path = p.into_os_string().into_string().unwrap();
                            event.window().emit("saveDashboardAs", file_path ).unwrap();
                            // println!("{}", file_path.clone());
                        }
                        _ => {}
                    });
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
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
