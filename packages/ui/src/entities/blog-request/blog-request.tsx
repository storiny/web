"use client";

import { get_blog_url } from "@storiny/shared/src/utils/get-blog-url";
import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Avatar from "~/components/avatar";
import Button from "~/components/button";
import DateTime from "~/components/date-time";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import {
  get_blog_requests_api,
  use_accept_blog_request_mutation,
  use_reject_blog_request_mutation
} from "~/redux/features";
import { use_app_dispatch } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { capitalize } from "~/utils/capitalize";
import { DateFormat } from "~/utils/format-date";
import { handle_api_error } from "~/utils/handle-api-error";

import styles from "./blog-request.module.scss";
import { BlogRequestProps } from "./blog-request.props";

const BlogRequest = (props: BlogRequestProps): React.ReactElement => {
  const { className, blog_request, ...rest } = props;
  const { blog } = blog_request;
  const toast = use_toast();
  const dispatch = use_app_dispatch();
  const blog_url = get_blog_url(blog);
  const [accept_request, { isLoading: is_accept_loading }] =
    use_accept_blog_request_mutation();
  const [reject_request, { isLoading: is_reject_loading }] =
    use_reject_blog_request_mutation();

  /**
   * Accepts the blog request
   */
  const handle_accept = (): void => {
    accept_request({ id: blog_request.id })
      .unwrap()
      .then(() => {
        toast("Request accepted", "success");
        dispatch(get_blog_requests_api.util.resetApiState());
      })
      .catch((error) =>
        handle_api_error(error, toast, null, "Could not accept the request")
      );
  };

  /**
   * Rejects the blog request
   */
  const handle_reject = (): void => {
    reject_request({ id: blog_request.id })
      .unwrap()
      .then(() => {
        toast("Request rejected", "success");
        dispatch(get_blog_requests_api.util.resetApiState());
      })
      .catch((error) =>
        handle_api_error(error, toast, null, "Could not reject the request")
      );
  };

  return (
    <div
      {...rest}
      className={clsx(css["flex-center"], styles["blog-request"], className)}
    >
      <NextLink
        className={clsx(css["flex-center"], styles.meta)}
        href={blog_url}
        target={"_blank"}
      >
        <Avatar
          alt={""}
          avatar_id={blog.logo_id}
          className={clsx(styles.x, styles.logo)}
          hex={blog.logo_hex}
          label={blog.name}
          size={"md"}
          slot_props={{
            fallback: {
              className: clsx(styles.x, styles.fallback)
            }
          }}
        />
        <div className={css["flex-col"]}>
          <Typography ellipsis level={"body2"} weight={"medium"}>
            {blog.name}
          </Typography>
          <Typography color={"minor"} ellipsis level={"body3"}>
            {capitalize(blog_request.role)} &bull;{" "}
            <DateTime
              date={blog_request.created_at}
              format={DateFormat.RELATIVE_CAPITALIZED}
            />
          </Typography>
        </div>
      </NextLink>
      <div className={clsx(css["flex-center"], styles.actions)}>
        <Button
          auto_size
          check_auth
          disabled={is_reject_loading}
          loading={is_accept_loading}
          onClick={handle_accept}
        >
          Accept
        </Button>
        <Button
          auto_size
          check_auth
          disabled={is_accept_loading}
          loading={is_reject_loading}
          onClick={handle_reject}
          variant={"hollow"}
        >
          Reject
        </Button>
      </div>
    </div>
  );
};

export default React.memo(BlogRequest);
