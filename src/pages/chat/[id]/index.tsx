import ChatInterface from "@/components/ChatInterface";
import { UUID } from "crypto";
import { useRouter } from "next/router";

export default function ChatPage() {
  const router = useRouter();
  return <ChatInterface chatId={router.query.id as UUID} />;
}
