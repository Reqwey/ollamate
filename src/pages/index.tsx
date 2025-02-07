import TitleBar from "@/components/ModelSelectDropdown";
import { useChatContext } from "@/contexts/chat";
import { useSettingsContext } from "@/contexts/settings";
import { ChatBubbleIcon, RocketIcon } from "@radix-ui/react-icons";
import { Button, Flex, Text, TextField } from "@radix-ui/themes";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function HomePage() {
  const { createChat } = useChatContext();
  const { getAppSettings } = useSettingsContext();
  const [modelName, setModelName] = useState<string>();
  const router = useRouter();

  useEffect(() => {
    getAppSettings().then((appSettings) =>
      setModelName(appSettings.selectedModel)
    );
  }, [getAppSettings]);

  return (
    <Flex direction="column" height="100%" width="100%">
      <Flex
        width="100%"
        height="100%"
        align="center"
        justify="center"
        direction="column"
      >
        <Text size="6" weight="bold">
          Welcome to OllaMate
        </Text>
        <Text size="3" weight="medium">
          Yet another Ollama chat interface.
        </Text>
        <Flex gap="2" mt="4">
          <TitleBar modelName={modelName} setModelName={setModelName} />
          <Button
            variant="classic"
            onClick={() => {
              createChat().then((chat) => {
                if (chat) {
                  router.push(`/chat/${chat.id}`);
                }
              });
            }}
          >
            Start Chatting
            <RocketIcon />
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
}
