import { getShortcutLabel } from "@storiny/shared/src/utils/get-shortcut-label";
import { clsx } from "clsx";
import React from "react";

import Option from "../../../../../../../../ui/src/components/option";
import Select from "../../../../../../../../ui/src/components/select";
import Spacer from "../../../../../../../../ui/src/components/spacer";
import ToggleGroup from "../../../../../../../../ui/src/components/toggle-group";
import ToggleGroupItem from "../../../../../../../../ui/src/components/toggle-group-item";
import Typography from "../../../../../../../../ui/src/components/typography";
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
} from "../../../../../../constants";
import { EDITOR_SHORTCUTS } from "../../../../../../constants/shortcuts";
import { useBold } from "../../../../../../hooks/use-bold";
import { useCode } from "../../../../../../hooks/use-code";
import { useItalic } from "../../../../../../hooks/use-italic";
import { useLink } from "../../../../../../hooks/use-link";
import { useStrikethrough } from "../../../../../../hooks/use-strikethrough";
import { useSubscript } from "../../../../../../hooks/use-subscript";
import { useSuperscript } from "../../../../../../hooks/use-superscript";
import { useTextStyle } from "../../../../../../hooks/use-text-style";
import { useUnderline } from "../../../../../../hooks/use-underline";
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
    right_slot={shortcut}
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
        data-testid={"bold-toggle"}
        onClick={toggleBold}
        slot_props={{
          tooltip: {
            right_slot: getShortcutLabel(EDITOR_SHORTCUTS.bold)
          }
        }}
        tooltip_content={"Bold"}
        value={"bold"}
      >
        <BoldIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        data-testid={"italic-toggle"}
        onClick={toggleItalic}
        slot_props={{
          tooltip: {
            right_slot: getShortcutLabel(EDITOR_SHORTCUTS.italic)
          }
        }}
        tooltip_content={"Italic"}
        value={"italic"}
      >
        <ItalicIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        data-testid={"underline-toggle"}
        onClick={toggleUnderline}
        slot_props={{
          tooltip: {
            right_slot: getShortcutLabel(EDITOR_SHORTCUTS.underline)
          }
        }}
        tooltip_content={"Underline"}
        value={"underline"}
      >
        <UnderlineIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        data-testid={"strikethrough-toggle"}
        onClick={toggleStrikethrough}
        slot_props={{
          tooltip: {
            right_slot: getShortcutLabel(EDITOR_SHORTCUTS.strikethrough)
          }
        }}
        tooltip_content={"Strikethrough"}
        value={"strikethrough"}
      >
        <StrikethroughIcon />
      </ToggleGroupItem>
      <PaddedDivider />
      <ToggleGroupItem
        data-testid={"code-toggle"}
        onClick={toggleCode}
        slot_props={{
          tooltip: {
            right_slot: getShortcutLabel(EDITOR_SHORTCUTS.code)
          }
        }}
        tooltip_content={"Code"}
        value={"code"}
      >
        <CodeIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        data-testid={"link-toggle"}
        onClick={(): void => insertLink()}
        slot_props={{
          tooltip: {
            right_slot: getShortcutLabel(EDITOR_SHORTCUTS.link)
          }
        }}
        tooltip_content={"Link"}
        value={"link"}
      >
        <LinkIcon />
      </ToggleGroupItem>
      <PaddedDivider />
      <ToggleGroupItem
        data-testid={"subscript-toggle"}
        onClick={toggleSubscript}
        slot_props={{
          tooltip: {
            right_slot: getShortcutLabel(EDITOR_SHORTCUTS.subscript)
          }
        }}
        tooltip_content={"Subscript"}
        value={"subscript"}
      >
        <SubscriptIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        data-testid={"superscript-toggle"}
        onClick={toggleSuperscript}
        slot_props={{
          tooltip: {
            right_slot: getShortcutLabel(EDITOR_SHORTCUTS.superscript)
          }
        }}
        tooltip_content={"Superscript"}
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
      slot_props={{
        trigger: {
          "aria-label": "Text style"
        },
        value: {
          placeholder: "Text style"
        }
      }}
      value={textStyle}
      value_children={
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
