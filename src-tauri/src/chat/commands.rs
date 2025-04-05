use crate::error::{OllamateError, OllamateResult};

use super::models::{AppState, ChatMessage, Model, ModelOptions};
use base64::{self, Engine};
use futures_util::StreamExt;
use serde_json::Value;
use tauri::{AppHandle, Emitter, State};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_http::reqwest::Client;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn fetch_chat_data(
    app: AppHandle,
    app_state: State<'_, Mutex<AppState>>,
    api_url: String,
    model_name: String,
    messages: Vec<ChatMessage>,
    options: ModelOptions,
) -> OllamateResult<()> {
    let mut state = app_state.lock().await;
    state.stop_flag = false;
    drop(state);

    let client = Client::new();
    let response = client
        .post(format!("{}/api/chat", api_url))
        .body(
            serde_json::json!({
                "model": model_name,
                "messages": messages,
                "options": options
            })
            .to_string(),
        )
        .send()
        .await?;

    if !response.status().is_success() {
        return Err(OllamateError(format!(
            "HTTP error! status: {}",
            response.status()
        )));
    }

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));
        let buffer_clone = buffer.clone();
        let lines: Vec<&str> = buffer_clone.split('\n').collect();
        buffer = lines.last().unwrap_or(&"").to_string();
        for line in lines.iter().take(lines.len() - 1) {
            if !line.trim().is_empty() {
                let data: Value = serde_json::from_str(line)?;
                app.emit("chat-response", data["message"].clone())?;
            }
        }
        let state = app_state.lock().await;
        let stop_flag = state.stop_flag;
        drop(state);
        // 检查 stop_flag
        if stop_flag {
            let _ = client
                .post(format!("{}/api/chat", api_url))
                .body(
                    serde_json::json!({
                        "model": model_name.clone(),
                        "messages": Vec::<ChatMessage>::new(),
                        "keep_alive": 0,
                    })
                    .to_string(),
                )
                .send()
                .await;
            break;
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn pause_chat(state: State<'_, Mutex<AppState>>) -> OllamateResult<()> {
    let mut state = state.lock().await;
    state.stop_flag = true;

    Ok(())
}

#[tauri::command]
pub async fn fetch_model_list(api_url: String) -> OllamateResult<Vec<Model>> {
    let client = Client::new();
    let response = client.get(format!("{}/api/tags", api_url)).send().await?;

    if !response.status().is_success() {
        return Err(OllamateError(format!(
            "HTTP error! status: {}",
            response.status()
        )));
    }

    let data: Value = response.json().await?;
    let models = data["models"]
        .as_array()
        .ok_or(OllamateError("Invalid response format".into()))?
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

#[tauri::command]
pub async fn open_images(app: AppHandle) -> OllamateResult<Vec<String>> {
    let image_paths = app
        .dialog()
        .file()
        .add_filter("Images", &["png", "jpeg", "jpg", "gif", "bmp", "webp"])
        .blocking_pick_files();
    let mut base64_images = Vec::new();

    if let Some(paths) = image_paths {
        for path in paths {
            let image_data = std::fs::read(path.to_string())?;
            let base64_image = base64::engine::general_purpose::STANDARD.encode(&image_data);
            base64_images.push(base64_image);
        }
    }

    Ok(base64_images)
}

#[tauri::command]
pub async fn generate_title(
    api_url: String,
    model_name: String,
    messages: Vec<ChatMessage>,
) -> OllamateResult<String> {
    let prompt = ChatMessage {
        role: "system".to_string(),
        content:
            "You are a helpful assistant that generates a short title for the above conversation, \\
         and then concludes the conversation with a single emoji. \\
         You should respond both items in given json format."
                .to_string(),
        images: vec![],
    };
    let mut msgs = messages.clone();
    msgs.push(prompt);
    let client = Client::new();
    let response = client
        .post(format!("{}/api/chat", api_url))
        .body(
            serde_json::json!({
                "model": model_name,
                "messages": msgs,
                "stream": false,
                "format": {
                    "type": "object",
                    "properties": {
                        "title": {
                            "type": "string"
                        },
                        "emoji": {
                            "type": "string"
                        }
                    },
                    "required": [
                        "title",
                        "emoji"
                    ]
                },
                "options": {
                    "temperature": 0
                }
            })
            .to_string(),
        )
        .send()
        .await?;
    let json_response: Value = response.json().await?;
    let content = json_response["message"]["content"]
        .as_str()
        .unwrap_or_default();
    let structured_content: Value = serde_json::from_str(content).unwrap_or_default();
    let title = structured_content["title"]
        .as_str()
        .unwrap_or_default()
        .to_string();
    let emoji = structured_content["emoji"]
        .as_str()
        .unwrap_or_default()
        .to_string();

    if title.is_empty() || emoji.is_empty() {
        return Err(OllamateError("Failed to generate title".into()));
    }

    Ok(emoji + " " + &title)
}
