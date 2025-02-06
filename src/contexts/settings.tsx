import {
  AppSettings,
  defaultAppSettings,
  defaultModelOptions,
  ModelOptions,
  ModelSettings,
} from "@/models/settings";
import { fetchModelList } from "@/services/chat";
import { Store } from "@tauri-apps/plugin-store";
import { createContext, useCallback, useContext, useState } from "react";

interface SettingsContextProps {
  settingsDialogOpen: boolean;
  getAppSettings: (sync?: boolean) => Promise<AppSettings>;
  getModelSettings: (sync?: boolean) => Promise<ModelSettings>;
  setSettingsDialogOpen: (open: boolean) => void;
  saveAppSettings: (value: Partial<AppSettings>) => Promise<void>;
  saveModelSettings: (value: ModelSettings) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextProps | undefined>(
  undefined
);

export const SettingsContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>();
  const [modelSettings, setModelSettings] = useState<ModelSettings>();

  const fetchStore = useCallback(async () => {
    let store = await Store.get("settings.json");
    if (!store) store = await Store.load("settings.json");
    return store;
  }, []);

  const getAppSettings = useCallback(
    async (sync = false) => {
      const store = await fetchStore();

      if (!sync && appSettings) return appSettings;

      const storedAppSettings = await store.get<AppSettings>("app-settings");

      if (!storedAppSettings) {
        setAppSettings(defaultAppSettings);
        await store.set("app-settings", defaultAppSettings);
        return defaultAppSettings;
      } else {
        setAppSettings(storedAppSettings);
        return storedAppSettings;
      }
    },
    [appSettings, fetchStore]
  );

  const saveAppSettings = useCallback(
    async (value: Partial<AppSettings>) => {
      const store = await fetchStore();
      const formerSettings = await store.get<AppSettings>("app-settings");
      await store.set("app-settings", { ...formerSettings, ...value });
      await getAppSettings(true);
    },
    [fetchStore, getAppSettings]
  );

  const getModelSettings = useCallback(
    async (sync = false) => {
      if (!sync && modelSettings) return modelSettings;

      const store = await fetchStore();
      const appSettings = await getAppSettings();
      const storedModelSettings = await store.get<ModelSettings>(
        "model-settings"
      );
      const newModelList = await fetchModelList(appSettings.ollamaApiUrl);
      const newModelSettings: ModelSettings = Object.fromEntries(
        newModelList.map((modelInfo) => {
          if (storedModelSettings) {
            const model = storedModelSettings[modelInfo.name];
            if (model) {
              return [modelInfo.name, { ...model }];
            }
          }

          return [modelInfo.name, defaultModelOptions];
        })
      );
      setModelSettings(newModelSettings);
      await store.set("model-settings", newModelSettings);
      return newModelSettings;
    },
    [fetchStore, getAppSettings, modelSettings]
  );

  const saveModelSettings = useCallback(
    async (value: ModelSettings) => {
      const store = await fetchStore();
      await store.set("model-settings", value);
      await getModelSettings(true);
    },
    [fetchStore, getModelSettings]
  );

  return (
    <SettingsContext.Provider
      value={{
        settingsDialogOpen,
        getAppSettings,
        getModelSettings,
        setSettingsDialogOpen,
        saveAppSettings,
        saveModelSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error(
      "useSettingsContext must be used within a SettingsContextProvider"
    );
  }
  return context;
};
