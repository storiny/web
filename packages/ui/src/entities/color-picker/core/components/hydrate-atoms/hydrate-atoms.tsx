import { useHydrateAtoms as use_hydrate_atoms } from "jotai/react/utils";
import React from "react";

import { HydrateAtomsProps } from "./hydrate-atoms.props";

const HydrateAtoms = (props: HydrateAtomsProps): React.ReactElement => {
  const { initial_values, children } = props;
  use_hydrate_atoms(initial_values);
  return <React.Fragment>{children}</React.Fragment>;
};

export default HydrateAtoms;
