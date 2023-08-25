"use client";

import { useAtom } from "jotai";
import NextLink from "next/link";
import React from "react";

import MenubarCheckboxItem from "~/components/MenubarCheckboxItem";
import MenubarItem from "~/components/MenubarItem";
import MenubarRadioGroup from "~/components/MenubarRadioGroup";
import MenubarRadioItem from "~/components/MenubarRadioItem";
import MenubarSub from "~/components/MenubarSub";
import Separator from "~/components/Separator";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import AdjustIcon from "~/icons/Adjust";
import AlignCenterIcon from "~/icons/AlignCenter";
import AlignJustifyIcon from "~/icons/AlignJustify";
import AlignLeftIcon from "~/icons/AlignLeft";
import AlignRightIcon from "~/icons/AlignRight";
import BoldIcon from "~/icons/Bold";
import BulletedListIcon from "~/icons/BulletedList";
import CodeIcon from "~/icons/Code";
import CodeBlockIcon from "~/icons/CodeBlock";
import EmbedIcon from "~/icons/Embed";
import HeadingIcon from "~/icons/Heading";
import HorizontalRuleIcon from "~/icons/HorizontalRule";
import ImageIcon from "~/icons/Image";
import IndentIcon from "~/icons/Indent";
import ItalicIcon from "~/icons/Italic";
import LinkIcon from "~/icons/Link";
import MoodSmileIcon from "~/icons/MoodSmile";
import MoonIcon from "~/icons/Moon";
import NumberedListIcon from "~/icons/NumberedList";
import OmegaIcon from "~/icons/Omega";
import OutdentIcon from "~/icons/Outdent";
import ParagraphIcon from "~/icons/Paragraph";
import QuoteIcon from "~/icons/Quote";
import RedoIcon from "~/icons/Redo";
import StrikethroughIcon from "~/icons/Strikethrough";
import SubheadingIcon from "~/icons/Subheading";
import SunIcon from "~/icons/Sun";
import UnderlineIcon from "~/icons/Underline";
import UndoIcon from "~/icons/Undo";
import { selectTheme, setTheme } from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";

import { sidebarsCollapsedAtom } from "../../../../atoms";

// File item

const FileItem = (): React.ReactElement => (
  <MenubarSub trigger={"File"}>
    <MenubarItem rightSlot={"⌘+O"}>Open…</MenubarItem>
    <MenubarItem>Save local copy…</MenubarItem>
    <Separator />
    <MenubarItem>Show version history</MenubarItem>
  </MenubarSub>
);

// Edit item

const EditItem = (): React.ReactElement => (
  <MenubarSub trigger={"Edit"}>
    <MenubarItem decorator={<UndoIcon />} rightSlot={"⌘+Z"}>
      Undo
    </MenubarItem>
    <MenubarItem decorator={<RedoIcon />} rightSlot={"⌘+Y"}>
      Redo
    </MenubarItem>
  </MenubarSub>
);

// View item

const ViewItem = (): React.ReactElement | null => {
  const isSmallerThanDesktop = useMediaQuery(breakpoints.down("desktop"));
  const [sidebarsCollapsed, setSidebarsCollapsed] = useAtom(
    sidebarsCollapsedAtom
  );

  return isSmallerThanDesktop ? null : (
    <MenubarSub trigger={"View"}>
      <MenubarItem
        onSelect={(event): void => {
          event.preventDefault(); // Prevent closing the menubar
          setSidebarsCollapsed((prev) => !prev);
        }}
        rightSlot={"⌘+\\"}
      >
        {sidebarsCollapsed ? "Show" : "Hide"} sidebars
      </MenubarItem>
    </MenubarSub>
  );
};

// Text item

const TextItem = (): React.ReactElement => (
  <MenubarSub trigger={"Text"}>
    <MenubarCheckboxItem decorator={<ParagraphIcon />} rightSlot={"⌘+P"}>
      Paragraph
    </MenubarCheckboxItem>
    <MenubarCheckboxItem decorator={<HeadingIcon />} rightSlot={"⌘+H"}>
      Heading
    </MenubarCheckboxItem>
    <MenubarCheckboxItem decorator={<SubheadingIcon />} rightSlot={"⌘+Shift+H"}>
      Subheading
    </MenubarCheckboxItem>
    <MenubarCheckboxItem decorator={<QuoteIcon />} rightSlot={"⌘+Q"}>
      Quote
    </MenubarCheckboxItem>
    <Separator />
    <MenubarCheckboxItem
      decorator={<BulletedListIcon />}
      rightSlot={"⌘+Shift+8"}
    >
      Bulleted list
    </MenubarCheckboxItem>
    <MenubarCheckboxItem
      decorator={<NumberedListIcon />}
      rightSlot={"⌘+Shift+7"}
    >
      Numbered list
    </MenubarCheckboxItem>
    <Separator />
    <MenubarCheckboxItem decorator={<BoldIcon />} rightSlot={"⌘+B"}>
      Bold
    </MenubarCheckboxItem>
    <MenubarCheckboxItem decorator={<ItalicIcon />} rightSlot={"⌘+I"}>
      Italic
    </MenubarCheckboxItem>
    <MenubarCheckboxItem decorator={<UnderlineIcon />} rightSlot={"⌘+U"}>
      Underline
    </MenubarCheckboxItem>
    <MenubarCheckboxItem
      decorator={<StrikethroughIcon />}
      rightSlot={"⌘+Shift+X"}
    >
      Strikethrough
    </MenubarCheckboxItem>
    <MenubarCheckboxItem decorator={<CodeIcon />} rightSlot={"⌘+`"}>
      Code
    </MenubarCheckboxItem>
    <MenubarCheckboxItem decorator={<LinkIcon />} rightSlot={"⌘+K"}>
      Link
    </MenubarCheckboxItem>
  </MenubarSub>
);

