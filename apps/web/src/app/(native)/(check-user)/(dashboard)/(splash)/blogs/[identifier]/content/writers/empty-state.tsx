import React from "react";

import CustomState from "~/entities/custom-state";
import UsersIcon from "~/icons/users";

const WritersEmptyState = (): React.ReactElement => (
  <CustomState
    auto_size
    description={"When writers are added to this blog, they will show up here."}
    icon={<UsersIcon />}
    title={"No writers yet"}
  />
);

export default WritersEmptyState;
