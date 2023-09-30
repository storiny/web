import { get_shortcut_label } from "@storiny/shared/src/utils/get-shortcut-label";
import { clsx } from "clsx";
import React from "react";

import Option from "../../../../../../../../ui/src/components/option";
import Select from "../../../../../../../../ui/src/components/select";
import Spacer from "../../../../../../../../ui/src/components/spacer";
import ToggleGroup from "../../../../../../../../ui/src/components/toggle-group";
import ToggleGroupItem from "../../../../../../../../ui/src/components/toggle-group-item";
import Typography from "../../../../../../../../ui/src/components/typography";
import BoldIcon from "../../../../../../../../ui/src/icons/bold";
import CodeIcon from "../../../../../../../../ui/src/icons/code";
import ItalicIcon from "../../../../../../../../ui/src/icons/italic";
import LinkIcon from "../../../../../../../../ui/src/icons/link";
import StrikethroughIcon from "../../../../../../../../ui/src/icons/strikethrough";
import SubscriptIcon from "../../../../../../../../ui/src/icons/subscript";
import SuperscriptIcon from "../../../../../../../../ui/src/icons/superscript";
import UnderlineIcon from "../../../../../../../../ui/src/icons/underline";

import {
  TextStyle as TextStyleEnum,
  TEXT_STYLE_ICON_MAP,
  TEXT_STYLE_LABEL_MAP
} from "../../../../../../constants";
import { EDITOR_SHORTCUTS } from "../../../../../../constants/shortcuts";
import { use_bold } from "../../../../../../hooks/use-bold";
import { use_code } from "../../../../../../hooks/use-code";
import { use_italic } from "../../../../../../hooks/use-italic";
import { use_link } from "../../../../../../hooks/use-link";
import { use_strikethrough } from "../../../../../../hooks/use-strikethrough";
import { use_subscript } from "../../../../../../hooks/use-subscript";
import { use_superscript } from "../../../../../../hooks/use-superscript";
import { use_text_style } from "../../../../../../hooks/use-text-style";
import { use_underline } from "../../../../../../hooks/use-underline";
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
    decorator={TEXT_STYLE_ICON_MAP[value]}
    right_slot={shortcut}
    value={value}
  >
    {TEXT_STYLE_LABEL_MAP[value]}
  </Option>
);

// Toggle group

const TextStyleToggleGroup = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const [bold, toggle_bold] = use_bold();
  const [italic, toggle_italic] = use_italic();
  const [underline, toggle_underline] = use_underline();
  const [strikethrough, toggle_strikethrough] = use_strikethrough();
  const [subscript, toggle_subscript] = use_subscript();
  const [superscript, toggle_superscript] = use_superscript();
  const [code, toggle_code] = use_code();
  const [link, insert_link] = use_link();

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
        onClick={toggle_bold}
        slot_props={{
          tooltip: {
            right_slot: get_shortcut_label(EDITOR_SHORTCUTS.bold)
          }
        }}
        tooltip_content={"Bold"}
        value={"bold"}
      >
        <BoldIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        data-testid={"italic-toggle"}
        onClick={toggle_italic}
        slot_props={{
          tooltip: {
            right_slot: get_shortcut_label(EDITOR_SHORTCUTS.italic)
          }
        }}
        tooltip_content={"Italic"}
        value={"italic"}
      >
        <ItalicIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        data-testid={"underline-toggle"}
        onClick={toggle_underline}
        slot_props={{
          tooltip: {
            right_slot: get_shortcut_label(EDITOR_SHORTCUTS.underline)
          }
        }}
        tooltip_content={"Underline"}
        value={"underline"}
      >
        <UnderlineIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        data-testid={"strikethrough-toggle"}
        onClick={toggle_strikethrough}
        slot_props={{
          tooltip: {
            right_slot: get_shortcut_label(EDITOR_SHORTCUTS.strikethrough)
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
        onClick={toggle_code}
        slot_props={{
          tooltip: {
            right_slot: get_shortcut_label(EDITOR_SHORTCUTS.code)
          }
        }}
        tooltip_content={"Code"}
        value={"code"}
      >
        <CodeIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        data-testid={"link-toggle"}
        onClick={(): void => insert_link()}
        slot_props={{
          tooltip: {
            right_slot: get_shortcut_label(EDITOR_SHORTCUTS.link)
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
        onClick={toggle_subscript}
        slot_props={{
          tooltip: {
            right_slot: get_shortcut_label(EDITOR_SHORTCUTS.subscript)
          }
        }}
        tooltip_content={"Subscript"}
        value={"subscript"}
      >
        <SubscriptIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        data-testid={"superscript-toggle"}
        onClick={toggle_superscript}
        slot_props={{
          tooltip: {
            right_slot: get_shortcut_label(EDITOR_SHORTCUTS.superscript)
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
    format_numbered_list,
    format_bulleted_list,
    format_paragraph,
    text_style,
    format_quote,
    format_heading
  } = use_text_style();

  /**
   * Handles select value change
   * @param next_value New value
   */
  const handleValueChange = (next_value: TextStyleEnum): void => {
    switch (next_value) {
      case TextStyleEnum.BULLETED_LIST:
        format_bulleted_list();
        break;
      case TextStyleEnum.NUMBERED_LIST:
        format_numbered_list();
        break;
      case TextStyleEnum.PARAGRAPH:
        format_paragraph();
        break;
      case TextStyleEnum.QUOTE:
        format_quote();
        break;
      case TextStyleEnum.HEADING:
        format_heading("h2");
        break;
      case TextStyleEnum.SUBHEADING:
        format_heading("h3");
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
      value={text_style}
      value_children={
        <span className={"flex-center"}>
          {TEXT_STYLE_ICON_MAP[text_style]}
          <Spacer />
          {TEXT_STYLE_LABEL_MAP[text_style]}
        </span>
      }
    >
      <TextStyleOption
        shortcut={get_shortcut_label(EDITOR_SHORTCUTS.paragraph)}
        value={TextStyleEnum.PARAGRAPH}
      />
      <TextStyleOption
        shortcut={get_shortcut_label(EDITOR_SHORTCUTS.heading)}
        value={TextStyleEnum.HEADING}
      />
      <TextStyleOption
        shortcut={get_shortcut_label(EDITOR_SHORTCUTS.subheading)}
        value={TextStyleEnum.SUBHEADING}
      />
      <TextStyleOption
        shortcut={get_shortcut_label(EDITOR_SHORTCUTS.quote)}
        value={TextStyleEnum.QUOTE}
      />
      <TextStyleOption
        shortcut={get_shortcut_label(EDITOR_SHORTCUTS.bulleted_list)}
        value={TextStyleEnum.BULLETED_LIST}
      />
      <TextStyleOption
        shortcut={get_shortcut_label(EDITOR_SHORTCUTS.numbered_list)}
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
