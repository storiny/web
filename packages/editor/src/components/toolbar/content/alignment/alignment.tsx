import { clsx } from "clsx";
import { useAtomValue } from "jotai";
import React from "react";

import Option from "~/components/Option";
import Select from "~/components/Select";

import { docStatusAtom } from "../../../../atoms";
import {
  Alignment,
  Alignment as AlignmentEnum,
  alignmentToIconMap
} from "../../../../constants";
import { useAlignment } from "../../../../hooks/use-alignment";
import toolbarStyles from "../../toolbar.module.scss";

// Item

const Item = ({
  label,
  alignment
}: {
  alignment: AlignmentEnum;
  label: React.ReactNode;
}): React.ReactElement => (
  <Option decorator={alignmentToIconMap[alignment]} value={alignment}>
    {label}
  </Option>
);

const ToolbarAlignmentItem = (): React.ReactElement => {
  const docStatus = useAtomValue(docStatusAtom);
  const [alignment, setAlignment, disabled] = useAlignment();
  const documentLoading = ["connecting", "reconnecting"].includes(docStatus);

  return (
    <Select
      disabled={documentLoading || disabled}
      onValueChange={setAlignment}
      size={"lg"}
      slot_props={{
        trigger: {
          "aria-label": "Alignment",
          className: clsx("focus-invert", toolbarStyles.x, toolbarStyles.select)
        },
        value: {
          placeholder: "Alignment"
        },
        content: {
          side: "top"
        }
      }}
      value={alignment}
      valueChildren={
        <span className={"flex-center"}>
          {alignmentToIconMap[alignment || Alignment.LEFT]}
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
