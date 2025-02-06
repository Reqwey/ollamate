import "@radix-ui/themes/styles.css";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Theme, Flex } from "@radix-ui/themes";
import Sidebar from "@/components/Sidebar";
import SettingsDialog from "@/components/SettingsDialog";
import { ChatContextProvider } from "@/contexts/chat";
import { SettingsContextProvider } from "@/contexts/settings";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Theme>
      <SettingsContextProvider>
        <ChatContextProvider>
          <Flex direction="row" height="100vh" overflow="hidden">
            <Sidebar />
            <Flex height="100%" overflow="hidden" flexGrow="1">
              <Component {...pageProps} />
            </Flex>
          </Flex>
          <SettingsDialog />
        </ChatContextProvider>
      </SettingsContextProvider>
    </Theme>
  );
}
