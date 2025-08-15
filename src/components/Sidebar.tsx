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
  AiOutlineMenu,
  AiOutlineEdit,
  AiOutlineDelete,
} from "react-icons/ai";
import { useChatContext } from "@/contexts/chat";
import { ChatInfo } from "@/models/chat";
import { UUID } from "crypto";
import { useRouter } from "next/router";
import { useSettingsContext } from "@/contexts/settings";
import { AppSettings } from "@/models/settings";

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
            <AiOutlineEdit />
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
                <AiOutlineMenu />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item onClick={() => setEditMode(true)}>
                <AiOutlineEdit />
                Edit
              </DropdownMenu.Item>
              <DropdownMenu.Item color="red" onClick={onDelete}>
                <AiOutlineDelete />
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
  const { getChatInfoList, updateChat, deleteChat } =
    useChatContext();
  const [chatInfoList, setChatInfoList] = useState<ChatInfo[]>([]);
  const [navMenuList, setNavMenuList] = useState<NavMenuProps[]>([]);

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
        overflowY="auto"
        p="2"
      >
        {renderNavMenuList}
      </Flex>
    </Box>
  );
};

export default Sidebar;
