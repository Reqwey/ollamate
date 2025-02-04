use super::models::{AppState, ChatMessage, Model};
use futures_util::StreamExt;
use serde_json::Value;
use tauri::{AppHandle, Emitter, State};
use tauri_plugin_http::reqwest::Client;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn fetch_chat_data(
    app: AppHandle,
    app_state: State<'_, Mutex<AppState>>,
    model_name: String,
    messages: Vec<ChatMessage>,
) -> Result<(), String> {
    let mut state = app_state.lock().await;
    state.stop_flag = false;
    drop(state);

    let client = Client::new();
    let response = client
        .post("http://localhost:11434/api/chat")
        .body(
            serde_json::json!({
                "model": model_name,
                "messages": messages,
            })
            .to_string(),
        )
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("HTTP error! status: {}", response.status()));
    }

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));
        let buffer_clone = buffer.clone();
        let lines: Vec<&str> = buffer_clone.split('\n').collect();
        buffer = lines.last().unwrap_or(&"").to_string();
        for line in lines.iter().take(lines.len() - 1) {
            if !line.trim().is_empty() {
                let data: Value = serde_json::from_str(line).map_err(|e| e.to_string())?;
                app.emit("chat-response", data["message"].clone())
                    .map_err(|e| e.to_string())?;
            }
        }
        let state = app_state.lock().await;
        let stop_flag = state.stop_flag;
        drop(state);
        // 检查 stop_flag
        if stop_flag {
            let _ = client
                .post("http://localhost:11434/api/chat")
                .body(
                    serde_json::json!({
                        "model": model_name.clone(),
                        "messages": Vec::<ChatMessage>::new(),
                        "keep_alive": 0,
                    })
                    .to_string(),
                )
                .send()
                .await
                .map_err(|e| e.to_string());
            break;
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn pause_chat(state: State<'_, Mutex<AppState>>) -> Result<(), String> {
    let mut state = state.lock().await;
    state.stop_flag = true;
    drop(state); // 释放锁

    Ok(())
}

#[tauri::command]
pub async fn fetch_model_list() -> Result<Vec<Model>, String> {
    let client = Client::new();
    let response = client
        .get("http://localhost:11434/api/tags")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("HTTP error! status: {}", response.status()));
    }

    let data: Value = response.json().await.map_err(|e| e.to_string())?;
    let models = data["models"]
        .as_array()
        .ok_or("Invalid response format")?
        .iter()
        .map(|model| Model {
            name: model["name"].as_str().unwrap_or_default().to_string(),
            parameter_size: model["details"]["parameter_size"]
                .as_str()
                .unwrap_or_default()
                .to_string(),
        })
        .collect();

    Ok(models)
}
