import { getShortcutLabel } from "@storiny/shared/src/utils/get-shortcut-label";
import React from "react";

import MenubarCheckboxItem from "~/components/MenubarCheckboxItem";
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

import { EDITOR_SHORTCUTS } from "../../../../../constants/shortcuts";

const TextItem = (): React.ReactElement => (
  <MenubarSub trigger={"Text"}>
    <MenubarCheckboxItem
      decorator={<ParagraphIcon />}
      rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.paragraph)}
    >
      Paragraph
    </MenubarCheckboxItem>
    <MenubarCheckboxItem
      decorator={<HeadingIcon />}
      rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.heading)}
    >
      Heading
    </MenubarCheckboxItem>
    <MenubarCheckboxItem
      decorator={<SubheadingIcon />}
      rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.subheading)}
    >
      Subheading
    </MenubarCheckboxItem>
    <MenubarCheckboxItem
      decorator={<QuoteIcon />}
      rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.quote)}
    >
      Quote
    </MenubarCheckboxItem>
    <Separator />
    <MenubarCheckboxItem
      decorator={<BulletedListIcon />}
      rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.bulletedList)}
    >
      Bulleted list
    </MenubarCheckboxItem>
    <MenubarCheckboxItem
      decorator={<NumberedListIcon />}
      rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.numberedList)}
    >
      Numbered list
    </MenubarCheckboxItem>
    <Separator />
    <MenubarCheckboxItem
      decorator={<BoldIcon />}
      rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.bold)}
    >
      Bold
    </MenubarCheckboxItem>
    <MenubarCheckboxItem
      decorator={<ItalicIcon />}
      rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.italic)}
    >
      Italic
    </MenubarCheckboxItem>
    <MenubarCheckboxItem
      decorator={<UnderlineIcon />}
      rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.underline)}
    >
      Underline
    </MenubarCheckboxItem>
    <MenubarCheckboxItem
      decorator={<StrikethroughIcon />}
      rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.strikethrough)}
    >
      Strikethrough
    </MenubarCheckboxItem>
    <MenubarCheckboxItem
      decorator={<CodeIcon />}
      rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.code)}
    >
      Code
    </MenubarCheckboxItem>
    <MenubarCheckboxItem
      decorator={<LinkIcon />}
      rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.link)}
    >
      Link
    </MenubarCheckboxItem>
    <Separator />
    <MenubarCheckboxItem
      decorator={<SubscriptIcon />}
      rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.subscript)}
    >
      Subscript
    </MenubarCheckboxItem>
    <MenubarCheckboxItem
      decorator={<SuperscriptIcon />}
      rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.superscript)}
    >
      Superscript
    </MenubarCheckboxItem>
  </MenubarSub>
);

export default TextItem;
