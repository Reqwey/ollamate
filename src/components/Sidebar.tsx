import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Box,
  Button,
  Card,
  DropdownMenu,
  Flex,
  IconButton,
  Text,
  TextField,
} from "@radix-ui/themes";
import {
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
import { AppSettings } from "@/models/settings";
import ModelSelectDropdown from "@/components/ModelSelectDropdown";

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

  const handleInputBlur = () => {
    setTitle(newTitle);
    setEditMode(false);
  };

  return (
    <Card
      size="1"
      className={id === currentId ? "selected" : ""}
      style={{
        width: "100%",
        minHeight: "max-content",
        cursor: "pointer",
        boxShadow: id === currentId ? "var(--shadow-3)" : "none",
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
        </TextField.Root>
      ) : (
        <Flex gap="3" align="center" justify="between">
          <Flex direction="column">
            <Text size="3">{title || "Untitled chat"}</Text>
            <Text size="1" color="gray">
              {updatedAt.toLocaleString()}
            </Text>
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
  const [modelName, setModelName] = useState<string>();
  const [appSettings, setAppSettings] = useState<AppSettings>();
  const [chatInfoList, setChatInfoList] = useState<ChatInfo[]>([]);
  const [navMenuList, setNavMenuList] = useState<NavMenuProps[]>([]);
  const router = useRouter();
  const { setSettingsDialogOpen, getAppSettings } = useSettingsContext();

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
    getAppSettings().then(setAppSettings);
  }, [getAppSettings]);

  useEffect(() => {
    if (appSettings) setModelName(appSettings.selectedModel);
  }, [appSettings]);

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
    <Box
      height="100%"
      width="250px"
      minWidth="250px"
      p="2"
      pr="1"
      style={{ backgroundColor: "var(--gray-2)" }}
    >
      <Flex
        height="100%"
        width="100%"
        direction="column"
        style={{
          borderRadius: "var(--radius-5)",
          backgroundColor: "var(--gray-3)",
          border: "1px solid var(--gray-4)",
          boxShadow: "var(--shadow-2)",
        }}
        gap="2"
      >
        <Flex
          width="100%"
          align="center"
          justify="center"
          px="4"
          pt="4"
          gap="3"
          style={{ cursor: "pointer" }}
          onClick={() => router.push("/")}
        >
          <Text size="6" weight="light">
            OLLAMATE
          </Text>
          <Text size="6" weight="regular" color={appSettings?.accentColor}>
            2.0
          </Text>
        </Flex>
        <ModelSelectDropdown
          modelName={modelName}
          setModelName={setModelName}
        />
        <Flex overflowY="auto" direction="column" gap="2" p="2">
          {renderNavMenuList}
        </Flex>
        <Flex gap="2" direction="row" align="center" px="2" pb="2">
          <Button
            variant="classic"
            onClick={handleCreateMenu}
            style={{ flexGrow: 1 }}
            radius="full"
          >
            <PlusCircledIcon />
            New Chat
          </Button>
          <IconButton
            variant="classic"
            radius="full"
            onClick={() => setSettingsDialogOpen(true)}
          >
            <GearIcon />
          </IconButton>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Sidebar;
