import { clsx } from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import React from "react";

import Option from "../../../../../../ui/src/components/option";
import Select from "../../../../../../ui/src/components/select";

import { doc_status_atom } from "../../../../atoms";
import {
  Alignment,
  Alignment as AlignmentEnum,
  ALIGNMENT_ICON_MAP
} from "../../../../constants";
import { use_alignment } from "../../../../hooks/use-alignment";
import toolbar_styles from "../../toolbar.module.scss";

// Item

const Item = ({
  label,
  alignment
}: {
  alignment: AlignmentEnum;
  label: React.ReactNode;
}): React.ReactElement => (
  <Option decorator={ALIGNMENT_ICON_MAP[alignment]} value={alignment}>
    {label}
  </Option>
);

const ToolbarAlignmentItem = (): React.ReactElement => {
  const doc_status = use_atom_value(doc_status_atom);
  const [alignment, set_alignment, disabled] = use_alignment();
  const document_loading = ["connecting", "reconnecting"].includes(doc_status);

  return (
    <Select
      disabled={document_loading || disabled}
      onValueChange={set_alignment}
      size={"lg"}
      slot_props={{
        trigger: {
          "aria-label": "Alignment",
          className: clsx(
            "focus-invert",
            toolbar_styles.x,
            toolbar_styles.select
          )
        },
        value: {
          placeholder: "Alignment"
        },
        content: {
          side: "top"
        }
      }}
      value={alignment}
      value_children={
        <span className={"flex-center"}>
          {ALIGNMENT_ICON_MAP[alignment || Alignment.LEFT]}
        </span>
      }
    >
      <Item alignment={AlignmentEnum.LEFT} label={"Left align"} />
      <Item alignment={AlignmentEnum.CENTER} label={"Center align"} />
      <Item alignment={AlignmentEnum.RIGHT} label={"Right align"} />
      <Item alignment={AlignmentEnum.JUSTIFY} label={"Justify align"} />
    </Select>
  );
};

export default ToolbarAlignmentItem;
