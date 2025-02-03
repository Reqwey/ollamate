import { ChatBubbleIcon } from "@radix-ui/react-icons";
import { Flex, Text, TextField } from "@radix-ui/themes";

export default function HomePage() {
  return (
    <Flex
      width="100%"
      height="100%"
      align="center"
      justify="center"
      direction="column"
      gap="4"
    >
      <TextField.Root
        size="3"
        radius="full"
        placeholder="Start chatting..."
        style={{ width: "80%" }}
      >
        <TextField.Slot>
          <ChatBubbleIcon />
        </TextField.Slot>
      </TextField.Root>
    </Flex>
  );
}
