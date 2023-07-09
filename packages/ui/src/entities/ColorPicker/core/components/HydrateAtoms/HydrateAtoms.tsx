import { useHydrateAtoms } from "jotai/react/utils";
import React from "react";

import { HydrateAtomsProps } from "./HydrateAtoms.props";

const HydrateAtoms = (props: HydrateAtomsProps): React.ReactElement => {
  const { initialValues, children } = props;
  useHydrateAtoms(initialValues);

  return <React.Fragment>{children}</React.Fragment>;
};

export default HydrateAtoms;
