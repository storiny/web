import React from "react";

import MenubarSub from "~/components/MenubarSub";

import CodeBlockMenubarItem from "./code-block";
import EmbedMenubarItem from "./embed";
import EmojiMenubarItem from "./emoji";
import HorizontalRuleMenubarItem from "./horizontal-rule";
import ImageMenubarItem from "./image";
import SymbolMenubarItem from "./symbol";

const InsertItem = (): React.ReactElement => (
  <MenubarSub trigger={"Insert"}>
    <HorizontalRuleMenubarItem />
    <ImageMenubarItem />
    <CodeBlockMenubarItem />
    <EmbedMenubarItem />
    <EmojiMenubarItem />
    <SymbolMenubarItem />
  </MenubarSub>
);

export default InsertItem;
