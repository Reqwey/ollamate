import { useChatContext } from "@/contexts/chat";
import { useSettingsContext } from "@/contexts/settings";
import { Button, Flex, Text } from "@radix-ui/themes";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";
import { AiOutlineMessage } from "react-icons/ai";

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
    <Flex
      direction="column"
      height="100%"
      width="100%"
      style={{ backgroundColor: "var(--gray-2)" }}
    >
      <Flex
        width="100%"
        height="100%"
        align="center"
        justify="center"
        direction="column"
        gap="4"
      >
        <img
          src={logo.src}
          alt="OllaMate Logo"
          width="100"
          height="100"
          style={{
            borderRadius: "50%",
            marginBottom: "20px",
            boxShadow: "var(--shadow-6)",
          }}
        />
        <Text size="3" weight="light" color="gray">
          Yet another Ollama chat interface.
        </Text>
        <Flex gap="2" mt="4">
          <Button
            variant="soft"
            radius="full"
            size="4"
            style={{ width: "250px" }}
            onClick={() => {
              createChat().then((chat) => {
                if (chat) {
                  router.push(`/chat/${chat.id}`);
                }
              });
            }}
          >
            <AiOutlineMessage />
            Start Chatting
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
}
