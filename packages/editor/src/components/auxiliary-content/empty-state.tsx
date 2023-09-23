import React from "react";

import CustomState from "~/entities/CustomState";

const EditorAuxiliaryContentEmptyState = (): React.ReactElement => (
  <CustomState
    autoSize
    description={"Be the first one to comment on this story."}
    style={{ marginBlock: "24px" }}
    title={"No comments yet"}
  />
);

export default EditorAuxiliaryContentEmptyState;
