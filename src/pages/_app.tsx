import "@radix-ui/themes/styles.css";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ChatContextProvider } from "@/contexts/chat";
import { SettingsContextProvider } from "@/contexts/settings";
import MainLayout from "@/layouts/main-layout";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SettingsContextProvider>
      <ChatContextProvider>
        <MainLayout>
          <Component {...pageProps} />
        </MainLayout>
      </ChatContextProvider>
    </SettingsContextProvider>
  );
}
