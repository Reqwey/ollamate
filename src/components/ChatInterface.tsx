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
  Callout,
  Spinner,
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
  const [isMessageGenerating, setIsMessageGenerating] =
    useState<boolean>(false);
  const [isTitleGenerating, setIsTitleGenerating] = useState<boolean>(false);
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAppSettings().then(setAppSettings);
  }, [getAppSettings]);

  useEffect(() => {
    getModelSettings().then(setModelSettings);
  }, [getModelSettings]);

  useEffect(() => {
    if (chatId) {
      setIsMessageGenerating(false);
      setIsTitleGenerating(false);
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
      setIsMessageGenerating(true);
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

      setIsMessageGenerating(false);

      if (appSettings.autoTitleGeneration && title === "") {
        setIsTitleGenerating(true);
      }
    }
  }, [appSettings, messages, modelName, modelSettings, title]);

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
          setIsMessageGenerating(true);
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
      isMessageGenerating
    ) {
      handleRespond();
    }

    return () => {
      pauseChat();
    };
  }, [messages, handleRespond, isMessageGenerating]);

  useEffect(() => {
    if (chatId && !isMessageGenerating && respondingMessage.content) {
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
    isMessageGenerating,
    messages,
    modelName,
    respondingMessage.content,
    respondingMessage.role,
    syncSetMessages,
  ]);

  useEffect(() => {
    if (isTitleGenerating && appSettings && modelName) {
      generateTitle(appSettings.ollamaApiUrl, modelName, messages).then(
        (generatedTitle) => {
          if (generatedTitle) {
            setTitle(title);
            setIsTitleGenerating(false);
            updateChat(chatId, { title: generatedTitle });
          }
        }
      );
    }
  }, [
    appSettings,
    chatId,
    isTitleGenerating,
    messages,
    modelName,
    title,
    updateChat,
  ]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({
      block: "end",
      inline: "end",
      behavior: "smooth",
    });
  }, [isMessageGenerating, respondingMessage.content, messages]);

  return (
    <Flex
      direction="column"
      height="100%"
      width="100%"
      style={{ backgroundColor: "var(--gray-2)" }}
    >
      <Flex
        gap="3"
        direction="column"
        flexGrow="1"
        overflowY="auto"
        width="100%"
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
        {isMessageGenerating && (
          <ChatMessageBubble
            message={respondingMessage}
            respondingMode={true}
            alternatives={[]}
          />
        )}
        <Box ref={messageEndRef} />
      </Flex>
      <Box
        width="100%"
        px="2"
        pb="2"
        style={{ zIndex: 1, background: "transparent" }}
      >
        <Flex
          p="3"
          gap="3"
          direction="column"
          height="100%"
          width="100%"
          style={{
            backgroundColor: "var(--gray-3)",
            boxShadow: "var(--shadow-2)",
            border: "1px solid var(--gray-4)",
            borderRadius: "var(--radius-5)",
          }}
        >
          {isTitleGenerating && (
            <Callout.Root color="gray">
              <Callout.Icon>
                <Spinner />
              </Callout.Icon>
              <Callout.Text>Generating title...</Callout.Text>
            </Callout.Root>
          )}

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
            <Tooltip content="Upload images">
              <IconButton
                radius="full"
                variant="classic"
                loading={isMessageGenerating || isTitleGenerating}
                onClick={() =>
                  openImages().then((list) => list && setImages(list))
                }
              >
                <UploadIcon />
              </IconButton>
            </Tooltip>
            <TextArea
              value={input}
              disabled={isMessageGenerating || isTitleGenerating}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              radius="large"
              style={{ flex: 1, backgroundColor: "var(--gray-3)" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Tooltip
              content={
                isMessageGenerating ? "Generating message..." : "Send message"
              }
            >
              <IconButton
                disabled={input.length === 0 && !isMessageGenerating}
                radius="full"
                onClick={isMessageGenerating ? pauseChat : handleSend}
                variant="classic"
              >
                {isMessageGenerating ? <PauseIcon /> : <PaperPlaneIcon />}
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
      </Box>
    </Flex>
  );
};

export default ChatInterface;
