import React from "react";

import MenubarItem from "~/components/MenubarItem";
import ImageIcon from "~/icons/Image";

const ImageMenubarItem = (): React.ReactElement => (
  <MenubarItem decorator={<ImageIcon />}>Image</MenubarItem>
);

export default ImageMenubarItem;
