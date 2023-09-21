import { getShortcutLabel } from "@storiny/shared/src/utils/get-shortcut-label";
import React from "react";

import MenubarCheckboxItem from "~/components/MenubarCheckboxItem";
import MenubarRadioGroup from "~/components/MenubarRadioGroup";
import MenubarRadioItem from "~/components/MenubarRadioItem";
import MenubarSub from "~/components/MenubarSub";
import Separator from "~/components/Separator";
import BoldIcon from "~/icons/Bold";
import BulletedListIcon from "~/icons/BulletedList";
import CodeIcon from "~/icons/Code";
import HeadingIcon from "~/icons/Heading";
import ItalicIcon from "~/icons/Italic";
import LinkIcon from "~/icons/Link";
import NumberedListIcon from "~/icons/NumberedList";
import ParagraphIcon from "~/icons/Paragraph";
import QuoteIcon from "~/icons/Quote";
import StrikethroughIcon from "~/icons/Strikethrough";
import SubheadingIcon from "~/icons/Subheading";
import SubscriptIcon from "~/icons/Subscript";
import SuperscriptIcon from "~/icons/Superscript";
import UnderlineIcon from "~/icons/Underline";

import { TextStyle } from "../../../../../constants";
import { EDITOR_SHORTCUTS } from "../../../../../constants/shortcuts";
import { useBold } from "../../../../../hooks/use-bold";
import { useCode } from "../../../../../hooks/use-code";
import { useItalic } from "../../../../../hooks/use-italic";
import { useLink } from "../../../../../hooks/use-link";
import { useStrikethrough } from "../../../../../hooks/use-strikethrough";
import { useSubscript } from "../../../../../hooks/use-subscript";
import { useSuperscript } from "../../../../../hooks/use-superscript";
import { useTextStyle } from "../../../../../hooks/use-text-style";
import { useUnderline } from "../../../../../hooks/use-underline";

const TextNodeItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const {
    formatBulletedList,
    formatNumberedList,
    formatParagraph,
    formatQuote,
    formatHeading,
    textStyle
  } = useTextStyle();

  return (
    <MenubarRadioGroup value={textStyle}>
      <MenubarRadioItem
        decorator={<ParagraphIcon />}
        disabled={disabled}
        onClick={formatParagraph}
        rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.paragraph)}
        value={TextStyle.PARAGRAPH}
      >
        Paragraph
      </MenubarRadioItem>
      <MenubarRadioItem
        decorator={<HeadingIcon />}
        disabled={disabled}
        onClick={(): void => formatHeading("h2")}
        rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.heading)}
        value={TextStyle.HEADING}
      >
        Heading
      </MenubarRadioItem>
      <MenubarRadioItem
        decorator={<SubheadingIcon />}
        disabled={disabled}
        onClick={(): void => formatHeading("h3")}
        rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.subheading)}
        value={TextStyle.SUBHEADING}
      >
        Subheading
      </MenubarRadioItem>
      <MenubarRadioItem
        decorator={<QuoteIcon />}
        disabled={disabled}
        onClick={formatQuote}
        rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.quote)}
        value={TextStyle.QUOTE}
      >
        Quote
      </MenubarRadioItem>
      <Separator />
      <MenubarRadioItem
        decorator={<BulletedListIcon />}
        disabled={disabled}
        onClick={formatBulletedList}
        rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.bulletedList)}
        value={TextStyle.BULLETED_LIST}
      >
        Bulleted list
      </MenubarRadioItem>
      <MenubarRadioItem
        decorator={<NumberedListIcon />}
        disabled={disabled}
        onClick={formatNumberedList}
        rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.numberedList)}
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
  const [bold, toggleBold] = useBold();
  const [italic, toggleItalic] = useItalic();
  const [underline, toggleUnderline] = useUnderline();
  const [strikethrough, toggleStrikethrough] = useStrikethrough();
  const [subscript, toggleSubscript] = useSubscript();
  const [superscript, toggleSuperscript] = useSuperscript();
  const [code, toggleCode] = useCode();
  const [link, insertLink] = useLink();

  return (
    <React.Fragment>
      <MenubarCheckboxItem
        checked={bold}
        decorator={<BoldIcon />}
        disabled={disabled}
        onCheckedChange={toggleBold}
        rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.bold)}
      >
        Bold
      </MenubarCheckboxItem>
      <MenubarCheckboxItem
        checked={italic}
        decorator={<ItalicIcon />}
        disabled={disabled}
        onCheckedChange={toggleItalic}
        rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.italic)}
      >
        Italic
      </MenubarCheckboxItem>
      <MenubarCheckboxItem
        checked={underline}
        decorator={<UnderlineIcon />}
        disabled={disabled}
        onCheckedChange={toggleUnderline}
        rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.underline)}
      >
        Underline
      </MenubarCheckboxItem>
      <MenubarCheckboxItem
        checked={strikethrough}
        decorator={<StrikethroughIcon />}
        disabled={disabled}
        onCheckedChange={toggleStrikethrough}
        rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.strikethrough)}
      >
        Strikethrough
      </MenubarCheckboxItem>
      <MenubarCheckboxItem
        checked={code}
        decorator={<CodeIcon />}
        disabled={disabled}
        onCheckedChange={toggleCode}
        rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.code)}
      >
        Code
      </MenubarCheckboxItem>
      <MenubarCheckboxItem
        checked={link}
        decorator={<LinkIcon />}
        disabled={disabled}
        onCheckedChange={(): void => insertLink()}
        rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.link)}
      >
        Link
      </MenubarCheckboxItem>
      <Separator />
      <MenubarCheckboxItem
        checked={subscript}
        decorator={<SubscriptIcon />}
        disabled={disabled}
        onCheckedChange={toggleSubscript}
        rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.subscript)}
      >
        Subscript
      </MenubarCheckboxItem>
      <MenubarCheckboxItem
        checked={superscript}
        decorator={<SuperscriptIcon />}
        disabled={disabled}
        onCheckedChange={toggleSuperscript}
        rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.superscript)}
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
