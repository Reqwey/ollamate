import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentWindow, Window } from "@tauri-apps/api/window";
import { Flex, IconButton, Text } from "@radix-ui/themes";
import {
  AiOutlineShrink,
  AiOutlineExpandAlt,
  AiOutlineMinus,
  AiOutlineClose,
  AiOutlineHome,
  AiOutlinePlus,
  AiOutlineSetting,
} from "react-icons/ai";
import { AppSettings } from "@/models/settings";
import { useSettingsContext } from "@/contexts/settings";
import ModelSelectDropdown from "./ModelSelectDropdown";
import { useRouter } from "next/router";
import { useChatContext } from "@/contexts/chat";

function CustomTitleBar() {
  const { createChat, getChatInfoList } = useChatContext();
  const { setSettingsDialogOpen, getAppSettings } = useSettingsContext();
  const router = useRouter();
  const [appWindow, setAppWindow] = useState<Window | null>(null);
  const titleBarRef = useRef<HTMLDivElement>(null);
  const [appSettings, setAppSettings] = useState<AppSettings>();
  const [modelName, setModelName] = useState<string>();
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  const handleCreateMenu = useCallback(async () => {
    const newChat = await createChat();
    if (newChat) {
      getChatInfoList(true);
      router.push(`/chat/${newChat.id}`);
    }
  }, [createChat, router, getChatInfoList]);

  useEffect(() => {
    setAppWindow(getCurrentWindow());
  }, [getCurrentWindow]);

  useEffect(() => {
    getAppSettings().then(setAppSettings);
  }, [getAppSettings]);
  useEffect(() => {
    if (appSettings) setModelName(appSettings.selectedModel);
  }, [appSettings]);
  useEffect(() => {
    if (titleBarRef.current && appWindow) {
      titleBarRef.current.addEventListener("mousedown", (e) => {
        if (e.button === 0) {
          e.detail === 2
            ? appWindow.toggleMaximize() // Maximize on double click
            : appWindow.startDragging();
        }
      });
    }
  }, [appWindow]);

  useEffect(() => {
    let isMounted = true;
    if (appWindow) {
      appWindow.isMaximized().then((maximized) => {
        if (isMounted) setIsMaximized(maximized);
      });
      const unlisten = appWindow.onResized(async () => {
        const maximized = await appWindow.isMaximized();
        if (isMounted) setIsMaximized(maximized);
      });
      return () => {
        isMounted = false;
        unlisten.then((fn) => fn());
      };
    }
  }, [appWindow]);

  return (
    <Flex
      direction="row"
      align="center"
      justify="between"
      style={{
        backgroundColor: "var(--gray-2)",
        userSelect: "none",
      }}
    >
      <Flex gap="5" m="3">
        <IconButton
          variant="ghost"
          onClick={() => {
            router.push("/");
          }}
        >
          <AiOutlineHome />
        </IconButton>
        <IconButton
          variant="ghost"
          onClick={(e) => {
            e.preventDefault();
            handleCreateMenu();
          }}
        >
          <AiOutlinePlus />
        </IconButton>
        <IconButton
          variant="ghost"
          onClick={(e) => {
            e.preventDefault();
            setSettingsDialogOpen(true);
          }}
        >
          <AiOutlineSetting />
        </IconButton>
      </Flex>
      <Flex
        direction="row"
        flexGrow="1"
        ref={titleBarRef}
        align="center"
        justify="center"
        gap="3"
        m="0"
      >
        <Text size="4" weight="light">
          OLLAMATE
        </Text>
        <Text size="4" weight="regular" color={appSettings?.accentColor}>
          2.0
        </Text>
        <ModelSelectDropdown
          modelName={modelName}
          setModelName={setModelName}
        />
      </Flex>
      <Flex gap="5" m="3">
        <IconButton
          radius="full"
          variant="ghost"
          onClick={(e) => {
            e.preventDefault();
            appWindow && appWindow.minimize();
          }}
        >
          <AiOutlineMinus />
        </IconButton>
        <IconButton
          radius="full"
          variant="ghost"
          onClick={(e) => {
            e.preventDefault();
            appWindow && appWindow.toggleMaximize();
          }}
        >
          {isMaximized ? <AiOutlineShrink /> : <AiOutlineExpandAlt />}
        </IconButton>
        <IconButton
          radius="full"
          variant="ghost"
          color="red"
          onClick={(e) => {
            e.preventDefault();
            appWindow && appWindow.close();
          }}
        >
          <AiOutlineClose />
        </IconButton>
      </Flex>
    </Flex>
  );
}

export default CustomTitleBar;
