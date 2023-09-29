import React from "react";

import MenuItem from "../../../../../../../ui/src/components/menu-item";
import EmbedIcon from "~/icons/Embed";

import EmbedModal from "../../../../embed-modal";

const EmbedMenuItem = (): React.ReactElement => (
  <EmbedModal
    modal
    trigger={({ open_modal }): React.ReactElement => (
      <MenuItem
        decorator={<EmbedIcon />}
        onClick={open_modal}
        onSelect={(event): void => event.preventDefault()}
      >
        Embed
      </MenuItem>
    )}
  />
);

export default EmbedMenuItem;
