import { clsx } from "clsx";
import React from "react";

import Option from "~/components/Option";
import Select from "~/components/Select";
import Spacer from "~/components/Spacer";
import ToggleGroup from "~/components/ToggleGroup";
import ToggleGroupItem from "~/components/ToggleGroupItem";
import Typography from "~/components/Typography";
import BoldIcon from "~/icons/Bold";
import CodeIcon from "~/icons/Code";
import ItalicIcon from "~/icons/Italic";
import LinkIcon from "~/icons/Link";
import StrikethroughIcon from "~/icons/Strikethrough";
import SubscriptIcon from "~/icons/Subscript";
import SuperscriptIcon from "~/icons/Superscript";
import UnderlineIcon from "~/icons/Underline";

import {
  TextStyle as TextStyleEnum,
  textStyleToIconMap,
  textStyleToLabelMap
} from "../../../constants";
import PaddedDivider from "../padded-divider";

// Option

const TextStyleOption = ({
  value
}: {
  value: TextStyleEnum;
}): React.ReactElement => (
  <Option decorator={textStyleToIconMap[value]} value={value}>
    {textStyleToLabelMap[value]}
  </Option>
);

// Toggle group

const TextStyleToggleGroup = (): React.ReactElement => (
  <ToggleGroup type={"multiple"}>
    <ToggleGroupItem tooltipContent={"Bold"} value={"bold"}>
      <BoldIcon />
    </ToggleGroupItem>
    <ToggleGroupItem tooltipContent={"Italic"} value={"italic"}>
      <ItalicIcon />
    </ToggleGroupItem>
    <ToggleGroupItem tooltipContent={"Underline"} value={"underline"}>
      <UnderlineIcon />
    </ToggleGroupItem>
    <ToggleGroupItem tooltipContent={"Strikethrough"} value={"strikethrough"}>
      <StrikethroughIcon />
    </ToggleGroupItem>
    <PaddedDivider />
    <ToggleGroupItem tooltipContent={"Code"} value={"code"}>
      <CodeIcon />
    </ToggleGroupItem>
    <ToggleGroupItem tooltipContent={"Link"} value={"link"}>
      <LinkIcon />
    </ToggleGroupItem>
    <PaddedDivider />
    <ToggleGroupItem tooltipContent={"Subscript"} value={"subscript"}>
      <SubscriptIcon />
    </ToggleGroupItem>
    <ToggleGroupItem tooltipContent={"Superscript"} value={"superscript"}>
      <SuperscriptIcon />
    </ToggleGroupItem>
  </ToggleGroup>
);

const TextStyle = (): React.ReactElement => {
  const [value, setValue] = React.useState<TextStyleEnum>(
    TextStyleEnum.PARAGRAPH
  );
  return (
    <div className={"flex-col"}>
      <Typography className={clsx("t-minor", "t-medium")} level={"body2"}>
        Text style
      </Typography>
      <Spacer orientation={"vertical"} size={2} />
      <Select
        onValueChange={(newValue): void => setValue(newValue as TextStyleEnum)}
        slotProps={{
          trigger: {
            "aria-label": "Text style"
          },
          value: {
            placeholder: "Text style"
          }
        }}
        value={value}
        valueChildren={
          <span className={"flex-center"}>
            {textStyleToIconMap[value]}
            <Spacer />
            {textStyleToLabelMap[value]}
          </span>
        }
      >
        <TextStyleOption value={TextStyleEnum.PARAGRAPH} />
        <TextStyleOption value={TextStyleEnum.HEADING} />
        <TextStyleOption value={TextStyleEnum.SUBHEADING} />
        <TextStyleOption value={TextStyleEnum.QUOTE} />
        <TextStyleOption value={TextStyleEnum.BULLETED_LIST} />
        <TextStyleOption value={TextStyleEnum.NUMBERED_LIST} />
      </Select>
      <Spacer orientation={"vertical"} size={2} />
      <TextStyleToggleGroup />
    </div>
  );
};

export default TextStyle;