// Align item

const AlignItem = (): React.ReactElement => (
  <MenubarSub trigger={"Align"}>
    <MenubarCheckboxItem decorator={<AlignLeftIcon />} rightSlot={"⌘+Alt+L"}>
      Align left
    </MenubarCheckboxItem>
    <MenubarCheckboxItem decorator={<AlignCenterIcon />} rightSlot={"⌘+Alt+T"}>
      Align center
    </MenubarCheckboxItem>
    <MenubarCheckboxItem decorator={<AlignRightIcon />} rightSlot={"⌘+Alt+R"}>
      Align right
    </MenubarCheckboxItem>
    <MenubarCheckboxItem decorator={<AlignJustifyIcon />} rightSlot={"⌘+Alt+J"}>
      Align justify
    </MenubarCheckboxItem>
    <Separator />
    <MenubarItem decorator={<IndentIcon />} rightSlot={"⌘+["}>
      Indent
    </MenubarItem>
    <MenubarItem decorator={<OutdentIcon />} rightSlot={"⌘+]"}>
      Outdent
    </MenubarItem>
  </MenubarSub>
);

// Insert item

const InsertItem = (): React.ReactElement => (
  <MenubarSub trigger={"Insert"}>
    <MenubarItem decorator={<HorizontalRuleIcon />}>
      Horizontal rule
    </MenubarItem>
    <MenubarItem decorator={<ImageIcon />}>Image</MenubarItem>
    <MenubarItem decorator={<CodeBlockIcon />}>Code block</MenubarItem>
    <MenubarItem decorator={<EmbedIcon />}>Embed</MenubarItem>
    <MenubarItem decorator={<MoodSmileIcon />}>Emoji</MenubarItem>
    <MenubarItem decorator={<OmegaIcon />}>Special character</MenubarItem>
  </MenubarSub>
);

// Help item

const HelpItem = (): React.ReactElement => (
  <MenubarSub trigger={"Help"}>
    <MenubarItem as={NextLink} href={"/help"} target={"_blank"}>
      Help center
    </MenubarItem>
    <MenubarItem as={NextLink} href={"/legal"} target={"_blank"}>
      Legal
    </MenubarItem>
    <Separator />
    <MenubarItem as={NextLink} href={"/me/account/profile"}>
      Account settings
    </MenubarItem>
    <MenubarItem as={NextLink} href={"/logout"}>
      Logout
    </MenubarItem>
  </MenubarSub>
);

// Theme item

const ThemeItem = (): React.ReactElement => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);

  return (
    <MenubarSub trigger={"Theme"}>
      <MenubarRadioGroup
        onValueChange={(newValue): void => {
          dispatch(setTheme(newValue as typeof theme));
        }}
        value={theme}
      >
        <MenubarRadioItem
          decorator={<AdjustIcon rotation={90} />}
          onSelect={(event): void => event.preventDefault()}
          value={"system"}
        >
          System
        </MenubarRadioItem>
        <MenubarRadioItem
          decorator={<SunIcon />}
          onSelect={(event): void => event.preventDefault()}
          value={"light"}
        >
          Light
        </MenubarRadioItem>
        <MenubarRadioItem
          decorator={<MoonIcon />}
          onSelect={(event): void => event.preventDefault()}
          value={"dark"}
        >
          Dark
        </MenubarRadioItem>
      </MenubarRadioGroup>
    </MenubarSub>
  );
};

const EditorMenubarItems = (): React.ReactElement => (
  <React.Fragment>
    <MenubarItem as={NextLink} href={"/me/account/stories"}>
      Dashboard
    </MenubarItem>
    <MenubarItem as={NextLink} href={"/"}>
      Home
    </MenubarItem>
    <Separator />
    <FileItem />
    <EditItem />
    <ViewItem />
    <TextItem />
    <AlignItem />
    <InsertItem />
    <Separator />
    <ThemeItem />
    <Separator />
    <HelpItem />
  </React.Fragment>
);

export default EditorMenubarItems;
