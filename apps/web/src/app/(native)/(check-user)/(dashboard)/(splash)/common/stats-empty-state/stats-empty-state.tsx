import React from "react";

import CustomState from "~/entities/custom-state";

const StatsEmptyState = (): React.ReactElement => (
  <CustomState
    auto_size
    description={
      "There isn't enough data to show this report. Please check back later."
    }
    style={{ marginBlock: "16px" }}
    title={"Insufficient data"}
  />
);

export default StatsEmptyState;
