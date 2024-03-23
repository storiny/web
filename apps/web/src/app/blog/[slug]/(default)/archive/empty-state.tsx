import React from "react";

import CustomState from "~/entities/custom-state";

const ArchiveEmptyState = (): React.ReactElement => (
  <CustomState
    auto_size
    description={
      "No stories have been published on this blog during this time period."
    }
    title={"Nothing to show here"}
  />
);

export default ArchiveEmptyState;
