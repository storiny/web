import React from "react";

import EmbedIcon from "~/icons/Embed";

import InsertItem from "../insert-item";

const EmbedItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => (
  <InsertItem decorator={<EmbedIcon />} disabled={disabled} label={"Embed"} />
);

export default EmbedItem;
