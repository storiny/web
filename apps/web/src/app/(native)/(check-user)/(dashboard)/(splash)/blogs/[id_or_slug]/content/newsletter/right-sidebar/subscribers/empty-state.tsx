import React from "react";

import CustomState from "~/entities/custom-state";

const SubscribersEmptyState = (): React.ReactElement => (
  <CustomState
    auto_size
    description={
      "When someone subscribes to this blog’s newsletter, they will show up here."
    }
    title={"No subscribers yet"}
  />
);

export default SubscribersEmptyState;
