import React from "react";

import CustomState from "~/entities/custom-state";

const ContributorsEmptyState = (): React.ReactElement => (
  <CustomState
    description={"You haven't invited anyone yet."}
    size={"sm"}
    title={"No contributors"}
  />
);

export default ContributorsEmptyState;
