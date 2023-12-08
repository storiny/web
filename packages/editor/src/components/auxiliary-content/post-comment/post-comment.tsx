import { COMMENT_PROPS } from "@storiny/shared";
import { clsx } from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import React from "react";

import Avatar from "~/components/avatar";
import Button from "~/components/button";
import { use_toast } from "~/components/toast";
import ResponseTextarea from "~/entities/response-textarea";
import {
  get_story_comments_api,
  select_is_logged_in,
  select_user,
  use_add_comment_mutation
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import { story_metadata_atom } from "../../../atoms";
import styles from "./post-comment.module.scss";

const PostComment = ({
  on_post
}: {
  on_post: () => void;
}): React.ReactElement => {
  const toast = use_toast();
  const dispatch = use_app_dispatch();
  const story = use_atom_value(story_metadata_atom);
  const user = use_app_selector(select_user);
  const logged_in = use_app_selector(select_is_logged_in);
  const textarea_ref = React.useRef<HTMLTextAreaElement | null>(null);
  const [add_comment, { isLoading: is_loading }] = use_add_comment_mutation();

  const handle_post = (): void => {
    if (textarea_ref.current?.value) {
      add_comment({
        story_id: story.id,
        content: textarea_ref.current.value
      })
        .unwrap()
        .then(() => {
          if (textarea_ref.current) {
            textarea_ref.current.value = "";
          }

          on_post();
          toast("Comment added", "success");
          dispatch(get_story_comments_api.util.resetApiState());
        })
        .catch((error) =>
          handle_api_error(error, toast, null, "Could not add your comment")
        );
    } else {
      toast("Comment content cannot be empty", "error");
    }
  };

  return (
    <div
      className={clsx(
        css["flex"],
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
            maxLength={COMMENT_PROPS.content.max_length}
            minLength={COMMENT_PROPS.content.min_length}
            placeholder={"Leave a comment"}
            post_button_props={{
              loading: is_loading,
              onClick: handle_post
            }}
            ref={textarea_ref}
            slot_props={{
              container: {
                className: clsx(
                  css["f-grow"],
                  styles.x,
                  styles["response-textarea"]
                )
              }
            }}
          />
        </React.Fragment>
      )}
    </div>
  );
};

export default PostComment;
