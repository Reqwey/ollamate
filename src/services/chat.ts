import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { ChatMessage, ModelInfo } from "@/models/chat";
import { ModelOptions } from "@/models/settings";

export const fetchChatData = async (
  apiUrl: string,
  modelName: string,
  messages: ChatMessage[],
  options: ModelOptions
) => {
  try {
    await invoke("fetch_chat_data", { apiUrl, modelName, messages, options });
  } catch (error) {
    console.error(error);
  }
};

export const onChatResponse = (callback: (data: ChatMessage) => void) => {
  const unlisten = listen<ChatMessage>("chat-response", (event) => {
    callback(event.payload);
  });

  return () => {
    unlisten.then((f) => f());
  };
};

export const pauseChat = async () => {
  try {
    await invoke("pause_chat");
  } catch (error) {
    console.error(error);
  }
};

export const fetchModelList = async (apiUrl: string) => {
  try {
    const models = await invoke<ModelInfo[]>("fetch_model_list", { apiUrl });
    return models;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const openImages = async () => {
  try {
    const images = await invoke<string[]>("open_images");
    return images;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const generateTitle = async (
  apiUrl: string,
  modelName: string,
  messages: ChatMessage[]
) => {
  try {
    const title = await invoke<string>("generate_title", {
      apiUrl,
      modelName,
      messages,
    });
    return title;
  } catch (error) {
    console.error(error);
    return "";
  }
};
