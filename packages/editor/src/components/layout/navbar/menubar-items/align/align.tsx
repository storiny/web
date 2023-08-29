import { getShortcutLabel } from "@storiny/shared/src/utils/get-shortcut-label";
import React from "react";

import MenubarItem from "~/components/MenubarItem";
import MenubarRadioGroup from "~/components/MenubarRadioGroup";
import MenubarRadioItem from "~/components/MenubarRadioItem";
import MenubarSub from "~/components/MenubarSub";
import Separator from "~/components/Separator";
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

const AlignItem = (): React.ReactElement => {
  const [alignment, setAlignment] = useAlignment();
  const { outdent, canOutdent, canIndent, indent } = useIndentation();

  return (
    <MenubarSub trigger={"Align"}>
      <MenubarRadioGroup value={alignment}>
        <MenubarRadioItem
          decorator={<AlignLeftIcon />}
          onClick={(): void => setAlignment(Alignment.LEFT)}
          rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.leftAlign)}
          value={Alignment.LEFT}
        >
          Align left
        </MenubarRadioItem>
        <MenubarRadioItem
          decorator={<AlignCenterIcon />}
          onClick={(): void => setAlignment(Alignment.CENTER)}
          rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.centerAlign)}
          value={Alignment.CENTER}
        >
          Align center
        </MenubarRadioItem>
        <MenubarRadioItem
          decorator={<AlignRightIcon />}
          onClick={(): void => setAlignment(Alignment.RIGHT)}
          rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.rightAlign)}
          value={Alignment.RIGHT}
        >
          Align right
        </MenubarRadioItem>
        <MenubarRadioItem
          decorator={<AlignJustifyIcon />}
          onClick={(): void => setAlignment(Alignment.JUSTIFY)}
          rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.justifyAlign)}
          value={Alignment.JUSTIFY}
        >
          Align justify
        </MenubarRadioItem>
        <Separator />
        <MenubarItem
          decorator={<IndentIcon />}
          disabled={!canIndent}
          onClick={indent}
          rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.indent)}
        >
          Indent
        </MenubarItem>
        <MenubarItem
          decorator={<OutdentIcon />}
          disabled={!canOutdent}
          onClick={outdent}
          rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.outdent)}
        >
          Outdent
        </MenubarItem>
      </MenubarRadioGroup>
    </MenubarSub>
  );
};

export default AlignItem;
