"use client";

import { use_blog_context } from "@storiny/web/src/common/context/blog";
import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Avatar from "~/components/avatar";
import Button from "~/components/button";
import DateTime from "~/components/date-time";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import {
  get_blog_editor_requests_api,
  get_blog_writer_requests_api,
  use_cancel_blog_editor_request_mutation,
  use_cancel_blog_writer_request_mutation
} from "~/redux/features";
import { use_app_dispatch } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { DateFormat } from "~/utils/format-date";
import { handle_api_error } from "~/utils/handle-api-error";

import styles from "./blog-member-request.module.scss";
import { BlogMemberRequestProps } from "./blog-member-request.props";

const BlogMemberRequest = (
  props: BlogMemberRequestProps
): React.ReactElement => {
  const { className, blog_member_request, role, ...rest } = props;
  const { user } = blog_member_request;
  const toast = use_toast();
  const blog = use_blog_context();
  const dispatch = use_app_dispatch();
  const user_url = `/${user.username}`;
  const [cancel_editor_request, { isLoading: is_cancel_editor_loading }] =
    use_cancel_blog_editor_request_mutation();
  const [cancel_writer_request, { isLoading: is_cancel_writer_loading }] =
    use_cancel_blog_writer_request_mutation();
  const cancel_request =
    role === "editor" ? cancel_editor_request : cancel_writer_request;
  const is_loading =
    role === "editor" ? is_cancel_editor_loading : is_cancel_writer_loading;

  /**
   * Cancels the blog member request
   */
  const handle_cancel = (): void => {
    cancel_request({ id: blog_member_request.id, blog_id: blog.id })
      .unwrap()
      .then(() => {
        toast("Request cancelled", "success");
        dispatch(
          (role === "editor"
            ? get_blog_editor_requests_api
            : get_blog_writer_requests_api
          ).util.resetApiState()
        );
      })
      .catch((error) =>
        handle_api_error(error, toast, null, "Could not cancel the request")
      );
  };

  return (
    <div
      {...rest}
      className={clsx(
        css["flex-center"],
        styles["blog-member-request"],
        className
      )}
    >
      <NextLink
        className={clsx(css["flex-center"], styles.meta)}
        href={user_url}
      >
        <Avatar
          alt={""}
          avatar_id={user.avatar_id}
          hex={user.avatar_hex}
          label={user.name}
          size={"md"}
        />
        <div className={css["flex-col"]}>
          <Typography ellipsis level={"body2"} weight={"medium"}>
            {user.name}
          </Typography>
          <Typography color={"minor"} ellipsis level={"body3"}>
            @{user.username} &bull;{" "}
            <DateTime
              date={blog_member_request.created_at}
              format={DateFormat.RELATIVE_CAPITALIZED}
            />
          </Typography>
        </div>
      </NextLink>
      <Button
        auto_size
        check_auth
        loading={is_loading}
        onClick={handle_cancel}
        variant={"hollow"}
      >
        Cancel
      </Button>
    </div>
  );
};

export default React.memo(BlogMemberRequest);
