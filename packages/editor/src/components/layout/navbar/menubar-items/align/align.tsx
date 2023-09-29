import { getShortcutLabel } from "@storiny/shared/src/utils/get-shortcut-label";
import React from "react";

import MenubarItem from "../../../../../../../ui/src/components/menubar-item";
import MenubarRadioGroup from "../../../../../../../ui/src/components/menubar-radio-group";
import MenubarRadioItem from "../../../../../../../ui/src/components/menubar-radio-item";
import MenubarSub from "../../../../../../../ui/src/components/menubar-sub";
import Separator from "../../../../../../../ui/src/components/separator";
import AlignCenterIcon from "~/icons/AlignCenter";
import AlignJustifyIcon from "~/icons/AlignJustify";
import AlignLeftIcon from "~/icons/AlignLeft";
import AlignRightIcon from "~/icons/AlignRight";
import IndentIcon from "~/icons/Indent";
import OutdentIcon from "~/icons/Outdent";

import { Alignment } from "../../../../../constants";
import { EDITOR_SHORTCUTS } from "../../../../../constants/shortcuts";
import { useAlignment } from "../../../../../hooks/use-alignment";
import { useIndentation } from "../../../../../hooks/use-indentation";

const AlignItem = ({
  disabled: disabled_prop
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const [alignment, setAlignment, disabled] = useAlignment();
  const { outdent, canOutdent, canIndent, indent } = useIndentation();

  return (
    <MenubarSub trigger={"Align"}>
      <MenubarRadioGroup value={alignment}>
        <MenubarRadioItem
          decorator={<AlignLeftIcon />}
          disabled={disabled_prop || disabled}
          onClick={(): void => setAlignment(Alignment.LEFT)}
          right_slot={getShortcutLabel(EDITOR_SHORTCUTS.leftAlign)}
          value={Alignment.LEFT}
        >
          Align left
        </MenubarRadioItem>
        <MenubarRadioItem
          decorator={<AlignCenterIcon />}
          disabled={disabled_prop || disabled}
          onClick={(): void => setAlignment(Alignment.CENTER)}
          right_slot={getShortcutLabel(EDITOR_SHORTCUTS.centerAlign)}
          value={Alignment.CENTER}
        >
          Align center
        </MenubarRadioItem>
        <MenubarRadioItem
          decorator={<AlignRightIcon />}
          disabled={disabled_prop || disabled}
          onClick={(): void => setAlignment(Alignment.RIGHT)}
          right_slot={getShortcutLabel(EDITOR_SHORTCUTS.rightAlign)}
          value={Alignment.RIGHT}
        >
          Align right
        </MenubarRadioItem>
        <MenubarRadioItem
          decorator={<AlignJustifyIcon />}
          disabled={disabled_prop || disabled}
          onClick={(): void => setAlignment(Alignment.JUSTIFY)}
          right_slot={getShortcutLabel(EDITOR_SHORTCUTS.justifyAlign)}
          value={Alignment.JUSTIFY}
        >
          Align justify
        </MenubarRadioItem>
        <Separator />
        <MenubarItem
          decorator={<IndentIcon />}
          disabled={disabled_prop || !canIndent}
          onClick={indent}
          right_slot={getShortcutLabel(EDITOR_SHORTCUTS.indent)}
        >
          Indent
        </MenubarItem>
        <MenubarItem
          decorator={<OutdentIcon />}
          disabled={disabled_prop || !canOutdent}
          onClick={outdent}
          right_slot={getShortcutLabel(EDITOR_SHORTCUTS.outdent)}
        >
          Outdent
        </MenubarItem>
      </MenubarRadioGroup>
    </MenubarSub>
  );
};

export default AlignItem;
