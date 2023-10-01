import React from "react";

import CustomState from "~/entities/custom-state";

const RecommendedStoriesEmptyState = (): React.ReactElement => (
  <CustomState
    description={"We were unable to find enough similar stories to display."}
    size={"sm"}
    title={"No recommendations"}
  />
);

export default RecommendedStoriesEmptyState;
