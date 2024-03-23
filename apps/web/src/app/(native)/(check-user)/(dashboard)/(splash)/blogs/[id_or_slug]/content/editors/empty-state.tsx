import React from "react";

import CustomState from "~/entities/custom-state";
import UsersIcon from "~/icons/users";

const EditorsEmptyState = (): React.ReactElement => (
  <CustomState
    auto_size
    description={"When editors are added to this blog, they will show up here."}
    icon={<UsersIcon />}
    title={"No editors yet"}
  />
);

export default EditorsEmptyState;
