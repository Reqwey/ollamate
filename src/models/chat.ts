import { UUID } from "crypto";

export type Role = "system" | "user" | "assistant" | "tool";

export interface ChatMessage {
	id: UUID;
	isShown: boolean;
	prevId: UUID | null;
	nextIds: UUID[];
  role: Role;
  content: string;
  images: string[];
	llmModelName?: string;
}

export interface ChatInfo {
	id: UUID;
	title: string;
	updatedAt: Date;
}

export interface Chat {
	id: UUID;
	title: string;
	updatedAt: Date;
	messages: ChatMessage[];
}

export interface StoredChat {
	id: UUID;
	title: string;
	updatedAt: string;
	messages: ChatMessage[];
}

export interface LLMModel {
	name: string;
	parameterSize: string;
}