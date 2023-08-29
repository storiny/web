import React from "react";

import MenuItem from "~/components/MenuItem";
import EmbedIcon from "~/icons/Embed";

const EmbedMenuItem = (): React.ReactElement => (
  <MenuItem decorator={<EmbedIcon />}>Embed</MenuItem>
);

export default EmbedMenuItem;
