import { COMMENT_PROPS } from "@storiny/shared";
import { clsx } from "clsx";
import { useAtomValue } from "jotai";
import React from "react";

import Avatar from "../../../../../ui/src/components/avatar";
import Button from "../../../../../ui/src/components/button";
import { use_toast } from "../../../../../ui/src/components/toast";
import ResponseTextarea from "../../../../../ui/src/entities/response-textarea";
import {
  get_story_comments_api,
  select_is_logged_in,
  select_user,
  use_add_comment_mutation
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";

import { storyMetadataAtom } from "../../../atoms";
import styles from "./post-comment.module.scss";

const PostComment = ({
  onPost
}: {
  onPost: () => void;
}): React.ReactElement => {
  const toast = use_toast();
  const dispatch = use_app_dispatch();
  const story = use_atom_value(storyMetadataAtom);
  const user = use_app_selector(select_user);
  const logged_in = use_app_selector(select_is_logged_in);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [addComment, { isLoading }] = use_add_comment_mutation();

  const handlePost = (): void => {
    if (textareaRef.current?.value) {
      addComment({
        story_id: story.id,
        content: textareaRef.current.value
      })
        .unwrap()
        .then(() => {
          if (textareaRef.current) {
            textareaRef.current.value = "";
          }

          onPost();
          toast("Comment added", "success");
          dispatch(get_story_comments_api.util.resetApiState());
        })
        .catch((e) =>
          toast(e?.data?.error || "Could not add your comment", "error")
        );
    } else {
      toast("Comment content cannot be empty", "error");
    }
  };

  return (
    <div
      className={clsx(
        "flex",
        styles["response-area"],
        !logged_in && styles["logged-out"]
      )}
    >
      {!logged_in ? (
        <Button check_auth variant={"hollow"}>
          Log in to leave a comment
        </Button>
      ) : (
        <React.Fragment>
          <Avatar
            alt={""}
            avatar_id={user?.avatar_id}
            hex={user?.avatar_hex}
            label={user?.name}
          />
          <ResponseTextarea
            maxLength={COMMENT_PROPS.content.maxLength}
            minLength={COMMENT_PROPS.content.minLength}
            placeholder={"Leave a comment"}
            post_button_props={{
              loading: isLoading,
              onClick: handlePost
            }}
            ref={textareaRef}
            slot_props={{
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

export default PostComment;
