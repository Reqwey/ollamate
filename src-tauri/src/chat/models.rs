use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Model {
    pub name: String,
    pub parameter_size: String,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
    pub images: Vec<String>,
}

#[derive(Default)]
pub struct AppState {
    pub stop_flag: bool,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelOptions {
    pub mirostat: i32,
    pub mirostat_eta: f32,
    pub mirostat_tau: f32,
    pub num_ctx: i32,
    pub repeat_last_n: i32,
    pub repeat_penalty: f32,
    pub temperature: f32,
    pub seed: i32,
    pub num_predict: i32,
    pub top_k: i32,
    pub top_p: f32,
    pub min_p: f32,
}
