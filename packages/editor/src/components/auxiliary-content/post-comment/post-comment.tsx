import { COMMENT_PROPS } from "@storiny/shared";
import { clsx } from "clsx";
import { useAtomValue } from "jotai";
import NextLink from "next/link";
import React from "react";

import Avatar from "~/components/Avatar";
import Button from "~/components/Button";
import { useToast } from "~/components/Toast";
import ResponseTextarea from "~/entities/ResponseTextarea";
import {
  getStoryCommentsApi,
  selectLoggedIn,
  selectUser,
  useAddCommentMutation
} from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";

import { storyMetadataAtom } from "../../../atoms";
import styles from "./post-comment.module.scss";

const PostComment = ({
  onPost
}: {
  onPost: () => void;
}): React.ReactElement => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const story = useAtomValue(storyMetadataAtom);
  const user = useAppSelector(selectUser);
  const loggedIn = useAppSelector(selectLoggedIn);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [addComment, { isLoading }] = useAddCommentMutation();

  const handlePost = (): void => {
    addComment({
      storyId: story.id,
      content: textareaRef.current?.value || ""
    })
      .unwrap()
      .then(() => {
        if (textareaRef.current) {
          textareaRef.current.value = "";
        }

        onPost();
        toast("Comment added", "success");
        dispatch(getStoryCommentsApi.util.resetApiState());
      })
      .catch((e) =>
        toast(e?.data?.error || "Could not add your comment", "error")
      );
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
        <Button as={NextLink} href={"/login"}>
          Log in to leave a comment
        </Button>
      ) : (
        <React.Fragment>
          <Avatar
            alt={""}
            avatarId={user?.avatar_id}
            hex={user?.avatar_hex}
            label={user?.name}
          />
          <ResponseTextarea
            maxLength={COMMENT_PROPS.content.maxLength}
            minLength={COMMENT_PROPS.content.minLength}
            placeholder={"Leave a comment"}
            postButtonProps={{
              loading: isLoading,
              onClick: handlePost
            }}
            ref={textareaRef}
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

export default PostComment;
