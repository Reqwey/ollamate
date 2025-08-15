import { useSettingsContext } from "@/contexts/settings";
import { AccentColor } from "@/models/settings";
import { useEffect, useState } from "react";
import { Theme, Flex } from "@radix-ui/themes";
import Sidebar from "@/components/Sidebar";
import SettingsDialog from "@/components/SettingsDialog";
import CustomTitleBar from "@/components/CustomTitleBar";
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
      <Flex direction="column" height="100vh" overflow="hidden">
        <CustomTitleBar />
        <Flex direction="row" flexGrow="1" overflow="hidden">
          <Sidebar />
          <Flex height="100%" overflow="hidden" flexGrow="1">
            {children}
          </Flex>
        </Flex>
      </Flex>
      <SettingsDialog />
    </Theme>
  );
};

export default MainLayout;
