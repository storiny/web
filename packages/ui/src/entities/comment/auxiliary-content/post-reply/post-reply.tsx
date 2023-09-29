import { REPLY_PROPS } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";
import Avatar from "src/components/avatar";
import { use_toast } from "src/components/toast";

import ResponseTextarea from "src/entities/response-textarea";
import {
  select_is_logged_in,
  select_user,
  use_add_reply_mutation
} from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";

import styles from "./post-reply.module.scss";

const PostReply = ({
  comment_id,
  placeholder
}: {
  comment_id: string;
  placeholder: string;
}): React.ReactElement | null => {
  const toast = use_toast();
  const user = use_app_selector(select_user);
  const logged_in = use_app_selector(select_is_logged_in);
  const textarea_ref = React.useRef<HTMLTextAreaElement | null>(null);
  const [add_reply, { isLoading: is_loading }] = use_add_reply_mutation();

  const handle_post = (): void => {
    if (textarea_ref.current?.value) {
      add_reply({
        comment_id,
        content: textarea_ref.current.value
      })
        .unwrap()
        .then(() => {
          if (textarea_ref.current) {
            textarea_ref.current.value = "";
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

  if (!logged_in) {
    return null;
  }

  return (
    <div
      className={clsx(
        "flex",
        styles["response-area"],
        !logged_in && styles["logged-out"]
      )}
    >
      <Avatar
        alt={""}
        avatar_id={user?.avatar_id}
        hex={user?.avatar_hex}
        label={user?.name}
      />
      <ResponseTextarea
        maxLength={REPLY_PROPS.content.maxLength}
        minLength={REPLY_PROPS.content.minLength}
        placeholder={placeholder}
        post_button_props={{
          loading: is_loading,
          onClick: handle_post
        }}
        ref={textarea_ref}
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
