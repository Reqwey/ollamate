import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  DropdownMenu,
  Flex,
  IconButton,
  RadioCards,
  Text,
  TextField,
} from "@radix-ui/themes";
import Link from "next/link";
import {
  ChatBubbleIcon,
  CheckIcon,
  GearIcon,
  HamburgerMenuIcon,
  Pencil2Icon,
  PlusCircledIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { useChatContext } from "@/contexts/chat";
import { ChatInfo } from "@/models/chat";
import { UUID } from "crypto";
import { useRouter } from "next/router";
import { useSettingsContext } from "@/contexts/settings";

interface NavMenuProps {
  id: UUID;
  title: string;
  setTitle: (title: string) => void;
  onDelete: () => void;
  updatedAt: Date;
}

const NavMenu: React.FC<{ value: NavMenuProps }> = ({ value }) => {
  const { id, title, setTitle, onDelete, updatedAt } = value;
  const [editMode, setEditMode] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const currentId = router.query.id as string;

  useEffect(() => {
    setNewTitle(title);
  }, [title]);

  useEffect(() => {
    if (editMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editMode]);

  // 当 input 失去焦点时将 editMode 设为 false
  const handleInputBlur = () => {
    setEditMode(false);
  };

  return (
    <Card
      size="1"
      className={id === currentId ? "selected" : ""}
      style={{
        width: "100%",
        cursor: "pointer",
      }}
      onClick={() => router.push(`/chat/${id}`)}
      variant="classic"
    >
      {editMode ? (
        <TextField.Root
          ref={inputRef}
          onBlur={handleInputBlur}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        >
          <TextField.Slot>
            <Pencil2Icon />
          </TextField.Slot>
          <TextField.Slot>
            <IconButton
              variant="ghost"
              onClick={() => {
                setTitle(newTitle);
                setEditMode(false);
              }}
            >
              <CheckIcon />
            </IconButton>
          </TextField.Slot>
        </TextField.Root>
      ) : (
        <Flex gap="3" align="center" justify="between">
          <Flex gap="3" align="center" justify="between">
            <ChatBubbleIcon color="gray" />
            <Flex direction="column">
              <Text size="3">{title}</Text>
              <Text size="1" color="gray">
                {updatedAt.toLocaleString()}
              </Text>
            </Flex>
          </Flex>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <IconButton variant="ghost">
                <HamburgerMenuIcon />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item onClick={() => setEditMode(true)}>
                <Pencil2Icon />
                Edit
              </DropdownMenu.Item>
              <DropdownMenu.Item color="red" onClick={onDelete}>
                <TrashIcon />
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </Flex>
      )}
    </Card>
  );
};
const Sidebar: React.FC = () => {
  const { getChatInfoList, createChat, updateChat, deleteChat } =
    useChatContext();
  const [chatInfoList, setChatInfoList] = useState<ChatInfo[]>([]);
  const [navMenuList, setNavMenuList] = useState<NavMenuProps[]>([]);
  const router = useRouter();
  const { setSettingsDialogOpen } = useSettingsContext();

  const handleCreateMenu = useCallback(async () => {
    const newChat = await createChat();
    if (newChat) {
      setNavMenuList([
        ...navMenuList,
        {
          id: newChat.id,
          title: newChat.title,
          setTitle: (title: string) => updateChat(newChat.id, { title }),
          onDelete: () => deleteChat(newChat.id),
          updatedAt: newChat.updatedAt,
        },
      ]);
      router.push(`/chat/${newChat.id}`);
    }
  }, [createChat, deleteChat, navMenuList, router, updateChat]);

  useEffect(() => {
    const fetchChatInfoList = async () => {
      const list = await getChatInfoList();
      setChatInfoList(list);
    };

    fetchChatInfoList();
  }, [getChatInfoList]);

  useEffect(() => {
    setNavMenuList(
      chatInfoList
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .map((chatInfo) => ({
          id: chatInfo.id,
          title: chatInfo.title,
          setTitle: (title: string) => updateChat(chatInfo.id, { title }),
          onDelete: () => deleteChat(chatInfo.id),
          updatedAt: chatInfo.updatedAt,
        }))
    );
  }, [chatInfoList, deleteChat, updateChat]);

  const renderNavMenuList = useMemo(() => {
    return navMenuList.map((navMenu) => (
      <NavMenu value={navMenu} key={navMenu.id} />
    ));
  }, [navMenuList]);

  return (
    <Flex
      height="100%"
      direction="column"
      width="250px"
      minWidth="250px"
      p="4"
      overflowY="auto"
      style={{ borderRight: "1px solid var(--gray-6)" }}
    >
      <Flex
        width="100%"
        align="center"
        justify="center"
        p="4"
        style={{ cursor: "pointer" }}
        onClick={() => router.push("/")}
      >
        <Text size="6" weight="bold">
          OllaMate
        </Text>
      </Flex>

      <Flex flexGrow="1" direction="column" width="100%" gap="3">
        <Button
          variant="soft"
          style={{ width: "100%" }}
          onClick={handleCreateMenu}
        >
          <PlusCircledIcon />
          New Chat
        </Button>
        {renderNavMenuList}
      </Flex>
      <Box width="100%" mt="auto" p="3">
        <Button
          variant="ghost"
          style={{ width: "100%" }}
          onClick={() => setSettingsDialogOpen(true)}
        >
          <GearIcon />
          Settings
        </Button>
      </Box>
    </Flex>
  );
};

export default Sidebar;
