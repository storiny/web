import React from "react";

import { PlusPromoIcon } from "../../../components/core/icons";
import { MainMenu } from "../../../lib/packages/excalidraw/index";
import { LanguageList } from "./LanguageList";

export const AppMainMenu: React.FC<{
  isCollabEnabled: boolean;
  isCollaborating: boolean;
  setCollabDialogShown: (toggle: boolean) => any;
}> = React.memo((props) => (
  <MainMenu>
    <MainMenu.DefaultItems.LoadScene />
    <MainMenu.DefaultItems.SaveToActiveFile />
    <MainMenu.DefaultItems.Export />
    <MainMenu.DefaultItems.SaveAsImage />
    {props.isCollabEnabled && (
      <MainMenu.DefaultItems.LiveCollaborationTrigger
        isCollaborating={props.isCollaborating}
        onSelect={() => props.setCollabDialogShown(true)}
      />
    )}

    <MainMenu.DefaultItems.Help />
    <MainMenu.DefaultItems.ClearCanvas />
    <MainMenu.Separator />
    <MainMenu.ItemLink
      className="ExcalidrawPlus"
      href="https://plus.excalidraw.com/plus?utm_source=excalidraw&utm_medium=app&utm_content=hamburger"
      icon={PlusPromoIcon}
    >
      Excalidraw+
    </MainMenu.ItemLink>
    <MainMenu.DefaultItems.Socials />
    <MainMenu.Separator />
    <MainMenu.DefaultItems.ToggleTheme />
    <MainMenu.ItemCustom>
      <LanguageList style={{ width: "100%" }} />
    </MainMenu.ItemCustom>
    <MainMenu.DefaultItems.ChangeCanvasBackground />
  </MainMenu>
));
