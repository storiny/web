import { getShortcutLabel } from "@storiny/shared/src/utils/get-shortcut-label";
import React from "react";

import ToggleGroup from "~/components/ToggleGroup";
import ToggleGroupItem from "~/components/ToggleGroupItem";

import {
  Alignment as AlignmentEnum,
  alignmentToIconMap
} from "../../../../../constants";
import { EDITOR_SHORTCUTS } from "../../../../../constants/shortcuts";
import { useAlignment } from "../../../../../hooks/use-alignment";

// Item

const Item = ({
  label,
  alignment,
  disabled,
  shortcut
}: {
  alignment: AlignmentEnum;
  disabled?: boolean;
  label: React.ReactNode;
  shortcut?: string;
}): React.ReactElement => (
  <ToggleGroupItem
    disabled={disabled}
    slotProps={{ tooltip: { rightSlot: shortcut } }}
    tooltipContent={label}
    value={alignment}
  >
    {alignmentToIconMap[alignment]}
  </ToggleGroupItem>
);

const Alignment = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const [alignment, setAlignment] = useAlignment();
  return (
    <ToggleGroup onValueChange={setAlignment} value={alignment}>
      <Item
        alignment={AlignmentEnum.LEFT}
        disabled={disabled}
        label={"Left align"}
        shortcut={getShortcutLabel(EDITOR_SHORTCUTS.leftAlign)}
      />
      <Item
        alignment={AlignmentEnum.CENTER}
        disabled={disabled}
        label={"Center align"}
        shortcut={getShortcutLabel(EDITOR_SHORTCUTS.centerAlign)}
      />
      <Item
        alignment={AlignmentEnum.RIGHT}
        disabled={disabled}
        label={"Right align"}
        shortcut={getShortcutLabel(EDITOR_SHORTCUTS.rightAlign)}
      />
      <Item
        alignment={AlignmentEnum.JUSTIFY}
        disabled={disabled}
        label={"Justify align"}
        shortcut={getShortcutLabel(EDITOR_SHORTCUTS.justifyAlign)}
      />
    </ToggleGroup>
  );
};

export default Alignment;
