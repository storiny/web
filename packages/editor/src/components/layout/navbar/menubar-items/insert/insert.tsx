import React from "react";

import MenubarItem from "~/components/MenubarItem";
import MenubarSub from "~/components/MenubarSub";
import CodeBlockIcon from "~/icons/CodeBlock";
import EmbedIcon from "~/icons/Embed";
import HorizontalRuleIcon from "~/icons/HorizontalRule";
import ImageIcon from "~/icons/Image";
import MoodSmileIcon from "~/icons/MoodSmile";
import OmegaIcon from "~/icons/Omega";

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

export default InsertItem;
