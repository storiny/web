import { getShortcutLabel } from "@storiny/shared/src/utils/get-shortcut-label";
import React from "react";

import MenubarItem from "~/components/MenubarItem";
import MenubarSub from "~/components/MenubarSub";
import Separator from "~/components/Separator";

import { EDITOR_SHORTCUTS } from "../../../../../constants/shortcuts";

const FileItem = (): React.ReactElement => (
  <MenubarSub trigger={"File"}>
    <MenubarItem rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.importFile)}>
      Open…
    </MenubarItem>
    <MenubarItem>Save local copy…</MenubarItem>
    <Separator />
    <MenubarItem>Show version history</MenubarItem>
  </MenubarSub>
);

export default FileItem;
