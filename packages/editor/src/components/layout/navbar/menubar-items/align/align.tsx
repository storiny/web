import { get_shortcut_label } from "@storiny/shared/src/utils/get-shortcut-label";
import React from "react";

import MenubarItem from "../../../../../../../ui/src/components/menubar-item";
import MenubarRadioGroup from "../../../../../../../ui/src/components/menubar-radio-group";
import MenubarRadioItem from "../../../../../../../ui/src/components/menubar-radio-item";
import MenubarSub from "../../../../../../../ui/src/components/menubar-sub";
import Separator from "../../../../../../../ui/src/components/separator";
import AlignCenterIcon from "../../../../../../../ui/src/icons/align-center";
import AlignJustifyIcon from "../../../../../../../ui/src/icons/align-justify";
import AlignLeftIcon from "../../../../../../../ui/src/icons/align-left";
import AlignRightIcon from "../../../../../../../ui/src/icons/align-right";
import IndentIcon from "../../../../../../../ui/src/icons/indent";
import OutdentIcon from "../../../../../../../ui/src/icons/outdent";

import { Alignment } from "../../../../../constants";
import { EDITOR_SHORTCUTS } from "../../../../../constants/shortcuts";
import { use_alignment } from "../../../../../hooks/use-alignment";
import { use_indentation } from "../../../../../hooks/use-indentation";

const AlignItem = ({
  disabled: disabled_prop
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const [alignment, set_alignment, disabled] = use_alignment();
  const { outdent, can_outdent, can_indent, indent } = use_indentation();

  return (
    <MenubarSub trigger={"Align"}>
      <MenubarRadioGroup value={alignment}>
        <MenubarRadioItem
          decorator={<AlignLeftIcon />}
          disabled={disabled_prop || disabled}
          onClick={(): void => set_alignment(Alignment.LEFT)}
          right_slot={get_shortcut_label(EDITOR_SHORTCUTS.left_align)}
          value={Alignment.LEFT}
        >
          Align left
        </MenubarRadioItem>
        <MenubarRadioItem
          decorator={<AlignCenterIcon />}
          disabled={disabled_prop || disabled}
          onClick={(): void => set_alignment(Alignment.CENTER)}
          right_slot={get_shortcut_label(EDITOR_SHORTCUTS.center_align)}
          value={Alignment.CENTER}
        >
          Align center
        </MenubarRadioItem>
        <MenubarRadioItem
          decorator={<AlignRightIcon />}
          disabled={disabled_prop || disabled}
          onClick={(): void => set_alignment(Alignment.RIGHT)}
          right_slot={get_shortcut_label(EDITOR_SHORTCUTS.right_align)}
          value={Alignment.RIGHT}
        >
          Align right
        </MenubarRadioItem>
        <MenubarRadioItem
          decorator={<AlignJustifyIcon />}
          disabled={disabled_prop || disabled}
          onClick={(): void => set_alignment(Alignment.JUSTIFY)}
          right_slot={get_shortcut_label(EDITOR_SHORTCUTS.justify_align)}
          value={Alignment.JUSTIFY}
        >
          Align justify
        </MenubarRadioItem>
        <Separator />
        <MenubarItem
          decorator={<IndentIcon />}
          disabled={disabled_prop || !can_indent}
          onClick={indent}
          right_slot={get_shortcut_label(EDITOR_SHORTCUTS.indent)}
        >
          Indent
        </MenubarItem>
        <MenubarItem
          decorator={<OutdentIcon />}
          disabled={disabled_prop || !can_outdent}
          onClick={outdent}
          right_slot={get_shortcut_label(EDITOR_SHORTCUTS.outdent)}
        >
          Outdent
        </MenubarItem>
      </MenubarRadioGroup>
    </MenubarSub>
  );
};

export default AlignItem;
