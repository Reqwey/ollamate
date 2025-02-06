import { useSettingsContext } from "@/contexts/settings";
import { AppSettings, ModelSettings } from "@/models/settings";
import {
  Box,
  Button,
  Card,
  DataList,
  Dialog,
  Flex,
  Inset,
  Radio,
  RadioCards,
  Switch,
  Tabs,
  Text,
  TextField,
} from "@radix-ui/themes";
import { useEffect, useState } from "react";

const SettingsDialog: React.FC = () => {
  const {
    settingsDialogOpen,
    setSettingsDialogOpen,
    getAppSettings,
    getModelSettings,
    saveAppSettings,
    saveModelSettings,
  } = useSettingsContext();

  const [appSettings, setAppSettings] = useState<AppSettings>();
  const [modelSettings, setModelSettings] = useState<ModelSettings>();

  useEffect(() => {
    getAppSettings().then(setAppSettings);
  }, [getAppSettings]);

  useEffect(() => {
    getModelSettings().then(setModelSettings);
  }, [getModelSettings]);

  return (
    <Dialog.Root open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
      <Dialog.Content
        style={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Dialog.Title>Settings</Dialog.Title>
        <Inset side="x">
          <Flex flexGrow="1" width="100%">
            <Tabs.Root defaultValue="app" style={{ width: "100%" }}>
              <Tabs.List>
                <Tabs.Trigger value="app">App Settings</Tabs.Trigger>
                <Tabs.Trigger value="models">Model Options</Tabs.Trigger>
              </Tabs.List>

              <Box pt="3" width="100%" height="100%">
                <Tabs.Content value="app">
                  {appSettings && (
                    <Flex direction="column" gap="3" p="4">
                      <Text as="label" size="2">
                        <Flex gap="2" align="center">
                          Auto Generate Title:
                          <Switch
                            size="2"
                            checked={appSettings.autoGenerateTitle}
                            onCheckedChange={(checked) => {
                              setAppSettings({
                                ...appSettings,
                                autoGenerateTitle: checked,
                              });
                            }}
                          />
                          {appSettings.autoGenerateTitle ? "On" : "Off"}
                        </Flex>
                      </Text>

                      <Text as="label" size="2">
                        <Flex gap="2" align="center">
                          Ollama API URL:
                          <TextField.Root
                            size="2"
                            style={{ flex: 1 }}
                            value={appSettings.ollamaApiUrl}
                            onChange={(e) => {
                              setAppSettings({
                                ...appSettings,
                                ollamaApiUrl: e.target.value.trim(),
                              });
                            }}
                          />
                        </Flex>
                      </Text>
                    </Flex>
                  )}
                </Tabs.Content>

                <Tabs.Content
                  value="models"
                  style={{ height: "100%", overflow: "auto" }}
                >
                  {appSettings && modelSettings && (
                    <Flex direction="row" p="4">
                      <Flex direction="column" width="30%" gap="1">
                        {Object.keys(modelSettings).map((modelName) => (
                          <Card
                            size="1"
                            className={
                              appSettings.selectedModel === modelName
                                ? "selected"
                                : ""
                            }
                            style={{
                              width: "100%",
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              setAppSettings({
                                ...appSettings,
                                selectedModel: modelName,
                              });
                            }}
                            variant="classic"
                            key={modelName}
                          >
                            <Flex
                              direction="row"
                              width="100%"
                              gap="2"
                              align="center"
                            >
                              <Radio
                                checked={
                                  modelName === appSettings.selectedModel
                                }
                                value={modelName}
                              />
                              <Flex direction="column" gap="1">
                                <Text size="1" weight="medium">
                                  {modelName}
                                </Text>
                                {modelName === appSettings.selectedModel && (
                                  <Text size="1" color="gray">
                                    Default
                                  </Text>
                                )}
                              </Flex>
                            </Flex>
                          </Card>
                        ))}
                      </Flex>

                      <Flex flexGrow="1" ml="2" height="40vh" overflow="auto">
                        <Card
                          style={{
                            width: "100%",
                            height: "100%",
                          }}
                        >
                          <DataList.Root
                            style={{ height: "100%", overflow: "auto" }}
                          >
                            {appSettings.selectedModel &&
                              Object.entries(
                                modelSettings[appSettings.selectedModel]
                              ).map(([key, value]) => (
                                <DataList.Item key={key}>
                                  <DataList.Label>{key}</DataList.Label>
                                  <TextField.Root
                                    value={value}
                                    onChange={(e) => {
                                      if (
                                        modelSettings &&
                                        appSettings &&
                                        appSettings.selectedModel
                                      ) {
                                        setModelSettings({
                                          ...modelSettings,
                                          [appSettings.selectedModel]: {
                                            ...modelSettings[
                                              appSettings.selectedModel
                                            ],
                                            [key]: e.target.value,
                                          },
                                        });
                                      }
                                    }}
                                  />
                                </DataList.Item>
                              ))}
                          </DataList.Root>
                        </Card>
                      </Flex>
                    </Flex>
                  )}
                </Tabs.Content>
              </Box>
            </Tabs.Root>
          </Flex>
        </Inset>
        <Flex gap="3" mt="4" justify="end" height="fit-content">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </Dialog.Close>
          <Dialog.Close>
            <Button
              onClick={() => {
                if (appSettings) saveAppSettings(appSettings);
                if (modelSettings) saveModelSettings(modelSettings);
              }}
            >
              Save
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default SettingsDialog;
