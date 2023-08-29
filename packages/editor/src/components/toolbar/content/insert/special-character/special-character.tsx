import React from "react";

import MenuItem from "~/components/MenuItem";
import OmegaIcon from "~/icons/Omega";

const SpecialCharacterMenuItem = (): React.ReactElement => (
  <MenuItem decorator={<OmegaIcon />}>Special character</MenuItem>
);

export default SpecialCharacterMenuItem;
