import React from "react";

import MenubarSub from "../../../../../../../ui/src/components/menubar-sub";

import CodeBlockMenubarItem from "./code-block";
import EmbedMenubarItem from "./embed";
import EmojiMenubarItem from "./emoji";
import HorizontalRuleMenubarItem from "./horizontal-rule";
import ImageMenubarItem from "./image";
import SymbolMenubarItem from "./symbol";

const InsertItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => (
  <MenubarSub trigger={"Insert"}>
    <HorizontalRuleMenubarItem disabled={disabled} />
    <ImageMenubarItem disabled={disabled} />
    <CodeBlockMenubarItem disabled={disabled} />
    <EmbedMenubarItem disabled={disabled} />
    <EmojiMenubarItem disabled={disabled} />
    <SymbolMenubarItem disabled={disabled} />
  </MenubarSub>
);

export default InsertItem;
