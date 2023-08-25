import { clsx } from "clsx";
import React from "react";

import Divider from "~/components/Divider";
import IconButton from "~/components/IconButton";
import Menu from "~/components/Menu";
import MenuItem from "~/components/MenuItem";
import Option from "~/components/Option";
import Select from "~/components/Select";
import Spacer from "~/components/Spacer";
import ToggleGroup from "~/components/ToggleGroup";
import ToggleGroupItem from "~/components/ToggleGroupItem";
import Tooltip from "~/components/Tooltip";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import BoldIcon from "~/icons/Bold";
import CodeIcon from "~/icons/Code";
import DotsIcon from "~/icons/Dots";
import ItalicIcon from "~/icons/Italic";
import LinkIcon from "~/icons/Link";
import StrikethroughIcon from "~/icons/Strikethrough";
import SubscriptIcon from "~/icons/Subscript";
import SuperscriptIcon from "~/icons/Superscript";
import UnderlineIcon from "~/icons/Underline";
import { breakpoints } from "~/theme/breakpoints";

import {
  TextStyle as TextStyleEnum,
  textStyleToIconMap,
  textStyleToLabelMap
} from "../../../../constants";
import toolbarStyles from "../../toolbar.module.scss";
import styles from "./text-style.module.scss";

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
    <ToggleGroupItem
      className={clsx("focus-invert", toolbarStyles.x, toolbarStyles.button)}
      size={"lg"}
      tooltipContent={"Bold"}
      value={"bold"}
    >
      <BoldIcon />
    </ToggleGroupItem>
    <ToggleGroupItem
      className={clsx("focus-invert", toolbarStyles.x, toolbarStyles.button)}
      size={"lg"}
      tooltipContent={"Italic"}
      value={"italic"}
    >
      <ItalicIcon />
    </ToggleGroupItem>
    <ToggleGroupItem
      className={clsx("focus-invert", toolbarStyles.x, toolbarStyles.button)}
      size={"lg"}
      tooltipContent={"Underline"}
      value={"underline"}
    >
      <UnderlineIcon />
    </ToggleGroupItem>
    <ToggleGroupItem
      className={clsx("focus-invert", toolbarStyles.x, toolbarStyles.button)}
      size={"lg"}
      tooltipContent={"Link"}
      value={"link"}
    >
      <LinkIcon />
    </ToggleGroupItem>
  </ToggleGroup>
);

const ToolbarTextStyleItem = (): React.ReactElement => {
  const isSmallerThanMobile = useMediaQuery(breakpoints.down("mobile"));
  const [value, setValue] = React.useState<TextStyleEnum>(
    TextStyleEnum.PARAGRAPH
  );

  return (
    <React.Fragment>
      <Select
        onValueChange={(newValue): void => setValue(newValue as TextStyleEnum)}
        size={"lg"}
        slotProps={{
          trigger: {
            "aria-label": "Text style",
            className: clsx(
              "focus-invert",
              toolbarStyles.x,
              toolbarStyles.select,
              styles.x,
              styles.select
            )
          },
          value: {
            placeholder: "Text style"
          },
          content: {
            side: "top"
          }
        }}
        value={value}
        valueChildren={
          <span className={"flex-center"}>
            {textStyleToIconMap[value]}
            {!isSmallerThanMobile && (
              <React.Fragment>
                <Spacer />
                {textStyleToLabelMap[value]}
              </React.Fragment>
            )}
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
      <Divider orientation={"vertical"} />
      <TextStyleToggleGroup />
      <Menu
        slotProps={{
          content: {
            side: "top"
          }
        }}
        trigger={
          <div>
            <Tooltip content={"More formatting options"}>
              <IconButton
                className={clsx(
                  "focus-invert",
                  toolbarStyles.x,
                  toolbarStyles.button
                )}
                size={"lg"}
                variant={"ghost"}
              >
                <DotsIcon />
              </IconButton>
            </Tooltip>
          </div>
        }
      >
        <MenuItem decorator={<CodeIcon />}>Code</MenuItem>
        <MenuItem decorator={<StrikethroughIcon />}>Strikethrough</MenuItem>
        <MenuItem decorator={<SubscriptIcon />}>Subscript</MenuItem>
        <MenuItem decorator={<SuperscriptIcon />}>Superscript</MenuItem>
      </Menu>
    </React.Fragment>
  );
};

export default ToolbarTextStyleItem;
