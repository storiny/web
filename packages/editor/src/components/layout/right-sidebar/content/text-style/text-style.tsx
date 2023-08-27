import { getShortcutLabel } from "@storiny/shared/src/utils/get-shortcut-label";
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
} from "../../../../../constants";
import { EDITOR_SHORTCUTS } from "../../../../../constants/shortcuts";
import { useBold } from "../../../../../hooks/useBold";
import { useCode } from "../../../../../hooks/useCode";
import { useItalic } from "../../../../../hooks/useItalic";
import { useLink } from "../../../../../hooks/useLink";
import { useStrikethrough } from "../../../../../hooks/useStrikethrough";
import { useSubscript } from "../../../../../hooks/useSubscript";
import { useSuperscript } from "../../../../../hooks/useSuperscript";
import { useTextStyle } from "../../../../../hooks/useTextStyle";
import { useUnderline } from "../../../../../hooks/useUnderline";
import PaddedDivider from "../padded-divider";

// Option

const TextStyleOption = ({
  value,
  shortcut
}: {
  shortcut: string;
  value: TextStyleEnum;
}): React.ReactElement => (
  <Option
    decorator={textStyleToIconMap[value]}
    rightSlot={shortcut}
    value={value}
  >
    {textStyleToLabelMap[value]}
  </Option>
);

// Toggle group

const TextStyleToggleGroup = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const [bold, toggleBold] = useBold();
  const [italic, toggleItalic] = useItalic();
  const [underline, toggleUnderline] = useUnderline();
  const [strikethrough, toggleStrikethrough] = useStrikethrough();
  const [subscript, toggleSubscript] = useSubscript();
  const [superscript, toggleSuperscript] = useSuperscript();
  const [code, toggleCode] = useCode();
  const [link, insertLink] = useLink();

  const value = React.useMemo(
    () =>
      [
        bold && "bold",
        italic && "italic",
        underline && "underline",
        strikethrough && "strikethrough",
        subscript && "subscript",
        superscript && "superscript",
        code && "code",
        link && "link"
      ].filter((item) => typeof item === "string") as string[],
    [bold, code, italic, link, strikethrough, subscript, superscript, underline]
  );

  return (
    <ToggleGroup disabled={disabled} type={"multiple"} value={value}>
      <ToggleGroupItem
        onClick={toggleBold}
        slotProps={{
          tooltip: {
            rightSlot: getShortcutLabel(EDITOR_SHORTCUTS.bold)
          }
        }}
        tooltipContent={"Bold"}
        value={"bold"}
      >
        <BoldIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        onClick={toggleItalic}
        slotProps={{
          tooltip: {
            rightSlot: getShortcutLabel(EDITOR_SHORTCUTS.italic)
          }
        }}
        tooltipContent={"Italic"}
        value={"italic"}
      >
        <ItalicIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        onClick={toggleUnderline}
        slotProps={{
          tooltip: {
            rightSlot: getShortcutLabel(EDITOR_SHORTCUTS.underline)
          }
        }}
        tooltipContent={"Underline"}
        value={"underline"}
      >
        <UnderlineIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        onClick={toggleStrikethrough}
        slotProps={{
          tooltip: {
            rightSlot: getShortcutLabel(EDITOR_SHORTCUTS.strikethrough)
          }
        }}
        tooltipContent={"Strikethrough"}
        value={"strikethrough"}
      >
        <StrikethroughIcon />
      </ToggleGroupItem>
      <PaddedDivider />
      <ToggleGroupItem
        onClick={toggleCode}
        slotProps={{
          tooltip: {
            rightSlot: getShortcutLabel(EDITOR_SHORTCUTS.code)
          }
        }}
        tooltipContent={"Code"}
        value={"code"}
      >
        <CodeIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        onClick={insertLink}
        slotProps={{
          tooltip: {
            rightSlot: getShortcutLabel(EDITOR_SHORTCUTS.link)
          }
        }}
        tooltipContent={"Link"}
        value={"link"}
      >
        <LinkIcon />
      </ToggleGroupItem>
      <PaddedDivider />
      <ToggleGroupItem
        onClick={toggleSubscript}
        slotProps={{
          tooltip: {
            rightSlot: getShortcutLabel(EDITOR_SHORTCUTS.subscript)
          }
        }}
        tooltipContent={"Subscript"}
        value={"subscript"}
      >
        <SubscriptIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        onClick={toggleSuperscript}
        slotProps={{
          tooltip: {
            rightSlot: getShortcutLabel(EDITOR_SHORTCUTS.superscript)
          }
        }}
        tooltipContent={"Superscript"}
        value={"superscript"}
      >
        <SuperscriptIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

const TextStyleSelect = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const {
    formatNumberedList,
    formatBulletedList,
    formatParagraph,
    textStyle,
    formatQuote,
    formatHeading
  } = useTextStyle();

  /**
   * Handles select value change
   * @param newValue New value
   */
  const handleValueChange = (newValue: TextStyleEnum): void => {
    switch (newValue) {
      case TextStyleEnum.BULLETED_LIST:
        formatBulletedList();
        break;
      case TextStyleEnum.NUMBERED_LIST:
        formatNumberedList();
        break;
      case TextStyleEnum.PARAGRAPH:
        formatParagraph();
        break;
      case TextStyleEnum.QUOTE:
        formatQuote();
        break;
      case TextStyleEnum.HEADING:
        formatHeading("h2");
        break;
      case TextStyleEnum.SUBHEADING:
        formatHeading("h3");
        break;
    }
  };

  return (
    <Select
      disabled={disabled}
      onValueChange={handleValueChange}
      slotProps={{
        trigger: {
          "aria-label": "Text style"
        },
        value: {
          placeholder: "Text style"
        }
      }}
      value={textStyle}
      valueChildren={
        <span className={"flex-center"}>
          {textStyleToIconMap[textStyle]}
          <Spacer />
          {textStyleToLabelMap[textStyle]}
        </span>
      }
    >
      <TextStyleOption
        shortcut={getShortcutLabel(EDITOR_SHORTCUTS.paragraph)}
        value={TextStyleEnum.PARAGRAPH}
      />
      <TextStyleOption
        shortcut={getShortcutLabel(EDITOR_SHORTCUTS.heading)}
        value={TextStyleEnum.HEADING}
      />
      <TextStyleOption
        shortcut={getShortcutLabel(EDITOR_SHORTCUTS.subheading)}
        value={TextStyleEnum.SUBHEADING}
      />
      <TextStyleOption
        shortcut={getShortcutLabel(EDITOR_SHORTCUTS.quote)}
        value={TextStyleEnum.QUOTE}
      />
      <TextStyleOption
        shortcut={getShortcutLabel(EDITOR_SHORTCUTS.bulletedList)}
        value={TextStyleEnum.BULLETED_LIST}
      />
      <TextStyleOption
        shortcut={getShortcutLabel(EDITOR_SHORTCUTS.numberedList)}
        value={TextStyleEnum.NUMBERED_LIST}
      />
    </Select>
  );
};

const TextStyle = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => (
  <div className={"flex-col"}>
    <Typography className={clsx("t-minor", "t-medium")} level={"body2"}>
      Text style
    </Typography>
    <Spacer orientation={"vertical"} size={2} />
    <TextStyleSelect disabled={disabled} />
    <Spacer orientation={"vertical"} size={2} />
    <TextStyleToggleGroup disabled={disabled} />
  </div>
);

export default TextStyle;
