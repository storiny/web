import React from "react";

import MenubarItem from "../../../../../../../../ui/src/components/menubar-item";
import EmbedIcon from "~/icons/Embed";

import EmbedModal from "../../../../../embed-modal";

const EmbedMenubarItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => (
  <EmbedModal
    modal
    trigger={({ open_modal }): React.ReactElement => (
      <MenubarItem
        decorator={<EmbedIcon />}
        disabled={disabled}
        onClick={open_modal}
        onSelect={(event): void => event.preventDefault()}
      >
        Embed
      </MenubarItem>
    )}
  />
);

export default EmbedMenubarItem;
