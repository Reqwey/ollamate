import { ChatMessage } from "@/models/chat";
import {
  Flex,
  Card,
  Badge,
  Spinner,
  Text,
  Inset,
  Separator,
  IconButton,
  Tooltip,
} from "@radix-ui/themes";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  TrashIcon,
  UpdateIcon,
} from "@radix-ui/react-icons";
import { useCallback, useState } from "react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { UUID } from "crypto";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  respondingMode: boolean;
  alternatives: UUID[];
  onDelete?: (messageId: UUID) => Promise<void>;
  onReGenerate?: (message: ChatMessage) => Promise<void>;
  onChangeShownMessage?: (fromId: UUID, toId: UUID) => void;
}

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  respondingMode,
  alternatives,
  onDelete,
  onReGenerate,
  onChangeShownMessage,
}) => {
  const [copied, setCopied] = useState(false);

  const selfPosition = alternatives.findIndex((id) => id === message.id);

  const handleCopy = async () => {
    await writeText(message.content);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

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
              <Badge>Thinking</Badge>
              <Flex direction="column" gap="1">
                {message.content
                  .split("<think>")[1]
                  .split("</think>")[0]
                  .split("\n")
                  .map((line, index) => (
                    <Text key={index} style={{ whiteSpace: "pre-wrap" }}>
                      {line}
                    </Text>
                  ))}
              </Flex>
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
        <Inset side="bottom">
          <Separator size="4" />
          <Flex gap="3" direction="row" p="2">
            {alternatives.length >= 2 && selfPosition !== -1 && (
              <Flex gap="2" direction="row">
                {selfPosition > 0 && (
                  <IconButton
                    size="1"
                    variant="ghost"
                    color="gray"
                    onClick={() => {
                      if (onChangeShownMessage) {
                        onChangeShownMessage(
                          message.id,
                          alternatives[selfPosition - 1]
                        );
                      }
                    }}
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                )}
                <Text size="1" color="gray">
                  {selfPosition + 1}/{alternatives.length}
                </Text>
                {selfPosition < alternatives.length - 1 && (
                  <IconButton
                    size="1"
                    variant="ghost"
                    color="gray"
                    onClick={() => {
                      if (onChangeShownMessage) {
                        onChangeShownMessage(
                          message.id,
                          alternatives[selfPosition + 1]
                        );
                      }
                    }}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                )}
              </Flex>
            )}
            <Tooltip content="Copy raw" side="bottom">
              <IconButton
                color={copied ? "green" : undefined}
                size="1"
                variant="ghost"
                onClick={handleCopy}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </IconButton>
            </Tooltip>
            {message.role === "assistant" && !!onReGenerate && (
              <Tooltip content="Re-generate" side="bottom">
                <IconButton
                  size="1"
                  variant="ghost"
                  onClick={() => onReGenerate(message)}
                >
                  <UpdateIcon />
                </IconButton>
              </Tooltip>
            )}
            {!!onDelete && (
              <Tooltip content="Delete message" side="bottom">
                <IconButton
                  size="1"
                  variant="ghost"
                  color="red"
                  onClick={() => onDelete(message.id)}
                >
                  <TrashIcon />
                </IconButton>
              </Tooltip>
            )}
          </Flex>
        </Inset>
      </Card>
    </Flex>
  );
};

export default ChatMessageBubble;
