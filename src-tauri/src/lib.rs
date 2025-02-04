mod chat;
use chat::models::AppState;
use tokio::sync::Mutex;
use tauri::{Builder, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::new().build())
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
            chat::commands::fetch_model_list
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
