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
  CopyIcon,
  TrashIcon,
  UpdateIcon,
} from "@radix-ui/react-icons";
import { useCallback, useState } from "react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  respondingMode: boolean;
}

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  respondingMode,
}) => {
  const [copied, setCopied] = useState(false);

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
          <Flex gap="2" direction="row" p="2">
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
            {message.role === "assistant" && (
              <Tooltip content="Re-generate" side="bottom">
                <IconButton size="1" variant="ghost" onClick={() => {}}>
                  <UpdateIcon />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip content="Delete message" side="bottom">
              <IconButton
                size="1"
                variant="ghost"
                color="red"
                onClick={() => {}}
              >
                <TrashIcon />
              </IconButton>
            </Tooltip>
          </Flex>
        </Inset>
      </Card>
    </Flex>
  );
};

export default ChatMessageBubble;
