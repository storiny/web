import { getShortcutLabel } from "@storiny/shared/src/utils/get-shortcut-label";
import React from "react";

import ToggleGroup from "~/components/ToggleGroup";
import ToggleGroupItem, {
  ToggleGroupItemProps
} from "~/components/ToggleGroupItem";

import {
  Alignment as AlignmentEnum,
  alignmentToIconMap
} from "../../../../../../constants";
import { EDITOR_SHORTCUTS } from "../../../../../../constants/shortcuts";
import { useAlignment } from "../../../../../../hooks/use-alignment";

// Item

const Item = ({
  label,
  alignment,
  disabled,
  shortcut,
  ...rest
}: {
  alignment: AlignmentEnum;
  disabled?: boolean;
  label: React.ReactNode;
  shortcut?: string;
} & Omit<ToggleGroupItemProps, "value">): React.ReactElement => (
  <ToggleGroupItem
    {...rest}
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
  const [alignment, setAlignment, alignmentDisabled] = useAlignment();
  return (
    <ToggleGroup onValueChange={setAlignment} value={alignment}>
      <Item
        alignment={AlignmentEnum.LEFT}
        data-testid={"align-left"}
        disabled={disabled || alignmentDisabled}
        label={"Left align"}
        shortcut={getShortcutLabel(EDITOR_SHORTCUTS.leftAlign)}
      />
      <Item
        alignment={AlignmentEnum.CENTER}
        data-testid={"align-center"}
        disabled={disabled || alignmentDisabled}
        label={"Center align"}
        shortcut={getShortcutLabel(EDITOR_SHORTCUTS.centerAlign)}
      />
      <Item
        alignment={AlignmentEnum.RIGHT}
        data-testid={"align-right"}
        disabled={disabled || alignmentDisabled}
        label={"Right align"}
        shortcut={getShortcutLabel(EDITOR_SHORTCUTS.rightAlign)}
      />
      <Item
        alignment={AlignmentEnum.JUSTIFY}
        data-testid={"align-justify"}
        disabled={disabled || alignmentDisabled}
        label={"Justify align"}
        shortcut={getShortcutLabel(EDITOR_SHORTCUTS.justifyAlign)}
      />
    </ToggleGroup>
  );
};

export default Alignment;
