import React from "react";

import EmbedIcon from "~/icons/Embed";

import EmbedModal from "../../../../../../embed-modal";
import InsertItem from "../insert-item";

const EmbedItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => (
  <EmbedModal
    trigger={({ openModal }): React.ReactElement => (
      <InsertItem
        data-testid={"insert-embed"}
        decorator={<EmbedIcon />}
        disabled={disabled}
        label={"Embed"}
        onClick={openModal}
      />
    )}
  />
);

export default EmbedItem;
