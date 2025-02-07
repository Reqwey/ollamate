import { ChatMessage } from "@/models/chat";
import { Flex, Card, Badge, Spinner, Text } from "@radix-ui/themes";
import MarkdownRenderer from "@/components/MarkdownRenderer";

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
              <Badge>Thinking</Badge>
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

export default ChatMessageBubble;
