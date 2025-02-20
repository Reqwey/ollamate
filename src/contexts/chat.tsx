import { Chat, ChatInfo, ChatMessage, Role, StoredChat } from "@/models/chat";
import { UUID } from "crypto";
import { createContext, useCallback, useContext, useState } from "react";
import { Store } from "@tauri-apps/plugin-store";

interface ChatContextProps {
  getChatInfoList: (sync?: boolean) => Promise<ChatInfo[]>;
  getShownChat: (id: UUID, sync?: boolean) => Promise<Chat | null>;
  createChat: () => Promise<Chat | void>;
  deleteChat: (id: UUID) => Promise<void>;
  updateChat: (id: UUID, value: Partial<Chat>) => Promise<void>;
  createChatMessage: (
    chatId: UUID,
    prevId: UUID | null,
    role: Role,
    content: string,
    images: string[],
    llmModelName?: string
  ) => Promise<UUID | null>;
  changeShownChatMessage: (
    chatId: UUID,
    fromId: UUID,
    toId: UUID
  ) => Promise<void>;
  deleteChatMessage: (chatId: UUID, messageId: UUID) => Promise<void>;
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined);

export const ChatContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [chatInfoList, setChatInfoList] = useState<ChatInfo[]>();

  const fetchStore = useCallback(async () => {
    let store = await Store.get("chat-store.json");
    if (!store) {
      store = await Store.load("chat-store.json");
    }
    return store;
  }, []);

  const getChatInfoList = useCallback(
    async (sync = false) => {
      const store = await fetchStore();
      if (!sync && chatInfoList) return chatInfoList;

      const keys = await store.keys();
      const newChatInfoList = await Promise.all(
        keys.map(async (key: string) => {
          const res = await store.get<StoredChat>(key);
          return {
            id: res?.id,
            title: res?.title,
            updatedAt: new Date(res?.updatedAt as string),
          } as ChatInfo;
        })
      );

      setChatInfoList(newChatInfoList);

      return newChatInfoList;
    },
    [chatInfoList, fetchStore]
  );

  const getShownChat = useCallback(
    async (id: UUID, sync = false): Promise<Chat | null> => {
      const store = await fetchStore();

      const storedChat = await store.get<StoredChat>(id);

      if (!storedChat) {
        return null;
      }

      const chat: Chat = {
        id: storedChat.id,
        title: storedChat.title,
        updatedAt: new Date(storedChat.updatedAt),
        messages: storedChat.messages,
      };

      const newMessages: ChatMessage[] = [];
      let currentMessage = chat.messages[0];

      while (currentMessage) {
        newMessages.push(currentMessage);
        let findShown = false;

        for (const nextId of currentMessage.nextIds) {
          const tmp = chat.messages.find((message) => message.id === nextId);
          if (tmp?.isShown) {
            findShown = true;
            currentMessage = tmp;
            break;
          }
        }

        if (!findShown) {
          break;
        }
      }

      return { ...chat, messages: newMessages };
    },
    [fetchStore]
  );

  const createChat = useCallback(async () => {
    const store = await fetchStore();

    const chat: Chat = {
      id: crypto.randomUUID() as UUID,
      title: "",
      updatedAt: new Date(),
      messages: [],
    };

    await store.set(chat.id, chat);
    await store.save();
    await getChatInfoList(true);

    return chat;
  }, [fetchStore, getChatInfoList]);

  const deleteChat = useCallback(
    async (id: UUID) => {
      const store = await fetchStore();
      await store.delete(id);
      await store.save();
      await getChatInfoList(true);
    },
    [fetchStore, getChatInfoList]
  );

  const updateChat = useCallback(
    async (id: UUID, value: Partial<Chat>) => {
      const store = await fetchStore();

      const chat = await store.get<StoredChat>(id);
      if (!chat) return;

      const updatedChat: Chat = {
        ...chat,
        ...value,
        title: value.title || chat.title,
        updatedAt: new Date(),
      };
      await store.set(id, updatedChat);
      await store.save();
      await getChatInfoList(true);
    },
    [fetchStore, getChatInfoList]
  );

  const createChatMessage = useCallback(
    async (
      chatId: UUID,
      prevId: UUID | null,
      role: Role,
      content: string,
      images: string[],
      llmModelName?: string
    ) => {
      const store = await fetchStore();

      const chat = await store.get<StoredChat>(chatId);
      if (!chat) return null;
      const id = crypto.randomUUID() as UUID;

      await updateChat(chatId, {
        messages: [
          ...chat.messages.map((message) =>
            message.id === prevId
              ? { ...message, nextIds: [...message.nextIds, id] }
              : message
          ),
          {
            id,
            isShown: true,
            prevId,
            nextIds: [],
            llmModelName,
            role,
            content,
            images,
          },
        ],
      });

      return id;
    },
    [fetchStore, updateChat]
  );

  const changeShownChatMessage = useCallback(
    async (chatId: UUID, fromId: UUID, toId: UUID) => {
      const store = await fetchStore();

      const chat = await store.get<StoredChat>(chatId);
      if (!chat) return;

      const updatedMessages = chat.messages.map((message) => {
        if (message.id === fromId) {
          return { ...message, isShown: false };
        }
        if (message.id === toId) {
          return { ...message, isShown: true };
        }
        return message;
      });

      await updateChat(chatId, { messages: updatedMessages });
    },
    [fetchStore, updateChat]
  );

  const deleteChatMessage = useCallback(
    async (chatId: UUID, messageId: UUID) => {
      const store = await fetchStore();

      const chat = await store.get<StoredChat>(chatId);
      if (!chat) return;

      const updatedMessages = chat.messages
        .filter((message) => message.id !== messageId)
        .map((message) => {
          if (message.nextIds.includes(messageId)) {
            return {
              ...message,
              nextIds: message.nextIds.filter((id) => id !== messageId),
            };
          } else {
            return message;
          }
        });

      await updateChat(chatId, { messages: updatedMessages });
    },
    [fetchStore, updateChat]
  );

  return (
    <ChatContext.Provider
      value={{
        getChatInfoList,
        getShownChat,
        createChat,
        deleteChat,
        updateChat,
        createChatMessage,
        changeShownChatMessage,
        deleteChatMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatContextProvider");
  }
  return context;
};
