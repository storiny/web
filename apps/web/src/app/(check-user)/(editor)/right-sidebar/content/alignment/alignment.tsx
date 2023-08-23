import React from "react";

import ToggleGroup from "~/components/ToggleGroup";
import ToggleGroupItem from "~/components/ToggleGroupItem";

import {
  Alignment as AlignmentEnum,
  alignmentToIconMap
} from "../../../constants";

// Item

const Item = ({
  label,
  alignment
}: {
  alignment: AlignmentEnum;
  label: React.ReactNode;
}): React.ReactElement => (
  <ToggleGroupItem tooltipContent={label} value={alignment}>
    {alignmentToIconMap[alignment]}
  </ToggleGroupItem>
);

const Alignment = (): React.ReactElement => (
  <ToggleGroup>
    <Item alignment={AlignmentEnum.LEFT} label={"Left align"} />
    <Item alignment={AlignmentEnum.CENTER} label={"Center align"} />
    <Item alignment={AlignmentEnum.RIGHT} label={"Right align"} />
    <Item alignment={AlignmentEnum.JUSTIFIED} label={"Justified align"} />
  </ToggleGroup>
);

export default Alignment;
