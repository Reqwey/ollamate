mod chat;
use chat::models::AppState;
use tauri::{Builder, Manager};
use tokio::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            app.manage(Mutex::new(AppState::default()));
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            chat::commands::fetch_chat_data,
            chat::commands::pause_chat,
            chat::commands::fetch_model_list,
            chat::commands::open_images,
            chat::commands::generate_title,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
