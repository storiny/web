import { get_shortcut_label } from "@storiny/shared/src/utils/get-shortcut-label";
import React from "react";

import ToggleGroup from "../../../../../../../../ui/src/components/toggle-group";
import ToggleGroupItem, {
  ToggleGroupItemProps
} from "../../../../../../../../ui/src/components/toggle-group-item";

import {
  Alignment as AlignmentEnum,
  ALIGNMENT_ICON_MAP
} from "../../../../../../constants";
import { EDITOR_SHORTCUTS } from "../../../../../../constants/shortcuts";
import { use_alignment } from "../../../../../../hooks/use-alignment";

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
    slot_props={{ tooltip: { right_slot: shortcut } }}
    tooltip_content={label}
    value={alignment}
  >
    {ALIGNMENT_ICON_MAP[alignment]}
  </ToggleGroupItem>
);

const Alignment = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const [alignment, set_alignment, alignment_disabled] = use_alignment();
  return (
    <ToggleGroup onValueChange={set_alignment} value={alignment}>
      <Item
        alignment={AlignmentEnum.LEFT}
        data-testid={"align-left"}
        disabled={disabled || alignment_disabled}
        label={"Left align"}
        shortcut={get_shortcut_label(EDITOR_SHORTCUTS.left_align)}
      />
      <Item
        alignment={AlignmentEnum.CENTER}
        data-testid={"align-center"}
        disabled={disabled || alignment_disabled}
        label={"Center align"}
        shortcut={get_shortcut_label(EDITOR_SHORTCUTS.center_align)}
      />
      <Item
        alignment={AlignmentEnum.RIGHT}
        data-testid={"align-right"}
        disabled={disabled || alignment_disabled}
        label={"Right align"}
        shortcut={get_shortcut_label(EDITOR_SHORTCUTS.right_align)}
      />
      <Item
        alignment={AlignmentEnum.JUSTIFY}
        data-testid={"align-justify"}
        disabled={disabled || alignment_disabled}
        label={"Justify align"}
        shortcut={get_shortcut_label(EDITOR_SHORTCUTS.justify_align)}
      />
    </ToggleGroup>
  );
};

export default Alignment;
