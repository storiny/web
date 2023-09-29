import React from "react";

import MenubarRadioGroup from "../../../../../../../ui/src/components/menubar-radio-group";
import MenubarRadioItem from "../../../../../../../ui/src/components/menubar-radio-item";
import MenubarSub from "../../../../../../../ui/src/components/menubar-sub";
import AdjustIcon from "../../../../../../../ui/src/icons/adjust";
import MoonIcon from "../../../../../../../ui/src/icons/moon";
import SunIcon from "../../../../../../../ui/src/icons/sun";
import { select_theme, set_theme } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";

const ThemeItem = (): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const theme = use_app_selector(select_theme);
  return (
    <MenubarSub trigger={"Theme"}>
      <MenubarRadioGroup
        onValueChange={(next_value: typeof theme): void => {
          dispatch(set_theme(next_value));
        }}
        value={theme}
      >
        <MenubarRadioItem
          decorator={<AdjustIcon rotation={90} />}
          onSelect={(event): void => event.preventDefault()}
          value={"system"}
        >
          System
        </MenubarRadioItem>
        <MenubarRadioItem
          decorator={<SunIcon />}
          onSelect={(event): void => event.preventDefault()}
          value={"light"}
        >
          Light
        </MenubarRadioItem>
        <MenubarRadioItem
          decorator={<MoonIcon />}
          onSelect={(event): void => event.preventDefault()}
          value={"dark"}
        >
          Dark
        </MenubarRadioItem>
      </MenubarRadioGroup>
    </MenubarSub>
  );
};

export default ThemeItem;
