import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  Text,
  TextArea,
  Flex,
  IconButton,
  Box,
  Grid,
  AspectRatio,
  Kbd,
  Tooltip,
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
  const {
    getShownChat,
    createChatMessage,
    changeShownChatMessage,
    deleteChatMessage,
    updateChat,
  } = useChatContext();
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
    if (chatId && input.trim() && modelName) {
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
  }, [
    chatId,
    createChatMessage,
    images,
    input,
    messages,
    modelName,
    syncSetMessages,
  ]);

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

  const handleDelete = useCallback(
    async (messageId: UUID) => {
      await deleteChatMessage(chatId, messageId);
      await syncSetMessages(true);
    },
    [chatId, deleteChatMessage, syncSetMessages]
  );

  const handleReGenerate = useCallback(
    async (message: ChatMessage) => {
      if (message.role === "assistant") {
        const newMessageId = await createChatMessage(
          chatId,
          message.prevId,
          "assistant",
          "",
          [],
          modelName
        );
        if (newMessageId) {
          await changeShownChatMessage(chatId, message.id, newMessageId);
          await syncSetMessages(true);
          await handleDelete(newMessageId);
          setIsLoading(true);
        }
      }
    },
    [
      changeShownChatMessage,
      chatId,
      createChatMessage,
      handleDelete,
      modelName,
      syncSetMessages,
    ]
  );

  const handleChangeShownMessage = useCallback(
    async (fromId: UUID, toId: UUID) => {
      await changeShownChatMessage(chatId, fromId, toId);
      await syncSetMessages(true);
    },
    [chatId, changeShownChatMessage, syncSetMessages]
  );

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
    let isMounted = true;
    const currentChatId = chatId;

    if (
      chatId &&
      modelName &&
      messages.length &&
      messages[messages.length - 1].role === "assistant" &&
      !isLoading &&
      title.length === 0
    ) {
      if (appSettings && appSettings.autoGenerateTitle) {
        generateTitle(appSettings.ollamaApiUrl, modelName, messages).then(
          (generatedTitle) => {
            if (isMounted && generatedTitle && currentChatId === chatId) {
              updateChat(chatId, { title: generatedTitle });
            }
          }
        );
      }
    }

    return () => {
      isMounted = false;
    };
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
            alternatives={
              message.prevId
                ? messages.filter((m) => m.id === message.prevId)[0].nextIds
                : []
            }
            onDelete={handleDelete}
            onReGenerate={handleReGenerate}
            onChangeShownMessage={handleChangeShownMessage}
          />
        ))}
        {isLoading && (
          <ChatMessageBubble
            message={respondingMessage}
            respondingMode={true}
            alternatives={[]}
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
        <Flex direction="row" gap="3" justify="between" align="center">
          {isLoading && modelName && (
            <IconButton onClick={pauseChat}>
              <PauseIcon />
            </IconButton>
          )}
          <Tooltip content="Upload images">
            <IconButton
              radius="full"
              variant="soft"
              onClick={() =>
                openImages().then((list) => list && setImages(list))
              }
            >
              <UploadIcon />
            </IconButton>
          </Tooltip>
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            radius="large"
            style={{ flex: 1 }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Tooltip content="Send message">
            <IconButton
              radius="full"
              disabled={!modelName || !input.trim()}
              loading={isLoading}
              onClick={handleSend}
            >
              <PaperPlaneIcon />
            </IconButton>
          </Tooltip>
        </Flex>

        <Flex justify="between">
          <Text color="gray" size="1">
            Conversations are only saved locally.
          </Text>
          <Flex gap="1" align="center">
            <Kbd size="1">Enter</Kbd>
            <Text color="gray" size="1">
              to add a line break.
            </Text>
            <Kbd size="1">Ctrl+Enter</Kbd>
            <Text color="gray" size="1">
              to send.
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default ChatInterface;
