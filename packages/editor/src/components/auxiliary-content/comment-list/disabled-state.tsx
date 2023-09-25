import React from "react";

import CustomState from "~/entities/CustomState";
import CommentOffIcon from "~/icons/comment-off";

const EditorAuxiliaryContentCommentListDisabledState =
  (): React.ReactElement => (
    <CustomState
      autoSize
      description={"The writer has disabled comments on this story."}
      icon={<CommentOffIcon />}
      style={{ marginBlock: "24px" }}
      title={"Comments are disabled"}
    />
  );

export default EditorAuxiliaryContentCommentListDisabledState;
