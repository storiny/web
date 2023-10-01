import { get_shortcut_label } from "@storiny/shared/src/utils/get-shortcut-label";
import React from "react";

import MenubarCheckboxItem from "~/components/menubar-checkbox-item";
import MenubarRadioGroup from "~/components/menubar-radio-group";
import MenubarRadioItem from "~/components/menubar-radio-item";
import MenubarSub from "~/components/menubar-sub";
import Separator from "~/components/separator";
import BoldIcon from "~/icons/bold";
import BulletedListIcon from "~/icons/bulleted-list";
import CodeIcon from "~/icons/code";
import HeadingIcon from "~/icons/heading";
import ItalicIcon from "~/icons/italic";
import LinkIcon from "~/icons/link";
import NumberedListIcon from "~/icons/numbered-list";
import ParagraphIcon from "~/icons/paragraph";
import QuoteIcon from "~/icons/quote";
import StrikethroughIcon from "~/icons/strikethrough";
import SubheadingIcon from "~/icons/subheading";
import SubscriptIcon from "~/icons/subscript";
import SuperscriptIcon from "~/icons/superscript";
import UnderlineIcon from "~/icons/underline";

import { TextStyle } from "../../../../../constants";
import { EDITOR_SHORTCUTS } from "../../../../../constants/shortcuts";
import { use_bold } from "../../../../../hooks/use-bold";
import { use_code } from "../../../../../hooks/use-code";
import { use_italic } from "../../../../../hooks/use-italic";
import { use_link } from "../../../../../hooks/use-link";
import { use_strikethrough } from "../../../../../hooks/use-strikethrough";
import { use_subscript } from "../../../../../hooks/use-subscript";
import { use_superscript } from "../../../../../hooks/use-superscript";
import { use_text_style } from "../../../../../hooks/use-text-style";
import { use_underline } from "../../../../../hooks/use-underline";

const TextNodeItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const {
    format_bulleted_list,
    format_numbered_list,
    format_paragraph,
    format_quote,
    format_heading,
    text_style
  } = use_text_style();
  return (
    <MenubarRadioGroup value={text_style}>
      <MenubarRadioItem
        decorator={<ParagraphIcon />}
        disabled={disabled}
        onClick={format_paragraph}
        right_slot={get_shortcut_label(EDITOR_SHORTCUTS.paragraph)}
        value={TextStyle.PARAGRAPH}
      >
        Paragraph
      </MenubarRadioItem>
      <MenubarRadioItem
        decorator={<HeadingIcon />}
        disabled={disabled}
        onClick={(): void => format_heading("h2")}
        right_slot={get_shortcut_label(EDITOR_SHORTCUTS.heading)}
        value={TextStyle.HEADING}
      >
        Heading
      </MenubarRadioItem>
      <MenubarRadioItem
        decorator={<SubheadingIcon />}
        disabled={disabled}
        onClick={(): void => format_heading("h3")}
        right_slot={get_shortcut_label(EDITOR_SHORTCUTS.subheading)}
        value={TextStyle.SUBHEADING}
      >
        Subheading
      </MenubarRadioItem>
      <MenubarRadioItem
        decorator={<QuoteIcon />}
        disabled={disabled}
        onClick={format_quote}
        right_slot={get_shortcut_label(EDITOR_SHORTCUTS.quote)}
        value={TextStyle.QUOTE}
      >
        Quote
      </MenubarRadioItem>
      <Separator />
      <MenubarRadioItem
        decorator={<BulletedListIcon />}
        disabled={disabled}
        onClick={format_bulleted_list}
        right_slot={get_shortcut_label(EDITOR_SHORTCUTS.bulleted_list)}
        value={TextStyle.BULLETED_LIST}
      >
        Bulleted list
      </MenubarRadioItem>
      <MenubarRadioItem
        decorator={<NumberedListIcon />}
        disabled={disabled}
        onClick={format_numbered_list}
        right_slot={get_shortcut_label(EDITOR_SHORTCUTS.numbered_list)}
        value={TextStyle.NUMBERED_LIST}
      >
        Numbered list
      </MenubarRadioItem>
    </MenubarRadioGroup>
  );
};

const TextStyleItem = ({
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

  return (
    <React.Fragment>
      <MenubarCheckboxItem
        checked={bold}
        decorator={<BoldIcon />}
        disabled={disabled}
        onCheckedChange={toggle_bold}
        right_slot={get_shortcut_label(EDITOR_SHORTCUTS.bold)}
      >
        Bold
      </MenubarCheckboxItem>
      <MenubarCheckboxItem
        checked={italic}
        decorator={<ItalicIcon />}
        disabled={disabled}
        onCheckedChange={toggle_italic}
        right_slot={get_shortcut_label(EDITOR_SHORTCUTS.italic)}
      >
        Italic
      </MenubarCheckboxItem>
      <MenubarCheckboxItem
        checked={underline}
        decorator={<UnderlineIcon />}
        disabled={disabled}
        onCheckedChange={toggle_underline}
        right_slot={get_shortcut_label(EDITOR_SHORTCUTS.underline)}
      >
        Underline
      </MenubarCheckboxItem>
      <MenubarCheckboxItem
        checked={strikethrough}
        decorator={<StrikethroughIcon />}
        disabled={disabled}
        onCheckedChange={toggle_strikethrough}
        right_slot={get_shortcut_label(EDITOR_SHORTCUTS.strikethrough)}
      >
        Strikethrough
      </MenubarCheckboxItem>
      <MenubarCheckboxItem
        checked={code}
        decorator={<CodeIcon />}
        disabled={disabled}
        onCheckedChange={toggle_code}
        right_slot={get_shortcut_label(EDITOR_SHORTCUTS.code)}
      >
        Code
      </MenubarCheckboxItem>
      <MenubarCheckboxItem
        checked={link}
        decorator={<LinkIcon />}
        disabled={disabled}
        onCheckedChange={(): void => insert_link()}
        right_slot={get_shortcut_label(EDITOR_SHORTCUTS.link)}
      >
        Link
      </MenubarCheckboxItem>
      <Separator />
      <MenubarCheckboxItem
        checked={subscript}
        decorator={<SubscriptIcon />}
        disabled={disabled}
        onCheckedChange={toggle_subscript}
        right_slot={get_shortcut_label(EDITOR_SHORTCUTS.subscript)}
      >
        Subscript
      </MenubarCheckboxItem>
      <MenubarCheckboxItem
        checked={superscript}
        decorator={<SuperscriptIcon />}
        disabled={disabled}
        onCheckedChange={toggle_superscript}
        right_slot={get_shortcut_label(EDITOR_SHORTCUTS.superscript)}
      >
        Superscript
      </MenubarCheckboxItem>
    </React.Fragment>
  );
};

const TextItem = ({ disabled }: { disabled?: boolean }): React.ReactElement => (
  <MenubarSub trigger={"Text"}>
    <TextNodeItem disabled={disabled} />
    <Separator />
    <TextStyleItem disabled={disabled} />
  </MenubarSub>
);

export default TextItem;
