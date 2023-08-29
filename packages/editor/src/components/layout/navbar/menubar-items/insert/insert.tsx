import React from "react";

import MenubarSub from "~/components/MenubarSub";

import CodeBlockMenubarItem from "./code-block";
import EmbedMenubarItem from "./embed";
import EmojiMenubarItem from "./emoji";
import HorizontalRuleMenubarItem from "./horizontal-rule";
import ImageMenubarItem from "./image";
import SpecialCharacterMenubarItem from "./special-character";

const InsertItem = (): React.ReactElement => (
  <MenubarSub trigger={"Insert"}>
    <HorizontalRuleMenubarItem />
    <ImageMenubarItem />
    <CodeBlockMenubarItem />
    <EmbedMenubarItem />
    <EmojiMenubarItem />
    <SpecialCharacterMenubarItem />
  </MenubarSub>
);

export default InsertItem;
