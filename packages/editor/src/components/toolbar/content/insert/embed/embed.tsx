import React from "react";

import MenuItem from "~/components/MenuItem";
import EmbedIcon from "~/icons/Embed";

import EmbedModal from "../../../../embed-modal";

const EmbedMenuItem = (): React.ReactElement => (
  <EmbedModal
    modal
    trigger={({ openModal }): React.ReactElement => (
      <MenuItem
        decorator={<EmbedIcon />}
        onClick={openModal}
        onSelect={(event): void => event.preventDefault()}
      >
        Embed
      </MenuItem>
    )}
  />
);

export default EmbedMenuItem;
