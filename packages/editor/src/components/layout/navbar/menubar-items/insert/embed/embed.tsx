import React from "react";

import MenubarItem from "~/components/MenubarItem";
import EmbedIcon from "~/icons/Embed";

import EmbedModal from "../../../../../embed-modal";

const EmbedMenubarItem = (): React.ReactElement => (
  <EmbedModal
    modal
    trigger={({ openModal }): React.ReactElement => (
      <MenubarItem
        decorator={<EmbedIcon />}
        onClick={openModal}
        onSelect={(event): void => event.preventDefault()}
      >
        Embed
      </MenubarItem>
    )}
  />
);

export default EmbedMenubarItem;
