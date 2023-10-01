import React from "react";

import MenubarRadioGroup from "~/components/menubar-radio-group";
import MenubarRadioItem from "~/components/menubar-radio-item";
import MenubarSub from "~/components/menubar-sub";
import AdjustIcon from "~/icons/adjust";
import MoonIcon from "~/icons/moon";
import SunIcon from "~/icons/sun";
import { select_theme, set_theme } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";

const ThemeItem = (): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const theme = use_app_selector(select_theme);
  return (
    <MenubarSub trigger={"Theme"}>
      <MenubarRadioGroup
        onValueChange={(next_value): void => {
          dispatch(set_theme(next_value as typeof theme));
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
