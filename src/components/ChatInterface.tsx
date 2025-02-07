import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  Text,
  TextArea,
  Button,
  Flex,
  Card,
  IconButton,
  Spinner,
  Box,
  Grid,
  AspectRatio,
  Badge,
} from "@radix-ui/themes";
import { useChatContext } from "@/contexts/chat";
import { ChatMessage } from "@/models/chat";
import { UUID } from "crypto";
import {
  fetchChatData,
  onChatResponse,
  pauseChat,
  openImages,
  generateTitle,
} from "@/services/chat";
import {
  GearIcon,
  PaperPlaneIcon,
  PauseIcon,
  UploadIcon,
} from "@radix-ui/react-icons";
import { useRouter } from "next/router";
import { useSettingsContext } from "@/contexts/settings";
import ModelSelectDropdown from "@/components/ModelSelectDropdown";
import { AppSettings, ModelSettings } from "@/models/settings";
import ChatMessageBubble from "@/components/ChatMessageBubble";

const emptyMessage: ChatMessage = {
  id: "0-0-0-0-0",
  role: "assistant",
  content: "",
  isShown: true,
  prevId: null,
  nextIds: [],
  images: [],
};

interface ChatInterfaceProps {
  chatId: UUID;
}
const ChatInterface: React.FC<ChatInterfaceProps> = ({ chatId }) => {
  const router = useRouter();
  const { getShownChat, createChatMessage, updateChat } = useChatContext();
  const { getAppSettings, getModelSettings, setSettingsDialogOpen } =
    useSettingsContext();
  const [title, setTitle] = useState<string>("");
  const [appSettings, setAppSettings] = useState<AppSettings>();
  const [modelSettings, setModelSettings] = useState<ModelSettings>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [respondingMessage, setRespondingMessage] =
    useState<ChatMessage>(emptyMessage);
  const [modelName, setModelName] = useState<string>();
  const [input, setInput] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAppSettings().then(setAppSettings);
  }, [getAppSettings]);

  useEffect(() => {
    getModelSettings().then(setModelSettings);
  }, [getModelSettings]);

  useEffect(() => {
    if (chatId) {
      setIsLoading(false);
      setImages([]);
      setRespondingMessage(emptyMessage);
    }
  }, [chatId]);

  useEffect(() => {
    if (appSettings) setModelName(appSettings.selectedModel);
  }, [appSettings]);

  const syncSetMessages = useCallback(
    async (sync = false) => {
      if (chatId) {
        const chat = await getShownChat(chatId, sync);
        if (chat) {
          setMessages(chat.messages);
          setTitle(chat.title);
        } else {
          router.push("/");
        }
      }
    },
    [chatId, getShownChat, router]
  );

  useEffect(() => {
    syncSetMessages();
  }, [syncSetMessages]);

  useEffect(() => {
    const unlisten = onChatResponse((data) => {
      setRespondingMessage((prev) => ({
        ...prev,
        role: data.role,
        content: prev.content + data.content,
      }));
    });

    return () => {
      unlisten();
    };
  }, []);

  const handleSend = useCallback(async () => {
    if (chatId && input.trim()) {
      await createChatMessage(
        chatId,
        messages.length ? messages[messages.length - 1].id : null,
        "user",
        input,
        images
      );
      await syncSetMessages(true);
      setInput("");
      setImages([]);
      setIsLoading(true);
    }
  }, [chatId, createChatMessage, images, input, messages, syncSetMessages]);

  const handleRespond = useCallback(async () => {
    if (modelName && appSettings && modelSettings) {
      setRespondingMessage({ ...emptyMessage, llmModelName: modelName });

      await fetchChatData(
        appSettings.ollamaApiUrl,
        modelName,
        messages,
        modelSettings[modelName]
      );

      setIsLoading(false);
    }
  }, [appSettings, messages, modelName, modelSettings]);

  useEffect(() => {
    if (
      messages.length &&
      messages[messages.length - 1].role === "user" &&
      isLoading
    ) {
      handleRespond();
    }

    return () => {
      pauseChat();
    };
  }, [messages, handleRespond, isLoading]);

  useEffect(() => {
    if (chatId && !isLoading && respondingMessage.content) {
      createChatMessage(
        chatId,
        messages[messages.length - 1].id,
        respondingMessage.role,
        respondingMessage.content,
        [],
        modelName
      ).then(() => {
        setRespondingMessage(emptyMessage);
        syncSetMessages(true);
      });
    }
  }, [
    chatId,
    createChatMessage,
    isLoading,
    messages,
    modelName,
    respondingMessage.content,
    respondingMessage.role,
    syncSetMessages,
  ]);

  useEffect(() => {
    if (
      chatId &&
      modelName &&
      messages.length &&
      messages[messages.length - 1].role === "assistant" &&
      !isLoading &&
      title === "Untitled chat"
    ) {
      if (appSettings && appSettings.autoGenerateTitle) {
        generateTitle(appSettings.ollamaApiUrl, modelName, messages).then(
          (title) => {
            if (title) {
              updateChat(chatId, { title });
            }
          }
        );
      }
    }
  }, [appSettings, chatId, isLoading, messages, modelName, title, updateChat]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({
      block: "end",
      inline: "end",
      behavior: "smooth",
    });
  }, [isLoading, respondingMessage.content, messages]);

  return (
    <Flex
      direction="column"
      height="100%"
      width="100%"
      style={{ backgroundColor: "var(--gray-2)" }}
    >
      <Flex
        mt="0"
        direction="row"
        align="center"
        justify="between"
        gap="3"
        width="100%"
        p="3"
      >
        <ModelSelectDropdown
          modelName={modelName}
          setModelName={setModelName}
        />
        <IconButton
          size="3"
          variant="ghost"
          onClick={() => setSettingsDialogOpen(true)}
        >
          <GearIcon />
        </IconButton>
      </Flex>
      <Flex
        gap="3"
        direction="column"
        flexGrow="1"
        overflowY="auto"
        width="100%"
        style={{ borderTop: "1px solid var(--gray-6)" }}
      >
        {messages.map((message, index) => (
          <ChatMessageBubble
            key={index}
            message={message}
            respondingMode={false}
          />
        ))}
        {isLoading && (
          <ChatMessageBubble
            message={respondingMessage}
            respondingMode={true}
          />
        )}
        <Box ref={messageEndRef} />
      </Flex>
      <Flex
        gap="3"
        mb="0"
        direction="column"
        width="100%"
        p="3"
        style={{
          backgroundColor: "var(--accent-1)",
          boxShadow: "var(--shadow-4)",
          borderRadius: "var(--radius-5) var(--radius-5) 0 0",
        }}
      >
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          style={{ flex: 1 }}
        />
        {!!images.length && (
          <Grid columns={{ xs: "5", md: "8", lg: "9" }} gap="3" width="auto">
            {images.map((image, index) => (
              <AspectRatio key={index} ratio={1}>
                <img
                  src={`data:image/png;base64,${image}`}
                  alt=""
                  style={{
                    objectFit: "cover",
                    width: "100%",
                    height: "100%",
                    borderRadius: "var(--radius-2)",
                  }}
                />
              </AspectRatio>
            ))}
          </Grid>
        )}
        <Flex direction="row" gap="3" justify="between">
          {isLoading && modelName && (
            <IconButton onClick={pauseChat}>
              <PauseIcon />
            </IconButton>
          )}
          <Button
            variant="soft"
            onClick={() => openImages().then((list) => list && setImages(list))}
          >
            <UploadIcon />
            Upload Images
          </Button>
          <Button
            disabled={!modelName || !input.trim()}
            loading={isLoading}
            onClick={handleSend}
            style={{ flex: 1 }}
          >
            Send
            <PaperPlaneIcon />
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default ChatInterface;
