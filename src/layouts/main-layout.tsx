import { useSettingsContext } from "@/contexts/settings";
import { AccentColor } from "@/models/settings";
import { useEffect, useState } from "react";
import { Theme, Flex } from "@radix-ui/themes";
import Sidebar from "@/components/Sidebar";
import SettingsDialog from "@/components/SettingsDialog";
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getAppSettings } = useSettingsContext();
  const [accentColor, setAccentColor] = useState<AccentColor>(
    AccentColor.Indigo
  );

  useEffect(() => {
    getAppSettings().then((appSettings) =>
      setAccentColor(appSettings.accentColor)
    );
  }, [getAppSettings]);
  return (
    <Theme accentColor={accentColor} radius="large">
      <Flex direction="row" height="100vh" overflow="hidden">
        <Sidebar />
        <Flex height="100%" overflow="hidden" flexGrow="1">
          {children}
        </Flex>
      </Flex>
      <SettingsDialog />
    </Theme>
  );
};

export default MainLayout;
