import { REPLY_PROPS } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Avatar from "~/components/Avatar";
import { useToast } from "~/components/Toast";
import ResponseTextarea from "~/entities/ResponseTextarea";
import {
  select_is_logged_in,
  select_user,
  use_add_reply_mutation
} from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";

import styles from "./post-reply.module.scss";

const PostReply = ({
  commentId,
  placeholder
}: {
  commentId: string;
  placeholder: string;
}): React.ReactElement | null => {
  const toast = useToast();
  const user = use_app_selector(select_user);
  const loggedIn = use_app_selector(select_is_logged_in);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [addReply, { isLoading }] = use_add_reply_mutation();

  const handlePost = (): void => {
    if (textareaRef.current?.value) {
      addReply({
        commentId,
        content: textareaRef.current.value
      })
        .unwrap()
        .then(() => {
          if (textareaRef.current) {
            textareaRef.current.value = "";
          }

          toast("Reply added", "success");
        })
        .catch((e) =>
          toast(e?.data?.error || "Could not add your reply", "error")
        );
    } else {
      toast("Reply content cannot be empty", "error");
    }
  };

  if (!loggedIn) {
    return null;
  }

  return (
    <div
      className={clsx(
        "flex",
        styles["response-area"],
        !loggedIn && styles["logged-out"]
      )}
    >
      <Avatar
        alt={""}
        avatarId={user?.avatar_id}
        hex={user?.avatar_hex}
        label={user?.name}
      />
      <ResponseTextarea
        maxLength={REPLY_PROPS.content.maxLength}
        minLength={REPLY_PROPS.content.minLength}
        placeholder={placeholder}
        postButtonProps={{
          loading: isLoading,
          onClick: handlePost
        }}
        ref={textareaRef}
        size={"sm"}
        slot_props={{
          container: {
            className: clsx("f-grow", styles.x, styles["response-textarea"])
          }
        }}
      />
    </div>
  );
};

export default PostReply;
