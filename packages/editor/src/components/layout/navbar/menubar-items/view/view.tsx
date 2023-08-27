import { getShortcutLabel } from "@storiny/shared/src/utils/get-shortcut-label";
import { useAtom } from "jotai/index";
import React from "react";

import MenubarItem from "~/components/MenubarItem";
import MenubarSub from "~/components/MenubarSub";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { breakpoints } from "~/theme/breakpoints";

import { sidebarsCollapsedAtom } from "../../../../../atoms";
import { EDITOR_SHORTCUTS } from "../../../../../constants/shortcuts";

const ViewItem = (): React.ReactElement | null => {
  const isSmallerThanDesktop = useMediaQuery(breakpoints.down("desktop"));
  const [sidebarsCollapsed, setSidebarsCollapsed] = useAtom(
    sidebarsCollapsedAtom
  );

  return isSmallerThanDesktop ? null : (
    <MenubarSub trigger={"View"}>
      <MenubarItem
        onSelect={(event): void => {
          event.preventDefault(); // Prevent closing the menubar
          setSidebarsCollapsed((prev) => !prev);
        }}
        rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.sidebars)}
      >
        {sidebarsCollapsed ? "Show" : "Hide"} sidebars
      </MenubarItem>
    </MenubarSub>
  );
};

export default ViewItem;
