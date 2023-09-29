import { getShortcutLabel } from "@storiny/shared/src/utils/get-shortcut-label";
import React from "react";

import MenubarItem from "../../../../../../../ui/src/components/menubar-item";
import MenubarSub from "../../../../../../../ui/src/components/menubar-sub";
import RedoIcon from "~/icons/Redo";
import UndoIcon from "~/icons/Undo";

import { EDITOR_SHORTCUTS } from "../../../../../constants/shortcuts";
import { useHistory } from "../../../../../hooks/use-history";

const EditItem = ({ disabled }: { disabled?: boolean }): React.ReactElement => {
  const { canRedo, canUndo, redo, undo } = useHistory();
  return (
    <MenubarSub trigger={"Edit"}>
      <MenubarItem
        decorator={<UndoIcon />}
        disabled={disabled || !canUndo}
        onClick={undo}
        right_slot={getShortcutLabel(EDITOR_SHORTCUTS.undo)}
      >
        Undo
      </MenubarItem>
      <MenubarItem
        decorator={<RedoIcon />}
        disabled={disabled || !canRedo}
        onClick={redo}
        right_slot={getShortcutLabel(EDITOR_SHORTCUTS.redo)}
      >
        Redo
      </MenubarItem>
    </MenubarSub>
  );
};

export default EditItem;
