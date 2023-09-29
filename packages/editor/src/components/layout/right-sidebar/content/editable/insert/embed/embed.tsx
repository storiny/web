import React from "react";

import EmbedIcon from "../../../../../../../../../ui/src/icons/embed";

import EmbedModal from "../../../../../../embed-modal";
import InsertItem from "../insert-item";

const EmbedItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => (
  <EmbedModal
    trigger={({ open_modal }): React.ReactElement => (
      <InsertItem
        data-testid={"insert-embed"}
        decorator={<EmbedIcon />}
        disabled={disabled}
        label={"Embed"}
        onClick={open_modal}
      />
    )}
  />
);

export default EmbedItem;
