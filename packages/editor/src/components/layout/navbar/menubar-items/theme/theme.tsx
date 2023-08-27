import React from "react";

import MenubarRadioGroup from "~/components/MenubarRadioGroup";
import MenubarRadioItem from "~/components/MenubarRadioItem";
import MenubarSub from "~/components/MenubarSub";
import AdjustIcon from "~/icons/Adjust";
import MoonIcon from "~/icons/Moon";
import SunIcon from "~/icons/Sun";
import { selectTheme, setTheme } from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";

const ThemeItem = (): React.ReactElement => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);

  return (
    <MenubarSub trigger={"Theme"}>
      <MenubarRadioGroup
        onValueChange={(newValue): void => {
          dispatch(setTheme(newValue as typeof theme));
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
