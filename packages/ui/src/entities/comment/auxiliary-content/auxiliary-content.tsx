import clsx from "clsx";
import React from "react";

import css from "~/theme/main.module.scss";

import styles from "./auxiliary-content.module.scss";
import PostReply from "./post-reply";
import ReplyList from "./reply-list";

const CommentAuxiliaryContent = (props: {
  comment_id: string;
  placeholder: string;
}): React.ReactElement => (
  <div className={clsx(css["flex-col"], styles.content)}>
    <PostReply {...props} />
    <ReplyList comment_id={props.comment_id} />
  </div>
);

export default CommentAuxiliaryContent;
