import { useSettingsContext } from "@/contexts/settings";
import { AppSettings, ModelSettings, AccentColor } from "@/models/settings";
import {
  Box,
  Button,
  Card,
  DataList,
  Dialog,
  Flex,
  Grid,
  Inset,
  Radio,
  Separator,
  Switch,
  Tabs,
  Text,
  TextField,
  Tooltip,
} from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { ColorWheelIcon, GlobeIcon, RocketIcon } from "@radix-ui/react-icons";

function upperFirst(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

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
                      <Text weight="light" as="label" size="2">
                        <Flex gap="2" align="center">
                          <RocketIcon />
                          Auto generate title:
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

                      <Separator my="1" size="4" />

                      <Text weight="light" as="label" size="2">
                        <Flex gap="2" align="center">
                          <GlobeIcon />
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

                      <Separator my="1" size="4" />

                      <Text weight="light" as="label" size="2">
                        <Flex gap="2" align="center">
                          <ColorWheelIcon />
                          Accent color:
                        </Flex>
                        <Grid mt="1" columns="13" gap="2" role="group">
                          {Object.values(AccentColor).map((color) => (
                            <label
                              key={color}
                              className="rt-ThemePanelSwatch"
                              style={{ backgroundColor: `var(--${color}-9)` }}
                            >
                              <Tooltip content={`${upperFirst(color)}`}>
                                <input
                                  className="rt-ThemePanelSwatchInput"
                                  type="radio"
                                  name="accentColor"
                                  value={color}
                                  checked={appSettings.accentColor === color}
                                  onChange={(event) =>
                                    setAppSettings({
                                      ...appSettings,
                                      accentColor: event.target
                                        .value as AccentColor,
                                    })
                                  }
                                />
                              </Tooltip>
                            </label>
                          ))}
                        </Grid>
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
