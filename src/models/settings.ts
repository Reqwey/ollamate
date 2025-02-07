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

export enum AccentColor {
  Gray = "gray",
  Gold = "gold",
  Bronze = "bronze",
  Brown = "brown",
  Yellow = "yellow",
  Amber = "amber",
  Orange = "orange",
  Tomato = "tomato",
  Red = "red",
  Ruby = "ruby",
  Crimson = "crimson",
  Pink = "pink",
  Plum = "plum",
  Purple = "purple",
  Violet = "violet",
  Iris = "iris",
  Indigo = "indigo",
  Blue = "blue",
  Cyan = "cyan",
  Teal = "teal",
  Jade = "jade",
  Green = "green",
  Grass = "grass",
  Lime = "lime",
  Mint = "mint",
  Sky = "sky"
}

export type AppSettings = {
  ollamaApiUrl: string;
  autoGenerateTitle: boolean;
  selectedModel: string | undefined;
  accentColor: AccentColor;
};

export const defaultAppSettings: AppSettings = {
  ollamaApiUrl: "http://localhost:11434",
  autoGenerateTitle: true,
  selectedModel: undefined,
  accentColor: AccentColor.Indigo,
};
