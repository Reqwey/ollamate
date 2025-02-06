export interface ModelOptions {
  mirostat: number;
  mirostatEta: number;
  mirostatTau: number;
  numCtx: number;
  repeatLastN: number;
  repeatPenalty: number;
  temperature: number;
  seed: number;
  numPredict: number;
  topK: number;
  topP: number;
  minP: number;
}

export const defaultModelOptions: ModelOptions = {
  mirostat: 0,
  mirostatEta: 0.1,
  mirostatTau: 5.0,
  numCtx: 2048,
  repeatLastN: 64,
  repeatPenalty: 1.1,
  temperature: 0.8,
  seed: 0,
  numPredict: -1,
  topK: 40,
  topP: 0.9,
  minP: 0.0,
};

export type ModelSettings = Record<string, ModelOptions>;

export type AppSettings = {
  ollamaApiUrl: string;
  autoGenerateTitle: boolean;
  selectedModel: string | undefined;
}

export const defaultAppSettings: AppSettings = {
  ollamaApiUrl: "http://localhost:11434",
  autoGenerateTitle: true,
  selectedModel: undefined,
}