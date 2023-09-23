import clsx from "clsx";
import React from "react";

import styles from "./auxiliary-content.module.scss";
import PostReply from "./post-reply";
import ReplyList from "./reply-list";

const CommentAuxiliaryContent = (props: {
  commentId: string;
  placeholder: string;
}): React.ReactElement => (
  <div className={clsx("flex-col", styles.content)}>
    <PostReply {...props} />
    <ReplyList commentId={props.commentId} />
  </div>
);

export default CommentAuxiliaryContent;
