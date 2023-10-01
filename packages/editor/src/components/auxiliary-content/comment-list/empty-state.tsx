import React from "react";

import CustomState from "~/entities/custom-state";

const EditorAuxiliaryContentCommentListEmptyState = (): React.ReactElement => (
  <CustomState
    auto_size
    description={"Be the first one to comment on this story."}
    style={{ marginBlock: "24px" }}
    title={"No comments yet"}
  />
);

export default EditorAuxiliaryContentCommentListEmptyState;
