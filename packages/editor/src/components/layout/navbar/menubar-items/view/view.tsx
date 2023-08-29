import { getShortcutLabel } from "@storiny/shared/src/utils/get-shortcut-label";
import { useAtom } from "jotai";
import React from "react";

import MenubarCheckboxItem from "~/components/MenubarCheckboxItem";
import MenubarSub from "~/components/MenubarSub";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { breakpoints } from "~/theme/breakpoints";

import {
  enableInlineDecoratorsAtom,
  enableTKAtom,
  sidebarsCollapsedAtom
} from "../../../../../atoms";
import { EDITOR_SHORTCUTS } from "../../../../../constants/shortcuts";

// Sidebar collapsed item

const SidebarsCollapsedItem = (): React.ReactElement => {
  const [sidebarsCollapsed, setSidebarsCollapsed] = useAtom(
    sidebarsCollapsedAtom
  );
  return (
    <MenubarCheckboxItem
      checked={!sidebarsCollapsed}
      onCheckedChange={(newValue): void => setSidebarsCollapsed(!newValue)}
      onSelect={
        (event): void => event.preventDefault() // Prevent closing the menubar
      }
      rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.sidebars)}
    >
      Show sidebars
    </MenubarCheckboxItem>
  );
};

// Enable TK item

const EnableTKItem = (): React.ReactElement => {
  const [enableTk, setEnableTk] = useAtom(enableTKAtom);
  return (
    <MenubarCheckboxItem checked={enableTk} onCheckedChange={setEnableTk}>
      Enable TK
    </MenubarCheckboxItem>
  );
};

// Enable inline decorators item

const EnableInlineDecoratorsItem = (): React.ReactElement => {
  const [enableInlineDecorators, setEnableInlineDecorators] = useAtom(
    enableInlineDecoratorsAtom
  );
  return (
    <MenubarCheckboxItem
      checked={enableInlineDecorators}
      onCheckedChange={setEnableInlineDecorators}
    >
      Enable inline decorators
    </MenubarCheckboxItem>
  );
};

const ViewItem = (): React.ReactElement => {
  const isSmallerThanDesktop = useMediaQuery(breakpoints.down("desktop"));
  return (
    <MenubarSub trigger={"View"}>
      {!isSmallerThanDesktop && <SidebarsCollapsedItem />}
      <EnableTKItem />
      <EnableInlineDecoratorsItem />
    </MenubarSub>
  );
};

export default ViewItem;
