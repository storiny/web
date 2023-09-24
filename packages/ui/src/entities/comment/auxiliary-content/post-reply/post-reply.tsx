import { REPLY_PROPS } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Avatar from "~/components/Avatar";
import Button from "~/components/Button";
import { useToast } from "~/components/Toast";
import ResponseTextarea from "~/entities/ResponseTextarea";
import {
  selectLoggedIn,
  selectUser,
  useAddReplyMutation
} from "~/redux/features";
import { useAppSelector } from "~/redux/hooks";

import styles from "./post-reply.module.scss";

const PostReply = ({
  commentId,
  placeholder
}: {
  commentId: string;
  placeholder: string;
}): React.ReactElement => {
  const toast = useToast();
  const user = useAppSelector(selectUser);
  const loggedIn = useAppSelector(selectLoggedIn);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [addReply, { isLoading }] = useAddReplyMutation();

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

  return (
    <div
      className={clsx(
        "flex",
        styles["response-area"],
        !loggedIn && styles["logged-out"]
      )}
    >
      {!loggedIn ? (
        <Button checkAuth>Log in to leave a reply</Button>
      ) : (
        <React.Fragment>
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
            slotProps={{
              container: {
                className: clsx("f-grow", styles.x, styles["response-textarea"])
              }
            }}
          />
        </React.Fragment>
      )}
    </div>
  );
};

export default PostReply;
