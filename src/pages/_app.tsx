import "@radix-ui/themes/styles.css";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Sidebar from "@/components/Sidebar";
import { ChatContextProvider } from "@/contexts/chat";
import { Theme, Flex } from "@radix-ui/themes";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Theme>
      <ChatContextProvider>
        <Flex direction="row" height="100vh" overflow="hidden">
          <Sidebar />
          <Flex height="100%" overflow="hidden" flexGrow="1">
            <Component {...pageProps} />
          </Flex>
        </Flex>
      </ChatContextProvider>
    </Theme>
  );
}
