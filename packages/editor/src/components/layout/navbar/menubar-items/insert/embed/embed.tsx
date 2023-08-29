import React from "react";

import MenubarItem from "~/components/MenubarItem";
import EmbedIcon from "~/icons/Embed";

const EmbedMenubarItem = (): React.ReactElement => (
  <MenubarItem decorator={<EmbedIcon />}>Embed</MenubarItem>
);

export default EmbedMenubarItem;
