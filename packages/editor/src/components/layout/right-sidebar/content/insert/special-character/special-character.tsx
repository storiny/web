import React from "react";

import OmegaIcon from "~/icons/Omega";

import InsertItem from "../insert-item";

const SpecialCharacterItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => (
  <InsertItem
    decorator={<OmegaIcon />}
    disabled={disabled}
    label={"Special character"}
  />
);

export default SpecialCharacterItem;
