import { getShortcutLabel } from "@storiny/shared/src/utils/get-shortcut-label";
import React from "react";

import MenubarItem from "~/components/MenubarItem";
import MenubarSub from "~/components/MenubarSub";
import RedoIcon from "~/icons/Redo";
import UndoIcon from "~/icons/Undo";

import { EDITOR_SHORTCUTS } from "../../../../../constants/shortcuts";
import { useHistory } from "../../../../../hooks/useHistory";

const EditItem = (): React.ReactElement => {
  const { canRedo, canUndo, redo, undo } = useHistory();
  return (
    <MenubarSub trigger={"Edit"}>
      <MenubarItem
        decorator={<UndoIcon />}
        disabled={!canUndo}
        onClick={undo}
        rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.undo)}
      >
        Undo
      </MenubarItem>
      <MenubarItem
        decorator={<RedoIcon />}
        disabled={!canRedo}
        onClick={redo}
        rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.redo)}
      >
        Redo
      </MenubarItem>
    </MenubarSub>
  );
};

export default EditItem;
