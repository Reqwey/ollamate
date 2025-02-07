/* eslint-disable @next/next/no-img-element */
import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  Text,
  TextArea,
  Button,
  Flex,
  Card,
  Code,
  IconButton,
  Spinner,
  Box,
  Grid,
  AspectRatio,
} from "@radix-ui/themes";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github.css";
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
import { GearIcon, PaperPlaneIcon, PauseIcon, UploadIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/router";
import { useSettingsContext } from "@/contexts/settings";
import ModelSelectDropdown from "./ModelSelectDropdown";

const emptyMessage: ChatMessage = {
  id: "0-0-0-0-0",
  role: "assistant",
  content: "",
  isShown: true,
  prevId: null,
  nextIds: [],
  images: [],
};

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex, rehypeHighlight]}
      components={{
        code(props) {
          const { children, className, node, ...rest } = props;
          const match = /language-(\w+)/.exec(className || "");
          return match ? (
            <Card variant="surface" style={{ overflow: "auto", padding: 0 }}>
              <Flex gap="1" direction="column" overflow="auto">
                <Text
                  size="1"
                  color="gray"
                  align="right"
                  weight="bold"
                  style={{
                    borderBottom: "1px solid var(--gray-6)",
                    padding: "var(--space-2)",
                  }}
                >
                  {match[1].toUpperCase()}
                </Text>
                <code {...rest} className={className}>
                  {children}
                </code>
              </Flex>
            </Card>
          ) : (
            <code {...rest} className={className}>
              {children}
            </code>
          );
        },
      }}
    >
      {content
        .replaceAll("\\[", "$$")
        .replaceAll("\\]", "$$")
        .replaceAll("\\(", " $")
        .replaceAll("\\)", "$ ")}
    </ReactMarkdown>
  );
};

interface ChatMessageBubbleProps {
  message: ChatMessage;
  respondingMode: boolean;
}

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  respondingMode,
}) => {
  return (
    <Flex
      direction="column"
      maxWidth="100%"
      align={message.role === "user" ? "end" : "start"}
      p="3"
      gap="2"
    >
      <Text
        as="div"
        weight="bold"
        style={{
          width: "100%",
          textAlign: message.role === "user" ? "end" : "start",
        }}
      >
        {message.role === "assistant" && message.llmModelName
          ? message.llmModelName
          : message.role}
      </Text>
      <Card
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-1)",
          maxWidth: "100%",
        }}
      >
        {message.content.startsWith("<think>") ? (
          <>
            <Card
              style={{
                backgroundColor: "var(--accent-a5)",
                width: "min(max-content, 100%)",
              }}
            >
              <Code>{"Reasoning Content"}</Code>
              <MarkdownRenderer
                content={
                  message.content.split("<think>")[1].split("</think>")[0]
                }
              />
            </Card>
            {message.content.includes("</think>") && (
              <MarkdownRenderer
                content={message.content.split("</think>")[1]}
              />
            )}
          </>
        ) : (
          <MarkdownRenderer content={message.content} />
        )}
        {respondingMode && <Spinner />}
        {!!message.images.length && (
          <Flex gap="2" direction="row" wrap="wrap" width="fit-content">
            {message.images.map((image, index) => (
              <Card
                key={index}
                style={{ width: "100px", height: "100px", padding: "0" }}
              >
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
              </Card>
            ))}
          </Flex>
        )}
      </Card>
    </Flex>
  );
};

interface ChatInterfaceProps {
  chatId: UUID;
}
const ChatInterface: React.FC<ChatInterfaceProps> = ({ chatId }) => {
  const router = useRouter();
  const { getShownChat, createChatMessage, updateChat } = useChatContext();
  const { getAppSettings, getModelSettings, setSettingsDialogOpen } = useSettingsContext();
  const [title, setTitle] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [respondingMessage, setRespondingMessage] =
    useState<ChatMessage>(emptyMessage);
  const [modelName, setModelName] = useState<string>();
  const [input, setInput] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatId) {
      setIsLoading(false);
      setImages([]);
    }
  }, [chatId]);

  useEffect(() => {
    getAppSettings().then((appSettings) =>
      setModelName(appSettings.selectedModel)
    );
  }, [getAppSettings]);

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
    if (modelName) {
      setRespondingMessage({ ...emptyMessage, llmModelName: modelName });

      const modelSettings = await getModelSettings();
      const apiUrl = (await getAppSettings()).ollamaApiUrl;
      await fetchChatData(
        apiUrl,
        modelName,
        messages,
        modelSettings[modelName]
      );

      setIsLoading(false);
    }
  }, [getAppSettings, getModelSettings, messages, modelName]);

  useEffect(() => {
    if (
      messages.length &&
      messages[messages.length - 1].role === "user" &&
      isLoading
    ) {
      handleRespond();
    }
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
      getAppSettings().then((settings) => {
        if (settings.autoGenerateTitle) {
          generateTitle(settings.ollamaApiUrl, modelName, messages).then(
            (title) => {
              if (title) {
                updateChat(chatId, { title });
              }
            }
          );
        }
      });
    }
  }, [
    chatId,
    getAppSettings,
    isLoading,
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
            <ModelSelectDropdown modelName={modelName} setModelName={setModelName} />
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
