import React from "react";

import MenubarItem from "~/components/MenubarItem";
import OmegaIcon from "~/icons/Omega";

const SpecialCharacterMenubarItem = (): React.ReactElement => (
  <MenubarItem decorator={<OmegaIcon />}>Special character</MenubarItem>
);

export default SpecialCharacterMenubarItem;
