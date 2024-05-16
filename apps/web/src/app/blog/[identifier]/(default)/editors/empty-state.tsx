import React from "react";

import CustomState from "~/entities/custom-state";

const EditorsEmptyState = (): React.ReactElement => (
  <CustomState
    auto_size
    description={"This blog does not have any public editors"}
    title={"No editors"}
  />
);

export default EditorsEmptyState;
