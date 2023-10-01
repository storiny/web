import { get_shortcut_label } from "@storiny/shared/src/utils/get-shortcut-label";
import React from "react";

import MenubarItem from "~/components/menubar-item";
import MenubarSub from "~/components/menubar-sub";
import RedoIcon from "~/icons/redo";
import UndoIcon from "~/icons/undo";

import { EDITOR_SHORTCUTS } from "../../../../../constants/shortcuts";
import { use_history } from "../../../../../hooks/use-history";

const EditItem = ({ disabled }: { disabled?: boolean }): React.ReactElement => {
  const { can_redo, can_undo, redo, undo } = use_history();
  return (
    <MenubarSub trigger={"Edit"}>
      <MenubarItem
        decorator={<UndoIcon />}
        disabled={disabled || !can_undo}
        onClick={undo}
        right_slot={get_shortcut_label(EDITOR_SHORTCUTS.undo)}
      >
        Undo
      </MenubarItem>
      <MenubarItem
        decorator={<RedoIcon />}
        disabled={disabled || !can_redo}
        onClick={redo}
        right_slot={get_shortcut_label(EDITOR_SHORTCUTS.redo)}
      >
        Redo
      </MenubarItem>
    </MenubarSub>
  );
};

export default EditItem;
