import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { ChatMessage, LLMModel } from "@/models/chat";

export const fetchChatData = async (
  modelName: string,
  messages: ChatMessage[]
) => {
  try {
    await invoke("fetch_chat_data", { modelName, messages });
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

export const fetchModelList = async () => {
  try {
    const models = await invoke<LLMModel[]>("fetch_model_list");
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
  }
};

export const generateTitle = async (
  modelName: string,
  messages: ChatMessage[]
) => {
  try {
    const title = await invoke<string>("generate_title", { modelName, messages });
    return title;
  } catch (error) {
    console.error(error);
  }
};
