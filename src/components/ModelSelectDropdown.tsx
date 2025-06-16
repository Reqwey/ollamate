import { useSettingsContext } from "@/contexts/settings";
import { ModelInfo } from "@/models/chat";
import { fetchModelList } from "@/services/chat";
import { DropdownMenu, Button, Code, Text } from "@radix-ui/themes";
import { useEffect, useState } from "react";

interface ModelSelectDropdownProps {
  modelName: string | undefined;
  setModelName: (name: string) => void;
}
const ModelSelectDropdown: React.FC<ModelSelectDropdownProps> = ({
  modelName,
  setModelName,
}) => {
  const { getAppSettings, saveAppSettings } = useSettingsContext();
  const [modelList, setModelList] = useState<ModelInfo[]>([]);

  useEffect(() => {
    const loadModelList = async () => {
      const apiUrl = (await getAppSettings()).ollamaApiUrl;
      const models = await fetchModelList(apiUrl);
      setModelList(models);
    };

    loadModelList();
  }, [getAppSettings]);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button variant="outline" radius="full" m="2" mb="0">
          {modelName || "Select a model"}
          <DropdownMenu.TriggerIcon />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content variant="soft">
        {modelList.length > 0 ? (
          <DropdownMenu.RadioGroup value={modelName}>
            {modelList.map((model) => (
              <DropdownMenu.RadioItem
                key={model.name}
                value={model.name}
                onSelect={() => {
                  setModelName(model.name);
                  saveAppSettings({ selectedModel: model.name });
                }}
              >
                <Text>{model.name}</Text>
                <Code>{model.parameterSize}</Code>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        ) : (
          <DropdownMenu.Item disabled>No models found</DropdownMenu.Item>
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export default ModelSelectDropdown;
