import { clsx } from "clsx";
import React from "react";

import Option from "~/components/Option";
import Select from "~/components/Select";

import {
  Alignment as AlignmentEnum,
  alignmentToIconMap
} from "../../../constants";
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
  const [value, setValue] = React.useState<AlignmentEnum>(AlignmentEnum.LEFT);
  return (
    <Select
      onValueChange={(newValue): void => setValue(newValue as AlignmentEnum)}
      size={"lg"}
      slotProps={{
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
      value={value}
      valueChildren={
        <span className={"flex-center"}>{alignmentToIconMap[value]}</span>
      }
    >
      <Item alignment={AlignmentEnum.LEFT} label={"Left align"} />
      <Item alignment={AlignmentEnum.CENTER} label={"Center align"} />
      <Item alignment={AlignmentEnum.RIGHT} label={"Right align"} />
      <Item alignment={AlignmentEnum.JUSTIFIED} label={"Justified align"} />
    </Select>
  );
};

export default ToolbarAlignmentItem;
